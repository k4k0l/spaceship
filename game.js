// Game logic module for Asteroids-like game
// Provides Game class which manages state, updates and rendering.

export default class Game {
  /**
   * @param {HTMLCanvasElement} canvas - canvas element to draw the game
   * @param {HTMLElement} scoreEl - element for score display
   * @param {HTMLElement} statusEl - element for lives/armor display
   * @param {HTMLElement} timerEl - element for timer display
   */
  constructor(canvas, mapCanvas, scoreEl, statusEl, timerEl, settings = {}) {
    this.canvas = canvas;
    this.mapCanvas = mapCanvas;
    this.mapCtx = mapCanvas.getContext('2d');
    this.ctx = canvas.getContext('2d');
    this.scoreEl = scoreEl;
    this.statusEl = statusEl;
    this.timerEl = timerEl;

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

    this.gameOver = false;
    this.restartTimer = 0;
    this.respawnTimer = 0;
    this.spawnInvul = 0;
    this.flashTimer = 0;
    this.lineFlashTimer = 0;
    this.pickupTimer = 10 + Math.random() * 20;
    this.healPickupTimer = 60 + Math.random() * 30;
    this.lives = 5;
    this.armor = 5;
    this.score = 0;
    this.sizeTimer = 0;
    this.sizeFactor = 1;
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

    window.addEventListener('keydown', e => { this.keys[e.keyCode] = true; });
    window.addEventListener('keyup', e => { this.keys[e.keyCode] = false; });
    window.addEventListener('resize', () => this.resizeCanvas());
    this.resizeCanvas();
    this.createStars();
    this.updateTopbar();
    this.updateTimer();
    this.minAsteroids = settings.minAsteroids || Game.MIN_INITIAL_ASTEROIDS;
    this.maxAsteroids = settings.maxAsteroids || Game.MAX_INITIAL_ASTEROIDS;
    this.spawnInitialAsteroids(Math.floor(Math.random() * (this.maxAsteroids - this.minAsteroids + 1)) + this.minAsteroids);
  }

  /** Resize canvas to window size */
  resizeCanvas() {
    this.canvas.width = Math.max(window.innerWidth * 0.5, 800);
    this.canvas.height = Math.max(window.innerHeight * 0.5, 600);
    this.mapCanvas.width = 150;
    this.mapCanvas.height = 150;
  }

  /** Update score/lives display */
  updateTopbar() {
    this.scoreEl.textContent = 'Score: ' + String(Math.floor(this.score)).padStart(5, '0');
    const armorStr = ('|'.repeat(this.armor)).padEnd(5, '.');
    this.statusEl.innerHTML = 'Lives: ' + String(this.lives).padStart(2, '0') + '&nbsp;&nbsp;Armor: ' + armorStr;
  }

  /** Update camera viewport to follow the ship */
  updateCamera() {
    this.viewportX = Math.min(Math.max(this.ship.x - this.canvas.width / 2, 0), this.worldWidth - this.canvas.width);
    this.viewportY = Math.min(Math.max(this.ship.y - this.canvas.height / 2, 0), this.worldHeight - this.canvas.height);
  }

  /** Update timer display */
  updateTimer() {
    const m = Math.floor(this.timer / 60);
    const s = Math.floor(this.timer % 60);
    this.timerEl.textContent = `[${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}]`;
  }

  /** Add score based on asteroid hp */
  addScore(hp) {
    this.score += Math.pow(2, hp);
    if (this.score > 99999) this.score = 99999;
    this.updateTopbar();
    this.updateTimer();
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
    const mass = radius * 0.5;
    this.asteroids.push({ x, y, dx, dy, radius, points, color, hp, mass, spawnDelay: 1 });
  }

  /** Spawn size changing pickup */
  spawnPickup() {
    const size = Game.PICKUP_SIZE;
    const x = Math.random() * this.worldWidth;
    const y = Math.random() * this.worldHeight;
    const ang = Math.random() * Math.PI * 2;
    const spd = Math.random() * 0.3 + 0.1;
    const dx = Math.cos(ang) * spd;
    const dy = Math.sin(ang) * spd;
    this.pickups.push({ x, y, dx, dy, size, hp: 15, letter: 'S', color: '#ff0', ttl: 15 });
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
      const color = Game.PALETTE[Math.floor(Math.random() * Game.PALETTE.length)];
      const hp = Math.max(1, a.hp - 1);
      const mass = radius * 0.5;
      this.asteroids.push({ x: spawnX, y: spawnY, dx, dy, radius, points: pts, color, hp, mass, spawnDelay: 0.3 });
    }
  }

  /** Apply size pickup effect */
  applyPickupSizeEffect() {
    if (this.sizeTimer > 0) {
      this.ship.radius /= this.sizeFactor;
      this.ship.mass /= this.sizeFactor;
    }
    let factor = Math.random() < 0.9 ? 2 : 0.5;
    const minR = Game.DEFAULT_SHIP_RADIUS / 3;
    const maxR = Game.DEFAULT_SHIP_RADIUS * 3;
    let newR = this.ship.radius * factor;
    if (newR > maxR) newR = maxR;
    if (newR < minR) newR = minR;
    factor = newR / this.ship.radius;
    this.ship.radius = newR;
    this.ship.mass *= factor;
    this.sizeFactor = factor;
    this.sizeTimer = Game.SIZE_EFFECT_DURATION;
  }

  /** Spawn particles for explosion/exhaust */
  spawnParticles(x, y, count, color, life = 1) {
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = Math.random() * 1 + 0.5;
      this.particles.push({ x, y, dx: Math.cos(ang) * spd, dy: Math.sin(ang) * spd, life, color });
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
  }

  /** Explode the ship and handle life loss */
  explodeShip() {
    this.ship.dead = true;
    this.shipFragments = [];
    this.flashTimer = 1;
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
      this.respawnTimer = 1;
    }
  }

  /** Restart entire game */
  restartGame() {
    this.ship.dead = false;
    this.ship.radius = Game.DEFAULT_SHIP_RADIUS;
    this.ship.mass = Game.DEFAULT_SHIP_MASS;
    this.sizeTimer = 0;
    this.sizeFactor = 1;
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
    this.sizeTimer = 0;
    this.sizeFactor = 1;
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
    mctx.fillStyle = '#fff';
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

    // draw trajectory
    mctx.strokeStyle = '#fff';
    mctx.beginPath();
    let tx = this.ship.x;
    let ty = this.ship.y;
    let vx = this.ship.thrust.x;
    let vy = this.ship.thrust.y;
    mctx.moveTo((tx / this.worldWidth) * mw, (ty / this.worldHeight) * mh);
    for (let i = 0; i < 20; i++) {
      tx = (tx + vx + this.worldWidth) % this.worldWidth;
      ty = (ty + vy + this.worldHeight) % this.worldHeight;
      const mx = (tx / this.worldWidth) * mw;
      const my = (ty / this.worldHeight) * mh;
      mctx.lineTo(mx, my);
    }
    mctx.stroke();

    // ship
    const sx = (this.ship.x / this.worldWidth) * mw;
    const sy = (this.ship.y / this.worldHeight) * mh;
    mctx.fillStyle = '#f0f';
    mctx.fillRect(sx - 2, sy - 2, 4, 4);
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
        this.running = false;
        if (this.onEnd) this.onEnd();
        return;
      }
      return;
    }

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

    if (this.ship.dead) {
      this.shipFragments.forEach(f => { f.x += f.dx; f.y += f.dy; f.rot += f.dr * dt; });
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0) this.respawnShip();
    } else {
      if (this.keys[Game.KEY_LEFT]) this.ship.angle -= 3 * dt;
      if (this.keys[Game.KEY_RIGHT]) this.ship.angle += 3 * dt;
      if (this.keys[Game.KEY_UP]) {
        this.ship.thrust.x += Math.cos(this.ship.angle) * 0.1;
        this.ship.thrust.y += Math.sin(this.ship.angle) * 0.1;
        const exX = this.ship.x - Math.cos(this.ship.angle) * this.ship.radius;
        const exY = this.ship.y - Math.sin(this.ship.angle) * this.ship.radius;
        if (this.exhaustDelay <= 0) {
          this.exhaust.push({ x: exX, y: exY, r: 2, life: Game.EXHAUST_LIFE, color: this.ship.color, type: 'back' });
          this.exhaustDelay = 0.1;
        }
      }
      if (this.keys[Game.KEY_DOWN]) {
        this.ship.thrust.x -= Math.cos(this.ship.angle) * 0.05;
        this.ship.thrust.y -= Math.sin(this.ship.angle) * 0.05;
        const exX = this.ship.x + Math.cos(this.ship.angle) * this.ship.radius;
        const exY = this.ship.y + Math.sin(this.ship.angle) * this.ship.radius;
        if (this.exhaustDelay <= 0) {
          this.exhaust.push({ x: exX, y: exY, r: 1, life: Game.EXHAUST_LIFE, color: this.ship.color, type: 'front' });
          this.exhaustDelay = 0.15;
        }
      }
      const sv = Math.hypot(this.ship.thrust.x, this.ship.thrust.y);
      if (sv > Game.MAX_SPEED) {
        const ratio = Game.MAX_SPEED / sv;
        this.ship.thrust.x *= ratio;
        this.ship.thrust.y *= ratio;
      }
      this.ship.x = (this.ship.x + this.ship.thrust.x + this.worldWidth) % this.worldWidth;
      this.ship.y = (this.ship.y + this.ship.thrust.y + this.worldHeight) % this.worldHeight;
      if (this.keys[Game.KEY_SPACE] && this.ship.canShoot) {
        this.bullets.push({
          x: this.ship.x + Math.cos(this.ship.angle) * this.ship.radius,
          y: this.ship.y + Math.sin(this.ship.angle) * this.ship.radius,
          dx: Math.cos(this.ship.angle) * 5 + this.ship.thrust.x,
          dy: Math.sin(this.ship.angle) * 5 + this.ship.thrust.y,
          life: Game.BULLET_LIFE
        });
        this.ship.canShoot = false;
      }
      if (!this.keys[Game.KEY_SPACE]) this.ship.canShoot = true;
    }

    this.spawnInvul = Math.max(0, this.spawnInvul - dt);
    this.flashTimer = Math.max(0, this.flashTimer - dt);
    this.lineFlashTimer = Math.max(0, this.lineFlashTimer - dt);
    if (this.exhaustDelay > 0) this.exhaustDelay -= dt;
    if (this.sizeTimer > 0) {
      this.sizeTimer -= dt;
      if (this.sizeTimer <= 0) {
        this.ship.radius /= this.sizeFactor;
        this.ship.mass /= this.sizeFactor;
        this.sizeFactor = 1;
      }
    }

    this.bullets.forEach((b, bi) => {
      b.x = (b.x + b.dx + this.worldWidth) % this.worldWidth;
      b.y = (b.y + b.dy + this.worldHeight) % this.worldHeight;
      b.life -= dt;
      if (!this.ship.dead && this.spawnInvul <= 0 && Math.hypot(b.x - this.ship.x, b.y - this.ship.y) < this.ship.radius) {
        this.bullets.splice(bi, 1);
        this.spawnParticles(b.x, b.y, 5, '#f00');
        this.armor -= 1; this.lineFlashTimer = 1.5; this.updateTopbar();
        if (this.armor <= 0) this.explodeShip();
      }
    });
    this.bullets = this.bullets.filter(b => b.life > 0);

    this.asteroids.forEach(a => {
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
    });

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
        if (this.spawnInvul <= 0) {
          this.armor -= 1; this.lineFlashTimer = 1.5; this.updateTopbar();
          this.spawnParticles(this.ship.x + Math.cos(ang) * this.ship.radius, this.ship.y + Math.sin(ang) * this.ship.radius, 10, '#f00');
          a.hp -= 1;
          if (this.armor <= 0) this.explodeShip();
        }
        if (a.hp <= 0) {
          this.asteroids.splice(ai, 1);
          this.explodeAsteroid(a);
          this.breakAsteroid(a, ang);
        }
      }
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
      this.pickupTimer = 10 + Math.random() * 20;
    }

    this.healPickupTimer -= dt;
    if (this.healPickupTimer <= 0) {
      this.spawnHealPickup();
      this.healPickupTimer = 60 + Math.random() * 30;
    }

    this.pickups.forEach((p, pi) => {
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
            this.applyPickupSizeEffect();
            this.score += 20; if (this.score > 99999) this.score = 99999; this.updateTopbar();
          } else if (p.letter === 'H') {
            this.lives = 5; this.armor = 5; this.updateTopbar();
          }
        }
      });
      if (!this.ship.dead && Math.hypot(p.x - this.ship.x, p.y - this.ship.y) < p.size + this.ship.radius) {
        this.spawnParticles(p.x, p.y, 50, p.color, 2);
        this.pickups.splice(pi, 1);
        if (p.letter === 'S') {
          this.applyPickupSizeEffect();
          this.score += 20; if (this.score > 99999) this.score = 99999; this.updateTopbar();
        } else if (p.letter === 'H') {
          this.lives = 5; this.armor = 5; this.updateTopbar();
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

    this.updateCamera();
  }

  /** Draw current game state */
  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawBackground();

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
      ctx.globalAlpha = Math.max(0, e.life / Game.EXHAUST_LIFE) * 0.5;
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
      ctx.fillStyle = 'white';
      ctx.globalAlpha = Math.max(0, b.life / Game.BULLET_LIFE);
      this.drawWrapped(b.x, b.y, 2, () => ctx.fillRect(b.x - 2, b.y - 2, 4, 4));
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
    this.update(dt);
    this.draw();
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
Game.DEFAULT_SHIP_RADIUS = 20;
Game.DEFAULT_SHIP_MASS = 5;
Game.BULLET_LIFE = 3;
Game.SIZE_EFFECT_DURATION = 30;
Game.PICKUP_SIZE = Game.DEFAULT_SHIP_RADIUS;
Game.EXHAUST_LIFE = 0.5;
Game.ROUND_TIME = 90;
Game.MIN_ASTEROID_RADIUS = 15;
Game.WORLD_SIZE = 3000;
Game.MIN_INITIAL_ASTEROIDS = 10;
Game.MAX_INITIAL_ASTEROIDS = 100;
Game.MAX_ASTEROIDS = 100;
Game.MAX_SPEED = 6;
Game.PALETTE = ['#fff', '#0ff', '#f0f', '#ff0', '#0f0', '#f00', '#00f', '#f80'];
