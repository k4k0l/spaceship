import Game from './game.js';

const canvas = document.getElementById('game');
const mapCanvas = document.getElementById('minimap');
const scoreEl = document.getElementById('score');
const statusEl = document.getElementById('status');
const timerEl = document.getElementById('timer');

const menu = document.getElementById('menu');
const settingsScreen = document.getElementById('settingsScreen');
const creditsScreen = document.getElementById('creditsScreen');
const newGameBtn = document.getElementById('newGameBtn');
const settingsBtn = document.getElementById('settingsBtn');
const creditsBtn = document.getElementById('creditsBtn');
const backBtn = document.getElementById('backBtn');
const creditsBack = document.getElementById('creditsBack');

const worldSizeInput = document.getElementById('worldSize');
const shipSizeInput = document.getElementById('shipSize');
const shipMassInput = document.getElementById('shipMass');
const roundTimeInput = document.getElementById('roundTime');

let creditsInterval;
let game;

function hideScreens() {
  menu.classList.add('hidden');
  settingsScreen.classList.add('hidden');
  creditsScreen.classList.add('hidden');
}

function showMenu() {
  hideScreens();
  menu.classList.remove('hidden');
}

function showSettings() {
  hideScreens();
  settingsScreen.classList.remove('hidden');
}

function showCredits() {
  hideScreens();
  creditsScreen.classList.remove('hidden');
  creditsInterval = setInterval(() => {
    creditsScreen.style.backgroundColor = `hsl(${Math.floor(Math.random()*360)},50%,20%)`;
  }, 200);
}

function hideCredits() {
  clearInterval(creditsInterval);
  creditsScreen.style.backgroundColor = 'rgba(0,0,0,0.8)';
}

function startGame() {
  hideCredits();
  hideScreens();
  Game.DEFAULT_SHIP_RADIUS = parseInt(shipSizeInput.value) || Game.DEFAULT_SHIP_RADIUS;
  Game.DEFAULT_SHIP_MASS = parseInt(shipMassInput.value) || Game.DEFAULT_SHIP_MASS;
  Game.ROUND_TIME = parseInt(roundTimeInput.value) || Game.ROUND_TIME;
  const settings = { worldSize: parseInt(worldSizeInput.value) || Game.WORLD_SIZE };
  game = new Game(canvas, mapCanvas, scoreEl, statusEl, timerEl, settings);
  game.start(showMenu);
}

newGameBtn.onclick = startGame;
settingsBtn.onclick = showSettings;
creditsBtn.onclick = showCredits;
backBtn.onclick = showMenu;
creditsBack.onclick = () => { hideCredits(); showMenu(); };

showMenu();
