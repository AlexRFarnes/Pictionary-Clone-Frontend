const drawSettingsRec = document
  .querySelector('[data-draw-settings]')
  .getBoundingClientRect();
const topOffset = drawSettingsRec.height;
export default function DrawableCanvas(canvas, socket, color, strokeWidth) {
  this.canDraw = false;
  this.color = color || '#000000';
  this.strokeWidth = strokeWidth || 1;
  this.clearCanvas = function () {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };
  let previousPosition = null;

  canvas.addEventListener('mousemove', e => {
    if (e.buttons !== 1 || !this.canDraw) {
      previousPosition = null;
      return;
    }

    const newPosition = { x: e.layerX, y: e.layerY - topOffset };
    if (previousPosition != null) {
      drawLine(previousPosition, newPosition, this.color, this.strokeWidth);
      socket.emit('draw', {
        start: normalizePosition(previousPosition),
        end: normalizePosition(newPosition),
        color: this.color,
        strokeWidth: this.strokeWidth,
      });
    }

    previousPosition = newPosition;
  });
  canvas.addEventListener('mouseleave', () => {
    previousPosition = null;
  });

  socket.on('draw-line', (start, end, color, strokeWidth) => {
    drawLine(toCanvasSpace(start), toCanvasSpace(end), color, strokeWidth);
  });

  function drawLine(start, end, color, strokeWidth) {
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = color;
    ctx.lineWidth = strokeWidth;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  }

  function normalizePosition(position) {
    return {
      x: position.x / canvas.width,
      y: position.y / canvas.height,
    };
  }

  function toCanvasSpace(position) {
    return {
      x: position.x * canvas.width,
      y: position.y * canvas.height,
    };
  }
}
