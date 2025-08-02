/* A set Of Functions That Manages Styling */

function toolStyle(toolName) {
  currentTool = toolName;

  // Highlight the selected tool button
  const buttons = document.querySelectorAll('.toolbar button');
  buttons.forEach(btn => btn.classList.remove('selected'));

  const toolButtons = {
    pen: 'Pen',
    eraser: 'Eraser',
    rect: 'Rectangle',
    circle: 'Circle',
    fill: 'Fill'
  };

  const selectedButton = Array.from(buttons).find(btn => 
    btn.textContent.trim() === toolButtons[toolName]
  );

  if (selectedButton) {
    selectedButton.classList.add('selected');
  }
}

toolStyle(tool);
