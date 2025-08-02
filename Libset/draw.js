/* Main Script For Drawing Functions And Configs */

/* Configs */
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const referenceCanvas = document.getElementById("referenceCanvas");
const refCtx = referenceCanvas.getContext("2d");
const loadReferenceInput = document.getElementById('loadReference');

const colorPicker = document.getElementById("colorPicker");
const fillToggle = document.getElementById("fillToggle");
const gridElement = document.getElementById("grid");
const brushSizeInput = document.getElementById("brushSize");

const refOpacitySlider = document.getElementById("refOpacity");

const size = 32; // Grid Size, Based Off the Canvas Height.
                 // So If you change the canvas to 640x480 as an Example, the height will stay 32 Pixels.
const pixelSize = canvas.height / size; // Dont change, Just Dont.
updateGridSize();

let tool = 'pen', isDrawing = false, startX = 0, startY = 0;
let showGrid = false;
let undoStack = [], redoStack = [];
let previewImageData = null;
let lastX = null, lastY = null;

canvas.addEventListener("contextmenu", event => event.preventDefault()); // Disables Right Click on the Canvas


// Base Functions, These Are functions that lay the Base For the app.
function toggleGrid() {
	showGrid = !showGrid;
	gridElement.style.display = showGrid ? 'block' : 'none';
}

function updateGridSize() {
	gridElement.style.backgroundSize = `${pixelSize}px ${pixelSize}px`;
}

function redraw() {
	const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
	ctx.putImageData(img, 0, 0);
	if (showGrid) drawGrid();
}

function pushState() {
	undoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
	redoStack = [];
}

function undo() {
	if (undoStack.length === 0) return;
	redoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
	ctx.putImageData(undoStack.pop(), 0, 0);
}

function redo() {
	if (redoStack.length === 0) return;
	undoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
	ctx.putImageData(redoStack.pop(), 0, 0);
}


function setTool(t) {
	tool = t;

	toolStyle(tool);
}

function clearCanvas() {
	pushState();
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	redraw();
}

function saveImage() {
	const prevGridState = showGrid;
	showGrid = false;
	redraw();
	const link = document.createElement("a");
	link.download = "pixel-art.png";
	link.href = canvas.toDataURL();
	link.click();
	showGrid = prevGridState;
	redraw();
}




// Draw Functions, DO NOT CHANGE UNLESS YOU KNOW WHAT YOU ARE DOING
function drawPixel(x, y, erase = false) {
	if (erase) {
		ctx.clearRect(x * pixelSize, y * pixelSize, pixelSize * brushSizeInput.value, pixelSize * brushSizeInput.value);
	} else {
		ctx.fillStyle = colorPicker.value;
    ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize * brushSizeInput.value, pixelSize * brushSizeInput.value);
	}
}

function drawLine(x0, y0, x1, y1, erase = false) {
	const dx = Math.abs(x1 - x0);
	const dy = Math.abs(y1 - y0);
	const sx = x0 < x1 ? 1 : -1;
	const sy = y0 < y1 ? 1 : -1;
	let err = dx - dy;

  while (true) {
		drawPixel(x0, y0, erase);
		if (x0 === x1 && y0 === y1) break;
		const e2 = 2 * err;
		if (e2 > -dy) { err -= dy; x0 += sx; }
		if (e2 < dx) { err += dx; y0 += sy; }
	}
}


function drawRect(x0, y0, x1, y1, erase = false) {
    const [sx, ex] = [Math.min(x0, x1), Math.max(x0, x1)];
    const [sy, ey] = [Math.min(y0, y1), Math.max(y0, y1)];
    const width = ex - sx + 1;
    const height = ey - sy + 1;

    if (erase) {
        ctx.clearRect(sx * pixelSize, sy * pixelSize, width * pixelSize, height * pixelSize);
    } else if (fillToggle.checked) {
        ctx.fillRect(sx * pixelSize, sy * pixelSize, width * pixelSize, height * pixelSize);
    } else {
		for (let x = sx; x <= ex; x++) {
			ctx.fillRect(x * pixelSize, sy * pixelSize, pixelSize, pixelSize);
			ctx.fillRect(x * pixelSize, ey * pixelSize, pixelSize, pixelSize);
		}
		for (let y = sy; y <= ey; y++) {
			ctx.fillRect(sx * pixelSize, y * pixelSize, pixelSize, pixelSize);
			ctx.fillRect(ex * pixelSize, y * pixelSize, pixelSize, pixelSize);
		}
	}
}

function drawCircle(x0, y0, x1, y1) {
	const cx = (x0 + x1) / 2;
	const cy = (y0 + y1) / 2;
  const rx = Math.abs(x1 - x0) / 2;
  const ry = Math.abs(y1 - y0) / 2;

	for (let x = 0; x < size; x++) {
		for (let y = 0; y < size; y++) {
			const dx = (x - cx) / rx;
			const dy = (y - cy) / ry;
			const d2 = dx * dx + dy * dy;
			if ((fillToggle.checked && d2 <= 1) || (!fillToggle.checked && d2 <= 1 && d2 >= 0.6)) {
				ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
			}
		}
	}
}




function floodFill(x, y, fillColor) {
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    const width = canvas.width;
    const height = canvas.height;
    const targetColor = getPixelColor(data, x, y);

    if (colorsMatch(targetColor, fillColor)) return;

    const stack = [[x, y]];

    while (stack.length) {
        const [currX, currY] = stack.pop();
        const index = (currY * width + currX) * 4;

        // Optimized color comparison directly within the loop
        if (data[index] === targetColor[0] && data[index + 1] === targetColor[1] &&
            data[index + 2] === targetColor[2] && data[index + 3] === targetColor[3]) {

            data[index] = fillColor[0];
            data[index + 1] = fillColor[1];
            data[index + 2] = fillColor[2];
            data[index + 3] = 255;

            // Boundary checks
            if (currX > 0) stack.push([currX - 1, currY]);
            if (currX < width - 1) stack.push([currX + 1, currY]);
            if (currY > 0) stack.push([currX, currY - 1]);
            if (currY < height - 1) stack.push([currX, currY + 1]);
        }
    }

    ctx.putImageData(imgData, 0, 0);
}


/* Color Utils */
function getPixelColor(data, x, y) {
	const index = (y * canvas.width + x) * 4;
	return [data[index], data[index + 1], data[index + 2], data[index + 3]];
}

function colorsMatch(a, b) {
	return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
}

function hexToRGBA(hex) {
	const bigint = parseInt(hex.slice(1), 16);
	return [
		(bigint >> 16) & 255,
		(bigint >> 8) & 255,
		bigint & 255,
		255
	];
}



//Delete Reference Layer When Reference Image is Loaded
function deleteReference() {
    // Clear the reference canvas
    refCtx.clearRect(0, 0, referenceCanvas.width, referenceCanvas.height);

    // Reset the button text and action
    const refButton = document.getElementById('referenceButton');
    refButton.textContent = '🖼️ Load Refer';
    refButton.onclick = () => document.getElementById('loadReference').click();
	
    loadReferenceInput.value = '';
}

let currentReferenceImage = null;

// Function to redraw the reference image with updated opacity
function updateReferenceOpacity() {
    if (!currentReferenceImage) return;

    refCtx.clearRect(0, 0, referenceCanvas.width, referenceCanvas.height);
    const hRatio = referenceCanvas.width / currentReferenceImage.width;
    const vRatio = referenceCanvas.height / currentReferenceImage.height;
    const ratio = Math.min(hRatio, vRatio);
    const centerShift_x = (referenceCanvas.width - currentReferenceImage.width * ratio) / 2;
    const centerShift_y = (referenceCanvas.height - currentReferenceImage.height * ratio) / 2;

    refCtx.globalAlpha = parseFloat(refOpacitySlider.value);
    refCtx.drawImage(
        currentReferenceImage,
        0,
        0,
        currentReferenceImage.width,
        currentReferenceImage.height,
        centerShift_x,
        centerShift_y,
        currentReferenceImage.width * ratio,
        currentReferenceImage.height * ratio
    );
    refCtx.globalAlpha = 1.0; // Reset alpha for other operations
}

refOpacitySlider.addEventListener("input", updateReferenceOpacity);


// Image Load Button, This feature Is Very prone to Breaking.
// So Dont change Unless You know your Things
// As it will always work Even If You add new Drawing Features.

document.getElementById('loadImage').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        alert('Please select an image file.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const scale = canvas.height / img.height;
            const newWidth = img.width * scale;
            const x = (canvas.width - newWidth) / 2;
            
            ctx.drawImage(img, x, 0, newWidth, canvas.height);
        };
        img.onerror = function() { alert('Error loading image.'); };
        img.src = event.target.result;
    };
    reader.onerror = function() { alert('Error reading file.'); };
    reader.readAsDataURL(file);

    // Reset the input value after processing the file
    this.value = ''; // 'this' refers to the input element
});


loadReferenceInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
			currentReferenceImage = img;
            refCtx.clearRect(0, 0, referenceCanvas.width, referenceCanvas.height);
            const hRatio = referenceCanvas.width / img.width;
            const vRatio = referenceCanvas.height / img.height;
            const ratio = Math.min(hRatio, vRatio);
            const centerShift_x = ( referenceCanvas.width - img.width * ratio ) / 2;
            const centerShift_y = ( referenceCanvas.height - img.height * ratio ) / 2;
						refCtx.globalAlpha = refOpacitySlider.value;
            refCtx.drawImage(img, 0, 0, img.width, img.height, centerShift_x, centerShift_y, img.width * ratio, img.height * ratio);

            const refButton = document.getElementById('referenceButton');
            refButton.textContent = '🗑️ Delete Refer'; // Change text
            refButton.onclick = deleteReference; // Change action to delete function
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    
    // Reset the input value after processing
    this.value = '';
});