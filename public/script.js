// script.js
const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d'); // Get 2D rendering context for drawing

const socket = io(); // Connect to the Socket.IO server (automatically connects to the server serving this page)

let drawing = false;
let currentPosition = { x: 0, y: 0 };
let color = 'black'; // Default drawing color
let size = 5;      // Default brush size

// Event listeners for mouse events on the canvas
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);
canvas.addEventListener('mousemove', draw);

function startDrawing(e) {
    drawing = true;
    getPosition(e);
    drawPoint(currentPosition.x, currentPosition.y, color, size); // Draw a point when mouse is pressed
    sendDrawData(currentPosition.x, currentPosition.y, color, size); // Send initial point to server
}

function stopDrawing() {
    drawing = false;
}

function draw(e) {
    if (!drawing) return; // Don't draw if not drawing

    getPosition(e);
    drawLine(currentPosition.x, currentPosition.y, color, size);
    sendDrawData(currentPosition.x, currentPosition.y, color, size); // Send drawing data to server
}

function getPosition(e) {
    // Get mouse position relative to the canvas
    const rect = canvas.getBoundingClientRect();
    currentPosition.x = e.clientX - rect.left;
    currentPosition.y = e.clientY - rect.top;
}

function drawPoint(x, y, drawColor, drawSize) {
    ctx.beginPath(); // Start a new drawing path
    ctx.arc(x, y, drawSize / 2, 0, Math.PI * 2); // Draw a circle (point)
    ctx.fillStyle = drawColor; // Set fill color
    ctx.fill();            // Fill the circle
    ctx.closePath();       // Close the path
}

function drawLine(x, y, drawColor, drawSize) {
    ctx.lineWidth = drawSize;      // Set line width
    ctx.lineCap = 'round';       // Make line ends rounded
    ctx.strokeStyle = drawColor; // Set line color
    ctx.lineTo(x, y);          // Draw line to current position
    ctx.stroke();               // Stroke (draw) the line
    ctx.beginPath();           // Start a new path for the next segment
    ctx.moveTo(x, y);            // Move starting point to current position for next segment
}

function sendDrawData(x, y, drawColor, drawSize) {
    // Send drawing data to the server via Socket.IO
    socket.emit('draw', {
        x: x,
        y: y,
        color: drawColor,
        size: drawSize
    });
}

// Listen for 'draw' events from the server (broadcasted from other clients)
socket.on('draw', (data) => {
    // Draw on *this* client's canvas based on data from the server
    drawPoint(data.x, data.y, data.color, data.size); // For points (initial clicks)
    drawLine(data.x, data.y, data.color, data.size);  // For line segments (dragging)
});