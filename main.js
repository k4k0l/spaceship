import Game from './game.js';

const canvas = document.getElementById('game');
const mapCanvas = document.getElementById('minimap');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const armorEl = document.getElementById('armor');
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
const minAstInput = document.getElementById('minAst');
const maxAstInput = document.getElementById('maxAst');
const maxPlanetsInput = document.getElementById('maxPlanets');
const menuStars = document.getElementById('menuStars');

let starAnim;
let starField = [];

function initStarField() {
  menuStars.width = window.innerWidth;
  menuStars.height = window.innerHeight;
  starField = [];
  for (let i = 0; i < 100; i++) {
    starField.push({
      x: (Math.random() - 0.5) * menuStars.width,
      y: (Math.random() - 0.5) * menuStars.height,
      z: Math.random() * menuStars.width
    });
  }
}

function renderStars() {
  const ctx = menuStars.getContext('2d');
  const w = menuStars.width;
  const h = menuStars.height;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#fff';
  for (const s of starField) {
    s.z -= 20;
    if (s.z <= 0) {
      s.x = (Math.random() - 0.5) * w;
      s.y = (Math.random() - 0.5) * h;
      s.z = w;
      s.px = s.x;
      s.py = s.y;
    }
    const k = 128 / s.z;
    const x = s.x * k + w / 2;
    const y = s.y * k + h / 2;
    const px = (s.px ?? s.x) * k + w / 2;
    const py = (s.py ?? s.y) * k + h / 2;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(x, y);
    ctx.stroke();
    s.px = s.x;
    s.py = s.y;
  }
  if (!menu.classList.contains('hidden')) starAnim = requestAnimationFrame(renderStars);
}

let creditsInterval;
let game;

function hideScreens() {
  cancelAnimationFrame(starAnim);
  menu.classList.add('hidden');
  settingsScreen.classList.add('hidden');
  creditsScreen.classList.add('hidden');
}

function showMenu() {
  hideScreens();
  menu.classList.remove('hidden');
  initStarField();
  starAnim = requestAnimationFrame(renderStars);
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
  const settings = {
    worldSize: parseInt(worldSizeInput.value) || Game.WORLD_SIZE,
    minAsteroids: parseInt(minAstInput.value) || Game.MIN_INITIAL_ASTEROIDS,
    maxAsteroids: parseInt(maxAstInput.value) || Game.MAX_INITIAL_ASTEROIDS,
    maxPlanets: parseInt(maxPlanetsInput.value) || Game.MAX_PLANETS
  };
  game = new Game(canvas, mapCanvas, scoreEl, livesEl, armorEl, timerEl, settings);
  game.start(showMenu);
}

newGameBtn.onclick = startGame;
settingsBtn.onclick = showSettings;
creditsBtn.onclick = showCredits;
backBtn.onclick = showMenu;
creditsBack.onclick = () => { hideCredits(); showMenu(); };

showMenu();
