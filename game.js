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
    this.pingEl = settings.pingEl || null;
    this.isHost = settings.isHost || false;
    this.ping = 0;
    this.statusMessage = '';
    this.stateSendDelay = 0;

    // TODO: refactor input handling to support touch events for mobile devices
    // TODO: investigate networking options for future multiplayer mode

    this.worldWidth = settings.worldSize || Game.WORLD_SIZE;
    this.worldHeight = settings.worldSize || Game.WORLD_SIZE;
    this.zoom = settings.zoom || 1;
    this.isMobile = settings.isMobile || false;

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
    this.peerShip = null;
    this.dataChannel = null;

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
    this.isoScale = Game.ISO_SCALE;

    const startAngle = Math.random() * Math.PI * 2;
    this.ship = {
      x: this.worldWidth / 2,
      y: this.worldHeight / 2,
      angle: startAngle,
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
    this.rotateDuration = Game.DEFAULT_ROTATE_DURATION;
    this.rotateStart = 0;
    this.rotateTarget = 0;

    const getKey = Game.keyFromEvent;
    window.addEventListener('keydown', e => {
      const code = getKey(e);
      if (code != null) this.keys[code] = true;
    });
    window.addEventListener('keyup', e => {
      const code = getKey(e);
      if (code != null) this.keys[code] = false;
    });
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
    const margin = 20;
    const dispW = window.innerWidth - margin;
    const dispH = window.innerHeight - margin;
    this.canvas.style.width = dispW + 'px';
    this.canvas.style.height = dispH + 'px';
    this.canvas.width = Math.floor(dispW / this.zoom);
    this.canvas.height = Math.floor(dispH / this.zoom);
    const mapSize = this.isMobile ? 112 : 150;
    this.mapCanvas.width = mapSize;
    this.mapCanvas.height = mapSize;
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
    if (this.pingEl) {
      const pingStr = '(' + Math.round(this.ping) + 'ms)';
      this.pingEl.textContent = pingStr + ' ' + (this.statusMessage || '');
    }
  }

  setStatus(msg) {
    this.statusMessage = msg;
    this.updateTopbar();
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
    const pos = this.isoTransform(x, y);
    return pos.x >= -margin && pos.x <= this.canvas.width + margin &&
           pos.y >= -margin && pos.y <= this.canvas.height + margin;
  }

  /** Convert world coordinates to isometric screen coordinates */
  isoTransform(x, y) {
    let dx = x - this.ship.x;
    let dy = y - this.ship.y;
    if (dx > this.worldWidth / 2) dx -= this.worldWidth;
    if (dx < -this.worldWidth / 2) dx += this.worldWidth;
    if (dy > this.worldHeight / 2) dy -= this.worldHeight;
    if (dy < -this.worldHeight / 2) dy += this.worldHeight;
    const ix = dx - dy;
    const iy = (dx + dy) * this.isoScale;
    return {
      x: ix + this.canvas.width / 2,
      y: iy + this.canvas.height / 2
    };
  }

  /** Convert a world angle to an isometric screen angle */
  isoAngle(angle) {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const ix = dx - dy;
    const iy = (dx + dy) * this.isoScale;
    return Math.atan2(iy, ix);
  }

  shipVertices() {
    const r = this.ship.radius;
    const a = this.ship.angle;
    const nose = {
      x: this.ship.x + Math.cos(a) * r,
      y: this.ship.y + Math.sin(a) * r
    };
    const left = {
      x: this.ship.x - Math.cos(a) * r + Math.sin(a) * (r / 2),
      y: this.ship.y - Math.sin(a) * r - Math.cos(a) * (r / 2)
    };
    const right = {
      x: this.ship.x - Math.cos(a) * r - Math.sin(a) * (r / 2),
      y: this.ship.y - Math.sin(a) * r + Math.cos(a) * (r / 2)
    };
    return [nose, left, right];
  }

  pointInShip(px, py) {
    const [A, B, C] = this.shipVertices();
    const v0x = C.x - A.x, v0y = C.y - A.y;
    const v1x = B.x - A.x, v1y = B.y - A.y;
    const v2x = px - A.x, v2y = py - A.y;
    const dot00 = v0x * v0x + v0y * v0y;
    const dot01 = v0x * v1x + v0y * v1y;
    const dot02 = v0x * v2x + v0y * v2y;
    const dot11 = v1x * v1x + v1y * v1y;
    const dot12 = v1x * v2x + v1y * v2y;
    const inv = 1 / (dot00 * dot11 - dot01 * dot01);
    const u = (dot11 * dot02 - dot01 * dot12) * inv;
    const v = (dot00 * dot12 - dot01 * dot02) * inv;
    return u >= 0 && v >= 0 && (u + v <= 1);
  }

  shipCircleCollision(obj) {
    const verts = this.shipVertices();
    for (let i = 0; i < 3; i++) {
      const v1 = verts[i];
      const v2 = verts[(i + 1) % 3];
      if (Game.segCircleIntersect(v1.x, v1.y, v2.x, v2.y, obj.x, obj.y, obj.radius)) {
        return true;
      }
    }
    return this.pointInShip(obj.x, obj.y);
  }

  getWorldState() {
    return JSON.parse(JSON.stringify({
      worldWidth: this.worldWidth,
      worldHeight: this.worldHeight,
      asteroids: this.asteroids,
      planets: this.planets,
      enemies: this.enemies,
      pickups: this.pickups
    }));
  }

  setWorldState(state) {
    this.worldWidth = state.worldWidth;
    this.worldHeight = state.worldHeight;
    this.asteroids = state.asteroids || [];
    this.planets = state.planets || [];
    this.enemies = state.enemies || [];
    this.pickups = state.pickups || [];
    this.updateTopbar();
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

  /** Rotate ship smoothly towards specified angle */
  rotateTo(angle, duration = Game.DEFAULT_ROTATE_DURATION) {
    if (duration <= 0) {
      this.ship.angle = angle;
      this.rotateDuration = 0;
      this.rotateAnim = 0;
      this.rotateStart = angle;
      this.rotateTarget = angle;
      return;
    }
    this.rotateDuration = duration;
    this.rotateStart = this.ship.angle;
    this.rotateTarget = angle;
    let diff = ((this.rotateTarget - this.rotateStart + Math.PI) % (Math.PI * 2)) - Math.PI;
    this.rotateTarget = this.rotateStart + diff;
    this.rotateAnim = this.rotateDuration;
  }

  /** Fire a bullet immediately at the given angle */
  fireBullet(angle) {
    if (!this.ship.canShoot) return;
    const laser = this.laserTimer > 0;
    this.bullets.push({
      x: this.ship.x + Math.cos(angle) * this.ship.radius,
      y: this.ship.y + Math.sin(angle) * this.ship.radius,
      dx: Math.cos(angle) * 5 + this.ship.thrust.x,
      dy: Math.sin(angle) * 5 + this.ship.thrust.y,
      life: laser ? Game.BULLET_LIFE * 2 : Game.BULLET_LIFE,
      laser,
      angle
    });
    if (window.playSound) window.playSound('shoot', this.ship.x, this.ship.y);
    if (!laser) {
      this.ship.thrust.x -= Math.cos(angle) * 5 * Game.BULLET_MASS / this.ship.mass * 0.5;
      this.ship.thrust.y -= Math.sin(angle) * 5 * Game.BULLET_MASS / this.ship.mass * 0.5;
    }
    this.ship.canShoot = false;
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
    const ang = Math.random() * Math.PI * 2;
    this.ship.angle = ang;
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
    const ang = Math.random() * Math.PI * 2;
    this.ship.angle = ang;
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
        const wx = x + ox * this.worldWidth;
        const wy = y + oy * this.worldHeight;
        const pos = this.isoTransform(wx, wy);
        if (pos.x + r < 0 || pos.x - r > this.canvas.width || pos.y + r < 0 || pos.y - r > this.canvas.height) continue;
        this.ctx.save();
        this.ctx.translate(pos.x - x, pos.y - y);
        fn();
        this.ctx.restore();
      }
    }
  }

  /** Draw parallax star background */
  drawBackground() {
    const speed = Math.hypot(this.ship.thrust.x, this.ship.thrust.y);
    for (let i = 0; i < this.stars.length; i++) {
      const layer = this.stars[i];
      layer.forEach(s => {
        const x = s.x - this.viewportX * s.factor;
        const y = s.y - this.viewportY * s.factor;
        const sx = ((x % this.worldWidth) + this.worldWidth) % this.worldWidth;
        const sy = ((y % this.worldHeight) + this.worldHeight) % this.worldHeight;
        const pos = this.isoTransform(sx, sy);
        if (pos.x < 0 || pos.x > this.canvas.width || pos.y < 0 || pos.y > this.canvas.height) return;
        const blur = speed * 10 * s.factor;
        const bx = pos.x - this.ship.thrust.x * blur;
        const by = pos.y - this.ship.thrust.y * blur;
        this.ctx.strokeStyle = s.color;
        this.ctx.beginPath();
        this.ctx.moveTo(pos.x, pos.y);
        this.ctx.lineTo(bx, by);
        this.ctx.stroke();
      });
    }

    // draw board edges
    this.ctx.strokeStyle = '#fff';
    const tl = this.isoTransform(0, 0);
    const tr = this.isoTransform(this.worldWidth, 0);
    const bl = this.isoTransform(0, this.worldHeight);
    const br = this.isoTransform(this.worldWidth, this.worldHeight);
    this.ctx.beginPath();
    this.ctx.moveTo(tl.x, tl.y);
    this.ctx.lineTo(tr.x, tr.y);
    this.ctx.lineTo(br.x, br.y);
    this.ctx.lineTo(bl.x, bl.y);
    this.ctx.closePath();
    this.ctx.stroke();
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
    if (this.peerShip) {
      const px = (this.peerShip.x / this.worldWidth) * mw;
      const py = (this.peerShip.y / this.worldHeight) * mh;
      mctx.strokeStyle = '#f00';
      mctx.beginPath();
      mctx.moveTo(px - 2, py - 2);
      mctx.lineTo(px + 2, py + 2);
      mctx.moveTo(px + 2, py - 2);
      mctx.lineTo(px - 2, py + 2);
      mctx.stroke();
    }

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
    // close icon
    mctx.strokeStyle = '#fff';
    mctx.beginPath();
    mctx.arc(mw - 10, 10, 8, 0, Math.PI * 2);
    mctx.moveTo(mw - 13, 7);
    mctx.lineTo(mw - 7, 13);
    mctx.moveTo(mw - 7, 7);
    mctx.lineTo(mw - 13, 13);
    mctx.stroke();
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
        const ax = Math.cos(this.ship.angle) * 0.035;
        const ay = Math.sin(this.ship.angle) * 0.035;
        this.ship.thrust.x += ax;
        this.ship.thrust.y += ay;
        const off = this.ship.radius * Game.EXHAUST_OFFSET;
        const mag = Math.hypot(ax, ay) || 1;
        const exX = this.ship.x - ax / mag * off;
        const exY = this.ship.y - ay / mag * off;
        if (this.exhaustDelay <= 0) {
          this.exhaust.push({ x: exX, y: exY, r: 2, life: Game.EXHAUST_LIFE, color: this.ship.color, type: 'back' });
          this.exhaustDelay = 0.1;
        }
      }
      if (this.keys[Game.KEY_DOWN] || this.keys[Game.KEY_S]) {
        const ax = -Math.cos(this.ship.angle) * 0.0175;
        const ay = -Math.sin(this.ship.angle) * 0.0175;
        this.ship.thrust.x += ax;
        this.ship.thrust.y += ay;
        const off = this.ship.radius * Game.EXHAUST_OFFSET;
        const mag = Math.hypot(ax, ay) || 1;
        const exX = this.ship.x - ax / mag * off;
        const exY = this.ship.y - ay / mag * off;
        if (this.exhaustDelay <= 0) {
          this.exhaust.push({ x: exX, y: exY, r: 1, life: Game.EXHAUST_LIFE, color: this.ship.color, type: 'front' });
          this.exhaustDelay = 0.15;
        }
      }
      if (this.keys[Game.KEY_Q]) {
        const ax = Math.sin(this.ship.angle) * 0.0175;
        const ay = -Math.cos(this.ship.angle) * 0.0175;
        this.ship.thrust.x += ax;
        this.ship.thrust.y += ay;
        const off = this.ship.radius * Game.EXHAUST_OFFSET;
        const mag = Math.hypot(ax, ay) || 1;
        const exX = this.ship.x - ax / mag * off;
        const exY = this.ship.y - ay / mag * off;
        if (this.exhaustDelay <= 0) {
          this.exhaust.push({ x: exX, y: exY, r: 1, life: Game.EXHAUST_LIFE, color: this.ship.color, type: 'side' });
          this.exhaustDelay = 0.1;
        }
      }
      if (this.keys[Game.KEY_E]) {
        const ax = -Math.sin(this.ship.angle) * 0.0175;
        const ay = Math.cos(this.ship.angle) * 0.0175;
        this.ship.thrust.x += ax;
        this.ship.thrust.y += ay;
        const off = this.ship.radius * Game.EXHAUST_OFFSET;
        const mag = Math.hypot(ax, ay) || 1;
        const exX = this.ship.x - ax / mag * off;
        const exY = this.ship.y - ay / mag * off;
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
        this.fireBullet(this.ship.angle);
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
      if (!this.ship.dead && this.pointInShip(b.x, b.y)) {
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
      if (!this.ship.dead && this.shipCircleCollision({ x: a.x, y: a.y, radius: a.radius })) {
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
      if (!this.ship.dead && this.shipCircleCollision({ x: pl.x, y: pl.y, radius: pl.radius })) {
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
      if (!this.ship.dead && this.shipCircleCollision({ x: p.x, y: p.y, radius: p.size })) {
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
        if (this.shipCircleCollision({ x: e.x, y: e.y, radius: Game.ENEMY_RADIUS })) {
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
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      let msg;
      if (this.isHost) {
        msg = { type: 'state', world: this.getWorldState(), ship: { x: this.ship.x, y: this.ship.y, angle: this.ship.angle } };
      } else {
        msg = { type: 'ship', ship: { x: this.ship.x, y: this.ship.y, angle: this.ship.angle } };
      }
      try { this.dataChannel.send(JSON.stringify(msg)); } catch {}
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
          ctx.rotate(this.isoAngle(this.ship.angle));
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
          ctx.rotate(this.isoAngle(f.rot));
          ctx.beginPath();
          ctx.moveTo(f.x1, f.y1);
          ctx.lineTo(f.x2, f.y2);
          ctx.stroke();
          ctx.restore();
        });
      });
    }

    if (this.peerShip) {
      ctx.strokeStyle = this.peerShip.color || '#f00';
      this.drawWrapped(this.peerShip.x, this.peerShip.y, this.peerShip.radius, () => {
        ctx.save();
        ctx.translate(this.peerShip.x, this.peerShip.y);
        ctx.rotate(this.isoAngle(this.peerShip.angle));
        ctx.beginPath();
        ctx.moveTo(this.peerShip.radius, 0);
        ctx.lineTo(-this.peerShip.radius, this.peerShip.radius / 2);
        ctx.lineTo(-this.peerShip.radius, -this.peerShip.radius / 2);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      });
    }

    this.bullets.forEach(b => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, b.life / Game.BULLET_LIFE);
      if (b.laser) {
        ctx.strokeStyle = '#0ff';
        this.drawWrapped(b.x, b.y, 20, () => {
          ctx.save();
          ctx.translate(b.x, b.y);
          ctx.rotate(this.isoAngle(b.angle));
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(20, 0);
          ctx.stroke();
          ctx.restore();
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
        ctx.rotate(this.isoAngle(e.angle) + Math.PI / 2);
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

  setDataChannel(ch) {
    this.dataChannel = ch;
    if (ch) {
      const sendInit = () => {
        if (this.isHost) {
          const initMsg = { type: 'state', world: this.getWorldState(), ship: { x: this.ship.x, y: this.ship.y, angle: this.ship.angle } };
          try { ch.send(JSON.stringify(initMsg)); } catch {}
        }
        this.setStatus('Connected');
      };
      if (ch.readyState === 'open') {
        sendInit();
      } else {
        ch.onopen = sendInit;
      }
      ch.onclose = () => { this.setStatus('Disconnected'); };
      ch.onmessage = e => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === 'state' && !this.isHost) {
            this.setWorldState(msg.world);
            if (!this.peerShip) this.peerShip = { radius: this.ship.radius, color: '#f00' };
            Object.assign(this.peerShip, msg.ship);
          } else if (msg.type === 'ship' && this.isHost) {
            if (!this.peerShip) this.peerShip = { radius: this.ship.radius, color: '#f00' };
            Object.assign(this.peerShip, msg.ship);
          } else if (msg.type === 'ping') {
            ch.send(JSON.stringify({ type: 'pong', t: msg.t }));
          } else if (msg.type === 'pong') {
            this.ping = performance.now() - msg.t;
            this.updateTopbar();
          }
        } catch {}
      };
      this.pingInterval = setInterval(() => {
        if (ch.readyState === 'open') {
          ch.send(JSON.stringify({ type: 'ping', t: performance.now() }));
        }
      }, 1000);
    } else {
      clearInterval(this.pingInterval);
    }
  }
}

/** Convert a keyboard event to the associated game key code */
Game.keyFromEvent = function(e) {
  if (e.code) {
    const map = {
      ArrowLeft: Game.KEY_LEFT,
      ArrowRight: Game.KEY_RIGHT,
      ArrowUp: Game.KEY_UP,
      ArrowDown: Game.KEY_DOWN,
      Space: Game.KEY_SPACE,
      Enter: Game.KEY_ENTER,
      KeyA: Game.KEY_A,
      KeyD: Game.KEY_D,
      KeyW: Game.KEY_W,
      KeyS: Game.KEY_S,
      KeyQ: Game.KEY_Q,
      KeyE: Game.KEY_E
    };
    if (map.hasOwnProperty(e.code)) return map[e.code];
  }
  return e.keyCode;
};

Game.segCircleIntersect = function(x1, y1, x2, y2, cx, cy, r) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const fx = x1 - cx;
  const fy = y1 - cy;
  const a = dx * dx + dy * dy;
  const b = 2 * (fx * dx + fy * dy);
  const c = fx * fx + fy * fy - r * r;
  let disc = b * b - 4 * a * c;
  if (disc < 0) return false;
  disc = Math.sqrt(disc);
  const t1 = (-b - disc) / (2 * a);
  const t2 = (-b + disc) / (2 * a);
  return (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1);
};

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
Game.EXHAUST_OFFSET = 1; // relative to ship radius
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
// disable passive slowdown; ship will maintain velocity until counter-thrust
Game.SHIP_DRAG = 1;
Game.DEFAULT_ROTATE_DURATION = 0.15;
Game.FAST_ROTATE_DURATION = 0.05;
// warn about strong gravity sooner
Game.GRAVITY_WARNING_RATIO = 0.4;
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
Game.ISO_SCALE = 0.5;

window.Game = Game;
