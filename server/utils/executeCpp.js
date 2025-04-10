const { spawn } = require('child_process');
const {writeFile, unlink} = require('fs/promises')
// const {exec} = require('child_process')  this part is fromt he version 1
const path = require('path')
const {v4:uuid} = require('uuid')

//   COMMENTED CUZ THIS PART IS FROM THE VERSION 1
// const executeCpp = async(code)=>{
//     const jobId = uuid();
//     const filePath = path.join(__dirname,`../temp/${jobId}.cpp`);
//     const outPath = path.join(__dirname,`../temp/${jobId}.out`);

//     await writeFile(filePath,code);

//     return new Promise((resolve,reject) => {
//         exec(`g++ ${filePath} -o ${outPath}.out`,(compileErr,_,compilerStderr)=>{
//             if(compileErr){
//                 return reject({error: compilerStderr});
//             }

//             exec(`${outPath}`,{timeout:5000}, async(execErr,stdout,stderr)=>{
//                 await unlink(filePath);
//                 await unlink(outPath).catch(()=>{});


//                 if(execErr){
//                     return reject({error: stderr||execErr.message});
//                 }

//                 resolve({output: stdout});
                
//             })
//         })
//     })
// }

const executeCpp = async(code,socket) =>{
    const jobid = uuid();
    const filePath = path.join(__dirname,`../temp/${jobid}.cpp`);
    const outPath = path.join(__dirname,`../temp/${jobid}.out`);


    try{
        await writeFile(filePath,code);
        const compile = spawn(`g++`,[filePath,'-o',outPath]);

        compile.stderr.on('data',(data)=>{
            socket.emit('output',data.toString());
        });

        compile.on('close',(code)=>{
            if(code != 0) {
                socket.emit('done',"Compilation failed.");
                cleanup();
                return;
            }

            const run = spawn(outPath);

            run.stdout.on('data',(data)=>{
                socket.emit('output',data.toString());
            })

            run.stderr.on('data',(data)=>{
                socket.emit('output',data.toString());
            })

            socket.on('input',(input)=>{
                run.stdin.write(input +"\n");
            });

            run.on('close',(code)=>{
                socket.emit('done',`Program exited with code: ${code}`)
                cleanup();
            })
        })
    }catch(err) {
        socket.emit('output',`Error: `+err.message);
        cleanup();
    }

    function cleanup() {
        unlink(filePath).catch(()=>{});
        unlink(outPath).catch(()=>{});
    }
}

module.exports = executeCpp;