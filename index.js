const express = require("express");
const { createServer } = require('http');
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
const port = process.env.PORT || 8000;
let clients = [];
app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.use(cors({
    origin: "*",
    credentials: true
}));

io.on("connection", (socket) => {
    console.log("a user connected");

    socket.on('join-room', (room, userId) => {
        socket.join(room);
        socket.broadcast.to(room).emit('user-connected', userId);

        socket.on('disconnect', () => {
            socket.broadcast.to(room).emit('user-disconnected', userId);
        });
    });

    socket.on('chatMessage', (message, username) => {
        socket.broadcast.emit('message', { user: username, content: message });
    });

    socket.on('join-room:chat', (room, username) => {
        socket.join(room);
        // socket.broadcast.to(room).emit('user-connected', username);
    });

    socket.on('disconnect', () => {
        // Handle user disconnection here
        console.log("a user disconnected");
    });

});

server.listen(port, () => {
    console.log(`server started on Port ${port}`);
});
