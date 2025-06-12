
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

const settingsText = document.getElementById('settingsText');
const menuStars = document.getElementById('menuStars');

let starAnim;
let starField = [];

const defaultSettingsText = `{
  "worldSize": 3000, // rozmiar planszy
  "shipSize": 20,    // promień statku
  "shipMass": 5,     // masa statku
  "roundTime": 150,  // czas rundy w sekundach
  "minAsteroids": 10, // minimalna liczba asteroid
  "maxAsteroids": 100, // maksymalna liczba asteroid
  "maxPlanets": 3,   // maksymalna liczba planet
  "minEnemies": 3,   // minimalna liczba przeciwników
  "maxEnemies": 10,  // maksymalna liczba przeciwników
  "gravityMultiplier": 0.2 // współczynnik grawitacji
}`;

const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx;

function playTone(freq, duration) {
  if (!audioCtx) audioCtx = new AudioCtx();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'square';
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
}

function playNoise(duration) {
  if (!audioCtx) audioCtx = new AudioCtx();
  const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * duration, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = audioCtx.createBufferSource();
  src.buffer = buffer;
  const gain = audioCtx.createGain();
  gain.gain.value = 0.1;
  src.connect(gain);
  gain.connect(audioCtx.destination);
  src.start();
  src.stop(audioCtx.currentTime + duration);
}

window.playSound = function(type, x, y) {
  if (!game) return;
  if (type !== 'alarm' && type !== 'pickup' && !game.isOnScreen(x, y, 50)) return;
  if (type === 'shoot') playTone(800, 0.05);
  else if (type === 'hit') playTone(400, 0.1);
  else if (type === 'explosion') playNoise(0.3);
  else if (type === 'alarm') playTone(1200, 0.05);
  else if (type === 'pickup') {
    playTone(660, 0.1);
    setTimeout(() => playTone(880, 0.1), 100);
    setTimeout(() => playTone(660, 0.1), 200);
  }
};

function initStarField() {
  menuStars.width = window.innerWidth;
  menuStars.height = window.innerHeight;
  starField = [];
  for (let i = 0; i < 200; i++) {
    starField.push({
      x: Math.random() * menuStars.width,
      y: Math.random() * menuStars.height,
      phase: Math.random() * Math.PI * 2
    });
  }
}

function renderStars() {
  const ctx = menuStars.getContext('2d');
  const w = menuStars.width;
  const h = menuStars.height;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, w, h);
  const t = performance.now() / 1000;
  ctx.fillStyle = '#fff';
  for (const s of starField) {
    const a = 0.5 + 0.5 * Math.sin(t + s.phase);
    ctx.globalAlpha = a;
    ctx.fillRect(s.x, s.y, 2, 2);
  }
  ctx.globalAlpha = 1;
  if (!menu.classList.contains('hidden')) starAnim = requestAnimationFrame(renderStars);
}

let creditsInterval;
let game;

window.addEventListener('keydown', e => {
  if (e.key === 'Escape' && game && game.running) {
    game.running = false;
    showMenu();
  }
});

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
  settingsText.value = defaultSettingsText;
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
  if (audioCtx) audioCtx.resume();
  let cfgText = settingsText.value || defaultSettingsText;
  let cfg;
  try {
    cfg = JSON.parse(cfgText.replace(/\/\/.*$/gm, ''));
  } catch (e) {
    alert('B\u0142\u0119dny format ustawie\u0144!');
    showSettings();
    return;
  }
  Game.DEFAULT_SHIP_RADIUS = parseInt(cfg.shipSize) || Game.DEFAULT_SHIP_RADIUS;
  Game.DEFAULT_SHIP_MASS = parseInt(cfg.shipMass) || Game.DEFAULT_SHIP_MASS;
  Game.ROUND_TIME = parseInt(cfg.roundTime) || Game.ROUND_TIME;
  Game.GRAVITY_MULT = parseFloat(cfg.gravityMultiplier) || Game.GRAVITY_MULT;
  const settings = {
    worldSize: parseInt(cfg.worldSize) || Game.WORLD_SIZE,
    minAsteroids: parseInt(cfg.minAsteroids) || Game.MIN_INITIAL_ASTEROIDS,
    maxAsteroids: parseInt(cfg.maxAsteroids) || Game.MAX_INITIAL_ASTEROIDS,
    maxPlanets: parseInt(cfg.maxPlanets) || Game.MAX_PLANETS,
    minEnemies: parseInt(cfg.minEnemies) || Game.MIN_ENEMIES,
    maxEnemies: parseInt(cfg.maxEnemies) || Game.MAX_ENEMIES
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
