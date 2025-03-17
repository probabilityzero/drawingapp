const canvas = document.getElementById('drawingCanvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const ctx = canvas.getContext('2d');

const socket = io();

let drawing = false;
let currentPosition = { x: 0, y: 0 };
let lastPosition = { x: 0, y: 0 };
let color = document.getElementById('colorPicker').value;
let size = 3;
let isErasing = false;
let zoomLevel = 1;
let panX = 0;
let panY = 0;
let drawingData = [];
let userList = [];

const colorPicker = document.getElementById('colorPicker');
const eraserButton = document.getElementById('eraser');
const eraserIcon = document.getElementById('eraserIcon');
const pencilIcon = document.getElementById('pencilIcon');
const eraserSizeInput = document.getElementById('eraserSize');
const nameModal = document.getElementById('nameModal');
const userNameInput = document.getElementById('userNameInput');
const saveNameButton = document.getElementById('saveNameButton');

let userName = localStorage.getItem('userName') || '';

function applyZoomAndPan() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.translate(panX, panY);
    ctx.scale(zoomLevel, zoomLevel);
    redrawCanvas();
}

function redrawCanvas() {
    ctx.clearRect(0, 0, canvas.width / zoomLevel, canvas.height / zoomLevel);
    drawingData.forEach(data => {
        const drawColor = data.isErasing ? 'white' : data.color;
        drawSmoothLine(data.x, data.y, drawColor, data.size);
    });
}

function drawSmoothLine(x, y, drawColor, drawSize, userName = null) {
    ctx.lineWidth = drawSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = drawColor;

    const distance = Math.sqrt(Math.pow(x - lastPosition.x, 2) + Math.pow(y - lastPosition.y, 2));
    const velocity = distance;
    const dynamicSize = Math.max(1, drawSize * (1.5 - velocity * 0.01));

    ctx.lineWidth = dynamicSize;

    ctx.beginPath();
    ctx.moveTo(lastPosition.x, lastPosition.y);
    ctx.quadraticCurveTo(lastPosition.x, lastPosition.y, x, y);
    ctx.stroke();
    lastPosition = { x: x, y: y };

    if (userName) {
        canvas.title = `Drawing by: ${userName}`;
        setTimeout(() => { canvas.title = ''; }, 500);
    }
}

function getPosition(e) {
    const rect = canvas.getBoundingClientRect();
    currentPosition.x = (e.clientX - rect.left - panX) / zoomLevel;
    currentPosition.y = (e.clientY - rect.top - panY) / zoomLevel;
}
function getPosition(touch) {
    const rect = canvas.getBoundingClientRect();
    currentPosition.x = (touch.clientX - rect.left - panX) / zoomLevel;
    currentPosition.y = (touch.clientY - rect.top - panY) / zoomLevel;
}


function sendDrawData(x, y, drawColor, drawSize, erasing) {
    socket.emit('draw', {
        x: x,
        y: y,
        color: drawColor,
        size: drawSize,
        isErasing: erasing,
        userName: userName
    });
}

function startDrawing(e) {
    drawing = true;
    getPosition(e);
    lastPosition = { x: currentPosition.x, y: currentPosition.y };
    const drawColor = isErasing ? 'white' : color;
    drawSmoothLine(currentPosition.x, currentPosition.y, drawColor, size);
    sendDrawData(currentPosition.x, currentPosition.y, drawColor, size, isErasing);
    socket.emit('drawStart', { isErasing: isErasing });
}
function startDrawingTouch(touch) {
    drawing = true;
    getPosition(touch);
    lastPosition = { x: currentPosition.x, y: currentPosition.y };
    const drawColor = isErasing ? 'white' : color;
    drawSmoothLine(currentPosition.x, currentPosition.y, drawColor, size);
    sendDrawData(currentPosition.x, currentPosition.y, drawColor, size, isErasing);
    socket.emit('drawStart', { isErasing: isErasing });
}


function stopDrawing() {
    drawing = false;
    ctx.beginPath();
    socket.emit('drawEnd');
}
function stopDrawingTouch() {
    drawing = false;
    ctx.beginPath();
    socket.emit('drawEnd');
}


function draw(e) {
    if (!drawing) return;
    getPosition(e);
    const drawColor = isErasing ? 'white' : color;
    drawSmoothLine(currentPosition.x, currentPosition.y, drawColor, size);
    sendDrawData(currentPosition.x, currentPosition.y, drawColor, size, isErasing);
}
function drawTouch(touch) {
    if (!drawing) return;
    getPosition(touch);
    const drawColor = isErasing ? 'white' : color;
    drawSmoothLine(currentPosition.x, currentPosition.y, drawColor, size);
    sendDrawData(currentPosition.x, currentPosition.y, drawColor, size, isErasing);
}


canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);
canvas.addEventListener('mousemove', draw);

canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
        e.preventDefault();
        startDrawingTouch(e.touches[0]);
    } else if (e.touches.length === 2) {
        e.preventDefault();
        initialDistance = getDistance(e.touches);
        initialPinchCenter = getPinchCenter(e.touches, canvas.getBoundingClientRect());
        lastTouchCenter = initialPinchCenter;
    }
});
canvas.addEventListener('touchmove', (e) => {
    if (drawing && e.touches.length === 1) {
        e.preventDefault();
        drawTouch(e.touches[0]);
    } else if (e.touches.length === 2) {
        e.preventDefault();
        handleTouchZoomAndPan(e.touches);
    }
});
canvas.addEventListener('touchend', (e) => {
    if (drawing && e.touches.length === 0) {
        stopDrawingTouch();
    } else if (e.touches.length < 2) {
        initialDistance = null;
        lastTouchCenter = null;
    }
});
canvas.addEventListener('touchcancel', (e) => {
    initialDistance = null;
    lastTouchCenter = null;
    stopDrawingTouch();
});


canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    handleMouseWheelZoom(e);
});

canvas.addEventListener('mousedown', (e) => {
    if (e.button === 1) {
        startPanning(e);
    } else if (e.button === 0) {
        startDrawing(e);
    }
});
canvas.addEventListener('mousemove', (e) => {
    if (isPanning) {
        panCanvas(e);
    } else if (drawing) {
        draw(e);
    }
});
canvas.addEventListener('mouseup', stopPanOrDraw);
canvas.addEventListener('mouseout', stopPanOrDraw);


colorPicker.addEventListener('input', (e) => {
    color = e.target.value;
    isErasing = false;
    eraserButton.classList.remove('active');
    eraserButton.classList.remove('bg-gray-200');
    eraserIcon.classList.remove('hidden');
    pencilIcon.classList.add('hidden');
    updateCanvasCursor();
});

eraserButton.addEventListener('click', () => {
    isErasing = !isErasing;
    eraserButton.classList.toggle('active', isErasing);
    eraserButton.classList.toggle('bg-gray-200', isErasing);

    eraserIcon.classList.toggle('hidden', !isErasing);
    pencilIcon.classList.toggle('hidden', isErasing);

    updateCanvasCursor();
});

eraserSizeInput.addEventListener('input', (e) => {
    size = parseInt(e.target.value);
    updateCanvasCursor();
});


window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    redrawCanvas();
    applyZoomAndPan();
});


function handleMouseWheelZoom(e) {
    const zoomSpeed = 0.1;
    const zoomFactor = e.deltaY > 0 ? (1 - zoomSpeed) : (1 + zoomSpeed);
    zoomLevel *= zoomFactor;
    zoomLevel = Math.max(0.2, Math.min(zoomLevel, 4));
    applyZoomAndPan();
}

let isPanning = false;
let startPanPoint = { x: 0, y: 0 };

function startPanning(e) {
    isPanning = true;
    startPanPoint = { x: e.clientX, y: e.clientY };
    canvas.style.cursor = 'grab';
}

function panCanvas(e) {
    panX += (e.clientX - startPanPoint.x);
    panY += (e.clientY - startPanPoint.y);
    startPanPoint = { x: e.clientX, y: e.clientY };
    applyZoomAndPan();
}

function stopPanOrDraw(e) {
    if (isPanning && e.button === 1) {
        isPanning = false;
        canvas.style.cursor = 'crosshair';
    }
    stopDrawing();
    stopDrawingTouch();
}


let initialDistance = null;
let initialPinchCenter = null;
let lastTouchCenter = null;

function getDistance(touches) {
    const touch1 = touches[0];
    const touch2 = touches[1];
    return Math.sqrt(Math.pow(touch2.clientX - touch1.clientX, 2) + Math.pow(touch2.clientY - touch1.clientY, 2));
}

function getPinchCenter(touches, rect) {
    const touch1 = touches[0];
    const touch2 = touches[1];
    return {
        x: ((touch1.clientX + touch2.clientX) / 2 - rect.left - panX) / zoomLevel,
        y: ((touch1.clientY + touch2.clientY) / 2 - rect.top - panY) / zoomLevel
    };
}

function handleTouchZoomAndPan(touches) {
    const rect = canvas.getBoundingClientRect();
    const currentDistance = getDistance(touches);
    const currentPinchCenter = getPinchCenter(touches, rect);

    if (initialDistance !== null) {
        zoomLevel *= currentDistance / initialDistance;
        zoomLevel = Math.max(0.2, Math.min(zoomLevel, 4));
        initialDistance = currentDistance;
    }

    if (lastTouchCenter) {
        panX += (currentPinchCenter.x - lastTouchCenter.x) / zoomLevel;
        panY += (currentPinchCenter.y - lastTouchCenter.y) / zoomLevel;
        lastTouchCenter = currentPinchCenter;
    }
    applyZoomAndPan();
}


function updateCanvasCursor() {
    if (isErasing) {
        const eraserRadius = size / 2 * zoomLevel;
        const cursorSize = Math.max(10, eraserRadius * 2 * zoomLevel);
        const canvasCursor = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${cursorSize}" height="${cursorSize}"><circle cx="${cursorSize/2}" cy="${cursorSize/2}" r="${eraserRadius * zoomLevel}" fill="none" stroke="black" stroke-width="1"/></svg>') ${cursorSize/2} ${cursorSize/2}, crosshair`;
        canvas.style.cursor = canvasCursor;
    } else {
        canvas.style.cursor = 'crosshair';
    }
}


socket.on('initialDrawData', (data) => {
    drawingData = data;
    redrawCanvas();
});

socket.on('draw', (data) => {
    drawingData.push(data);
    const drawColor = data.isErasing ? 'white' : data.color;
    drawSmoothLine(data.x, data.y, drawColor, data.size);
});

socket.on('clear', () => {
    ctx.clearRect(0, 0, canvas.width / zoomLevel, canvas.height / zoomLevel);
    drawingData = [];
});


socket.on('userListUpdate', (users) => {
    userList = users;
    console.log("Updated user list:", userList);
});


if (!userName) {
    nameModal.classList.remove('hidden');
} else {
    nameModal.classList.add('hidden');
}

saveNameButton.addEventListener('click', () => {
    userName = userNameInput.value.trim();
    if (userName) {
        localStorage.setItem('userName', userName);
        nameModal.classList.add('hidden');
        socket.emit('setUserName', userName);
    } else {
        alert('Please enter a name.');
    }
});

applyZoomAndPan();
updateCanvasCursor();