
const GAME_NAME = 'Asteroids';
const GAME_VERSION = '0.1.0';

const canvas = document.getElementById('game');
const mapCanvas = document.getElementById('minimap');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const armorEl = document.getElementById('armor');
const timerEl = document.getElementById('timer');
const enemiesEl = document.getElementById('enemies');

const menu = document.getElementById('menu');
const settingsScreen = document.getElementById('settingsScreen');
const creditsScreen = document.getElementById('creditsScreen');
const controlsScreen = document.getElementById('controlsScreen');
const aboutScreen = document.getElementById('aboutScreen');
const modeScreen = document.getElementById('modeScreen');
const singleBtn = document.getElementById('singleBtn');
const hostBtn = document.getElementById('hostBtn');
const joinBtn = document.getElementById('joinBtn');
const newGameBtn = document.getElementById('newGameBtn');
const settingsBtn = document.getElementById('settingsBtn');
const controlsBtn = document.getElementById('controlsBtn');
const aboutBtn = document.getElementById('aboutBtn');
const creditsBtn = document.getElementById('creditsBtn');
const backBtn = document.getElementById('backBtn');
const controlsBack = document.getElementById('controlsBack');
const aboutBack = document.getElementById('aboutBack');
const creditsBack = document.getElementById('creditsBack');

const mobileControls = document.getElementById('mobileControls');
const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

const settingsText = document.getElementById('settingsText');
const resetBtn = document.getElementById('resetBtn');
const menuStars = document.getElementById('menuStars');
const menuTitle = document.getElementById('menuTitle');
const footerVersion = document.getElementById('footerVersion');

document.title = GAME_NAME;
menuTitle.textContent = GAME_NAME;
footerVersion.textContent = 'Version ' + GAME_VERSION;
if (isMobile) {
  mobileControls.classList.remove('hidden');
  document.body.classList.add('mobile');
}

let starAnim;
let starField = [];
let lastStarTime = 0;
let menuMusic;
let editor;
let settingsData = '';
const midiUrl = 'data:audio/midi;base64,TVRoZAAAAAYAAQAGAYBNVHJrAAAAGgD/WAQEAmAIAP9/AwAAQQD/UQMJiWgA/y8ATVRyawAAANoA/wMAALEAAADBUACxCj8A/1kCAAAAsQd/AJFDZIIggUMAAJFFZIFAgUUAAJFIZGCBSAAAkUdkgiCBRwAAkUNkgiCBQwAAkUhkgiCBSAAAkUpkgUCBSgAAkU1kYIFNAACRTGSCIIFMAACRSmSCIIFKAACRS2SCIIFLAACRSmSBQIFKAACRSGRggUgAAJFGZIIggUYAAJFLZIIggUsAAJFSZIIggVIAAJFPZIFAgU8AAJFLZGCBSwAAkUpkgiCBSgAAkU9kgUCBTwAAkUxkYLEHAIMAgUwAAP8vAE1UcmsAAAFAAP8DAACyAAAAwlAAsgo/AP9ZAgAAALIHfwCSTGSBQIJMAACSQ2RggkMAAJJKZIFAgkoAAJJFZGCCRQAAkkhkgUCCSAAAkkNkYIJDAACSRWSBQIJFAACSSGRggkgAAJJMZIFAgkwAAJJDZGCCQwAAkkpkgUCCSgAAkkVkYIJFAACSSGSBQIJIAACSQ2RggkMAAJJIZIFAgkgAAJJPZGCCTwAAklBkgUCCUAAAkk9kYIJPAACSTWSBQIJNAACSS2RggksAAJJKZIFAgkoAAJJIZGCCSAAAkkZkgUCCRgAAkkpkYIJKAACSS2SBQIJLAACSTWRggk0AAJJLZIFAgksAAJJIZGCCSAAAkk1kYIJNAACSSmRggkoAAJJFZGCCRQAAkkpkYIJKAACSR2RggkcAAJJFZGCyBwCDAIJFAAD/LwBNVHJrAAABQAD/AwAAswAAAMNQALMKPwD/WQIAAACzB38Ak0NkgUCDQwAAk0hkYINIAACTSmSBQINKAACTTWRgg00AAJNMZIFAg0wAAJNIZGCDSAAAk0pkgUCDSgAAk1FkYINRAACTT2SBQINPAACTSGRgg0gAAJNKZIFAg0oAAJNNZGCDTQAAk0xkgUCDTAAAk0hkYINIAACTT2SBQINPAACTU2Rgg1MAAJNUZIFAg1QAAJNSZGCDUgAAk1BkgUCDUAAAk09kYINPAACTTWSBQINNAACTS2Rgg0sAAJNKZIFAg0oAAJNGZGCDRgAAk1JkgUCDUgAAk1RkYINUAACTUmSBQINSAACTT2Rgg08AAJNRZGCDUQAAk01kYINNAACTSmRgg0oAAJNPZGCDTwAAk0xkYINMAACTSmRgswcAgwCDSgAA/y8ATVRyawAAABIA/wMAALQKPwD/WQIAAAD/LwBNVHJrAAAADgD/AwAA/1kCAAAA/y8A';

const defaultSettingsText = `{
  "worldSize": 3000, // map size
  "shipSize": 20,    // ship radius
  "shipMass": 5,     // ship mass
  "roundTime": 150,  // round time in seconds
  "minAsteroids": 10, // minimum asteroids
  "maxAsteroids": 100, // maximum asteroids
  "maxPlanets": 3,   // maximum planets
  "minEnemies": 3,   // minimum enemies
  "maxEnemies": 10,  // maximum enemies
  "gravityMultiplier": 0.5, // object mass multiplier
  "planetGravityMultiplier": 8, // extra planet mass multiplier
  "bulletLife": 3, // bullet lifetime
  "shieldDuration": 30, // shield time in seconds
  "exhaustLife": 0.7, // exhaust particle life
  "maxSpeed": 4, // maximum ship speed
  "bulletMass": 0.5, // bullet mass
  "gravityRangeFactor": 10.5, // gravity effect range
  "gravityWarningRatio": 0.8, // alarm threshold
  "enemyDetection": 600 // enemy alert radius
}`;

function parseJSONC(text) {
  return JSON.parse(text.replace(/\/\/.*$/gm, ''));
}

function generateSettingsText(values) {
  return defaultSettingsText.replace(/"(\w+)":\s*([^,\n]+)(,?)/g, (m, key, val, comma) => {
    const v = values && values[key] !== undefined ? values[key] : val.trim();
    return `"${key}": ${v}${comma}`;
  });
}

function applyGameSettings(cfg) {
  Game.DEFAULT_SHIP_RADIUS = parseInt(cfg.shipSize) || Game.DEFAULT_SHIP_RADIUS;
  Game.DEFAULT_SHIP_MASS = parseInt(cfg.shipMass) || Game.DEFAULT_SHIP_MASS;
  Game.ROUND_TIME = parseInt(cfg.roundTime) || Game.ROUND_TIME;
  Game.GRAVITY_MULT = parseFloat(cfg.gravityMultiplier) || Game.GRAVITY_MULT;
  Game.PLANET_GRAVITY_MULT = parseFloat(cfg.planetGravityMultiplier) || Game.PLANET_GRAVITY_MULT;
  Game.BULLET_LIFE = parseFloat(cfg.bulletLife) || Game.BULLET_LIFE;
  Game.SHIELD_DURATION = parseFloat(cfg.shieldDuration) || Game.SHIELD_DURATION;
  Game.EXHAUST_LIFE = parseFloat(cfg.exhaustLife) || Game.EXHAUST_LIFE;
  Game.MAX_SPEED = parseFloat(cfg.maxSpeed) || Game.MAX_SPEED;
  Game.BULLET_MASS = parseFloat(cfg.bulletMass) || Game.BULLET_MASS;
  Game.GRAVITY_RANGE_FACTOR = parseFloat(cfg.gravityRangeFactor) || Game.GRAVITY_RANGE_FACTOR;
  Game.GRAVITY_WARNING_RATIO = parseFloat(cfg.gravityWarningRatio) || Game.GRAVITY_WARNING_RATIO;
  Game.ENEMY_DETECTION_RADIUS = parseFloat(cfg.enemyDetection) || Game.ENEMY_DETECTION_RADIUS;
}

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
window.playNoise = playNoise;

window.playSound = function(type, x, y) {
  if (!game) return;
  if (type !== 'alarm' && type !== 'pickup' && !game.isOnScreen(x, y, 50)) return;
  if (type === 'shoot') playTone(800, 0.05);
  else if (type === 'hit') playTone(400, 0.1);
  else if (type === 'explosion') playNoise(0.3);
  else if (type === 'alarm') playTone(1200, 0.05);
  else if (type === 'pickup') {
    const notes = [660, 880, 990, 880, 660];
    notes.forEach((n, i) => setTimeout(() => playTone(n, 0.15), i * 150));
  }
};

function initStarField() {
  menuStars.width = window.innerWidth;
  menuStars.height = window.innerHeight;
  starField = [];
  const layers = [0.2, 0.5, 0.8];
  const counts = [150, 100, 70];
  for (let i = 0; i < layers.length; i++) {
    for (let j = 0; j < counts[i]; j++) {
      starField.push({
        x: Math.random() * menuStars.width,
        y: Math.random() * menuStars.height,
        phase: Math.random() * Math.PI * 2,
        factor: layers[i]
      });
    }
  }
  lastStarTime = performance.now();
}

function renderStars(timestamp) {
  const ctx = menuStars.getContext('2d');
  const w = menuStars.width;
  const h = menuStars.height;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, w, h);
  const t = timestamp / 1000;
  const dt = (timestamp - lastStarTime) / 1000;
  lastStarTime = timestamp;
  ctx.fillStyle = '#fff';
  for (const s of starField) {
    const a = 0.5 + 0.5 * Math.sin(t + s.phase);
    ctx.globalAlpha = a;
    s.x -= dt * 50 * s.factor;
    if (s.x < 0) s.x += w;
    ctx.fillRect(s.x, s.y, 2, 2);
  }
  ctx.globalAlpha = 1;
  if (!menu.classList.contains('hidden')) starAnim = requestAnimationFrame(renderStars);
}

let creditsInterval;
let game;

if (isMobile) {
  const joystick = document.getElementById('joystick');
  const stick = document.getElementById('stick');
  let touchId = null;
  let longPress = false;
  let lpTimer = null;
  let dx = 0, dy = 0;
  const joystickRadius = 40;
  const stickRadius = 20;
  let maxRadius = 0;
  let lastTapX = 0, lastTapY = 0;
  let returnAnim = null;
  let releaseTimeout = null;
  const HOLD_DELAY = 150;

  function updateMaxRadius() {
    maxRadius = Math.min(window.innerWidth, window.innerHeight) / 2 - stickRadius;
  }

  window.addEventListener('resize', updateMaxRadius);
  updateMaxRadius();

  function updateKeys() {
    if (!game) return;
    const thr = 10;
    const dist = Math.hypot(dx, dy);
    if (dist > 0) game.ship.angle = Math.atan2(dy, dx);
    game.keys[Game.KEY_UP] = dist > thr;
  }

  function resetKeys() {
    if (!game) return;
    game.keys[Game.KEY_UP] = false;
    game.keys[Game.KEY_LEFT] = false;
    game.keys[Game.KEY_RIGHT] = false;
    game.keys[Game.KEY_DOWN] = false;
  }

  function updateIndicator() {
    if (touchId !== null || !game) return;
    const scale = maxRadius / Game.MAX_SPEED;
    let vx = game.ship.thrust.x * scale;
    let vy = game.ship.thrust.y * scale;
    const dist = Math.hypot(vx, vy);
    if (dist > maxRadius) {
      vx = (vx / dist) * maxRadius;
      vy = (vy / dist) * maxRadius;
    }
    stick.style.transform = `translate(${vx}px,${vy}px)`;
  }
  function startReturn() {
    if (returnAnim) cancelAnimationFrame(returnAnim);
    const step = () => {
      dx *= Game.SHIP_DRAG;
      dy *= Game.SHIP_DRAG;
      if (Math.hypot(dx, dy) < 0.5) {
        dx = dy = 0;
        stick.style.transform = '';
        returnAnim = null;
      } else {
        stick.style.transform = `translate(${dx}px,${dy}px)`;
        returnAnim = requestAnimationFrame(step);
      }
    };
    returnAnim = requestAnimationFrame(step);
  }
  window.updateJoystickIndicator = updateIndicator;

  mobileControls.addEventListener('touchstart', e => {
    e.preventDefault();
    const t = e.touches[0];
    lastTapX = t.clientX;
    lastTapY = t.clientY;
    longPress = false;
    if (releaseTimeout) { clearTimeout(releaseTimeout); releaseTimeout = null; }
    if (returnAnim) { cancelAnimationFrame(returnAnim); returnAnim = null; }
    lpTimer = setTimeout(() => {
      longPress = true;
      touchId = t.identifier;
      joystick.classList.add('active');
    }, 200);
  });

  mobileControls.addEventListener('touchmove', e => {
    if (touchId === null) return;
    for (const t of e.touches) {
      if (t.identifier === touchId) {
        dx = t.clientX - (joystick.offsetLeft + joystickRadius);
        dy = t.clientY - (joystick.offsetTop + joystickRadius);
        const dist = Math.hypot(dx, dy);
        if (dist > maxRadius) {
          dx = (dx / dist) * maxRadius;
          dy = (dy / dist) * maxRadius;
        }
        stick.style.transform = `translate(${dx}px,${dy}px)`;
        updateKeys();
        break;
      }
    }
  });

  mobileControls.addEventListener('touchend', e => {
    clearTimeout(lpTimer);
    if (touchId === null) {
      if (!longPress && game) {
        const rect = canvas.getBoundingClientRect();
        const wx = game.viewportX + (lastTapX - rect.left);
        const wy = game.viewportY + (lastTapY - rect.top);
        const angle = Math.atan2(wy - game.ship.y, wx - game.ship.x);
        game.rotateTo(angle);
        setTimeout(() => {
          if (!game) return;
          game.keys[Game.KEY_SPACE] = true;
          setTimeout(() => { if (game) game.keys[Game.KEY_SPACE] = false; }, 100);
        }, game.rotateDuration * 1000);
      }
    } else {
      joystick.classList.remove('active');
      touchId = null;
      releaseTimeout = setTimeout(() => {
        resetKeys();
        startReturn();
        releaseTimeout = null;
      }, HOLD_DELAY);
    }
  });
}

window.addEventListener('keydown', e => {
  if (e.key === 'Escape' && game) {
    if (!game.paused) {
      game.paused = true;
      showMenu();
    } else if (!menu.classList.contains('hidden')) {
      hideScreens();
      game.paused = false;
    }
  }
});

function hideScreens() {
  cancelAnimationFrame(starAnim);
  if (menuMusic) menuMusic.pause();
  menu.classList.add('hidden');
  settingsScreen.classList.add('hidden');
  modeScreen.classList.add('hidden');
  controlsScreen.classList.add('hidden');
  aboutScreen.classList.add('hidden');
  creditsScreen.classList.add('hidden');
}

function showMenu() {
  hideScreens();
  menu.classList.remove('hidden');
  if (isMobile) mobileControls.classList.add('hidden');
  if (audioCtx) audioCtx.suspend();
  initStarField();
  starAnim = requestAnimationFrame(renderStars);
  if (!menuMusic) {
    menuMusic = new MIDIPlayer(midiUrl);
    menuMusic.autoReplay = true;
    menuMusic.onload = () => menuMusic.play();
  } else {
    menuMusic.play();
  }
}

function showModeScreen() {
  hideScreens();
  modeScreen.classList.remove('hidden');
}

function showSettings() {
  hideScreens();
  settingsScreen.classList.remove('hidden');
  if (!editor) {
    editor = ace.edit('settingsText');
    editor.session.setMode('ace/mode/json5');
    editor.setTheme('ace/theme/monokai');
  }
  if (!settingsData) {
    fetch('settings.json')
      .then(r => r.text())
      .then(t => {
        let obj;
        try { obj = JSON.parse(t); } catch (e) { obj = null; }
        settingsData = generateSettingsText(obj);
        editor.setValue(settingsData, -1);
      })
      .catch(() => { settingsData = defaultSettingsText; editor.setValue(settingsData, -1); });
  } else {
    editor.setValue(settingsData, -1);
  }
}

function showControls() {
  hideScreens();
  controlsScreen.classList.remove('hidden');
}

function showAbout() {
  hideScreens();
  aboutScreen.classList.remove('hidden');
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

async function startGame() {
  hideCredits();
  hideScreens();
  if (isMobile) mobileControls.classList.remove('hidden');
  if (audioCtx) audioCtx.resume();
  let cfgText = '';
  try {
    const resp = await fetch('settings.json');
    if (resp.ok) cfgText = await resp.text();
  } catch (e) {}
  if (!cfgText) cfgText = settingsData || defaultSettingsText;
  let cfg;
  try {
    cfg = parseJSONC(cfgText);
  } catch (e) {
    alert('B\u0142\u0119dny format ustawie\u0144!');
    showSettings();
    return;
  }
  settingsData = generateSettingsText(cfg);
  applyGameSettings(cfg);
  const settings = {
    worldSize: parseInt(cfg.worldSize) || Game.WORLD_SIZE,
    minAsteroids: parseInt(cfg.minAsteroids) || Game.MIN_INITIAL_ASTEROIDS,
    maxAsteroids: parseInt(cfg.maxAsteroids) || Game.MAX_INITIAL_ASTEROIDS,
    maxPlanets: parseInt(cfg.maxPlanets) || Game.MAX_PLANETS,
    minEnemies: parseInt(cfg.minEnemies) || Game.MIN_ENEMIES,
    maxEnemies: parseInt(cfg.maxEnemies) || Game.MAX_ENEMIES,
    zoom: isMobile ? 0.8 : 1,
    isMobile
  };
  game = new Game(canvas, mapCanvas, scoreEl, livesEl, armorEl, timerEl, enemiesEl, settings);
  game.paused = false;
  game.start(() => { game.paused = true; showMenu(); });
}

let peerConnection = null;
let dataChannel = null;

function createPeer() {
  const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
  pc.oniceconnectionstatechange = () => console.log('ice', pc.iceConnectionState);
  return pc;
}

async function startHost() {
  peerConnection = createPeer();
  dataChannel = peerConnection.createDataChannel('game');
  dataChannel.onopen = () => { if (game) game.setDataChannel(dataChannel); };
  peerConnection.onicecandidate = e => {
    if (!e.candidate) {
      const offerStr = btoa(JSON.stringify({ type: 'offer', sdp: peerConnection.localDescription.sdp }));
      prompt('Share this link with a friend:', `${location.origin}${location.pathname}?session=${offerStr}`);
    }
  };
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  const ans = prompt('Paste answer link when ready:');
  if (ans) handleSessionLink(ans);
}

async function startJoin() {
  const link = prompt('Paste host link:');
  if (!link) return;
  const url = new URL(link);
  const session = url.searchParams.get('session');
  if (!session) return;
  await joinWithSession(session);
}

async function joinWithSession(session) {
  const data = JSON.parse(atob(session));
  if (data.type !== 'offer') return;
  peerConnection = createPeer();
  peerConnection.ondatachannel = e => {
    dataChannel = e.channel;
    dataChannel.onopen = () => { if (game) game.setDataChannel(dataChannel); };
  };
  await peerConnection.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: data.sdp }));
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  peerConnection.onicecandidate = e => {
    if (!e.candidate) {
      const ansStr = btoa(JSON.stringify({ type: 'answer', sdp: peerConnection.localDescription.sdp }));
      prompt('Send this link back to host:', `${location.origin}${location.pathname}?session=${ansStr}`);
    }
  };
  startGame();
}

async function handleSessionLink(url) {
  try {
    const session = new URL(url).searchParams.get('session');
    if (!session) return;
    const data = JSON.parse(atob(session));
    if (data.type === 'answer' && peerConnection) {
      await peerConnection.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: data.sdp }));
      startGame();
    } else if (data.type === 'offer') {
      await joinWithSession(session);
    }
  } catch (e) {
    console.error(e);
  }
}

newGameBtn.onclick = showModeScreen;
settingsBtn.onclick = showSettings;
controlsBtn.onclick = showControls;
aboutBtn.onclick = showAbout;
creditsBtn.onclick = showCredits;
singleBtn.onclick = startGame;
hostBtn.onclick = startHost;
joinBtn.onclick = startJoin;
backBtn.onclick = () => {
  const txt = editor.getValue();
  let cfg;
  try {
    cfg = parseJSONC(txt);
  } catch (e) {
    alert('Invalid settings!');
    return;
  }
  settingsData = generateSettingsText(cfg);
  applyGameSettings(cfg);
  if (game) applyGameSettings(cfg);
  showMenu();
};
resetBtn.onclick = () => { settingsData = defaultSettingsText; editor.setValue(defaultSettingsText, -1); };
controlsBack.onclick = () => { showMenu(); };
aboutBack.onclick = () => { showMenu(); };
creditsBack.onclick = () => { hideCredits(); showMenu(); };

[newGameBtn, settingsBtn, controlsBtn, aboutBtn, creditsBtn, backBtn, controlsBack, aboutBack, creditsBack, resetBtn, singleBtn, hostBtn, joinBtn].forEach(btn => {
  btn.addEventListener('mouseenter', () => playTone(880, 0.05));
});

showMenu();

// auto join if session parameter present
const sessionParam = new URLSearchParams(location.search).get('session');
if (sessionParam) {
  handleSessionLink(location.href);
}
