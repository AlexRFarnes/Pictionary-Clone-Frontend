import { io } from 'socket.io-client';
import DrawableCanvas from './DrawableCanvas';
const production = process.env.NODE_ENV === 'production';
const serverUrl = production ? 'https://pictionary-clone-server.herokuapp.com/' : 'http://localhost:3000';

const urlParams = new URLSearchParams(window.location.search);
const name = urlParams.get('name');
const roomId = urlParams.get('room-id');
if (!name || !roomId) window.location = './index.html';

const socket = io(serverUrl);

// Get all html elements
const guessForm = document.querySelector('[data-guess-form]');
const guessInput = document.querySelector('[data-guess-input]');
const wordElement = document.querySelector('[data-word]');
const messagesElement = document.querySelector('[data-messages]');
const readyBtn = document.querySelector('[data-ready-btn]');
const canvas = document.querySelector('[data-canvas]');
const guessTemplate = document.querySelector('[data-guess-template]');
const colorPicker = document.querySelector('[data-color-picker]');
const strokeWidthRange = document.querySelector('[data-stroke-range]');
strokeWidthRange.defaultValue = strokeWidthRange.value;
const strokeLabel = document.querySelector('[data-stroke-label]');
// Initialize the DrawableCanvas
const drawableCanvas = new DrawableCanvas(
  canvas,
  socket,
  colorPicker.value,
  parseInt(strokeWidthRange.value)
);
// Once the user joins a room pass its information to the server
socket.emit('join-room', { name: name, roomId: roomId });

socket.on('start-drawing', startRoundDrawer);
socket.on('start-guessing', startRoundGuesser);
socket.on('guess', displayGuess);
socket.on('winner', endRound);
endRound();
resizeCanvas();
setupEvents();

function setupEvents() {
  readyBtn.addEventListener('click', () => {
    hideElement(readyBtn);
    socket.emit('ready');
  });

  guessForm.addEventListener('submit', e => {
    e.preventDefault();

    if (guessInput.value === '') return;

    socket.emit('make-guess', { guess: guessInput.value });
    displayGuess(name, guessInput.value);

    guessInput.value = '';
  });

  colorPicker.addEventListener('change', e => {
    drawableCanvas.color = `${e.target.value}`;
  });

  strokeWidthRange.addEventListener('change', e => {
    drawableCanvas.strokeWidth = parseInt(e.target.value);
  });

  window.addEventListener('resize', () => {
    resizeCanvas();
  });
}

function startRoundDrawer(word) {
  drawableCanvas.clearCanvas();
  messagesElement.innerHTML = '';
  wordElement.innerText = '';
  drawableCanvas.canDraw = true;
  wordElement.innerText = word;
  showElement(colorPicker);
  showElement(strokeWidthRange);
  showElement(strokeLabel);
}

function startRoundGuesser() {
  drawableCanvas.clearCanvas();
  hideElement(wordElement);
  messagesElement.innerHTML = '';
  wordElement.innerText = '';
  showElement(guessForm);
}

function endRound(name, word) {
  if (word && name) {
    wordElement.innerText = word;
    showElement(wordElement);
    displayGuess(null, `${name} is the winner`);
  }
  hideElement(colorPicker);
  hideElement(strokeWidthRange);
  hideElement(strokeLabel);
  hideElement(guessForm);
  showElement(readyBtn);
  drawableCanvas.canDraw = false;
}

function displayGuess(guesserName, guess) {
  const guessElement = guessTemplate.content.cloneNode(true);
  const nameElement = guessElement.querySelector('[data-name]');
  const messageElement = guessElement.querySelector('[data-text]');
  nameElement.innerText = guesserName;
  messageElement.innerText = guess;
  messagesElement.append(guessElement);
}

function resizeCanvas() {
  canvas.width = null;
  canvas.height = null;
  const clientDimensions = canvas.getBoundingClientRect();
  canvas.width = clientDimensions.width;
  canvas.height = clientDimensions.height;
}

function showElement(el) {
  el.classList.remove('hide');
}

function hideElement(el) {
  el.classList.add('hide');
}
