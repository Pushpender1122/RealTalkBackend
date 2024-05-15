const express = require("express");
const { createServer } = require('http');
const { Server } = require("socket.io");
const cors = require("cors");
const allfunction = require('./fun');
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
let idToUser = new Map();
let userToId = new Map();
io.on("connection", (socket) => {
    console.log("a user connected");
    clients.push(socket.id);
    console.log('clients start', clients);
    // Check if we have at least 2 clients to pair
    if (clients.length >= 2) {
        allfunction.mapTheUsers(clients, idToUser, userToId);
        console.log('Remaining clients: ', clients.length);
    }
    // if (!clients.includes(socket.id)) {
    //     clients.push(socket.id);
    // }
    // idToUser.set(socket.id);
    // userToId.set(socket.id);

    socket.on('join-room', (room, userId) => {
        socket.join(room);
        socket.broadcast.to(room).emit('user-connected', userId);

        socket.on('disconnect', () => {
            socket.broadcast.to(room).emit('user-disconnected', userId);
        });
    });
    // this is the chat message event
    socket.on('chatMessage', (message, username) => {
        const id = idToUser.get(socket.id);
        console.log('id', id);
        console.log('username', socket.id, username);
        if (id) {
            io.to(id).emit('message', { user: username, content: message });
        }
    });

    socket.on('join-room:chat', (room, username) => {
        socket.join(room);
        // socket.broadcast.to(room).emit('user-connected', username);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected: ' + socket.id);
        clients = clients.filter(id => id !== socket.id);


        const disconnectedUserId = socket.id;
        const pairId = allfunction.getUserId(idToUser, disconnectedUserId, userToId);
        idToUser.delete(socket.id);
        userToId.delete(socket.id);
        console.log('pairId', pairId);
        if (pairId) {
            idToUser.delete(pairId);
            userToId.delete(pairId);
            clients.push(pairId); // Add pair back to the available clients

            // Check if there are two disconnected clients
            if (clients.length >= 2) {
                allfunction.mapTheUsers(clients, idToUser, userToId);
                console.log('Remaining clients: ', clients.length);
            }
        }
        else {

        }
        console.log('clients', clients);
    });

});

server.listen(port, () => {
    console.log(`server started on Port ${port}`);
});
