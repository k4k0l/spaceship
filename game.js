// Game logic module for Asteroids-like game
// Provides Game class which manages state, updates and rendering.

class Game {
  /**
   * @param {HTMLCanvasElement} canvas - canvas element to draw the game
   * @param {HTMLElement} scoreEl - element for score display
   * @param {HTMLElement} livesEl - element for lives display
   * @param {HTMLElement} armorEl - element for armor display
   * @param {HTMLElement} timerEl - element for timer display
   */
  constructor(canvas, mapCanvas, scoreEl, livesEl, armorEl, timerEl, enemiesEl, settings = {}) {
    this.canvas = canvas;
    this.mapCanvas = mapCanvas;
    this.mapCtx = mapCanvas.getContext('2d');
    this.ctx = canvas.getContext('2d');
    this.scoreEl = scoreEl;
    this.livesEl = livesEl;
    this.armorEl = armorEl;
    this.timerEl = timerEl;
    this.enemiesEl = enemiesEl;

    // TODO: refactor input handling to support touch events for mobile devices
    // TODO: investigate networking options for future multiplayer mode

    this.worldWidth = settings.worldSize || Game.WORLD_SIZE;
    this.worldHeight = settings.worldSize || Game.WORLD_SIZE;

    this.keys = {};
    this.bullets = [];
    this.asteroids = [];
    this.shipFragments = [];
    this.particles = [];
    this.asteroidLines = [];
    this.pickups = [];
    this.exhaust = [];
    this.stars = [[], [], []];
    this.planets = [];
    // ensure enemies array exists before any spawns
    this.enemies = [];

    this.paused = false;

    this.gameOver = false;
    this.restartTimer = 0;
    this.respawnTimer = 0;
    this.spawnInvul = 0;
    this.flashTimer = 0;
    this.lineFlashTimer = 0;
    this.pickupTimer = 3 + Math.random() * 5;
    this.healPickupTimer = 20 + Math.random() * 10;
    this.timePickupTimer = 30 + Math.random() * 15;
    this.lives = 5;
    this.armor = 5;
    this.score = 0;
    this.shieldTimer = 0;
    this.laserTimer = 0;
    this.gravityAccel = 0;
    this.nearGravityTrap = false;
    this.timer = Game.ROUND_TIME;
    this.exhaustDelay = 0;
    this.lastTime = 0;

    this.viewportX = 0;
    this.viewportY = 0;

    const startAngle = Math.random() * Math.PI * 2;
    this.ship = {
      x: this.worldWidth / 2,
      y: this.worldHeight / 2,
      angle: 0,
      radius: Game.DEFAULT_SHIP_RADIUS,
      mass: Game.DEFAULT_SHIP_MASS,
      thrust: {
        x: Math.cos(startAngle) * 0.5,
        y: Math.sin(startAngle) * 0.5
      },
      canShoot: true,
      dead: false,
      color: '#fff'
    };
    this.enterHeld = false;
    this.rotateAnim = 0;
    this.rotateDuration = 0.15;
    this.rotateStart = 0;
    this.rotateTarget = 0;

    window.addEventListener('keydown', e => { this.keys[e.keyCode] = true; });
    window.addEventListener('keyup', e => { this.keys[e.keyCode] = false; });
    window.addEventListener('resize', () => this.resizeCanvas());
    this.resizeCanvas();
    this.createStars();
    this.updateTimer();
    this.minAsteroids = settings.minAsteroids || Game.MIN_INITIAL_ASTEROIDS;
    this.maxAsteroids = settings.maxAsteroids || Game.MAX_INITIAL_ASTEROIDS;
    this.maxPlanets = settings.maxPlanets || Game.MAX_PLANETS;
    this.minEnemies = settings.minEnemies || Game.MIN_ENEMIES;
    this.maxEnemies = settings.maxEnemies || Game.MAX_ENEMIES;
    this.spawnInitialAsteroids(Math.floor(Math.random() * (this.maxAsteroids - this.minAsteroids + 1)) + this.minAsteroids);
    this.spawnPlanets(this.maxPlanets);
    const enemyCount = Math.floor(Math.random() * (this.maxEnemies - this.minEnemies + 1)) + this.minEnemies;
    for (let i = 0; i < enemyCount; i++) this.spawnEnemy();
    this.updateTopbar();
  }

  /** Resize canvas to window size */
  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.mapCanvas.width = 150;
    this.mapCanvas.height = 150;
  }

  /** Update score/lives display */
  updateTopbar() {
    this.scoreEl.textContent = 'Score: ' + String(Math.floor(this.score)).padStart(5, '0');
    let livesHtml = 'Lives: ';
    for (let i = 0; i < 5; i++) {
      if (i < this.lives) livesHtml += '<span style="color:#f00">|</span>';
      else livesHtml += '<span style="color:#888">.</span>';
    }
    this.livesEl.innerHTML = livesHtml;
    let armorHtml = 'Armor: ';
    for (let i = 0; i < 5; i++) {
      if (i < this.armor) armorHtml += '<span style="color:#0f0">|</span>';
      else armorHtml += '<span style="color:#888">.</span>';
    }
    this.armorEl.innerHTML = armorHtml;
    const enemyCount = Array.isArray(this.enemies) ? this.enemies.length : 0;
    this.enemiesEl.innerHTML = 'Enemies: <span style="color:#f0f">' + enemyCount + '</span>';
  }

  /** Update camera viewport to follow the ship */
  updateCamera() {
    if (this.canvas.width >= this.worldWidth) {
      this.viewportX = -(this.canvas.width - this.worldWidth) / 2;
    } else {
      this.viewportX = Math.min(Math.max(this.ship.x - this.canvas.width / 2, 0), this.worldWidth - this.canvas.width);
    }
    if (this.canvas.height >= this.worldHeight) {
      this.viewportY = -(this.canvas.height - this.worldHeight) / 2;
    } else {
      this.viewportY = Math.min(Math.max(this.ship.y - this.canvas.height / 2, 0), this.worldHeight - this.canvas.height);
    }
  }

  /** Check if world coordinates are visible on screen */
  isOnScreen(x, y, margin = 0) {
    const sx = (x - this.viewportX + this.worldWidth) % this.worldWidth;
    const sy = (y - this.viewportY + this.worldHeight) % this.worldHeight;
    return sx >= -margin && sx <= this.canvas.width + margin &&
           sy >= -margin && sy <= this.canvas.height + margin;
  }

  /** Update timer display */
  updateTimer() {
    const m = Math.floor(this.timer / 60);
    const s = Math.floor(this.timer % 60);
    this.timerEl.textContent = `Timer: [${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}]`;
  }

  /** Add score based on asteroid hp */
  addScore(hp) {
    this.score += Math.pow(2, hp);
    if (this.score > 99999) this.score = 99999;
    this.updateTopbar();
    this.updateTimer();
  }

  static gravityRange(mass) {
    return mass * Game.GRAVITY_RANGE_FACTOR;
  }

  /** Generate star background */
  createStars() {
    const layers = [0.2, 0.5, 0.8];
    const counts = [150, 100, 70];
    const colors = ['#bbb', '#eee', '#fff'];
    const sizes = [2, 2, 3];
    this.stars = [[], [], []];
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < counts[i]; j++) {
        this.stars[i].push({
          x: Math.random() * this.worldWidth,
          y: Math.random() * this.worldHeight,
          color: colors[i],
          factor: layers[i],
          size: sizes[i]
        });
      }
    }
  }

  /** Spawn multiple asteroids at start */
  spawnInitialAsteroids(num) {
    for (let i = 0; i < num; i++) this.spawnAsteroid();
  }

  spawnPlanets(num) {
    for (let i = 0; i < num; i++) this.spawnPlanet();
  }

  spawnPlanet() {
    const radius = Math.random() * 60 + 40;
    const mass = radius * Game.GRAVITY_MULT * Game.PLANET_GRAVITY_MULT;
    const x = Math.random() * this.worldWidth;
    const y = Math.random() * this.worldHeight;
    const color = Game.PALETTE[Math.floor(Math.random() * Game.PALETTE.length)];
    this.planets.push({ x, y, radius, mass, color, shake: 0 });
  }

  spawnEnemy() {
    const x = Math.random() * this.worldWidth;
    const y = Math.random() * this.worldHeight;
    this.enemies.push({
      x, y,
      dx: 0,
      dy: 0,
      angle: 0,
      alerted: false,
      alertBlink: 0,
      detection: Game.ENEMY_DETECTION_RADIUS,
      hp: Game.ENEMY_HP
    });
    this.updateTopbar();
  }

  /** Spawn a single asteroid */
  spawnAsteroid() {
    if (this.asteroids.length >= Game.MAX_ASTEROIDS) return;
    let x, y, tries = 0;
    let safe = false;
    while (!safe && tries < 50) {
      x = Math.random() * this.worldWidth;
      y = Math.random() * this.worldHeight;
      safe = this.asteroids.every(a => Math.hypot(x - a.x, y - a.y) > a.radius + 60);
      tries++;
    }
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 0.5 + 0.2;
    const dx = Math.cos(angle) * speed;
    const dy = Math.sin(angle) * speed;
    const radius = Math.random() * 40 + 30;
    const points = [];
    const count = Math.floor(Math.random() * 5) + 5;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const r = radius * (0.7 + Math.random() * 0.3);
      points.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
    }
    const color = Game.PALETTE[Math.floor(Math.random() * Game.PALETTE.length)];
    const hp = Math.max(1, Math.round(radius / 15));
    const mass = radius * Game.GRAVITY_MULT;
    this.asteroids.push({ x, y, dx, dy, radius, points, color, hp, mass, spawnDelay: 1 });
  }

  /** Spawn shield/laser pickup */
  spawnPickup() {
    const size = Game.PICKUP_SIZE;
    const x = Math.random() * this.worldWidth;
    const y = Math.random() * this.worldHeight;
    const ang = Math.random() * Math.PI * 2;
    const spd = Math.random() * 0.3 + 0.1;
    const dx = Math.cos(ang) * spd;
    const dy = Math.sin(ang) * spd;
    const laser = Math.random() < 0.7;
    if (laser) {
      this.pickups.push({ x, y, dx, dy, size, hp: 15, letter: 'L', color: '#0ff', ttl: 15 });
    } else {
      this.pickups.push({ x, y, dx, dy, size, hp: 15, letter: 'S', color: '#ff0', ttl: 15 });
    }
  }

  /** Spawn heal pickup */
  spawnHealPickup() {
    const size = Game.PICKUP_SIZE;
    const x = Math.random() * this.worldWidth;
    const y = Math.random() * this.worldHeight;
    const ang = Math.random() * Math.PI * 2;
    const spd = Math.random() * 0.3 + 0.1;
    const dx = Math.cos(ang) * spd;
    const dy = Math.sin(ang) * spd;
    this.pickups.push({ x, y, dx, dy, size, hp: 15, letter: 'H', color: '#f00', ttl: 15 });
  }

  /** Spawn time bonus pickup */
  spawnTimePickup() {
    const size = Game.PICKUP_SIZE;
    const x = Math.random() * this.worldWidth;
    const y = Math.random() * this.worldHeight;
    const ang = Math.random() * Math.PI * 2;
    const spd = Math.random() * 0.3 + 0.1;
    const dx = Math.cos(ang) * spd;
    const dy = Math.sin(ang) * spd;
    this.pickups.push({ x, y, dx, dy, size, hp: 15, letter: 'T', color: '#00f', ttl: 15 });
  }

  /** Break asteroid into pieces */
  breakAsteroid(a, impactAngle) {
    const pieces = Math.floor(a.radius / Game.MIN_ASTEROID_RADIUS);
    if (pieces < 2) return;
    const radius = Math.sqrt((a.radius * a.radius) / pieces);
    if (radius < Game.MIN_ASTEROID_RADIUS) return;
    for (let i = 0; i < pieces; i++) {
      const angle = impactAngle + Math.PI + (i / pieces) * Math.PI * 2;
      const speed = Math.random() * 0.5 + 0.2;
      const dx = Math.cos(angle) * speed;
      const dy = Math.sin(angle) * speed;
      const offset = radius * 0.75;
      const spawnX = a.x + Math.cos(angle) * offset;
      const spawnY = a.y + Math.sin(angle) * offset;
      const pts = [];
      const pc = Math.floor(Math.random() * 5) + 5;
      for (let j = 0; j < pc; j++) {
        const ang = (j / pc) * Math.PI * 2;
        const r = radius * (0.7 + Math.random() * 0.3);
        pts.push({ x: Math.cos(ang) * r, y: Math.sin(ang) * r });
      }
      const color = a.color;
      const hp = Math.max(1, a.hp - 1);
      const mass = radius * Game.GRAVITY_MULT;
      this.asteroids.push({ x: spawnX, y: spawnY, dx, dy, radius, points: pts, color, hp, mass, spawnDelay: 0.3 });
    }
  }

  /** Activate temporary shield effect */
  applyShieldEffect() {
    this.shieldTimer = Game.SHIELD_DURATION;
    if (window.playTone) window.playTone(880, 0.2);
  }

  /** Spawn particles for explosion/exhaust */
  spawnParticles(x, y, count, color, life = 1) {
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = Math.random() * 1 + 0.5;
      this.particles.push({ x, y, dx: Math.cos(ang) * spd, dy: Math.sin(ang) * spd, life, color });
    }
  }

  /** Rotate ship 180 degrees like pressing Enter */
  triggerEnter() {
    const sp = Math.hypot(this.ship.thrust.x, this.ship.thrust.y);
    if (sp > 0) {
      this.rotateStart = this.ship.angle;
      this.rotateTarget = Math.atan2(-this.ship.thrust.y, -this.ship.thrust.x);
      let diff = ((this.rotateTarget - this.rotateStart + Math.PI) % (Math.PI * 2)) - Math.PI;
      this.rotateTarget = this.rotateStart + diff;
      this.rotateAnim = this.rotateDuration;
    }
  }

  /** Spawn lines for asteroid explosion */
  explodeAsteroid(a) {
    for (let i = 0; i < a.points.length; i++) {
      const p1 = a.points[i];
      const p2 = a.points[(i + 1) % a.points.length];
      const ang = Math.atan2((p1.y + p2.y) / 2, (p1.x + p2.x) / 2);
      this.asteroidLines.push({
        x: a.x,
        y: a.y,
        x1: p1.x,
        y1: p1.y,
        x2: p2.x,
        y2: p2.y,
        dx: Math.cos(ang),
        dy: Math.sin(ang),
        life: 1,
        color: a.color
      });
    }
    if (window.playSound) window.playSound('explosion', a.x, a.y);
  }

  /** Explode the ship and handle life loss */
  explodeShip() {
    this.ship.dead = true;
    this.shipFragments = [];
    this.flashTimer = 0.5;
    if (window.playSound) window.playSound('explosion', this.ship.x, this.ship.y);
    const pts = [
      { x: this.ship.radius, y: 0 },
      { x: -this.ship.radius, y: this.ship.radius / 2 },
      { x: -this.ship.radius, y: -this.ship.radius / 2 }
    ];
    for (let i = 0; i < pts.length; i++) {
      const p1 = pts[i];
      const p2 = pts[(i + 1) % pts.length];
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 1 + 0.5;
      this.shipFragments.push({
        x: this.ship.x,
        y: this.ship.y,
        x1: p1.x,
        y1: p1.y,
        x2: p2.x,
        y2: p2.y,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed,
        rot: 0,
        dr: (Math.random() - 0.5) * 2
      });
    }
    this.lives -= 1;
    this.updateTopbar();
    if (this.lives <= 0) {
      this.gameOver = true;
      this.restartTimer = 5;
    } else {
      let gx = 0, gy = 0;
      this.respawnTimer = 1;
    }
  }

  /** Restart entire game */
  restartGame() {
    this.ship.dead = false;
    this.ship.radius = Game.DEFAULT_SHIP_RADIUS;
    this.ship.mass = Game.DEFAULT_SHIP_MASS;
    this.shieldTimer = 0;
    this.ship.x = this.worldWidth / 2;
    this.ship.y = this.worldHeight / 2;
    this.ship.angle = 0;
    const ang = Math.random() * Math.PI * 2;
    this.ship.thrust.x = Math.cos(ang) * 0.5;
    this.ship.thrust.y = Math.sin(ang) * 0.5;
    this.shipFragments = [];
    this.bullets = [];
    this.asteroids = [];
    this.gameOver = false;
    this.lives = 5;
    this.armor = 5;
    this.score = 0;
    this.timer = Game.ROUND_TIME;
    this.updateTopbar();
    this.updateTimer();
    this.spawnInitialAsteroids(Math.floor(Math.random() * 10) + 1);
  }

  /** Respawn ship after death */
  respawnShip() {
    this.ship.dead = false;
    this.ship.radius = Game.DEFAULT_SHIP_RADIUS;
    this.ship.mass = Game.DEFAULT_SHIP_MASS;
    this.shieldTimer = 0;
    this.ship.x = this.worldWidth / 2;
    this.ship.y = this.worldHeight / 2;
    this.ship.angle = 0;
    const ang = Math.random() * Math.PI * 2;
    this.ship.thrust.x = Math.cos(ang) * 0.5;
    this.ship.thrust.y = Math.sin(ang) * 0.5;
    this.armor = 5;
    this.spawnInvul = 3;
    this.shipFragments = [];
    this.updateTopbar();
    let tries = 0;
    while (this.asteroids.some(a => Math.hypot(this.ship.x - a.x, this.ship.y - a.y) < this.ship.radius + a.radius + 20) && tries < 50) {
      this.ship.x = Math.random() * this.worldWidth;
      this.ship.y = Math.random() * this.worldHeight;
      tries++;
    }
  }

  /** Helper to draw elements with screen wrapping */
  drawWrapped(x, y, r, fn) {
    if (!isFinite(x) || !isFinite(y)) return;
    for (let ox = -1; ox <= 1; ox++) {
      for (let oy = -1; oy <= 1; oy++) {
        const nx = x + ox * this.worldWidth - this.viewportX;
        const ny = y + oy * this.worldHeight - this.viewportY;
        if (nx + r < 0 || nx - r > this.canvas.width || ny + r < 0 || ny - r > this.canvas.height) continue;
        this.ctx.save();
        this.ctx.translate(nx - x, ny - y);
        fn();
        this.ctx.restore();
      }
    }
  }

  /** Draw parallax star background */
  drawBackground() {
    for (let i = 0; i < this.stars.length; i++) {
      const layer = this.stars[i];
      layer.forEach(s => {
        const x = s.x - this.viewportX * s.factor;
        const y = s.y - this.viewportY * s.factor;
        const sx = ((x % this.worldWidth) + this.worldWidth) % this.worldWidth - this.viewportX;
        const sy = ((y % this.worldHeight) + this.worldHeight) % this.worldHeight - this.viewportY;
        if (sx < 0 || sx > this.canvas.width || sy < 0 || sy > this.canvas.height) return;
        this.ctx.fillStyle = s.color;
        this.ctx.fillRect(sx, sy, s.size, s.size);
      });
    }

    // draw board edges
    this.ctx.strokeStyle = '#fff';
    this.ctx.strokeRect(-this.viewportX, -this.viewportY, this.worldWidth, this.worldHeight);
  }

  drawPlanets() {
    this.planets.forEach(p => {
      this.ctx.fillStyle = p.color;
      if (p.shake > 0 && Math.floor(p.shake * 20) % 2 === 0) this.ctx.fillStyle = '#fff';
      const offset = p.shake > 0 ? (Math.random() - 0.5) * 4 : 0;
      this.drawWrapped(p.x + offset, p.y + offset, p.radius, () => {
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        this.ctx.fill();
      });
    });
  }

  /** Draw mini map */
  drawMinimap() {
    const mctx = this.mapCtx;
    const mw = this.mapCanvas.width;
    const mh = this.mapCanvas.height;
    mctx.clearRect(0, 0, mw, mh);
    mctx.strokeStyle = '#777';
    mctx.strokeRect(0, 0, mw, mh);
    const viewW = this.canvas.width / this.worldWidth * mw;
    const viewH = this.canvas.height / this.worldHeight * mh;
    const viewX = this.viewportX / this.worldWidth * mw;
    const viewY = this.viewportY / this.worldHeight * mh;
    mctx.strokeStyle = '#fff';
    mctx.strokeRect(viewX, viewY, viewW, viewH);
    mctx.fillStyle = '#888';
    this.asteroids.forEach(a => {
      const x = (a.x / this.worldWidth) * mw;
      const y = (a.y / this.worldHeight) * mh;
      mctx.fillRect(x - 1, y - 1, 2, 2);
    });
    this.pickups.forEach(p => {
      const x = (p.x / this.worldWidth) * mw;
      const y = (p.y / this.worldHeight) * mh;
      mctx.fillStyle = p.color;
      mctx.fillRect(x - 1, y - 1, 2, 2);
    });
    this.planets.forEach(p => {
      const x = (p.x / this.worldWidth) * mw;
      const y = (p.y / this.worldHeight) * mh;
      mctx.fillStyle = '#888';
      mctx.beginPath();
      mctx.arc(x, y, 3, 0, Math.PI * 2);
      mctx.fill();
    });

    // draw velocity vector
    const speed = Math.hypot(this.ship.thrust.x, this.ship.thrust.y);
    if (speed > 0) {
      mctx.strokeStyle = '#fff';
      mctx.beginPath();
      const sx = (this.ship.x / this.worldWidth) * mw;
      const sy = (this.ship.y / this.worldHeight) * mh;
      mctx.moveTo(sx, sy);
      const scale = 10;
      const vx = (this.ship.thrust.x / speed) * Math.min(speed * scale, 20);
      const vy = (this.ship.thrust.y / speed) * Math.min(speed * scale, 20);
      const ex = (this.ship.x + vx) / this.worldWidth * mw;
      const ey = (this.ship.y + vy) / this.worldHeight * mh;
      mctx.lineTo(ex, ey);
      mctx.stroke();
      const ang = Math.atan2(ey - sy, ex - sx);
      mctx.beginPath();
      mctx.moveTo(ex, ey);
      const ah = 4;
      mctx.lineTo(ex - Math.cos(ang - Math.PI / 6) * ah, ey - Math.sin(ang - Math.PI / 6) * ah);
      mctx.lineTo(ex - Math.cos(ang + Math.PI / 6) * ah, ey - Math.sin(ang + Math.PI / 6) * ah);
      mctx.closePath();
      mctx.stroke();
    }

    // ship
    const sx = (this.ship.x / this.worldWidth) * mw;
    const sy = (this.ship.y / this.worldHeight) * mh;
    mctx.fillStyle = '#fff';
    mctx.fillRect(sx - 2, sy - 2, 4, 4);

    this.enemies.forEach(e => {
      const ex = (e.x / this.worldWidth) * mw;
      const ey = (e.y / this.worldHeight) * mh;
      mctx.fillStyle = '#f0f';
      mctx.fillRect(ex - 2, ey - 2, 4, 4);
      if (e.alerted) {
        mctx.save();
        mctx.setLineDash([2, 2]);
        mctx.strokeStyle = '#f0f';
        const alpha = 0.5 + 0.5 * Math.sin(e.alertBlink * 2);
        mctx.globalAlpha = alpha;
        mctx.beginPath();
        mctx.arc(ex, ey, e.detection / this.worldWidth * mw, 0, Math.PI * 2);
        mctx.stroke();
        mctx.restore();
      }
    });
    if (this.nearGravityTrap && Math.floor(Date.now() / 250) % 2 === 0) {
      if (window.playSound) window.playSound('alarm');
      this.canvas.style.border = '2px solid red';
      mctx.fillStyle = '#f00';
      mctx.font = 'bold 14px sans-serif';
      mctx.textAlign = 'center';
      mctx.fillText('Terrain ahead!', mw / 2, mh / 2);
    } else {
      this.canvas.style.border = 'none';
    }
  }

  /** Update game state */
  update(dt) {
    if (this.gameOver) {
      this.shipFragments.forEach(f => { f.x += f.dx; f.y += f.dy; f.rot += f.dr * dt; });
      this.particles.forEach(p => { p.x += p.dx; p.y += p.dy; p.life -= dt; });
      this.particles = this.particles.filter(p => p.life > 0);
      this.asteroidLines.forEach(l => { l.x += l.dx; l.y += l.dy; l.life -= dt; });
      this.asteroidLines = this.asteroidLines.filter(l => l.life > 0);
      this.restartTimer -= dt;
      if (this.restartTimer <= 0) {
        this.restartGame();
        this.gameOver = false;
      }
      return;
    }

    this.planets.forEach(pl => { pl.shake = Math.max(0, pl.shake - dt); });
    this.timer -= dt;
    if (this.timer <= 0) {
      if (!this.ship.dead) this.explodeShip();
      this.gameOver = true;
      this.restartTimer = 2;
      this.timer = 0;
      this.updateTimer();
      return;
    }
    this.updateTimer();

    // accumulate gravity acceleration for diagnostics
    let gx = 0, gy = 0;

    if (this.ship.dead) {
      this.shipFragments.forEach(f => { f.x += f.dx; f.y += f.dy; f.rot += f.dr * dt; });
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0) this.respawnShip();
    } else {
      if (this.keys[Game.KEY_LEFT] || this.keys[Game.KEY_A]) this.ship.angle -= 3 * dt;
      if (this.keys[Game.KEY_RIGHT] || this.keys[Game.KEY_D]) this.ship.angle += 3 * dt;

      if (this.keys[Game.KEY_ENTER] && !this.enterHeld) {
        this.enterHeld = true;
        this.triggerEnter();
      }
      if (!this.keys[Game.KEY_ENTER]) this.enterHeld = false;
      if (this.rotateAnim > 0) {
        this.rotateAnim -= dt;
        const t = 1 - this.rotateAnim / this.rotateDuration;
        this.ship.angle = this.rotateStart + (this.rotateTarget - this.rotateStart) * t;
      }
      if (this.keys[Game.KEY_UP] || this.keys[Game.KEY_W]) {
        this.ship.thrust.x += Math.cos(this.ship.angle) * 0.035;
        this.ship.thrust.y += Math.sin(this.ship.angle) * 0.035;
        const exX = this.ship.x - Math.cos(this.ship.angle) * this.ship.radius;
        const exY = this.ship.y - Math.sin(this.ship.angle) * this.ship.radius;
        if (this.exhaustDelay <= 0) {
          this.exhaust.push({ x: exX, y: exY, r: 2, life: Game.EXHAUST_LIFE, color: this.ship.color, type: 'back' });
          this.exhaustDelay = 0.1;
        }
      }
      if (this.keys[Game.KEY_DOWN] || this.keys[Game.KEY_S]) {
        this.ship.thrust.x -= Math.cos(this.ship.angle) * 0.0175;
        this.ship.thrust.y -= Math.sin(this.ship.angle) * 0.0175;
        const exX = this.ship.x + Math.cos(this.ship.angle) * this.ship.radius;
        const exY = this.ship.y + Math.sin(this.ship.angle) * this.ship.radius;
        if (this.exhaustDelay <= 0) {
          this.exhaust.push({ x: exX, y: exY, r: 1, life: Game.EXHAUST_LIFE, color: this.ship.color, type: 'front' });
          this.exhaustDelay = 0.15;
        }
      }
      if (this.keys[Game.KEY_Q]) {
        this.ship.thrust.x += Math.sin(this.ship.angle) * 0.0175;
        this.ship.thrust.y += -Math.cos(this.ship.angle) * 0.0175;
        const exX = this.ship.x + Math.sin(this.ship.angle) * this.ship.radius;
        const exY = this.ship.y - Math.cos(this.ship.angle) * this.ship.radius;
        if (this.exhaustDelay <= 0) {
          this.exhaust.push({ x: exX, y: exY, r: 1, life: Game.EXHAUST_LIFE, color: this.ship.color, type: 'side' });
          this.exhaustDelay = 0.1;
        }
      }
      if (this.keys[Game.KEY_E]) {
        this.ship.thrust.x += -Math.sin(this.ship.angle) * 0.0175;
        this.ship.thrust.y += Math.cos(this.ship.angle) * 0.0175;
        const exX = this.ship.x - Math.sin(this.ship.angle) * this.ship.radius;
        const exY = this.ship.y + Math.cos(this.ship.angle) * this.ship.radius;
        if (this.exhaustDelay <= 0) {
          this.exhaust.push({ x: exX, y: exY, r: 1, life: Game.EXHAUST_LIFE, color: this.ship.color, type: 'side' });
          this.exhaustDelay = 0.1;
        }
      }
      const sv = Math.hypot(this.ship.thrust.x, this.ship.thrust.y);
      if (sv > Game.MAX_SPEED) {
        const ratio = Game.MAX_SPEED / sv;
        this.ship.thrust.x *= ratio;
        this.ship.thrust.y *= ratio;
      }
      this.planets.forEach(p => {
        const dx = p.x - this.ship.x;
        const dy = p.y - this.ship.y;
        const distSq = dx * dx + dy * dy;
        const range = Game.gravityRange(p.mass);
        if (distSq > 1 && distSq < range * range) {
          const dist = Math.sqrt(distSq);
          const a = Game.GRAVITY * p.mass / distSq;
          const ax = (dx / dist) * a;
          const ay = (dy / dist) * a;
          this.ship.thrust.x += ax;
          this.ship.thrust.y += ay;
          gx += ax; gy += ay;
        }
      });
      this.asteroids.forEach(a => {
        const dx = a.x - this.ship.x;
        const dy = a.y - this.ship.y;
        const distSq = dx * dx + dy * dy;
        const range = Game.gravityRange(a.mass);
        if (distSq > 1 && distSq < range * range) {
          const dist = Math.sqrt(distSq);
          const accelShip = Game.GRAVITY * a.mass / distSq;
          const accelAst = Game.GRAVITY * this.ship.mass / distSq;
          const ax = (dx / dist) * accelShip;
          const ay = (dy / dist) * accelShip;
          this.ship.thrust.x += ax;
          this.ship.thrust.y += ay;
          gx += ax; gy += ay;
          a.dx -= (dx / dist) * accelAst;
          a.dy -= (dy / dist) * accelAst;
        }
      });
      this.gravityAccel = Math.hypot(gx, gy);
      this.nearGravityTrap = this.gravityAccel > Game.SHIP_ACCEL * Game.GRAVITY_WARNING_RATIO;
      this.ship.x = (this.ship.x + this.ship.thrust.x + this.worldWidth) % this.worldWidth;
      this.ship.y = (this.ship.y + this.ship.thrust.y + this.worldHeight) % this.worldHeight;
      if (!this.keys[Game.KEY_UP] && !this.keys[Game.KEY_DOWN] &&
          !this.keys[Game.KEY_Q] && !this.keys[Game.KEY_E]) {
        this.ship.thrust.x *= Game.SHIP_DRAG;
        this.ship.thrust.y *= Game.SHIP_DRAG;
      }
      if (this.keys[Game.KEY_SPACE] && this.ship.canShoot) {
        const laser = this.laserTimer > 0;
        this.bullets.push({
          x: this.ship.x + Math.cos(this.ship.angle) * this.ship.radius,
          y: this.ship.y + Math.sin(this.ship.angle) * this.ship.radius,
          dx: Math.cos(this.ship.angle) * 5 + this.ship.thrust.x,
          dy: Math.sin(this.ship.angle) * 5 + this.ship.thrust.y,
          life: laser ? Game.BULLET_LIFE * 2 : Game.BULLET_LIFE,
          laser,
          angle: this.ship.angle
        });
        if (window.playSound) window.playSound('shoot', this.ship.x, this.ship.y);
        if (!laser) {
          this.ship.thrust.x -= Math.cos(this.ship.angle) * 5 * Game.BULLET_MASS / this.ship.mass * 0.5;
          this.ship.thrust.y -= Math.sin(this.ship.angle) * 5 * Game.BULLET_MASS / this.ship.mass * 0.5;
        }
        this.ship.canShoot = false;
      }
      if (!this.keys[Game.KEY_SPACE]) this.ship.canShoot = true;
    }

    this.spawnInvul = Math.max(0, this.spawnInvul - dt);
    this.flashTimer = Math.max(0, this.flashTimer - dt);
    this.lineFlashTimer = Math.max(0, this.lineFlashTimer - dt);
    if (this.exhaustDelay > 0) this.exhaustDelay -= dt;
    if (this.shieldTimer > 0) {
      this.shieldTimer -= dt;
    }
    if (this.laserTimer > 0) {
      this.laserTimer -= dt;
      this.ship.color = '#0ff';
    } else {
      this.ship.color = '#fff';
    }

    this.bullets.forEach((b, bi) => {
      this.planets.forEach(p => {
        const dx = p.x - b.x;
        const dy = p.y - b.y;
        const distSq = dx * dx + dy * dy;
        const range = Game.gravityRange(p.mass);
        if (distSq > 1 && distSq < range * range) {
          const dist = Math.sqrt(distSq);
          const a = Game.GRAVITY * p.mass / distSq;
          b.dx += (dx / dist) * a * dt;
          b.dy += (dy / dist) * a * dt;
        }
      });
      b.x = (b.x + b.dx + this.worldWidth) % this.worldWidth;
      b.y = (b.y + b.dy + this.worldHeight) % this.worldHeight;
      b.life -= dt;
      if (!this.ship.dead && Math.hypot(b.x - this.ship.x, b.y - this.ship.y) < this.ship.radius) {
        this.bullets.splice(bi, 1);
        if (this.shieldTimer > 0) {
          this.spawnParticles(b.x, b.y, 5, '#ff0');
        } else if (this.spawnInvul <= 0) {
          this.spawnParticles(b.x, b.y, 5, '#f00');
          if (window.playSound) window.playSound('hit', b.x, b.y);
          this.armor -= 1; this.lineFlashTimer = 1.5; this.updateTopbar();
          if (this.armor <= 0) this.explodeShip();
        }
      }
    });
    this.bullets = this.bullets.filter(b => b.life > 0);

    this.asteroids.forEach(a => {
      this.planets.forEach(p => {
        const dx = p.x - a.x;
        const dy = p.y - a.y;
        const distSq = dx * dx + dy * dy;
        const range = Game.gravityRange(p.mass);
        if (distSq > 1 && distSq < range * range) {
          const dist = Math.sqrt(distSq);
          const accel = Game.GRAVITY * p.mass / distSq;
          a.dx += (dx / dist) * accel * dt;
          a.dy += (dy / dist) * accel * dt;
        }
      });
      a.x = (a.x + a.dx + this.worldWidth) % this.worldWidth;
      a.y = (a.y + a.dy + this.worldHeight) % this.worldHeight;
      if (a.spawnDelay > 0) a.spawnDelay = Math.max(0, a.spawnDelay - dt);
    });

    this.bullets.forEach((b, bi) => {
      this.asteroids.forEach((a, ai) => {
        if (Math.hypot(b.x - a.x, b.y - a.y) < a.radius) {
          this.bullets.splice(bi, 1);
          this.addScore(a.hp);
          this.spawnParticles(b.x, b.y, 5, a.color);
          if (window.playSound) window.playSound('hit', b.x, b.y);
          a.dx += b.dx * 0.5 / a.mass;
          a.dy += b.dy * 0.5 / a.mass;
          a.hp -= 1;
          if (a.hp <= 0) {
            this.asteroids.splice(ai, 1);
            this.explodeAsteroid(a);
            this.breakAsteroid(a, Math.atan2(a.y - b.y, a.x - b.x));
          }
        }
      });
      this.enemies.forEach((e, ei) => {
        if (Math.hypot(b.x - e.x, b.y - e.y) < Game.ENEMY_RADIUS) {
          this.bullets.splice(bi, 1);
          e.hp -= 1;
          this.spawnParticles(e.x, e.y, 20, '#f0f');
          if (window.playSound) window.playSound('hit', e.x, e.y);
          if (e.hp <= 0) {
            this.enemies.splice(ei, 1);
            this.spawnParticles(e.x, e.y, 30, '#f0f');
            this.score += 10; if (this.score > 99999) this.score = 99999; this.updateTopbar();
          }
        }
      });
    });

    for (let i = 0; i < this.asteroids.length; i++) {
      const a = this.asteroids[i];
      for (let j = i + 1; j < this.asteroids.length; j++) {
        const b = this.asteroids[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distSq = dx * dx + dy * dy;
        const rangeA = Game.gravityRange(a.mass);
        const rangeB = Game.gravityRange(b.mass);
        if (distSq > 1 && (distSq < rangeA * rangeA || distSq < rangeB * rangeB)) {
          const dist = Math.sqrt(distSq);
          const accelA = Game.GRAVITY * b.mass / distSq;
          const accelB = Game.GRAVITY * a.mass / distSq;
          a.dx += (dx / dist) * accelA * dt;
          a.dy += (dy / dist) * accelA * dt;
          b.dx -= (dx / dist) * accelB * dt;
          b.dy -= (dy / dist) * accelB * dt;
        }
      }
    }

    for (let i = 0; i < this.asteroids.length; i++) {
      const a = this.asteroids[i];
      for (let j = i + 1; j < this.asteroids.length; j++) {
        const b = this.asteroids[j];
        if (a.spawnDelay > 0 || b.spawnDelay > 0) continue;
        if (Math.hypot(a.x - b.x, a.y - b.y) < a.radius + b.radius) {
          const ang = Math.atan2(b.y - a.y, b.x - a.x);
          const force = 0.5;
          a.dx -= Math.cos(ang) * force * b.mass / a.mass;
          a.dy -= Math.sin(ang) * force * b.mass / a.mass;
          b.dx += Math.cos(ang) * force * a.mass / b.mass;
          b.dy += Math.sin(ang) * force * a.mass / b.mass;
          const cx = (a.x + b.x) / 2;
          const cy = (a.y + b.y) / 2;
          this.spawnParticles(cx, cy, 5, a.color);
          this.spawnParticles(cx, cy, 5, b.color);
          a.hp -= 0.5;
          b.hp -= 0.5;
          if (a.hp <= 0) {
            this.asteroids.splice(i, 1);
            this.explodeAsteroid(a);
            this.breakAsteroid(a, ang + Math.PI);
            i--; break;
          }
          if (b.hp <= 0) {
            this.asteroids.splice(j, 1);
            this.explodeAsteroid(b);
            this.breakAsteroid(b, ang);
            j--;
          }
        }
      }
    }

    this.asteroids.forEach((a, ai) => {
      if (!this.ship.dead && Math.hypot(this.ship.x - a.x, this.ship.y - a.y) < this.ship.radius + a.radius) {
        const ang = Math.atan2(a.y - this.ship.y, a.x - this.ship.x);
        const force = 0.5;
        this.ship.thrust.x -= Math.cos(ang) * force * a.mass / this.ship.mass;
        this.ship.thrust.y -= Math.sin(ang) * force * a.mass / this.ship.mass;
        a.dx += Math.cos(ang) * force * this.ship.mass / a.mass;
        a.dy += Math.sin(ang) * force * this.ship.mass / a.mass;
        if (this.shieldTimer > 0) {
          this.spawnParticles(a.x, a.y, 20, '#ff0');
          this.asteroids.splice(ai, 1);
          this.explodeAsteroid(a);
          this.breakAsteroid(a, ang);
        } else if (this.spawnInvul <= 0) {
          this.armor -= 1; this.lineFlashTimer = 1.5; this.updateTopbar();
          this.spawnParticles(this.ship.x + Math.cos(ang) * this.ship.radius, this.ship.y + Math.sin(ang) * this.ship.radius, 10, '#f00');
          if (window.playSound) window.playSound('hit', this.ship.x, this.ship.y);
          a.hp -= 1;
          if (this.armor <= 0) this.explodeShip();
          if (a.hp <= 0) {
            this.asteroids.splice(ai, 1);
            this.explodeAsteroid(a);
            this.breakAsteroid(a, ang);
          }
        }
      }
    });

    this.planets.forEach(pl => {
      if (!this.ship.dead && Math.hypot(this.ship.x - pl.x, this.ship.y - pl.y) < this.ship.radius + pl.radius) {
        pl.shake = Math.max(pl.shake, Math.min(1, this.ship.mass / pl.mass));
        if (this.shieldTimer > 0) {
          const ang = Math.atan2(this.ship.y - pl.y, this.ship.x - pl.x);
          const sp = Math.hypot(this.ship.thrust.x, this.ship.thrust.y);
          this.ship.thrust.x = Math.cos(ang) * Math.max(sp, 2);
          this.ship.thrust.y = Math.sin(ang) * Math.max(sp, 2);
          this.ship.x = pl.x + Math.cos(ang) * (pl.radius + this.ship.radius + 1);
          this.ship.y = pl.y + Math.sin(ang) * (pl.radius + this.ship.radius + 1);
          this.spawnParticles(this.ship.x, this.ship.y, 10, '#ff0');
        } else {
          this.spawnParticles(this.ship.x, this.ship.y, 20, '#fff');
          this.explodeShip();
        }
      }
      this.asteroids.forEach((a, ai) => {
        if (Math.hypot(a.x - pl.x, a.y - pl.y) < a.radius + pl.radius) {
          pl.shake = Math.max(pl.shake, Math.min(1, a.mass / pl.mass));
          this.spawnParticles(a.x, a.y, 20, a.color);
          this.asteroids.splice(ai, 1);
          this.explodeAsteroid(a);
          this.breakAsteroid(a, Math.atan2(a.y - pl.y, a.x - pl.x));
        }
      });
      this.bullets.forEach((b, bi) => {
        if (Math.hypot(b.x - pl.x, b.y - pl.y) < pl.radius) {
          pl.shake = Math.max(pl.shake, Math.min(1, Game.BULLET_MASS / pl.mass));
          this.spawnParticles(b.x, b.y, 5, '#fff');
          this.bullets.splice(bi, 1);
        }
      });
      this.pickups.forEach((p, pi) => {
        if (Math.hypot(p.x - pl.x, p.y - pl.y) < pl.radius + p.size) {
          pl.shake = Math.max(pl.shake, Math.min(1, 1 / pl.mass));
          this.spawnParticles(p.x, p.y, 10, p.color);
          this.pickups.splice(pi, 1);
        }
      });
    });

    this.particles.forEach(p => { p.x += p.dx; p.y += p.dy; p.life -= dt; });
    this.particles = this.particles.filter(p => p.life > 0);
    this.asteroidLines.forEach(l => { l.x += l.dx; l.y += l.dy; l.life -= dt; });
    this.asteroidLines = this.asteroidLines.filter(l => l.life > 0);
    this.exhaust.forEach(e => { e.life -= dt; e.r += 40 * dt; });
    this.exhaust = this.exhaust.filter(e => e.life > 0);

    this.pickupTimer -= dt;
    if (this.pickupTimer <= 0) {
      this.spawnPickup();
      this.pickupTimer = 3 + Math.random() * 5;
    }

    this.healPickupTimer -= dt;
    if (this.healPickupTimer <= 0) {
      this.spawnHealPickup();
      this.healPickupTimer = 20 + Math.random() * 10;
    }

    this.timePickupTimer -= dt;
    if (this.timePickupTimer <= 0) {
      this.spawnTimePickup();
      this.timePickupTimer = 30 + Math.random() * 15;
    }

    this.pickups.forEach((p, pi) => {
      this.planets.forEach(pl => {
        const dx = pl.x - p.x;
        const dy = pl.y - p.y;
        const distSq = dx * dx + dy * dy;
        const range = Game.gravityRange(pl.mass);
        if (distSq > 1 && distSq < range * range) {
          const dist = Math.sqrt(distSq);
          const a = Game.GRAVITY * pl.mass / distSq;
          p.dx += (dx / dist) * a * dt;
          p.dy += (dy / dist) * a * dt;
        }
      });
      p.x = (p.x + p.dx + this.worldWidth) % this.worldWidth;
      p.y = (p.y + p.dy + this.worldHeight) % this.worldHeight;
      p.ttl -= dt;
      if (p.ttl < 2) p.size = Game.PICKUP_SIZE * Math.max(0, p.ttl / 2);
      if (p.ttl <= 0) {
        this.spawnParticles(p.x, p.y, 30, p.color, 2);
        this.pickups.splice(pi, 1);
        return;
      }
      this.asteroids.forEach((a, ai) => {
        if (Math.hypot(p.x - a.x, p.y - a.y) < p.size + a.radius) {
          this.spawnParticles((p.x + a.x) / 2, (p.y + a.y) / 2, 5, p.color);
          p.hp -= 1;
          a.hp -= 0.5;
          if (a.hp <= 0) {
            this.asteroids.splice(ai, 1);
            this.explodeAsteroid(a);
            this.breakAsteroid(a, Math.atan2(a.y - p.y, a.x - p.x));
          }
        }
      });
      this.bullets.forEach((b, bi) => {
        if (Math.hypot(b.x - p.x, b.y - p.y) < p.size) {
          this.bullets.splice(bi, 1);
          this.spawnParticles(p.x, p.y, 50, p.color, 2);
          this.pickups.splice(pi, 1);
          if (p.letter === 'S') {
            this.applyShieldEffect();
            this.score += 20; if (this.score > 99999) this.score = 99999; this.updateTopbar();
          } else if (p.letter === 'L') {
            this.laserTimer = Game.LASER_DURATION;
          } else if (p.letter === 'H') {
            this.lives = 5; this.armor = 5; this.updateTopbar();
          } else if (p.letter === 'T') {
            this.timer += 30;
            this.updateTimer();
          }
        }
      });
      if (!this.ship.dead && Math.hypot(p.x - this.ship.x, p.y - this.ship.y) < p.size + this.ship.radius) {
        this.spawnParticles(p.x, p.y, 50, p.color, 2);
        this.pickups.splice(pi, 1);
        if (window.playSound) window.playSound('pickup', this.ship.x, this.ship.y);
        if (p.letter === 'S') {
          this.applyShieldEffect();
          this.score += 20; if (this.score > 99999) this.score = 99999; this.updateTopbar();
        } else if (p.letter === 'L') {
          this.laserTimer = Game.LASER_DURATION;
        } else if (p.letter === 'H') {
          this.lives = 5; this.armor = 5; this.updateTopbar();
        } else if (p.letter === 'T') {
          this.timer += 30;
          this.updateTimer();
        }
      } else if (p.hp <= 0) {
        this.spawnParticles(p.x, p.y, 30, p.color, 2);
        this.pickups.splice(pi, 1);
      }
    });

    this.asteroids.forEach(a => {
      const spd = Math.hypot(a.dx, a.dy);
      if (spd > Game.MAX_SPEED) {
        const ratio = Game.MAX_SPEED / spd;
        a.dx *= ratio;
        a.dy *= ratio;
      }
    });

    for (let ei = 0; ei < this.enemies.length; ei++) {
      const e = this.enemies[ei];
      const distToShip = Math.hypot(e.x - this.ship.x, e.y - this.ship.y);
      if (distToShip < e.detection && !this.ship.dead) {
        if (!e.alerted) { e.alerted = true; if (window.playSound) window.playSound('alarm'); }
        e.alertBlink += dt;
        const dx = this.ship.x - e.x;
        const dy = this.ship.y - e.y;
        const d = Math.hypot(dx, dy) || 1;
        e.dx += (dx / d) * Game.ENEMY_ACCEL;
        e.dy += (dy / d) * Game.ENEMY_ACCEL;
        if (distToShip < this.ship.radius + Game.ENEMY_RADIUS) {
          if (this.spawnInvul <= 0) {
            this.armor -= 1; this.lineFlashTimer = 1.5; this.updateTopbar();
            if (this.armor <= 0) this.explodeShip();
          }
          this.spawnParticles(e.x, e.y, 20, '#0f0');
          this.enemies.splice(ei, 1);
          this.updateTopbar();
          ei--; continue;
        }
      } else {
        e.alerted = false;
        e.alertBlink = 0;
        e.dx += (Math.random() - 0.5) * Game.ENEMY_ACCEL;
        e.dy += (Math.random() - 0.5) * Game.ENEMY_ACCEL;
      }
      for (let ai = 0; ai < this.asteroids.length; ai++) {
        const a = this.asteroids[ai];
        const dx = e.x - a.x;
        const dy = e.y - a.y;
        const dist = Math.hypot(dx, dy);
        if (dist < a.radius + Game.ENEMY_RADIUS) {
          this.spawnParticles(e.x, e.y, 20, '#f0f');
          this.enemies.splice(ei, 1);
          this.updateTopbar();
          ei--; break;
        }
        if (dist < a.radius + Game.ENEMY_RADIUS * 2) {
          const ang = Math.atan2(dy, dx);
          e.dx += Math.cos(ang) * Game.ENEMY_ACCEL * 5;
          e.dy += Math.sin(ang) * Game.ENEMY_ACCEL * 5;
          e.angle = ang;
        }
      }
      if (!this.enemies[ei]) continue;
      for (let pi = 0; pi < this.planets.length; pi++) {
        const p = this.planets[pi];
        const dx = e.x - p.x;
        const dy = e.y - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist < p.radius + Game.ENEMY_RADIUS) {
          this.spawnParticles(e.x, e.y, 20, '#f0f');
          this.enemies.splice(ei, 1);
          this.updateTopbar();
          ei--; break;
        }
        if (dist < p.radius + Game.ENEMY_RADIUS * 2) {
          const ang = Math.atan2(dy, dx);
          e.dx += Math.cos(ang) * Game.ENEMY_ACCEL * 5;
          e.dy += Math.sin(ang) * Game.ENEMY_ACCEL * 5;
          e.angle = ang;
        }
      }
      if (!this.enemies[ei]) continue;
      const sp = Math.hypot(e.dx, e.dy);
      if (sp > Game.ENEMY_MAX_SPEED) {
        const r = Game.ENEMY_MAX_SPEED / sp;
        e.dx *= r; e.dy *= r;
      }
      e.x = (e.x + e.dx + this.worldWidth) % this.worldWidth;
      e.y = (e.y + e.dy + this.worldHeight) % this.worldHeight;
      e.angle = Math.atan2(e.dy, e.dx);
    }

    this.updateCamera();
  }

  /** Draw current game state */
  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawBackground();
    this.drawPlanets();

    this.asteroidLines.forEach(l => {
      ctx.save();
      ctx.globalAlpha = l.life;
      this.drawWrapped(l.x, l.y, 0, () => {
        ctx.save();
        ctx.translate(l.x, l.y);
        ctx.beginPath();
        ctx.moveTo(l.x1, l.y1);
        ctx.lineTo(l.x2, l.y2);
        ctx.strokeStyle = l.color;
        ctx.stroke();
        ctx.restore();
      });
      ctx.restore();
    });

    this.particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      this.drawWrapped(p.x, p.y, 2, () => ctx.fillRect(p.x - 1, p.y - 1, 2, 2));
      ctx.restore();
    });

    this.exhaust.forEach(e => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, e.life / Game.EXHAUST_LIFE) * 0.7;
      ctx.strokeStyle = e.color;
      this.drawWrapped(e.x, e.y, e.r, () => {
        ctx.beginPath();
        if (e.type === 'front') {
          ctx.moveTo(e.x, e.y - e.r);
          ctx.lineTo(e.x + e.r, e.y);
          ctx.lineTo(e.x, e.y + e.r);
          ctx.lineTo(e.x - e.r, e.y);
          ctx.closePath();
        } else {
          ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
        }
        ctx.stroke();
      });
      ctx.restore();
    });

    ctx.strokeStyle = this.lineFlashTimer > 0 ? (Math.floor(this.lineFlashTimer * 5) % 2 === 0 ? this.ship.color : '#f00') : this.ship.color;
    if (!this.ship.dead) {
      if (this.spawnInvul <= 0 || Math.floor(this.spawnInvul * 10) % 2 === 0) {
        this.drawWrapped(this.ship.x, this.ship.y, this.ship.radius, () => {
          ctx.save();
          ctx.translate(this.ship.x, this.ship.y);
          ctx.rotate(this.ship.angle);
          ctx.beginPath();
          ctx.moveTo(this.ship.radius, 0);
          ctx.lineTo(-this.ship.radius, this.ship.radius / 2);
          ctx.lineTo(-this.ship.radius, -this.ship.radius / 2);
          ctx.closePath();
          ctx.stroke();
          ctx.restore();
        });
      }
      if (this.shieldTimer > 0) {
        const phase = Math.floor(Date.now() / 100) % 2 === 0;
        ctx.strokeStyle = phase ? '#ff0' : '#fff';
        ctx.lineWidth = phase ? 4 : 2;
        this.drawWrapped(this.ship.x, this.ship.y, this.ship.radius + 5, () => {
          ctx.beginPath();
          ctx.arc(this.ship.x, this.ship.y, this.ship.radius + 5, 0, Math.PI * 2);
          ctx.stroke();
        });
        ctx.lineWidth = 1;
      }
    } else {
      this.shipFragments.forEach(f => {
        this.drawWrapped(f.x, f.y, 0, () => {
          ctx.save();
          ctx.translate(f.x, f.y);
          ctx.rotate(f.rot);
          ctx.beginPath();
          ctx.moveTo(f.x1, f.y1);
          ctx.lineTo(f.x2, f.y2);
          ctx.stroke();
          ctx.restore();
        });
      });
    }

    this.bullets.forEach(b => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, b.life / Game.BULLET_LIFE);
      if (b.laser) {
        ctx.strokeStyle = '#0ff';
        this.drawWrapped(b.x, b.y, 20, () => {
          ctx.beginPath();
          ctx.moveTo(b.x, b.y);
          ctx.lineTo(b.x + Math.cos(b.angle) * 20, b.y + Math.sin(b.angle) * 20);
          ctx.stroke();
        });
      } else {
        ctx.fillStyle = 'white';
        this.drawWrapped(b.x, b.y, 2, () => ctx.fillRect(b.x - 2, b.y - 2, 4, 4));
      }
      ctx.restore();
    });

    this.asteroids.forEach(a => {
      ctx.strokeStyle = a.color;
      this.drawWrapped(a.x, a.y, a.radius, () => {
        ctx.beginPath();
        ctx.moveTo(a.points[0].x + a.x, a.points[0].y + a.y);
        for (let i = 1; i < a.points.length; i++) ctx.lineTo(a.points[i].x + a.x, a.points[i].y + a.y);
        ctx.closePath();
        ctx.stroke();
      });
    });

    this.pickups.forEach(p => {
      ctx.save();
      ctx.fillStyle = p.color;
      this.drawWrapped(p.x, p.y, p.size, () => {
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        ctx.fillStyle = '#000';
        ctx.font = p.size + 'px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.letter, p.x, p.y + 1);
      });
      ctx.restore();
    });

    this.enemies.forEach(e => {
      ctx.save();
      this.drawWrapped(e.x, e.y, Game.ENEMY_RADIUS + 2, () => {
        ctx.translate(e.x, e.y);
        ctx.rotate(e.angle + Math.PI / 2);
        ctx.font = Game.ENEMY_FONT_SIZE + 'px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('\uD83D\uDC7E', 0, 0);
      });
      ctx.restore();
    });

    if (this.gameOver) {
      ctx.fillStyle = 'white';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', this.canvas.width / 2, this.canvas.height / 2);
      ctx.font = '24px sans-serif';
      ctx.fillText('Restarting in ' + Math.ceil(this.restartTimer), this.canvas.width / 2, this.canvas.height / 2 + 40);
    }

    if (this.flashTimer > 0 && Math.floor(this.flashTimer * 6) % 2 === 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'difference';
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.restore();
    }

    this.drawMinimap();
  }

  /** Main loop called by requestAnimationFrame */
  loop(timestamp) {
    const dt = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;
    if (!this.paused) this.update(dt);
    this.draw();
    if (window.updateJoystickIndicator) window.updateJoystickIndicator();
    if (this.running) requestAnimationFrame(t => this.loop(t));
  }

  /** Start the game loop */
  start(onEnd) {
    this.onEnd = onEnd;
    this.running = true;
    requestAnimationFrame(t => { this.lastTime = t; this.loop(t); });
  }
}

// Game constants
Game.KEY_LEFT = 37;
Game.KEY_UP = 38;
Game.KEY_RIGHT = 39;
Game.KEY_DOWN = 40;
Game.KEY_SPACE = 32;
Game.KEY_ENTER = 13;
Game.KEY_A = 65;
Game.KEY_D = 68;
Game.KEY_W = 87;
Game.KEY_S = 83;
Game.KEY_Q = 81;
Game.KEY_E = 69;
Game.DEFAULT_SHIP_RADIUS = 20;
Game.DEFAULT_SHIP_MASS = 5;
Game.BULLET_LIFE = 3;
Game.SHIELD_DURATION = 30;
Game.LASER_DURATION = 60;
Game.PICKUP_SIZE = Game.DEFAULT_SHIP_RADIUS * 2;
Game.EXHAUST_LIFE = 0.7;
Game.ROUND_TIME = 150;
Game.MIN_ASTEROID_RADIUS = 15;
Game.WORLD_SIZE = 3000;
Game.MIN_INITIAL_ASTEROIDS = 10;
Game.MAX_INITIAL_ASTEROIDS = 100;
Game.MAX_ASTEROIDS = 100;
Game.MAX_SPEED = 2;
Game.BULLET_MASS = 0.5;
Game.GRAVITY = 5;
Game.GRAVITY_MULT = 0.5;
Game.PLANET_GRAVITY_MULT = 8;
Game.GRAVITY_RANGE_FACTOR = 10.5;
Game.SHIP_ACCEL = 0.035;
Game.SHIP_DRAG = 0.98;
Game.GRAVITY_WARNING_RATIO = 0.8;
Game.MAX_PLANETS = 3;
Game.MIN_ENEMIES = 3;
Game.MAX_ENEMIES = 10;
Game.ENEMY_RADIUS = 20;
Game.ENEMY_FONT_SIZE = 48;
Game.ENEMY_MAX_SPEED = 2;
Game.ENEMY_ACCEL = 0.025;
Game.ENEMY_DETECTION_RADIUS = 600;
Game.ENEMY_HP = 1;
Game.PALETTE = ['#fff', '#0ff', '#f0f', '#ff0', '#0f0', '#f00', '#00f', '#f80'];

window.Game = Game;
