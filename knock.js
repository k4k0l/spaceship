(function () {
  const TAU = Math.PI * 2;
  const G = 9.81;

  const SURFACES = {
    normal:   { color: '#374553', friction: 0.85, bounce: 0.5, traction: 0.9 },
    slick:    { color: '#4f7cff', friction: 0.25, bounce: 0.65, traction: 0.3 },
    rough:    { color: '#745533', friction: 1.4, bounce: 0.4, traction: 1.4 },
    magnetic: { color: '#6b2fb4', friction: 0.9, bounce: 0.55, traction: 1.8 },
    sticky:   { color: '#0f8c4c', friction: 2.6, bounce: 0.25, traction: 2.8 }
  };

  const FLOOR_PATTERN_COLOR = 'rgba(255,255,255,0.05)';

  const ORIENTATION_REWARD = {
    horizontal: 'Hold the phone more level to slip through the low tunnels.',
    vertical: 'Tip the phone upright to tackle the climbing shafts.'
  };

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function choice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function randRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  function rotateVector(x, y, angleRad) {
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);
    return {
      x: x * cos - y * sin,
      y: x * sin + y * cos
    };
  }

  class DynamicElement {
    constructor(data) {
      Object.assign(this, data);
      this.time = Math.random() * 1000;
      this.state = 0;
    }

    update(dt, tiltStrength) {
      this.time += dt;
      switch (this.kind) {
        case 'seesaw': {
          const target = clamp(tiltStrength.x * 0.7, -0.8, 0.8);
          this.state = lerp(this.state, target, clamp(dt * 2.5, 0, 1));
          break;
        }
        case 'piston': {
          const speed = this.speed || 1.1;
          this.state = Math.sin(this.time * speed) * this.amplitude;
          break;
        }
        case 'pendulum': {
          const speed = this.speed || 1.5;
          const sway = Math.sin(this.time * speed + this.phase) * this.amplitude;
          this.state = sway;
          break;
        }
      }
    }

    render(ctx, camera) {
      ctx.save();
      ctx.translate(this.x - camera.x, this.y - camera.y);
      if (this.kind === 'seesaw') {
        ctx.rotate(this.state);
        ctx.fillStyle = 'rgba(230,230,255,0.8)';
        ctx.fillRect(-this.width / 2, -this.thickness / 2, this.width, this.thickness);
        ctx.fillStyle = 'rgba(160,180,255,0.4)';
        ctx.beginPath();
        ctx.arc(0, 0, this.thickness * 0.8, 0, TAU);
        ctx.fill();
      } else if (this.kind === 'piston') {
        ctx.fillStyle = 'rgba(255,90,60,0.9)';
        const offset = this.axis === 'x' ? this.state : 0;
        const offsetY = this.axis === 'y' ? this.state : 0;
        ctx.fillRect(-this.width / 2 + offset, -this.height / 2 + offsetY, this.width, this.height);
      } else if (this.kind === 'pendulum') {
        ctx.rotate(this.state);
        ctx.strokeStyle = 'rgba(240,240,240,0.6)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, this.length);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,210,90,0.85)';
        ctx.beginPath();
        ctx.arc(0, this.length, this.massRadius, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }

    applyInteraction(ball, dt) {
      if (this.kind === 'seesaw') {
        const relative = {
          x: ball.x - this.x,
          y: ball.y - this.y
        };
        const s = Math.sin(this.state);
        const c = Math.cos(this.state);
        const rotatedY = relative.x * s + relative.y * c;
        const rotatedX = relative.x * c - relative.y * s;
        if (Math.abs(rotatedX) < this.width / 2 && Math.abs(rotatedY) < this.thickness) {
          ball.vx += -s * 18 * dt;
          ball.vy += c * 18 * dt;
          ball.x += -s * 8 * dt;
          ball.y += c * 8 * dt;
        }
      } else if (this.kind === 'piston') {
        const px = this.x + (this.axis === 'x' ? this.state : 0);
        const py = this.y + (this.axis === 'y' ? this.state : 0);
        const within = Math.abs(ball.x - px) < (this.width / 2 + ball.radius) &&
          Math.abs(ball.y - py) < (this.height / 2 + ball.radius);
        if (within) {
          if (this.axis === 'x') {
            const dir = Math.sign(ball.x - px) || 1;
            ball.vx = Math.max(Math.abs(ball.vx), 90) * dir;
            ball.x = px + dir * (this.width / 2 + ball.radius + 2);
          } else {
            const dir = Math.sign(ball.y - py) || 1;
            ball.vy = Math.max(Math.abs(ball.vy), 90) * dir;
            ball.y = py + dir * (this.height / 2 + ball.radius + 2);
          }
        }
      } else if (this.kind === 'pendulum') {
        const swingAngle = this.state;
        const anchorX = this.x;
        const anchorY = this.y;
        const bobX = anchorX + Math.sin(swingAngle) * this.length;
        const bobY = anchorY + Math.cos(swingAngle) * this.length;
        const dx = ball.x - bobX;
        const dy = ball.y - bobY;
        const dist = Math.hypot(dx, dy);
        const totalRadius = ball.radius + this.massRadius;
        if (dist < totalRadius) {
          const nx = dx / (dist || 1);
          const ny = dy / (dist || 1);
          const overlap = totalRadius - dist;
          ball.x += nx * overlap;
          ball.y += ny * overlap;
          const relativeSpeed = ball.vx * nx + ball.vy * ny;
          if (relativeSpeed < 0) {
            ball.vx -= 1.8 * relativeSpeed * nx;
            ball.vy -= 1.8 * relativeSpeed * ny;
          }
        }
      }
    }
  }

  class Labyrinth {
    constructor(width, height, tileSize) {
      this.width = width;
      this.height = height;
      this.tileSize = tileSize;
      this.cols = Math.ceil(width / tileSize);
      this.rows = Math.ceil(height / tileSize);
      this.tiles = new Array(this.cols * this.rows).fill(null);
      this.orientationHints = [];
      this.dynamicElements = [];
      this.pickups = [];
      this.generate();
    }

    index(col, row) {
      return row * this.cols + col;
    }

    setTile(col, row, data) {
      if (col < 0 || row < 0 || col >= this.cols || row >= this.rows) return;
      this.tiles[this.index(col, row)] = data;
    }

    getTile(col, row) {
      if (col < 0 || row < 0 || col >= this.cols || row >= this.rows) return null;
      return this.tiles[this.index(col, row)];
    }

    generate() {
      const pathCols = this.cols;
      const pathRows = this.rows;
      const startCol = Math.floor(pathCols / 2);
      let currentCol = startCol;
      for (let row = 0; row < pathRows; row++) {
        const surfaceKeys = Object.keys(SURFACES);
        const surface = choice(surfaceKeys);
        this.setTile(currentCol, row, { type: 'floor', surface });
        if (Math.random() < 0.2) {
          this.setTile(currentCol, row, {
            type: 'floor',
            surface,
            requiredOrientation: Math.random() < 0.5 ? 'vertical' : 'horizontal'
          });
        }
        const carveWidth = Math.random() < 0.4 ? 2 : 1;
        for (let offset = 1; offset <= carveWidth; offset++) {
          const side = Math.random() < 0.5 ? -1 : 1;
          this.setTile(currentCol + side * offset, row, { type: 'floor', surface: choice(surfaceKeys) });
        }
        const direction = Math.random();
        if (direction < 0.33) {
          currentCol = clamp(currentCol - 1, 1, pathCols - 2);
        } else if (direction > 0.66) {
          currentCol = clamp(currentCol + 1, 1, pathCols - 2);
        }
      }

      for (let row = 0; row < this.rows; row++) {
        for (let col = 0; col < this.cols; col++) {
          if (!this.getTile(col, row)) {
            this.setTile(col, row, { type: 'wall' });
          }
        }
      }

      this.orientationHints = [];
      for (let row = 2; row < this.rows - 2; row += Math.floor(randRange(3, 6))) {
        const col = clamp(Math.floor(randRange(2, this.cols - 3)), 1, this.cols - 2);
        const tile = this.getTile(col, row);
        if (tile && tile.type === 'floor' && !tile.requiredOrientation && Math.random() < 0.4) {
          tile.requiredOrientation = Math.random() < 0.5 ? 'horizontal' : 'vertical';
          this.orientationHints.push({
            col,
            row,
            kind: tile.requiredOrientation
          });
        }
      }

      this.generateDynamics();
      this.generatePickups();
    }

    generateDynamics() {
      this.dynamicElements = [];
      const total = Math.floor(this.rows / 6);
      for (let i = 0; i < total; i++) {
        const row = Math.floor(randRange(3, this.rows - 4));
        const col = Math.floor(randRange(1, this.cols - 1));
        const tile = this.getTile(col, row);
        if (!tile || tile.type !== 'floor') continue;
        if (Math.random() < 0.33) {
          this.dynamicElements.push(new DynamicElement({
            kind: 'seesaw',
            x: (col + 0.5) * this.tileSize,
            y: (row + 0.5) * this.tileSize,
            width: this.tileSize * randRange(1.4, 1.9),
            thickness: this.tileSize * 0.18
          }));
        } else if (Math.random() < 0.5) {
          this.dynamicElements.push(new DynamicElement({
            kind: 'piston',
            x: (col + 0.5) * this.tileSize,
            y: (row + 0.5) * this.tileSize,
            width: this.tileSize * randRange(0.5, 0.8),
            height: this.tileSize * randRange(0.5, 1.2),
            axis: Math.random() < 0.5 ? 'x' : 'y',
            amplitude: this.tileSize * randRange(0.4, 1.0),
            speed: randRange(0.5, 1.5)
          }));
        } else {
          this.dynamicElements.push(new DynamicElement({
            kind: 'pendulum',
            x: (col + 0.5) * this.tileSize,
            y: (row + 0.1) * this.tileSize,
            amplitude: randRange(0.4, 1.2),
            length: this.tileSize * randRange(1.1, 1.8),
            massRadius: this.tileSize * randRange(0.18, 0.3),
            phase: Math.random() * Math.PI * 2,
            speed: randRange(0.6, 1.8)
          }));
        }
      }
    }

    generatePickups() {
      this.pickups = [];
      const count = Math.floor(this.rows / 5);
      for (let i = 0; i < count; i++) {
        const col = Math.floor(randRange(1, this.cols - 1));
        const row = Math.floor(randRange(2, this.rows - 2));
        const tile = this.getTile(col, row);
        if (!tile || tile.type !== 'floor') continue;
        const scale = Math.random() < 0.5 ? 0.6 : 1.6;
        this.pickups.push({
          x: (col + 0.5) * this.tileSize,
          y: (row + 0.5) * this.tileSize,
          radius: this.tileSize * 0.18,
          scale
        });
      }
    }

    getTileAtPosition(x, y) {
      const col = Math.floor(x / this.tileSize);
      const row = Math.floor(y / this.tileSize);
      return { tile: this.getTile(col, row), col, row };
    }
  }

  class KnockVisualizer {
    constructor(canvas, statusEl) {
      this.canvas = canvas;
      this.statusEl = statusEl;
      this.ctx = canvas.getContext('2d');
      this.running = false;
      this.motionAllowed = false;
      this.motionListening = false;
      this.motionRequesting = false;
      this.logicalWidth = canvas.width;
      this.logicalHeight = canvas.height;
      this.lastTime = 0;
      this.camera = { x: 0, y: 0 };
      this.tilt = { x: 0, y: 0, z: -1 };
      this.accMagnitude = G;
      this.shakeTimer = 0;
      this.boxDepth = 40;
      this.labyrinth = new Labyrinth(1200, 5400, 140);
      this.ball = {
        x: this.labyrinth.width / 2,
        y: this.labyrinth.tileSize * 0.6,
        z: 4,
        vx: 0,
        vy: 0,
        vz: 0,
        radius: 26,
        mass: 26 * 26 * 0.04,
        rollAngle: 0
      };
      this.targetStatus = '';
      this.motionHandler = this.handleMotion.bind(this);
      this.handleResize = this.resize.bind(this);
      this.pointerDown = this.handlePointerDown.bind(this);
      this.pointerUp = this.handlePointerUp.bind(this);
      this.update = this.update.bind(this);
      this.render = this.render.bind(this);
      this.loop = this.loop.bind(this);
    }

    start() {
      if (this.running) return;
      this.running = true;
      this.canvas.style.touchAction = 'manipulation';
      this.canvas.style.userSelect = 'none';
      this.resize();
      window.addEventListener('resize', this.handleResize);
      this.canvas.addEventListener('pointerdown', this.pointerDown);
      this.canvas.addEventListener('pointerup', this.pointerUp);
      this.canvas.addEventListener('pointercancel', this.pointerUp);
      this.lastTime = performance.now();
      this.updateStatus('Tilt the phone to roll the steel ball. Shake to rattle the maze.');
      this.raf = requestAnimationFrame(this.loop);
    }

    stop() {
      if (!this.running) return;
      this.running = false;
      cancelAnimationFrame(this.raf);
      window.removeEventListener('resize', this.handleResize);
      this.canvas.removeEventListener('pointerdown', this.pointerDown);
      this.canvas.removeEventListener('pointerup', this.pointerUp);
      this.canvas.removeEventListener('pointercancel', this.pointerUp);
      if (this.motionListening) {
        window.removeEventListener('devicemotion', this.motionHandler, true);
        this.motionListening = false;
      }
      this.motionAllowed = false;
      this.motionRequesting = false;
    }

    resize() {
      const rect = this.canvas.getBoundingClientRect();
      this.logicalWidth = rect.width || this.canvas.width;
      this.logicalHeight = rect.height || this.canvas.height;
      const dpr = window.devicePixelRatio || 1;
      this.canvas.width = Math.round(this.logicalWidth * dpr);
      this.canvas.height = Math.round(this.logicalHeight * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    async requestMotionPermission() {
      if (this.motionAllowed || this.motionRequesting) return;
      if (typeof DeviceMotionEvent === 'undefined') {
        this.updateStatus('Motion sensors unavailable. Maze will rely on simulated tilt.');
        return;
      }
      this.motionRequesting = true;
      try {
        if (typeof DeviceMotionEvent.requestPermission === 'function') {
          const result = await DeviceMotionEvent.requestPermission();
          this.motionAllowed = result === 'granted';
        } else {
          this.motionAllowed = true;
        }
      } catch (err) {
        this.motionAllowed = false;
      }
      this.motionRequesting = false;
      if (this.motionAllowed && !this.motionListening) {
        window.addEventListener('devicemotion', this.motionHandler, true);
        this.motionListening = true;
      }
      this.updateStatus();
    }

    handlePointerDown(e) {
      try { this.canvas.setPointerCapture(e.pointerId); } catch (_) {}
      if (!this.motionAllowed) {
        this.requestMotionPermission();
      }
      this.updateStatus('Tilting controls the slope. Rapid shakes bounce the ball.');
    }

    handlePointerUp(e) {
      try { this.canvas.releasePointerCapture(e.pointerId); } catch (_) {}
    }

    getOrientationAngle() {
      if (screen.orientation && typeof screen.orientation.angle === 'number') {
        return screen.orientation.angle;
      }
      if (typeof window.orientation === 'number') {
        return window.orientation;
      }
      return 0;
    }

    handleMotion(event) {
      if (!this.running) return;
      const acc = event.accelerationIncludingGravity || event.acceleration;
      if (!acc) return;
      const angle = ((this.getOrientationAngle() % 360) + 360) % 360;
      let ax = acc.x || 0;
      let ay = acc.y || 0;
      let az = acc.z || 0;
      switch (angle) {
        case 90:
          [ax, ay] = [-ay, ax];
          break;
        case 180:
          ax = -ax;
          ay = -ay;
          break;
        case 270:
          [ax, ay] = [ay, -ax];
          break;
      }
      this.accMagnitude = Math.sqrt(ax * ax + ay * ay + az * az);
      this.tilt.x = clamp(ax / G, -2, 2);
      this.tilt.y = clamp(ay / G, -2, 2);
      this.tilt.z = clamp(az / G, -2, 2);
      const shake = Math.max(0, this.accMagnitude - G * 1.35);
      if (shake > 0.2) {
        this.shakeTimer = 0.25;
        this.ball.vz -= shake * 1.4;
      }
    }

    simulateFallbackTilt(dt) {
      const time = performance.now() * 0.0003;
      this.tilt.x = Math.sin(time * 1.3) * 0.3;
      this.tilt.y = Math.cos(time) * 0.25;
      this.tilt.z = -1;
    }

    updateStatus(message) {
      if (message) {
        this.targetStatus = message;
      }
      if (!this.statusEl) return;
      const orientationMode = Math.abs(this.tilt.y) > Math.abs(this.tilt.x) ? 'vertical' : 'horizontal';
      const hint = ORIENTATION_REWARD[orientationMode];
      const pieces = [];
      if (this.targetStatus) pieces.push(this.targetStatus);
      pieces.push(`Current posture: <strong>${orientationMode.toUpperCase()}</strong>. ${hint}`);
      pieces.push('Surfaces: blue = slick, green = sticky, violet = magnetic, brown = rough, steel = balanced.');
      this.statusEl.innerHTML = pieces.join(' ');
    }

    update(dt) {
      if (!this.motionAllowed) {
        this.simulateFallbackTilt(dt);
      }
      if (this.shakeTimer > 0) {
        this.shakeTimer -= dt;
        this.ball.vx += randRange(-80, 80) * dt;
        this.ball.vy += randRange(-80, 80) * dt;
      }

      const { ball, labyrinth } = this;
      const { tile, col, row } = labyrinth.getTileAtPosition(ball.x, ball.y);
      const surface = tile && tile.surface ? SURFACES[tile.surface] : SURFACES.normal;
      const orientationMode = Math.abs(this.tilt.y) > Math.abs(this.tilt.x) ? 'vertical' : 'horizontal';

      const slopeStrength = 620;
      const accX = this.tilt.x * slopeStrength / Math.max(ball.mass, 1) * surface.traction;
      const accY = this.tilt.y * slopeStrength / Math.max(ball.mass, 1) * surface.traction;

      ball.vx += accX * dt;
      ball.vy += accY * dt;

      const friction = surface.friction;
      ball.vx -= ball.vx * friction * dt;
      ball.vy -= ball.vy * friction * dt;

      if (tile && tile.requiredOrientation && tile.requiredOrientation !== orientationMode) {
        const penalty = tile.requiredOrientation === 'vertical' ? Math.abs(this.tilt.x) : Math.abs(this.tilt.y);
        const blockStrength = clamp(1 - penalty, 0.3, 1.2);
        ball.vx *= 0.25 * blockStrength;
        ball.vy *= 0.25 * blockStrength;
      }

      if (tile && tile.surface === 'magnetic') {
        const cx = (col + 0.5) * labyrinth.tileSize;
        const cy = (row + 0.5) * labyrinth.tileSize;
        const dx = cx - ball.x;
        const dy = cy - ball.y;
        ball.vx += dx * dt * 6.5;
        ball.vy += dy * dt * 6.5;
      }

      if (tile && tile.surface === 'sticky') {
        ball.vx *= 1 - clamp(dt * 5.5, 0, 0.9);
        ball.vy *= 1 - clamp(dt * 5.5, 0, 0.9);
      }

      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;

      const bounceFactor = surface.bounce;
      if (ball.x - ball.radius < 0) {
        ball.x = ball.radius;
        ball.vx = Math.abs(ball.vx) * bounceFactor;
      } else if (ball.x + ball.radius > labyrinth.width) {
        ball.x = labyrinth.width - ball.radius;
        ball.vx = -Math.abs(ball.vx) * bounceFactor;
      }
      if (ball.y - ball.radius < 0) {
        ball.y = ball.radius;
        ball.vy = Math.abs(ball.vy) * bounceFactor;
      } else if (ball.y + ball.radius > labyrinth.height) {
        ball.y = labyrinth.height - ball.radius;
        ball.vy = -Math.abs(ball.vy) * bounceFactor;
      }

      this.resolveMazeWalls(ball, labyrinth);

      const gravityNormal = clamp(-this.tilt.z, -1.5, 1.5);
      ball.vz += gravityNormal * 120 * dt;
      ball.vz -= ball.vz * 2.5 * dt;
      ball.z += ball.vz * dt;
      if (ball.z < ball.radius * -0.35) {
        ball.z = ball.radius * -0.35;
        ball.vz = -ball.vz * 0.55;
      } else if (ball.z > this.boxDepth - ball.radius * 0.65) {
        ball.z = this.boxDepth - ball.radius * 0.65;
        ball.vz = -Math.abs(ball.vz) * 0.4;
      }

      labyrinth.dynamicElements.forEach(el => {
        el.update(dt, this.tilt);
        el.applyInteraction(ball, dt);
      });

      this.applyPickups();
      ball.mass = Math.max(10, ball.radius * ball.radius * 0.05);
      const speed = Math.hypot(ball.vx, ball.vy);
      ball.rollAngle += speed * dt / Math.max(ball.radius, 1);

      const padding = 200;
      this.camera.x = clamp(ball.x - this.logicalWidth / 2, 0, Math.max(0, labyrinth.width - this.logicalWidth));
      this.camera.y = clamp(ball.y - this.logicalHeight / 2, 0, Math.max(0, labyrinth.height - this.logicalHeight));
      this.camera.x = clamp(this.camera.x, ball.x - padding, ball.x + padding - this.logicalWidth);
      this.camera.y = clamp(this.camera.y, ball.y - padding, ball.y + padding - this.logicalHeight);
      this.camera.x = clamp(this.camera.x, 0, Math.max(0, labyrinth.width - this.logicalWidth));
      this.camera.y = clamp(this.camera.y, 0, Math.max(0, labyrinth.height - this.logicalHeight));
    }

    resolveMazeWalls(ball, labyrinth) {
      const tileSize = labyrinth.tileSize;
      const col = Math.floor(ball.x / tileSize);
      const row = Math.floor(ball.y / tileSize);
      const neighbors = [
        { dc: -1, dr: 0 },
        { dc: 1, dr: 0 },
        { dc: 0, dr: -1 },
        { dc: 0, dr: 1 },
        { dc: -1, dr: -1 },
        { dc: 1, dr: -1 },
        { dc: -1, dr: 1 },
        { dc: 1, dr: 1 }
      ];
      neighbors.forEach(({ dc, dr }) => {
        const nCol = col + dc;
        const nRow = row + dr;
        const tile = labyrinth.getTile(nCol, nRow);
        if (!tile || tile.type !== 'wall') return;
        const minX = nCol * tileSize;
        const minY = nRow * tileSize;
        const maxX = minX + tileSize;
        const maxY = minY + tileSize;
        const nearestX = clamp(ball.x, minX, maxX);
        const nearestY = clamp(ball.y, minY, maxY);
        const dx = ball.x - nearestX;
        const dy = ball.y - nearestY;
        const dist = Math.hypot(dx, dy);
        if (dist < ball.radius) {
          const nx = dx / (dist || 1);
          const ny = dy / (dist || 1);
          const overlap = ball.radius - dist;
          ball.x += nx * overlap;
          ball.y += ny * overlap;
          const vn = ball.vx * nx + ball.vy * ny;
          if (vn < 0) {
            ball.vx -= (1.2 * vn) * nx;
            ball.vy -= (1.2 * vn) * ny;
          }
        }
      });
    }

    applyPickups() {
      const { ball } = this;
      this.labyrinth.pickups = this.labyrinth.pickups.filter(p => {
        const dx = ball.x - p.x;
        const dy = ball.y - p.y;
        if (dx * dx + dy * dy < (ball.radius + p.radius) ** 2) {
          const original = ball.radius;
          ball.radius = clamp(original * p.scale, 12, 48);
          this.updateStatus(p.scale > 1 ? 'Ball grew heavier!' : 'Ball shrank, becoming nimble.');
          ball.vx *= 0.6;
          ball.vy *= 0.6;
          return false;
        }
        return true;
      });
    }

    drawFloorPattern(ctx, tileSize) {
      const spacing = tileSize / 5;
      ctx.strokeStyle = FLOOR_PATTERN_COLOR;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= tileSize; x += spacing) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, tileSize);
      }
      for (let y = 0; y <= tileSize; y += spacing) {
        ctx.moveTo(0, y);
        ctx.lineTo(tileSize, y);
      }
      ctx.stroke();
    }

    render() {
      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.logicalWidth, this.logicalHeight);
      ctx.save();
      ctx.translate(-this.camera.x, -this.camera.y);

      ctx.fillStyle = '#0d1423';
      ctx.fillRect(this.camera.x, this.camera.y, this.logicalWidth, this.logicalHeight);

      const tileSize = this.labyrinth.tileSize;
      const startCol = Math.max(0, Math.floor(this.camera.x / tileSize) - 1);
      const endCol = Math.min(this.labyrinth.cols, Math.ceil((this.camera.x + this.logicalWidth) / tileSize) + 1);
      const startRow = Math.max(0, Math.floor(this.camera.y / tileSize) - 1);
      const endRow = Math.min(this.labyrinth.rows, Math.ceil((this.camera.y + this.logicalHeight) / tileSize) + 1);

      for (let row = startRow; row < endRow; row++) {
        for (let col = startCol; col < endCol; col++) {
          const tile = this.labyrinth.getTile(col, row);
          if (!tile) continue;
          const x = col * tileSize;
          const y = row * tileSize;
          if (tile.type === 'wall') {
            ctx.fillStyle = '#05070d';
            ctx.fillRect(x, y, tileSize, tileSize);
          } else {
            const surface = SURFACES[tile.surface] || SURFACES.normal;
            ctx.fillStyle = surface.color;
            ctx.fillRect(x, y, tileSize, tileSize);
            ctx.save();
            ctx.translate(x, y);
            this.drawFloorPattern(ctx, tileSize);
            ctx.restore();
            if (tile.requiredOrientation) {
              ctx.save();
              ctx.translate(x + tileSize / 2, y + tileSize / 2);
              ctx.strokeStyle = 'rgba(255,255,255,0.75)';
              ctx.lineWidth = 4;
              ctx.beginPath();
              if (tile.requiredOrientation === 'vertical') {
                ctx.moveTo(0, -tileSize * 0.35);
                ctx.lineTo(0, tileSize * 0.35);
              } else {
                ctx.moveTo(-tileSize * 0.35, 0);
                ctx.lineTo(tileSize * 0.35, 0);
              }
              ctx.stroke();
              ctx.restore();
            }
          }
        }
      }

      this.labyrinth.dynamicElements.forEach(el => el.render(ctx, this.camera));

      this.labyrinth.pickups.forEach(p => {
        ctx.save();
        ctx.translate(p.x - this.camera.x, p.y - this.camera.y);
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.beginPath();
        ctx.arc(0, 0, p.radius, 0, TAU);
        ctx.fill();
        ctx.fillStyle = 'rgba(40,120,255,0.9)';
        ctx.font = `${p.radius * 1.2}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.scale > 1 ? '+' : '-', 0, 0);
        ctx.restore();
      });

      const ballScreenX = this.ball.x - this.camera.x;
      const ballScreenY = this.ball.y - this.camera.y - this.ball.z * 0.4;
      ctx.save();
      ctx.translate(ballScreenX, ballScreenY);
      const radial = ctx.createRadialGradient(-this.ball.radius * 0.4, -this.ball.radius * 0.6, this.ball.radius * 0.2,
        this.ball.radius * 0.2, this.ball.radius * 0.2, this.ball.radius);
      radial.addColorStop(0, '#ff5959');
      radial.addColorStop(1, '#850909');
      ctx.fillStyle = radial;
      ctx.beginPath();
      ctx.arc(0, 0, this.ball.radius, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#f5f5f5';
      const dotOffset = rotateVector(0, -this.ball.radius * 0.6, this.ball.rollAngle);
      ctx.beginPath();
      ctx.arc(dotOffset.x, dotOffset.y, this.ball.radius * 0.18, 0, TAU);
      ctx.fill();
      ctx.restore();

      ctx.restore();
    }

    loop(now) {
      if (!this.running) return;
      const dt = clamp((now - this.lastTime) / 1000, 0.001, 0.05);
      this.lastTime = now;
      this.update(dt);
      this.render();
      this.updateStatus();
      this.raf = requestAnimationFrame(this.loop);
    }
  }

  window.KnockVisualizer = KnockVisualizer;
})();
