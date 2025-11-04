(function () {
  class PinballGame {
    constructor(canvas, statusEl) {
      this.canvas = canvas;
      this.statusEl = statusEl;
      this.ctx = canvas.getContext('2d');
      this.running = false;
      this.motionAllowed = false;
      this.motionRequesting = false;
      this.motionListening = false;
      this.lastTime = 0;
      this.ball = null;
      this.score = 0;
      this.hadFirstBall = false;
      this.knockThreshold = 11;
      this.lastKnockTime = 0;
      this.lastLaunchTime = 0;
      this.plungerArmed = false;
      this.pointerPress = null;
      this.instruction = '';
      this.bumpers = [];
      this.flippers = {};
      this.board = null;
      this.gravity = 900;
      this.logicalWidth = canvas.width;
      this.logicalHeight = canvas.height;
      this.handleResize = this.handleResize.bind(this);
      this.loop = this.loop.bind(this);
      this.handleMotion = this.handleMotion.bind(this);
      this.handlePointerDown = this.handlePointerDown.bind(this);
      this.handlePointerMove = this.handlePointerMove.bind(this);
      this.handlePointerUp = this.handlePointerUp.bind(this);
      this.handleKeyDown = this.handleKeyDown.bind(this);
      this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    }

    start() {
      if (this.running) return;
      this.running = true;
      this.score = 0;
      this.hadFirstBall = false;
      this.canvas.style.touchAction = 'none';
      this.canvas.style.userSelect = 'none';
      this.resize();
      this.instruction = 'Tap "Allow" to enable motion knocks, then press firmly to launch the ball.';
      this.refreshStatus();
      window.addEventListener('resize', this.handleResize);
      window.addEventListener('keydown', this.handleKeyDown);
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
      this.canvas.addEventListener('pointerdown', this.handlePointerDown);
      this.canvas.addEventListener('pointermove', this.handlePointerMove);
      this.canvas.addEventListener('pointerup', this.handlePointerUp);
      this.canvas.addEventListener('pointercancel', this.handlePointerUp);
      this.lastTime = performance.now();
      this.resetBall(true);
      this.requestMotionPermission();
      this.raf = requestAnimationFrame(this.loop);
    }

    stop() {
      if (!this.running) return;
      this.running = false;
      cancelAnimationFrame(this.raf);
      window.removeEventListener('resize', this.handleResize);
      window.removeEventListener('keydown', this.handleKeyDown);
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
      this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
      this.canvas.removeEventListener('pointermove', this.handlePointerMove);
      this.canvas.removeEventListener('pointerup', this.handlePointerUp);
      this.canvas.removeEventListener('pointercancel', this.handlePointerUp);
      if (this.motionListening) {
        window.removeEventListener('devicemotion', this.handleMotion, true);
        this.motionListening = false;
      }
      this.pointerPress = null;
    }

    handleVisibilityChange() {
      if (document.hidden && this.motionListening) {
        window.removeEventListener('devicemotion', this.handleMotion, true);
        this.motionListening = false;
      } else if (!document.hidden && this.motionAllowed && !this.motionListening) {
        window.addEventListener('devicemotion', this.handleMotion, true);
        this.motionListening = true;
      }
    }

    handleResize() {
      this.resize();
      if (this.ball && this.ball.stuck) {
        this.resetBall(true);
      }
    }

    resize() {
      const rect = this.canvas.getBoundingClientRect();
      this.logicalWidth = rect.width || this.canvas.width || 420;
      this.logicalHeight = rect.height || this.canvas.height || 680;
      const dpr = window.devicePixelRatio || 1;
      this.canvas.width = Math.round(this.logicalWidth * dpr);
      this.canvas.height = Math.round(this.logicalHeight * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const padding = Math.max(22, this.logicalWidth * 0.05);
      const laneWidth = Math.max(58, this.logicalWidth * 0.14);
      this.board = {
        left: padding,
        right: this.logicalWidth - padding,
        top: padding,
        bottom: this.logicalHeight - padding,
        laneWidth
      };
      this.board.innerRight = this.board.right - laneWidth;
      this.board.flipperY = this.board.bottom - Math.max(70, this.logicalWidth * 0.14);
      this.board.flipperLength = Math.max(90, this.logicalWidth * 0.34);
      this.board.flipperGap = Math.max(40, this.logicalWidth * 0.12);
      this.ballRadius = Math.max(8, this.logicalWidth * 0.03);
      this.initBumpers();
      this.initFlippers();
    }

    initBumpers() {
      const span = this.board.innerRight - this.board.left;
      const centerX = (this.board.left + this.board.innerRight) / 2;
      const spread = Math.max(60, span * 0.26);
      const baseY = this.board.top + Math.max(120, this.logicalHeight * 0.18);
      const radius = Math.max(18, this.logicalWidth * 0.045);
      this.bumpers = [
        { x: centerX - spread, y: baseY, radius, pulse: 0 },
        { x: centerX, y: baseY + Math.max(80, this.logicalHeight * 0.12), radius: radius + 6, pulse: 0 },
        { x: centerX + spread, y: baseY, radius, pulse: 0 }
      ];
    }

    initFlippers() {
      const span = this.board.innerRight - this.board.left;
      const pivotOffset = Math.max(70, span * 0.28);
      this.flippers = {
        left: {
          side: 'left',
          pivotX: this.board.left + pivotOffset,
          pivotY: this.board.flipperY,
          length: this.board.flipperLength,
          restAngle: -0.75,
          activeAngle: 0.45,
          progress: 0,
          engaged: false,
          lastTrigger: 0
        },
        right: {
          side: 'right',
          pivotX: this.board.innerRight - pivotOffset,
          pivotY: this.board.flipperY,
          length: this.board.flipperLength,
          restAngle: -0.75,
          activeAngle: 0.45,
          progress: 0,
          engaged: false,
          lastTrigger: 0
        }
      };
    }

    resetBall(initial = false) {
      this.ball = {
        x: this.board.innerRight + this.board.laneWidth * 0.5,
        y: this.board.bottom - 40,
        vx: 0,
        vy: 0,
        radius: this.ballRadius,
        stuck: true
      };
      if (!initial) {
        this.instruction = `Ball ready. ${this.getLaunchInstruction()}`;
        this.refreshStatus();
      }
    }

    getLaunchInstruction() {
      const launch = 'Press firmly on the plunger lane or flick the phone down then up to launch.';
      const flips = this.motionAllowed
        ? 'Knock the left or right side to fire the flippers.'
        : 'Tap near the left/right flippers to flip.';
      return `${launch} ${flips}`;
    }

    launchBall(force = 1) {
      if (!this.ball || !this.ball.stuck) return;
      const now = performance.now();
      if (now - this.lastLaunchTime < 500) return;
      const clamped = Math.min(1.8, Math.max(0.5, force));
      this.ball.stuck = false;
      this.ball.vx = -140 * clamped;
      this.ball.vy = -520 * clamped;
      this.lastLaunchTime = now;
      this.hadFirstBall = true;
      this.instruction = 'Ball in play! Aim for the bumpers and keep it alive.';
      this.refreshStatus();
      this.vibrate(35);
    }

    triggerFlipper(side) {
      if (!this.ball) return;
      const flipper = this.flippers[side];
      if (!flipper) return;
      const now = performance.now();
      if (now - flipper.lastTrigger < 140) return;
      flipper.lastTrigger = now;
      flipper.engaged = true;
      flipper.progress = Math.min(1, flipper.progress + 0.35);
      this.applyFlipperForce(flipper);
      this.vibrate(25);
      if (this.motionAllowed) {
        this.instruction = 'Nice knock! Aim for the glowing bumpers.';
        this.refreshStatus();
      }
    }

    applyFlipperForce(flipper) {
      if (!this.ball || this.ball.stuck) return;
      const dx = this.ball.x - flipper.pivotX;
      const dy = this.ball.y - flipper.pivotY;
      if (dy < -140 || dy > 80) return;
      const reach = flipper.length + this.ball.radius + 20;
      if (Math.abs(dx) > reach) return;
      if (this.ball.y < flipper.pivotY - 80) return;
      const direction = flipper.side === 'left' ? 1 : -1;
      this.ball.vx += direction * 320;
      this.ball.vy = Math.min(this.ball.vy, 0) - 520;
      this.score += 35;
      this.refreshStatus();
    }

    handlePointerDown(e) {
      if (!this.running) return;
      this.canvas.setPointerCapture(e.pointerId);
      const pos = this.getLocalCoords(e);
      if (pos.y > this.board.flipperY - 60) {
        if (pos.x < (this.board.left + this.board.innerRight) / 2) {
          this.triggerFlipper('left');
        } else if (pos.x < this.board.innerRight + this.board.laneWidth - 10) {
          this.triggerFlipper('right');
        }
      }
      if (pos.x > this.board.innerRight + 6) {
        this.pointerPress = {
          id: e.pointerId,
          start: performance.now(),
          maxPressure: e.pressure || 0,
          minY: pos.y,
          maxY: pos.y
        };
      }
    }

    handlePointerMove(e) {
      if (!this.pointerPress || this.pointerPress.id !== e.pointerId) return;
      const pos = this.getLocalCoords(e);
      this.pointerPress.maxPressure = Math.max(this.pointerPress.maxPressure, e.pressure || 0);
      this.pointerPress.minY = Math.min(this.pointerPress.minY, pos.y);
      this.pointerPress.maxY = Math.max(this.pointerPress.maxY, pos.y);
    }

    handlePointerUp(e) {
      if (this.pointerPress && this.pointerPress.id === e.pointerId) {
        const press = this.pointerPress;
        const travel = Math.abs(press.maxY - press.minY);
        const pressure = Math.max(press.maxPressure, Math.min(travel / 140, 1));
        if (pressure > 0.15) {
          this.launchBall(0.8 + pressure * 0.9);
        }
        this.pointerPress = null;
      }
      try { this.canvas.releasePointerCapture(e.pointerId); } catch (_) {}
    }

    handleKeyDown(e) {
      if (!this.running) return;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        this.triggerFlipper('left');
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        this.triggerFlipper('right');
      } else if ((e.code === 'Space' || e.code === 'ArrowUp') && this.ball && this.ball.stuck) {
        this.launchBall(1.1);
      }
    }

    async requestMotionPermission() {
      if (this.motionRequesting || typeof DeviceMotionEvent === 'undefined') {
        if (typeof DeviceMotionEvent === 'undefined') {
          this.motionAllowed = false;
          this.instruction = `Motion sensors unavailable. ${this.getLaunchInstruction()}`;
          this.refreshStatus();
        }
        return;
      }
      this.motionRequesting = true;
      try {
        if (typeof DeviceMotionEvent.requestPermission === 'function') {
          const res = await DeviceMotionEvent.requestPermission();
          this.motionAllowed = res === 'granted';
        } else {
          this.motionAllowed = true;
        }
      } catch (err) {
        this.motionAllowed = false;
      }
      this.motionRequesting = false;
      if (this.motionAllowed && !this.motionListening) {
        window.addEventListener('devicemotion', this.handleMotion, true);
        this.motionListening = true;
        this.instruction = `Motion controls active! ${this.getLaunchInstruction()}`;
      } else if (!this.motionAllowed) {
        this.instruction = `Motion permission denied. ${this.getLaunchInstruction()}`;
      }
      this.refreshStatus();
    }

    handleMotion(event) {
      if (!this.running) return;
      const acc = event.accelerationIncludingGravity || event.acceleration;
      if (!acc) return;
      const ax = acc.x || 0;
      const ay = acc.y || 0;
      const now = performance.now();
      if (Math.abs(ax) > this.knockThreshold && now - this.lastKnockTime > 220) {
        if (ax > 0) {
          this.triggerFlipper('left');
        } else {
          this.triggerFlipper('right');
        }
        this.lastKnockTime = now;
      }
      if (!this.plungerArmed && ay > 14) {
        this.plungerArmed = true;
      }
      if (this.plungerArmed && ay < -14) {
        this.launchBall(1.2);
        this.plungerArmed = false;
      }
    }

    vibrate(duration = 20) {
      if ('vibrate' in navigator) {
        try { navigator.vibrate(duration); } catch (_) {}
      }
    }

    getLocalCoords(e) {
      const rect = this.canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * this.logicalWidth;
      const y = ((e.clientY - rect.top) / rect.height) * this.logicalHeight;
      return { x, y };
    }

    update(dt) {
      if (!this.ball) return;
      for (const flipper of Object.values(this.flippers)) {
        if (flipper.engaged) {
          flipper.progress = Math.min(1, flipper.progress + dt * 8);
          if (flipper.progress >= 0.98) flipper.engaged = false;
        } else {
          flipper.progress = Math.max(0, flipper.progress - dt * 5);
        }
      }
      for (const bumper of this.bumpers) {
        bumper.pulse = Math.max(0, bumper.pulse - dt * 3.5);
      }
      if (this.ball.stuck) {
        this.ball.x = this.board.innerRight + this.board.laneWidth * 0.5;
        this.ball.y = Math.max(this.board.top + 60, this.board.bottom - 40);
        return;
      }
      this.ball.vy += this.gravity * dt;
      this.ball.x += this.ball.vx * dt;
      this.ball.y += this.ball.vy * dt;
      this.ball.vx *= 0.995;
      this.ball.vy *= 0.995;
      this.resolveCollisions();
      this.resolveBumpers();
      if (this.ball.y - this.ball.radius > this.board.bottom + 80) {
        this.instruction = 'Ball drained! Launch again when ready.';
        this.refreshStatus();
        this.resetBall();
      }
    }

    resolveCollisions() {
      const r = this.ball.radius;
      if (this.ball.x - r < this.board.left) {
        this.ball.x = this.board.left + r;
        this.ball.vx = Math.abs(this.ball.vx) * 0.85;
      }
      const innerRight = this.board.innerRight;
      if (this.ball.x + r > innerRight && this.ball.y > this.board.top + 40 && this.ball.y < this.board.bottom - 60) {
        this.ball.x = innerRight - r;
        this.ball.vx = -Math.abs(this.ball.vx) * 0.8;
      }
      if (this.ball.x + r > this.board.right) {
        this.ball.x = this.board.right - r;
        this.ball.vx = -Math.abs(this.ball.vx) * 0.8;
      }
      if (this.ball.y - r < this.board.top) {
        this.ball.y = this.board.top + r;
        this.ball.vy = Math.abs(this.ball.vy) * 0.9;
      }
      if (this.ball.y + r > this.board.bottom && this.ball.x > this.board.innerRight - 20) {
        this.ball.y = this.board.bottom - r;
        this.ball.vy = -Math.abs(this.ball.vy) * 0.6;
      }
    }

    resolveBumpers() {
      for (const bumper of this.bumpers) {
        const dx = this.ball.x - bumper.x;
        const dy = this.ball.y - bumper.y;
        const dist = Math.hypot(dx, dy);
        const overlap = bumper.radius + this.ball.radius - dist;
        if (overlap > 0) {
          const nx = dx / (dist || 1);
          const ny = dy / (dist || 1);
          this.ball.x += nx * overlap;
          this.ball.y += ny * overlap;
          const dot = this.ball.vx * nx + this.ball.vy * ny;
          this.ball.vx -= 2 * dot * nx;
          this.ball.vy -= 2 * dot * ny;
          this.ball.vx *= 0.9;
          this.ball.vy *= 0.9;
          bumper.pulse = 1;
          this.score += 150;
          this.refreshStatus();
          this.vibrate(18);
        }
      }
    }

    draw() {
      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.logicalWidth, this.logicalHeight);
      ctx.fillStyle = '#050b18';
      ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight);
      this.drawBoard();
      this.drawLane();
      for (const bumper of this.bumpers) {
        this.drawBumper(bumper);
      }
      this.drawFlipper(this.flippers.left);
      this.drawFlipper(this.flippers.right);
      this.drawBall();
    }

    drawBoard() {
      const ctx = this.ctx;
      ctx.strokeStyle = '#5cc9ff';
      ctx.lineWidth = 6;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(this.board.left, this.board.bottom);
      ctx.lineTo(this.board.left, this.board.top);
      ctx.lineTo(this.board.innerRight, this.board.top);
      ctx.lineTo(this.board.innerRight, this.board.bottom);
      ctx.stroke();
      ctx.strokeStyle = '#1f88ff33';
      ctx.beginPath();
      ctx.moveTo(this.board.left, this.board.bottom - 60);
      ctx.lineTo(this.board.innerRight, this.board.bottom - 60);
      ctx.stroke();
    }

    drawLane() {
      const ctx = this.ctx;
      ctx.strokeStyle = '#74ffad';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(this.board.innerRight, this.board.top);
      ctx.lineTo(this.board.right, this.board.top);
      ctx.lineTo(this.board.right, this.board.bottom);
      ctx.stroke();
    }

    drawBumper(bumper) {
      const ctx = this.ctx;
      const pulse = 1 + bumper.pulse * 0.6;
      ctx.fillStyle = bumper.pulse > 0 ? '#ffe066' : '#ff9af0';
      ctx.beginPath();
      ctx.arc(bumper.x, bumper.y, bumper.radius * pulse, 0, Math.PI * 2);
      ctx.fill();
    }

    drawFlipper(flipper) {
      if (!flipper) return;
      const ctx = this.ctx;
      ctx.save();
      ctx.translate(flipper.pivotX, flipper.pivotY);
      ctx.scale(flipper.side === 'left' ? 1 : -1, 1);
      const angle = flipper.restAngle + (flipper.activeAngle - flipper.restAngle) * flipper.progress;
      ctx.rotate(angle);
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#ff7af6';
      ctx.lineWidth = 16;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(flipper.length, 0);
      ctx.stroke();
      ctx.restore();
    }

    drawBall() {
      const ctx = this.ctx;
      ctx.fillStyle = '#f7f0a6';
      ctx.beginPath();
      ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffffaa';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    refreshStatus() {
      if (!this.statusEl) return;
      const scorePart = `Score: ${this.score}`;
      const text = this.instruction ? `${scorePart} • ${this.instruction}` : scorePart;
      this.statusEl.textContent = text;
    }

    loop(timestamp) {
      if (!this.running) return;
      const dt = Math.min(0.05, (timestamp - this.lastTime) / 1000 || 0.016);
      this.lastTime = timestamp;
      this.update(dt);
      this.draw();
      this.raf = requestAnimationFrame(this.loop);
    }
  }

  window.PinballGame = PinballGame;
})();
