const CELL = 32;
const MAX_HISTORY = 30;

const PALETTE = [
  '#111827', '#ef4444', '#f97316', '#f59e0b',
  '#84cc16', '#22c55e', '#14b8a6', '#06b6d4',
  '#3b82f6', '#6366f1', '#a855f7', '#ec4899',
  '#f43f5e', '#92400e', '#ffffff', '#9ca3af',
];

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const swatchesEl = document.getElementById('swatches');
const eraserBtn = document.getElementById('eraserBtn');
const undoBtn = document.getElementById('undoBtn');
const clearBtn = document.getElementById('clearBtn');
const downloadBtn = document.getElementById('downloadBtn');
const currentSwatch = document.getElementById('currentSwatch');
const currentLabel = document.getElementById('currentLabel');
const sizeSelect = document.getElementById('sizeSelect');

const background = document.createElement('canvas');

let size = Number(sizeSelect.value);
let grid = emptyGrid();
let color = PALETTE[1];
let erasing = false;
let drawing = false;
let history = [];

function emptyGrid() {
  return Array.from({ length: size }, () => Array(size).fill(null));
}

function snapshot() {
  return grid.map((row) => row.slice());
}

function saveHistory() {
  history.push(snapshot());
  if (history.length > MAX_HISTORY) history.shift();
}

function buildBackground() {
  const width = size * CELL;
  background.width = width;
  background.height = width;

  const bg = background.getContext('2d');
  bg.clearRect(0, 0, width, width);

  if (size > 32) {
    bg.fillStyle = '#ffffff';
    bg.fillRect(0, 0, width, width);
    return;
  }

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      bg.fillStyle = (row + col) % 2 === 0 ? '#ffffff' : '#f4f7fb';
      bg.fillRect(col * CELL, row * CELL, CELL, CELL);
    }
  }

  bg.strokeStyle = '#e3e9f2';
  bg.lineWidth = 1;

  for (let i = 0; i <= size; i++) {
    const position = i * CELL + 0.5;
    bg.beginPath();
    bg.moveTo(position, 0);
    bg.lineTo(position, width);
    bg.stroke();
    bg.beginPath();
    bg.moveTo(0, position);
    bg.lineTo(width, position);
    bg.stroke();
  }
}

function resizeCanvas() {
  canvas.width = size * CELL;
  canvas.height = size * CELL;
  buildBackground();
}

function draw() {
  const width = canvas.width;
  ctx.clearRect(0, 0, width, width);
  ctx.drawImage(background, 0, 0);

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const value = grid[row][col];
      if (!value) continue;
      ctx.fillStyle = value;
      ctx.fillRect(col * CELL, row * CELL, CELL, CELL);
    }
  }
}

function buildPalette() {
  PALETTE.forEach((value) => {
    const swatch = document.createElement('button');
    swatch.type = 'button';
    swatch.className = 'swatch';
    swatch.style.background = value;
    swatch.dataset.color = value;
    swatch.setAttribute('aria-label', `Colour ${value}`);

    if (value === color) swatch.classList.add('active');

    swatch.addEventListener('click', () => {
      color = value;
      erasing = false;
      currentSwatch.style.background = value;
      currentLabel.textContent = value;
      eraserBtn.classList.remove('active');
      swatchesEl.querySelectorAll('.swatch').forEach((item) => {
        item.classList.toggle('active', item.dataset.color === value);
      });
    });

    swatchesEl.appendChild(swatch);
  });
}

function cellFromEvent(event) {
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor(((event.clientX - rect.left) / rect.width) * size);
  const y = Math.floor(((event.clientY - rect.top) / rect.height) * size);

  if (x < 0 || x >= size || y < 0 || y >= size) return null;
  return { x, y };
}

function paint(event) {
  const cell = cellFromEvent(event);
  if (!cell) return;

  const value = erasing ? null : color;
  if (grid[cell.y][cell.x] === value) return;

  grid[cell.y][cell.x] = value;
  draw();
}

canvas.addEventListener('pointerdown', (event) => {
  drawing = true;
  saveHistory();
  canvas.setPointerCapture(event.pointerId);
  paint(event);
});

canvas.addEventListener('pointermove', (event) => {
  if (!drawing) return;
  paint(event);
});

canvas.addEventListener('pointerup', () => {
  drawing = false;
});

canvas.addEventListener('pointercancel', () => {
  drawing = false;
});

eraserBtn.addEventListener('click', () => {
  erasing = !erasing;
  eraserBtn.classList.toggle('active', erasing);
});

undoBtn.addEventListener('click', () => {
  if (!history.length) return;
  grid = history.pop();
  draw();
});

clearBtn.addEventListener('click', () => {
  saveHistory();
  grid = emptyGrid();
  draw();
});

sizeSelect.addEventListener('change', () => {
  size = Number(sizeSelect.value);
  grid = emptyGrid();
  history = [];
  resizeCanvas();
  draw();
});

downloadBtn.addEventListener('click', () => {
  const output = document.createElement('canvas');
  output.width = canvas.width;
  output.height = canvas.height;
  const outCtx = output.getContext('2d');

  grid.forEach((row, r) => {
    row.forEach((value, c) => {
      if (!value) return;
      outCtx.fillStyle = value;
      outCtx.fillRect(c * CELL, r * CELL, CELL, CELL);
    });
  });

  output.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'pixel-art.png';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
});

buildPalette();
currentSwatch.style.background = color;
resizeCanvas();
draw();
