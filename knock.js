(function () {
  const TWO_PI = Math.PI * 2;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function drawRoundedRect(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.arcTo(x + width, y, x + width, y + r, r);
    ctx.lineTo(x + width, y + height - r);
    ctx.arcTo(x + width, y + height, x + width - r, y + height, r);
    ctx.lineTo(x + r, y + height);
    ctx.arcTo(x, y + height, x, y + height - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
    ctx.fill();
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
      this.leftLevel = 0;
      this.rightLevel = 0;
      this.rings = [];
      this.lastTime = 0;
      this.lastKnock = null;
      this.lastHorizontal = 0;
      this.lastDelta = 0;
      this.lastStatusUpdate = 0;
      this.horizontalBaseline = 0;
      this.lastKnockTime = 0;
      this.lastReadingTime = 0;
      this.knockThreshold = 6;
      this.maxImpulse = 32;
      this.decayRate = 1.6;
      this.vibrationSupported = typeof navigator !== 'undefined' &&
        (typeof navigator.vibrate === 'function' || typeof navigator.webkitVibrate === 'function');
      this.handleResize = this.handleResize.bind(this);
      this.loop = this.loop.bind(this);
      this.handleMotion = this.handleMotion.bind(this);
      this.handlePointerDown = this.handlePointerDown.bind(this);
      this.handlePointerUp = this.handlePointerUp.bind(this);
    }

    start() {
      if (this.running) return;
      this.running = true;
      this.canvas.style.touchAction = 'manipulation';
      this.canvas.style.userSelect = 'none';
      this.resize();
      window.addEventListener('resize', this.handleResize);
      this.canvas.addEventListener('pointerdown', this.handlePointerDown);
      this.canvas.addEventListener('pointerup', this.handlePointerUp);
      this.canvas.addEventListener('pointercancel', this.handlePointerUp);
      this.updateStatus();
      this.lastTime = performance.now();
      this.raf = requestAnimationFrame(this.loop);
    }

    stop() {
      if (!this.running) return;
      this.running = false;
      cancelAnimationFrame(this.raf);
      window.removeEventListener('resize', this.handleResize);
      this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
      this.canvas.removeEventListener('pointerup', this.handlePointerUp);
      this.canvas.removeEventListener('pointercancel', this.handlePointerUp);
      if (this.motionListening) {
        window.removeEventListener('devicemotion', this.handleMotion, true);
        this.motionListening = false;
      }
      this.motionAllowed = false;
      this.motionRequesting = false;
      this.updateStatus('Motion monitoring paused.');
    }

    handleResize() {
      this.resize();
    }

    resize() {
      const rect = this.canvas.getBoundingClientRect();
      this.logicalWidth = rect.width || this.canvas.width || 420;
      this.logicalHeight = rect.height || this.canvas.height || 680;
      const dpr = window.devicePixelRatio || 1;
      this.canvas.width = Math.round(this.logicalWidth * dpr);
      this.canvas.height = Math.round(this.logicalHeight * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    async requestMotionPermission() {
      if (this.motionAllowed || this.motionRequesting) return;
      if (typeof DeviceMotionEvent === 'undefined') {
        this.updateStatus('Motion sensors are not available on this device.');
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
        window.addEventListener('devicemotion', this.handleMotion, true);
        this.motionListening = true;
        this.horizontalBaseline = 0;
      }
      this.updateStatus();
    }

    handlePointerDown(e) {
      try { this.canvas.setPointerCapture(e.pointerId); } catch (_) {}
      if (!this.motionAllowed) {
        this.requestMotionPermission();
      }
      const { x } = this.getLocalCoords(e);
      const side = x < this.logicalWidth / 2 ? 'left' : 'right';
      this.triggerKnock(side, 0.35);
    }

    handlePointerUp(e) {
      try { this.canvas.releasePointerCapture(e.pointerId); } catch (_) {}
    }

    getLocalCoords(e) {
      const rect = this.canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * this.logicalWidth;
      const y = ((e.clientY - rect.top) / rect.height) * this.logicalHeight;
      return { x, y };
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

    projectHorizontal(acc) {
      const ax = acc.x || 0;
      const ay = acc.y || 0;
      const angle = ((this.getOrientationAngle() % 360) + 360) % 360;
      if (angle === 90) return ay;
      if (angle === 270) return -ay;
      if (angle === 180) return -ax;
      return ax;
    }

    handleMotion(event) {
      if (!this.running) return;
      const acc = event.accelerationIncludingGravity || event.acceleration;
      if (!acc) return;
      const horizontal = this.projectHorizontal(acc);
      if (!Number.isFinite(this.horizontalBaseline)) {
        this.horizontalBaseline = horizontal;
      }
      this.horizontalBaseline = this.horizontalBaseline * 0.92 + horizontal * 0.08;
      const delta = horizontal - this.horizontalBaseline;
      const magnitude = Math.abs(delta);
      const now = performance.now();
      this.lastHorizontal = horizontal;
      this.lastDelta = delta;
      this.lastReadingTime = now;
      if (magnitude > this.knockThreshold && now - this.lastKnockTime > 60) {
        const side = delta > 0 ? 'right' : 'left';
        const excess = magnitude - this.knockThreshold;
        const normalized = clamp(excess / this.maxImpulse, 0, 1);
        this.triggerKnock(side, normalized);
        this.lastKnockTime = now;
      }
    }

    triggerKnock(side, level) {
      if (!this.running) return;
      const clampedLevel = clamp(level, 0.05, 1);
      if (side === 'left') {
        this.leftLevel = Math.max(this.leftLevel, clampedLevel);
      } else {
        this.rightLevel = Math.max(this.rightLevel, clampedLevel);
      }
      const centerOffset = this.logicalWidth * 0.2;
      this.rings.push({
        side,
        radius: this.logicalWidth * 0.1,
        strength: clampedLevel,
        life: 1,
        centerX: side === 'left' ? centerOffset : this.logicalWidth - centerOffset
      });
      this.lastKnock = {
        side,
        level: clampedLevel,
        timestamp: performance.now()
      };
      this.updateStatus();
      this.vibrate(clampedLevel);
    }

    vibrate(level) {
      if (!this.vibrationSupported) return;
      const tap = Math.round(12 + level * 70);
      const hold = Math.round(24 + level * 120);
      const pattern = [0, tap, 14, hold];
      try {
        if (typeof navigator.vibrate === 'function') {
          navigator.vibrate(pattern);
        } else if (typeof navigator.webkitVibrate === 'function') {
          navigator.webkitVibrate(pattern);
        }
      } catch (_) {}
    }

    updateStatus(explicitText) {
      if (!this.statusEl) return;
      if (explicitText) {
        this.statusEl.textContent = explicitText;
        return;
      }
      if (!this.motionAllowed) {
        this.statusEl.textContent = 'Tap the panel, allow motion access, then knock left or right. Strong hits fire the virtual solenoid with heavier vibration.';
        return;
      }
      const delta = Math.round(this.lastDelta * 10) / 10;
      const magnitude = Math.round(Math.abs(this.lastDelta) * 10) / 10;
      if (this.lastKnock && performance.now() - this.lastKnock.timestamp < 3000) {
        const side = this.lastKnock.side.toUpperCase();
        const percent = Math.round(this.lastKnock.level * 100);
        this.statusEl.textContent = `Motion streaming • Last knock: ${side} ${percent}% • Horizontal Δ ${delta} m/s²`;
      } else if (this.lastReadingTime && performance.now() - this.lastReadingTime < 1500) {
        this.statusEl.textContent = `Motion streaming • Horizontal Δ ${delta} m/s² (|Δ| ${magnitude})`;
      } else {
        this.statusEl.textContent = 'Motion streaming • Waiting for knocks…';
      }
    }

    update(dt) {
      const decay = this.decayRate * dt;
      this.leftLevel = Math.max(0, this.leftLevel - decay);
      this.rightLevel = Math.max(0, this.rightLevel - decay);
      for (const ring of this.rings) {
        ring.radius += dt * this.logicalWidth * 1.4 * (0.7 + ring.strength);
        ring.life -= dt * 1.1;
      }
      this.rings = this.rings.filter(r => r.life > 0);
      const now = performance.now();
      if (now - this.lastStatusUpdate > 250) {
        this.updateStatus();
        this.lastStatusUpdate = now;
      }
    }

    draw() {
      const ctx = this.ctx;
      const w = this.logicalWidth;
      const h = this.logicalHeight;
      ctx.clearRect(0, 0, w, h);
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, '#04060e');
      bg.addColorStop(1, '#020308');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      const mid = w / 2;
      const pad = Math.min(48, w * 0.12);
      const radius = Math.max(18, w * 0.04);
      const barWidth = mid - pad * 1.4;
      const leftIntensity = Math.pow(this.leftLevel, 0.75);
      const rightIntensity = Math.pow(this.rightLevel, 0.75);

      // Left glow
      const leftGradient = ctx.createLinearGradient(0, h / 2, mid, h / 2);
      leftGradient.addColorStop(0, `rgba(90, 170, 255, ${0.25 + leftIntensity * 0.55})`);
      leftGradient.addColorStop(1, 'rgba(90, 170, 255, 0)');
      ctx.fillStyle = leftGradient;
      ctx.fillRect(0, pad * 0.5, mid, h - pad);

      // Right glow
      const rightGradient = ctx.createLinearGradient(w, h / 2, mid, h / 2);
      rightGradient.addColorStop(0, `rgba(255, 160, 96, ${0.25 + rightIntensity * 0.55})`);
      rightGradient.addColorStop(1, 'rgba(255, 160, 96, 0)');
      ctx.fillStyle = rightGradient;
      ctx.fillRect(mid, pad * 0.5, mid, h - pad);

      // Pulsing rings
      ctx.lineCap = 'round';
      for (const ring of this.rings) {
        const alpha = clamp(ring.life, 0, 1) * (0.35 + ring.strength * 0.45);
        const color = ring.side === 'left'
          ? `rgba(140, 200, 255, ${alpha})`
          : `rgba(255, 180, 120, ${alpha})`;
        ctx.save();
        if (ring.side === 'left') {
          ctx.beginPath();
          ctx.rect(0, 0, mid, h);
          ctx.clip();
        } else {
          ctx.beginPath();
          ctx.rect(mid, 0, mid, h);
          ctx.clip();
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = Math.max(6, ring.strength * 24);
        ctx.beginPath();
        ctx.arc(ring.centerX, h / 2, ring.radius, 0, TWO_PI);
        ctx.stroke();
        ctx.restore();
      }

      // Left bar
      ctx.fillStyle = `rgba(120, 190, 255, ${0.35 + leftIntensity * 0.45})`;
      drawRoundedRect(ctx, mid - barWidth - pad, pad, barWidth * leftIntensity + pad * 0.6, h - pad * 2, radius);

      // Right bar
      ctx.fillStyle = `rgba(255, 170, 120, ${0.35 + rightIntensity * 0.45})`;
      drawRoundedRect(ctx, mid + pad - pad * 0.6, pad, barWidth * rightIntensity + pad * 0.6, h - pad * 2, radius);

      // Center divider
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(mid, pad * 0.7);
      ctx.lineTo(mid, h - pad * 0.7);
      ctx.stroke();

      // Gauge
      const gaugeWidth = Math.max(120, w * 0.4);
      const gaugeHeight = Math.max(12, h * 0.025);
      const gaugeX = mid - gaugeWidth / 2;
      const gaugeY = h / 2 - gaugeHeight / 2;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      drawRoundedRect(ctx, gaugeX, gaugeY, gaugeWidth, gaugeHeight, gaugeHeight / 2);
      const normalized = clamp(this.lastDelta / this.maxImpulse, -1, 1);
      if (Math.abs(normalized) > 0.02) {
        const fillWidth = (gaugeWidth / 2) * Math.abs(normalized);
        const fillX = normalized >= 0 ? mid : mid - fillWidth;
        ctx.fillStyle = normalized >= 0
          ? `rgba(255, 160, 96, ${0.6 + 0.4 * Math.abs(normalized)})`
          : `rgba(120, 190, 255, ${0.6 + 0.4 * Math.abs(normalized)})`;
        drawRoundedRect(ctx, fillX, gaugeY, fillWidth, gaugeHeight, gaugeHeight / 2);
      }

      // Labels
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.font = `${Math.round(Math.max(20, w * 0.06))}px "Doto", sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('Knock Monitor', mid, pad + Math.max(24, w * 0.08));

      ctx.font = `${Math.round(Math.max(16, w * 0.04))}px "Doto", sans-serif`;
      ctx.fillStyle = 'rgba(160, 200, 255, 0.85)';
      ctx.textAlign = 'left';
      ctx.fillText('Left hull', pad * 0.6, h - pad * 0.6);
      ctx.textAlign = 'right';
      ctx.fillStyle = 'rgba(255, 190, 150, 0.85)';
      ctx.fillText('Right hull', w - pad * 0.6, h - pad * 0.6);
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

  window.KnockVisualizer = KnockVisualizer;
})();
