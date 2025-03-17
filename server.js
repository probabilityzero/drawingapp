const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

let drawingData = [];
const users = {};

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    users[socket.id] = { userName: 'Anonymous', drawing: false, erasing: false };

    socket.emit('initialDrawData', drawingData);

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        delete users[socket.id];
        io.emit('userListUpdate', getUsersArray());
    });

    socket.on('setUserName', (userName) => {
        users[socket.id].userName = userName || 'Anonymous';
        io.emit('userListUpdate', getUsersArray());
    });

    socket.on('drawStart', (data) => {
        users[socket.id].drawing = !data.isErasing;
        users[socket.id].erasing = data.isErasing;
        io.emit('userListUpdate', getUsersArray());
    });
    socket.on('drawEnd', () => {
        users[socket.id].drawing = false;
        users[socket.id].erasing = false;
        io.emit('userListUpdate', getUsersArray());
    });

    socket.on('draw', (data) => {
        drawingData.push(data);
        io.emit('draw', data);
        console.log(`User: ${data.userName || 'Unknown'} - Draw event`);
    });

    socket.on('clear', () => {
        drawingData = [];
        io.emit('clear');
    });

    function getUsersArray() {
        return Object.values(users).map(user => ({ userName: user.userName, drawing: user.drawing, erasing: user.erasing }));
    }

    io.emit('userListUpdate', getUsersArray());
});

server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});