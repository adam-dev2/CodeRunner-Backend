const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

io.on('connection', (socket) => {
  console.log(`⚡ New client connected: ${socket.id}`);
  let currentProcess = null;

  socket.on('runCode', ({ code }) => {
    const sessionId = Date.now().toString();
    const filePath = path.join(tempDir, `${sessionId}.cpp`);
    const execPath = path.join(tempDir, `${sessionId}.out`); // `.exe` for Windows

    // Write C++ code to temp file
    try {
      fs.writeFileSync(filePath, code);
    } catch (err) {
      socket.emit('output', `❌ Error writing file: ${err.message}\n`);
      return;
    }

    // Kill any previously running process
    if (currentProcess && !currentProcess.killed) {
      currentProcess.kill();
    }

    // Compile the code
    const compile = spawn('g++', ['-o', execPath, filePath]);
    currentProcess = compile;

    compile.stderr.on('data', (data) => {
      socket.emit('output', `❌ Compilation Error:\n${data.toString()}`);
    });

    compile.on('close', (code) => {
      if (code !== 0) {
        socket.emit('output', '❌ Compilation failed.\n');
        socket.emit('executionEnd', { exitCode: code });
        cleanupFiles(filePath, execPath);
        return;
      }

      socket.emit('output', '✅ Compilation successful. Running...\n');

      const run = spawn(execPath);
      currentProcess = run;

      run.stdout.on('data', (data) => {
        const output = data.toString();
        socket.emit('output', output);

        // Check if input is likely needed
        if (needsInput(output)) {
          socket.emit('inputRequest');
        }
      });

      run.stderr.on('data', (data) => {
        socket.emit('output', `🔥 Runtime Error:\n${data.toString()}`);
      });

      socket.on('provideInput', (input) => {
        if (run.stdin.writable) {
          run.stdin.write(input + '\n');
        }
      });

      run.on('close', (code) => {
        socket.emit('output', `\n🚪 Program exited with code: ${code}\n`);
        socket.emit('executionEnd', { exitCode: code });
        cleanupFiles(filePath, execPath);
      });

      run.on('error', (err) => {
        socket.emit('output', `💥 Error running program: ${err.message}\n`);
        cleanupFiles(filePath, execPath);
      });
    });
  });

  socket.on('disconnect', () => {
    console.log(`👋 Client disconnected: ${socket.id}`);
    if (currentProcess && !currentProcess.killed) {
      currentProcess.kill();
    }
  });
});

// Helper function to detect if user input is likely required
function needsInput(output) {
  return /enter|input|:|>|\?\s*$/i.test(output.trim());
}

// Delete temporary files
function cleanupFiles(file, exec) {
  try {
    if (fs.existsSync(file)) fs.unlinkSync(file);
    if (fs.existsSync(exec)) fs.unlinkSync(exec);
  } catch (err) {
    console.error('Cleanup error:', err);
  }
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});
