/* Input Handling Script for Pixkey */

// Get Pointer Position (Mouse or Touch)
function getPointerPos(e) {
  const rect = canvas.getBoundingClientRect();
  const clientX = e.touches?.[0]?.clientX ?? e.clientX;
  const clientY = e.touches?.[0]?.clientY ?? e.clientY;
  const x = Math.floor((clientX - rect.left) / pixelSize);
  const y = Math.floor((clientY - rect.top) / pixelSize);
  return { x, y };
}

// Begin Drawing
function handleStart(x, y, isRightClick = false) {
  isDrawing = true;
  startX = lastX = x;
  startY = lastY = y;
  pushState();

  if (tool === 'fill') {
    floodFill(x * pixelSize, y * pixelSize, hexToRGBA(colorPicker.value));
    isDrawing = false;
  } else {
    drawPixel(x, y, isRightClick || tool === 'eraser');
  }
}

// Continue Drawing
function handleMove(x, y, isRightClick = false) {
  if (!isDrawing) return;
  if (x === lastX && y === lastY) return;

  if (tool === 'pen' || tool === 'eraser') {
    drawLine(lastX, lastY, x, y, isRightClick || tool === 'eraser');
    lastX = x;
    lastY = y;
  } else if (tool === 'rect' || tool === 'circle') {
    ctx.putImageData(previewImageData, 0, 0);
    ctx.fillStyle = colorPicker.value;
    tool === 'rect'
      ? drawRect(startX, startY, x, y, isRightClick)
      : drawCircle(startX, startY, x, y); //Note:circle does not erase
  }
}

// End Drawing
function handleEnd(x, y, isRightClick = false) {
  if (!isDrawing) return;
  pushState();

  if (tool === 'rect') drawRect(startX, startY, x, y, isRightClick);
  if (tool === 'circle') drawCircle(startX, startY, x, y);

  isDrawing = false;
  lastX = lastY = null;
  previewImageData = null;
}

// Mouse Events
canvas.addEventListener("mousedown", e => {
  e.preventDefault();
  const { x, y } = getPointerPos(e);
  const isRightClick = e.button === 2; // Check for right click (button 2)
  if (tool !== 'fill') {
    previewImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  }
  handleStart(x, y, isRightClick);
});

canvas.addEventListener("mousemove", e => {
  const { x, y } = getPointerPos(e);
  const isRightClick = e.buttons === 2; // Check if the right button is held down
  handleMove(x, y, isRightClick);
});

canvas.addEventListener("mouseup", e => {
  const { x, y } = getPointerPos(e);
  const isRightClick = e.button === 2; // Check for right click (button 2)
  handleEnd(x, y, isRightClick);
});

// Touch Events
canvas.addEventListener("touchstart", e => {
  e.preventDefault();
  const { x, y } = getPointerPos(e);
  if (tool !== 'fill') {
    previewImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  }
  handleStart(x, y);
});

canvas.addEventListener("touchmove", e => {
  e.preventDefault();
  const { x, y } = getPointerPos(e);
  handleMove(x, y);
});

canvas.addEventListener("touchend", e => {
  const { x, y } = getPointerPos(e);
  handleEnd(x, y);
});