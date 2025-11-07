import { createSensorManager } from './sensors.js';

const THREE = window.THREE;

if (!THREE) {
  throw new Error('Three.js is required for the labyrinth experience.');
}

const DEG = 180 / Math.PI;

const DEFAULTS = {
  boardPadding: 36,
  gravityStrength: 1450,
  velocityDamping: 2.1,
  tiltResponse: 16,
  manualReturn: 1.6,
  pointerSensitivity: 0.014,
  elasticity: 0.78,
  wallFriction: 0.18
};

export class LabyrinthGame {
  constructor(canvas, statusEl, options = {}) {
    this.canvas = canvas;
    this.statusEl = statusEl;
    this.ctx = canvas.getContext('2d');
    if (!this.ctx) {
      throw new Error('2D canvas context unavailable.');
    }

    this.settings = { ...DEFAULTS, ...options };

    this.sensorManager = createSensorManager(THREE, { allowRoll: true, minAcceleration: 0.05 });
    this.orientationQuaternion = new THREE.Quaternion();
    this.inverseQuaternion = new THREE.Quaternion();
    this.worldGravity = new THREE.Vector3(0, 0, -1);
    this.localGravity = new THREE.Vector3();

    this.tiltTarget = new THREE.Vector2();
    this.tiltSmooth = new THREE.Vector2();
    this.manualTilt = new THREE.Vector2();

    this.resetOrientationState();

    this.ballPosition = new THREE.Vector2();
    this.ballVelocity = new THREE.Vector2();
    this.ballRadius = 18;

    this.boardRect = { x: 0, y: 0, width: canvas.width, height: canvas.height };

    this.lastTimestamp = 0;
    this.lastStatusTimestamp = 0;
    this.running = false;
    this.statusMessage = '';
    this.pointerActive = false;
    this.pointerLast = { x: 0, y: 0 };

    this.removeOrientationListener = this.sensorManager.onOrientation(this.handleOrientation.bind(this));

    this.boundResize = this.resize.bind(this);
    this.boundAnimate = this.animate.bind(this);
    this.boundPointerDown = this.handlePointerDown.bind(this);
    this.boundPointerMove = this.handlePointerMove.bind(this);
    this.boundPointerUp = this.handlePointerUp.bind(this);
    this.boundKeyDown = this.handleKeyDown.bind(this);
    this.boundKeyUp = this.handleKeyUp.bind(this);

    this.activeKeys = new Set();

    this.resize();
    this.resetBall();
    this.render();
    this.updateStatus('Dotknij planszy lub przechyl urządzenie, by przejąć kontrolę nad kulką. Gdy obraz wydaje się przekrzywiony, skorzystaj z „Kalibruj orientację”.');
  }

  resetOrientationState() {
    this.orientationQuaternion.identity();
    this.inverseQuaternion.identity();
    this.manualTilt.set(0, 0);
    this.tiltTarget.set(0, 0);
    this.tiltSmooth.set(0, 0);
  }

  calibrateOrientation() {
    this.sensorManager.reset();
    this.sensorManager.requestPermissions().catch(() => {});
    this.resetOrientationState();
    this.updateStatus('Orientacja wyzerowana. Trzymaj urządzenie nieruchomo przez chwilę.');
  }

  dispose() {
    if (this.removeOrientationListener) {
      this.removeOrientationListener();
      this.removeOrientationListener = null;
    }
  }

  handleOrientation() {
    const state = this.sensorManager.getState();
    if (!state.hasOrientation) {
      return;
    }

    const relative = this.sensorManager.deviceQuaternion;
    if (relative) {
      this.orientationQuaternion.copy(relative);
    }
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.sensorManager.reset();
    this.resetOrientationState();
    this.sensorManager.start();
    this.sensorManager.requestPermissions().catch(() => {});
    this.resetBall();
    this.lastTimestamp = performance.now();
    window.addEventListener('resize', this.boundResize);
    window.addEventListener('orientationchange', this.boundResize);
    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keyup', this.boundKeyUp);
    this.canvas.addEventListener('pointerdown', this.boundPointerDown);
    this.canvas.addEventListener('pointermove', this.boundPointerMove);
    this.canvas.addEventListener('pointerup', this.boundPointerUp);
    this.canvas.addEventListener('pointercancel', this.boundPointerUp);
    this.animationFrame = requestAnimationFrame(this.boundAnimate);
    this.updateStatus();
  }

  stop() {
    if (!this.running) return;
    this.running = false;
    cancelAnimationFrame(this.animationFrame);
    this.sensorManager.stop();
    window.removeEventListener('resize', this.boundResize);
    window.removeEventListener('orientationchange', this.boundResize);
    window.removeEventListener('keydown', this.boundKeyDown);
    window.removeEventListener('keyup', this.boundKeyUp);
    this.canvas.removeEventListener('pointerdown', this.boundPointerDown);
    this.canvas.removeEventListener('pointermove', this.boundPointerMove);
    this.canvas.removeEventListener('pointerup', this.boundPointerUp);
    this.canvas.removeEventListener('pointercancel', this.boundPointerUp);
    this.pointerActive = false;
    this.activeKeys.clear();
    this.updateStatus('Labirynt wstrzymany.');
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    const width = rect.width || this.canvas.width;
    const height = rect.height || this.canvas.height;

    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);

    const padding = this.settings.boardPadding;
    this.boardRect.x = padding;
    this.boardRect.y = padding;
    this.boardRect.width = Math.max(40, width - padding * 2);
    this.boardRect.height = Math.max(40, height - padding * 2);

    const diameter = Math.min(this.boardRect.width, this.boardRect.height) / 10;
    this.ballRadius = THREE.MathUtils.clamp(diameter, 12, 28);
    this.ballMinX = this.ballRadius;
    this.ballMaxX = this.boardRect.width - this.ballRadius;
    this.ballMinY = this.ballRadius;
    this.ballMaxY = this.boardRect.height - this.ballRadius;

    if (!this.running) {
      this.render();
    }
  }

  resetBall() {
    this.ballPosition.set(
      this.boardRect.width / 2,
      this.boardRect.height / 2
    );
    this.ballVelocity.set(0, 0);
  }

  handlePointerDown(event) {
    if (!event.isPrimary) return;
    this.pointerActive = true;
    this.pointerLast.x = event.clientX;
    this.pointerLast.y = event.clientY;
    try { this.canvas.setPointerCapture(event.pointerId); } catch (err) { void err; }
    this.sensorManager.requestPermissions().catch(() => {});
  }

  handlePointerMove(event) {
    if (!this.pointerActive || !event.isPrimary) return;
    const dx = event.clientX - this.pointerLast.x;
    const dy = event.clientY - this.pointerLast.y;
    this.pointerLast.x = event.clientX;
    this.pointerLast.y = event.clientY;
    this.manualTilt.x = THREE.MathUtils.clamp(this.manualTilt.x + dx * this.settings.pointerSensitivity, -1.1, 1.1);
    this.manualTilt.y = THREE.MathUtils.clamp(this.manualTilt.y + dy * this.settings.pointerSensitivity, -1.1, 1.1);
  }

  handlePointerUp(event) {
    if (!event.isPrimary) return;
    this.pointerActive = false;
    try { this.canvas.releasePointerCapture(event.pointerId); } catch (err) { void err; }
  }

  handleKeyDown(event) {
    const key = event.key.toLowerCase();
    if (key === 'c') {
      this.calibrateOrientation();
      event.preventDefault();
      return;
    }
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(key)) {
      this.activeKeys.add(key);
      event.preventDefault();
    }
  }

  handleKeyUp(event) {
    const key = event.key.toLowerCase();
    if (this.activeKeys.has(key)) {
      this.activeKeys.delete(key);
      event.preventDefault();
    }
  }

  updateManualTilt(dt) {
    if (this.activeKeys.size) {
      const accel = dt * 2.2;
      if (this.activeKeys.has('arrowleft') || this.activeKeys.has('a')) {
        this.manualTilt.x = THREE.MathUtils.clamp(this.manualTilt.x - accel, -1.2, 1.2);
      }
      if (this.activeKeys.has('arrowright') || this.activeKeys.has('d')) {
        this.manualTilt.x = THREE.MathUtils.clamp(this.manualTilt.x + accel, -1.2, 1.2);
      }
      if (this.activeKeys.has('arrowup') || this.activeKeys.has('w')) {
        this.manualTilt.y = THREE.MathUtils.clamp(this.manualTilt.y - accel, -1.2, 1.2);
      }
      if (this.activeKeys.has('arrowdown') || this.activeKeys.has('s')) {
        this.manualTilt.y = THREE.MathUtils.clamp(this.manualTilt.y + accel, -1.2, 1.2);
      }
    } else if (!this.pointerActive) {
      const decay = Math.exp(-this.settings.manualReturn * dt);
      this.manualTilt.multiplyScalar(decay);
      if (this.manualTilt.lengthSq() < 1e-4) {
        this.manualTilt.set(0, 0);
      }
    }
  }

  computeTilt(dt) {
    const state = this.sensorManager.getState();
    let targetX = 0;
    let targetY = 0;

    if (state.hasOrientation) {
      this.inverseQuaternion.copy(this.orientationQuaternion).invert();
      this.localGravity.copy(this.worldGravity).applyQuaternion(this.inverseQuaternion);
      targetX = THREE.MathUtils.clamp(this.localGravity.x, -1.2, 1.2);
      const rawY = -this.localGravity.y;
      targetY = THREE.MathUtils.clamp(rawY, -1.2, 1.2);
    } else {
      targetX = this.manualTilt.x;
      targetY = this.manualTilt.y;
    }

    this.tiltTarget.set(targetX, targetY);
    const factor = 1 - Math.exp(-this.settings.tiltResponse * dt);
    this.tiltSmooth.lerp(this.tiltTarget, factor);
  }

  stepPhysics(dt) {
    this.updateManualTilt(dt);
    this.computeTilt(dt);

    const tilt = this.tiltSmooth;
    const accelX = tilt.x * this.settings.gravityStrength;
    const accelY = tilt.y * this.settings.gravityStrength;

    this.ballVelocity.x += accelX * dt;
    this.ballVelocity.y += accelY * dt;

    const damping = Math.exp(-this.settings.velocityDamping * dt);
    this.ballVelocity.multiplyScalar(damping);

    if (this.ballVelocity.lengthSq() < 0.0001) {
      this.ballVelocity.set(0, 0);
    }

    this.ballPosition.addScaledVector(this.ballVelocity, dt);

    let bounced = false;
    if (this.ballPosition.x < this.ballMinX) {
      this.ballPosition.x = this.ballMinX;
      if (this.ballVelocity.x < 0) {
        this.ballVelocity.x = -this.ballVelocity.x * this.settings.elasticity;
        this.ballVelocity.y *= (1 - this.settings.wallFriction);
        bounced = true;
      }
    } else if (this.ballPosition.x > this.ballMaxX) {
      this.ballPosition.x = this.ballMaxX;
      if (this.ballVelocity.x > 0) {
        this.ballVelocity.x = -this.ballVelocity.x * this.settings.elasticity;
        this.ballVelocity.y *= (1 - this.settings.wallFriction);
        bounced = true;
      }
    }

    if (this.ballPosition.y < this.ballMinY) {
      this.ballPosition.y = this.ballMinY;
      if (this.ballVelocity.y < 0) {
        this.ballVelocity.y = -this.ballVelocity.y * this.settings.elasticity;
        this.ballVelocity.x *= (1 - this.settings.wallFriction);
        bounced = true;
      }
    } else if (this.ballPosition.y > this.ballMaxY) {
      this.ballPosition.y = this.ballMaxY;
      if (this.ballVelocity.y > 0) {
        this.ballVelocity.y = -this.ballVelocity.y * this.settings.elasticity;
        this.ballVelocity.x *= (1 - this.settings.wallFriction);
        bounced = true;
      }
    }

    if (bounced) {
      const normalImpulse = this.ballVelocity.length();
      if (normalImpulse < 10) {
        this.ballVelocity.multiplyScalar(0);
      }
    }
  }

  drawRoundedRect(ctx, x, y, width, height, radius) {
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(x, y, width, height, radius);
      return;
    }
    const r = Math.min(radius, width / 2, height / 2);
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  animate() {
    if (!this.running) return;
    const now = performance.now();
    const dt = Math.min(0.05, (now - this.lastTimestamp) / 1000 || 0.016);
    this.lastTimestamp = now;

    this.stepPhysics(dt);
    this.render();
    this.updateStatus();

    this.animationFrame = requestAnimationFrame(this.boundAnimate);
  }

  render() {
    const ctx = this.ctx;
    const width = this.canvas.width / (window.devicePixelRatio || 1);
    const height = this.canvas.height / (window.devicePixelRatio || 1);
    ctx.clearRect(0, 0, width, height);

    const boardX = this.boardRect.x;
    const boardY = this.boardRect.y;
    const boardW = this.boardRect.width;
    const boardH = this.boardRect.height;

    const tilt = this.tiltSmooth;
    const shadeOffsetX = THREE.MathUtils.clamp(tilt.x, -1, 1) * 120;
    const shadeOffsetY = THREE.MathUtils.clamp(tilt.y, -1, 1) * 140;

    const gradient = ctx.createLinearGradient(
      boardX - shadeOffsetX,
      boardY - shadeOffsetY,
      boardX + boardW + shadeOffsetX,
      boardY + boardH + shadeOffsetY
    );
    gradient.addColorStop(0, '#1b1f28');
    gradient.addColorStop(0.5, '#10141c');
    gradient.addColorStop(1, '#06070a');

    ctx.save();
    ctx.beginPath();
    this.drawRoundedRect(ctx, boardX, boardY, boardW, boardH, 24);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.stroke();

    const highlight = ctx.createLinearGradient(
      boardX,
      boardY,
      boardX + boardW,
      boardY + boardH
    );
    highlight.addColorStop(0, 'rgba(255,255,255,0.08)');
    highlight.addColorStop(0.5, 'rgba(255,255,255,0.02)');
    highlight.addColorStop(1, 'rgba(255,255,255,0.05)');
    ctx.fillStyle = highlight;
    ctx.fill();
    ctx.restore();

    const ballX = boardX + this.ballPosition.x;
    const ballY = boardY + this.ballPosition.y;

    const ballGradient = ctx.createRadialGradient(
      ballX - tilt.x * this.ballRadius * 0.6,
      ballY - tilt.y * this.ballRadius * 0.6,
      this.ballRadius * 0.4,
      ballX,
      ballY,
      this.ballRadius * 1.2
    );
    ballGradient.addColorStop(0, '#f5f7ff');
    ballGradient.addColorStop(0.2, '#d7def5');
    ballGradient.addColorStop(0.75, '#7a88c4');
    ballGradient.addColorStop(1, '#2c3158');

    ctx.beginPath();
    ctx.arc(ballX, ballY, this.ballRadius, 0, Math.PI * 2);
    ctx.fillStyle = ballGradient;
    ctx.fill();

    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(ballX - tilt.x * this.ballRadius * 0.4, ballY - tilt.y * this.ballRadius * 0.4, this.ballRadius * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fill();
  }

  updateStatus(extra) {
    const now = performance.now();
    if (!extra && now - this.lastStatusTimestamp < 200) {
      return;
    }
    this.lastStatusTimestamp = now;

    const state = this.sensorManager.getState();
    const speed = this.ballVelocity.length();
    const tiltX = THREE.MathUtils.clamp(this.tiltSmooth.x, -1, 1);
    const tiltY = THREE.MathUtils.clamp(this.tiltSmooth.y, -1, 1);
    const degX = Math.asin(tiltX) * DEG;
    const degY = Math.asin(tiltY) * DEG;

    const parts = [
      `Nachylenie X ${degX.toFixed(0)}° / Y ${degY.toFixed(0)}°`,
      `Prędkość ${speed.toFixed(0)} px/s`
    ];

    if (state.hasOrientation) {
      parts.push('Sterowanie żyroskopem');
    } else if (state.permissionState === 'prompt') {
      parts.push('Dotknij planszy, by udzielić dostępu do czujników.');
    } else if (state.permissionState === 'denied') {
      parts.push('Sterowanie dotykiem lub klawiaturą (brak dostępu do czujników).');
    } else {
      parts.push('Sterowanie dotykiem lub klawiaturą');
    }

    if (state.orientationAllowed && state.permissionState !== 'denied') {
      parts.push('Przycisk „Kalibruj” zeruje orientację.');
    }

    if (extra) {
      parts.push(extra);
    }

    const message = parts.join(' • ');
    if (message !== this.statusMessage) {
      this.statusEl.textContent = message;
      this.statusMessage = message;
    }
  }
}

if (typeof window !== 'undefined') {
  window.LabyrinthGame = LabyrinthGame;
}

export default LabyrinthGame;
