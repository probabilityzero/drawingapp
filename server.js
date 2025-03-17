// server.js
const express = require('express'); // Import the Express library
const http = require('http');       // Import the built-in HTTP module
const socketIO = require('socket.io'); // Import Socket.IO

const app = express();              // Create an Express application
const server = http.createServer(app); // Create an HTTP server using Express
const io = socketIO(server);         // Initialize Socket.IO with the HTTP server

const PORT = 3000; // Define the port the server will listen on

// Serve static files from the 'public' directory (where our HTML will be)
app.use(express.static('public'));

// Handle Socket.IO connections
io.on('connection', (socket) => {
    console.log('User connected:', socket.id); // Log when a user connects

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id); // Log when a user disconnects
    });

    // Listen for 'draw' events from clients
    socket.on('draw', (data) => {
        // Broadcast the 'draw' event to all connected clients (including sender)
        io.emit('draw', data); // 'io.emit' sends to *all* clients
    });
});

// Start the server
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});