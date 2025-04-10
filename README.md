# 🧠 Code Runner – Backend

Backend server for the Code Runner project. Compiles and executes **C++ code** with real-time support for runtime input using **WebSockets**.

> ⚠️ Deployed on Render (Free Tier). Since the server runs with only 512MB RAM, performance may vary depending on the complexity of the code.

---

## ⚙️ Features

- Accepts C++ code and user input from the frontend
- Compiles and runs code using `g++`
- Sends live output back to the frontend terminal using **Socket.IO**
- Handles runtime input/output streams and errors efficiently

---

## 🛠️ Tech Stack

- Node.js
- Express.js
- Socket.IO
- Child Process (for compiling & running code)

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/adam-dev2/CodeRunner-Backend.git
cd CodeRunner-Backend

npm install

node server.js
The server runs on port 3000 by default. You can change it in server.js if needed.


Workflow
Frontend sends run-code event with C++ code and input

Server writes the code to a .cpp file

Uses g++ to compile and run the file

Streams output/errors back via WebSocket



Let me know if you want to add example requests or error handling explanation later.
