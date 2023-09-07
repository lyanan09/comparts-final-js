// Import Libraries and Setup
const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

// Tell Node.js Server to host page from the public folder.
app.use(express.static("public"));

// Setup Node.js server to listen to connections from chrome, and open chrome when it is ready
server.listen(3000, () => {
    console.log("listening on *:3000");
});

let printEveryMessage = false;

// Callback function for what to do when single page connects and sends messages
io.on("connection", (socket) => {

    
    console.log(socket.id + " connected");

    //send to everyone when screen1 is being watched
    socket.on("is_1_looking", (data) => {

        socket.broadcast.emit('is_1_looking', data);

        // Print it to the Console
        if (printEveryMessage) {
            console.log(data);
        }
    });

    //send to everyone when screen2 is being watched
    socket.on("is_2_looking", (data) => {

        socket.broadcast.emit('is_2_looking', data);

        // Print it to the Console
        if (printEveryMessage) {
            console.log(data);
        }
    });
});


