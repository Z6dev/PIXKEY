/* This Script Handles The Animation Feature And Spritesheet Export */
/* I Recommend Not Modifying Any parts of this, Unless You want to Add New Features related To Animation */

let frames = [ctx.getImageData(0, 0, canvas.width, canvas.height)];
let currentFrame = 0;


let isPlaying = false;
let animationInterval = null;


function updateFrameDisplay() {
  ctx.putImageData(frames[currentFrame], 0, 0);
  renderFrameList(); // Ensure UI updates
}

function saveCurrentFrame() {
  frames[currentFrame] = ctx.getImageData(0, 0, canvas.width, canvas.height);
}

function addFrame() {
  saveCurrentFrame();
  frames.push(ctx.createImageData(canvas.width, canvas.height));
  currentFrame = frames.length - 1;
  updateFrameDisplay();
  renderFrameList();
}

function deleteFrame() {
  if (frames.length <= 1) return;
  frames.splice(currentFrame, 1);
  currentFrame = Math.max(0, currentFrame - 1);
  updateFrameDisplay();
  renderFrameList();
}


function nextFrame() {
  saveCurrentFrame();
  currentFrame = (currentFrame + 1) % frames.length;
  updateFrameDisplay();
  renderFrameList();
}

function prevFrame() {
  saveCurrentFrame();
  currentFrame = (currentFrame - 1 + frames.length) % frames.length;
  updateFrameDisplay();
  renderFrameList();
}


function playAnimation() {
  const button = document.querySelector('button[onclick="playAnimation()"]');

  if (isPlaying) {
    clearInterval(animationInterval);
    isPlaying = false;
    button.textContent = '▶️ Play';
    updateFrameDisplay(); // restore the original frame
    return;
  }

  saveCurrentFrame(); // Save before playing
  isPlaying = true;
  button.textContent = '⏹️ Stop';

  let i = 0;
  animationInterval = setInterval(() => {
    ctx.putImageData(frames[i], 0, 0);
    i = (i + 1) % frames.length; // loop
  }, 100);
}

function exportSpriteSheet() {
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = canvas.width * frames.length;
  tempCanvas.height = canvas.height;
  const tempCtx = tempCanvas.getContext('2d');

  frames.forEach((frame, i) => {
    tempCtx.putImageData(frame, i * canvas.width, 0);
  });

  const link = document.createElement('a');
  link.download = 'spritesheet.png';
  link.href = tempCanvas.toDataURL();
  link.click();
}


// Renders Frame List
function renderFrameList() {
  const list = document.getElementById('frameList');
  list.innerHTML = '';
  frames.forEach((_, i) => {
    const item = document.createElement('div');
    item.className = 'frame-item' + (i === currentFrame ? ' active' : '');
    item.textContent = `Frame ${i + 1}`;
    item.onclick = () => {
      saveCurrentFrame();
      currentFrame = i;
      updateFrameDisplay();
      renderFrameList();
    };
    list.appendChild(item);
  });
}

// Frame List Management
const originalAddFrame = addFrame;
addFrame = function () {
  saveCurrentFrame();
  frames.push(ctx.createImageData(canvas.width, canvas.height));
  currentFrame = frames.length - 1;
  updateFrameDisplay();
  renderFrameList();
};

const originalDeleteFrame = deleteFrame;
deleteFrame = function () {
  if (frames.length <= 1) return;
  frames.splice(currentFrame, 1);
  currentFrame = Math.max(0, currentFrame - 1);
  updateFrameDisplay();
  renderFrameList();
};

// Initial render on load
window.onload = () => {
  renderFrameList();
};