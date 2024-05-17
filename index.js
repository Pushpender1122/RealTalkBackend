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
// let userToId = new Map();
let videoidToScoketid = new Map();
io.on("connection", (socket) => {
    console.log("a user connected");
    clients.push(socket.id);
    console.log('clients start', clients);
    // Check if we have at least 2 clients to pair
    if (clients.length >= 2) {
        allfunction.mapTheUsers(clients, idToUser);
        const getpairuserId = idToUser.get(socket.id);
        io.to(getpairuserId).to(socket.id).emit('user-connected', socket.id);
        // io.to(socket.id).emit('user-connected', socket.id);
        console.log('Remaining clients: ', clients.length);
    }
    socket.on('join-room', (userId) => {
        // socket.join(room);
        videoidToScoketid.set(socket.id, userId);
        const id = idToUser.get(socket.id);
        console.log('user id ', id);
        if (id) {
            // console.log('Video id', id);
            io.to(id).emit('user-connected', userId);
            // videoidToScoketid.set(userId, socket.id);
        };
        // socket.broadcast.emit('user-connected', userId);
        socket.on('disconnect', () => {
            console.log('User disconnected: ' + socket.id);
            const anotherUserId = idToUser.get(socket.id);
            idToUser.delete(socket.id);
            idToUser.delete(anotherUserId);
        });
    });
    socket.on('change-user', (userId) => {
        let connecteduserid = idToUser.get(socket.id);
        if (connecteduserid) {
            idToUser.delete(connecteduserid);
            idToUser.delete(socket.id);
        }

        if (connecteduserid) {
            io.to(connecteduserid).emit('user-disconnected', userId);
        }
        let ack = clients.find(id => id === socket.id);
        if (!ack) clients.push(socket.id);
        if (clients.length >= 2) {
            allfunction.mapTheUsers(clients, idToUser);
            const newuserid = idToUser.get(socket.id);
            if (newuserid) {
                const availableuserid = videoidToScoketid.get(socket.id);
                io.to(newuserid).emit('user-connected', availableuserid);
            }
        }

    });
    // this is the chat message event
    socket.on('chatMessage', (message, username) => {
        const id = idToUser.get(socket.id);
        // console.log('id', id);
        console.log('username', socket.id, username);
        if (id) {
            io.to(id).emit('message', { user: username, content: message });
        }
    });

    socket.on('disconnect', () => {
        clients = clients.filter(id => id !== socket.id);


        const disconnectedUserId = socket.id;
        const pairId = idToUser.get(disconnectedUserId);
        console.log('user pair is ', socket.id, pairId);
        io.to(pairId).emit('user-disconnected', socket.id);
        idToUser.delete(socket.id);
        if (pairId) {
            idToUser.delete(pairId);
            clients.push(pairId);

            // Check if there are two disconnected clients
            if (clients.length >= 2) {
                allfunction.mapTheUsers(clients, idToUser);
                // console.log('Remaining clients: ', clients.length);
            }
        }
        else {

        }
        // console.log('clients', clients);
    });

});

server.listen(port, () => {
    console.log(`server started on Port ${port}`);
});
