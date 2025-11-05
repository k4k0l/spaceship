(function () {
  const DEG2RAD = Math.PI / 180;
  const TAU = Math.PI * 2;
  const G = 9.80665;
  const WORLD_LIMIT = { x: 0.45, y: 0.35, z: 0.75 };
  const LIGHT_DIR = normalize({ x: 0.35, y: 0.8, z: -0.5 });

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function normalize(v) {
    const len = Math.hypot(v.x, v.y, v.z) || 1;
    return { x: v.x / len, y: v.y / len, z: v.z / len };
  }

  function dot(a, b) {
    return a.x * b.x + a.y * b.y + a.z * b.z;
  }

  function multiplyMatrices(a, b) {
    const r = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0]
    ];
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        r[i][j] = a[i][0] * b[0][j] + a[i][1] * b[1][j] + a[i][2] * b[2][j];
      }
    }
    return r;
  }

  function rotationX(angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return [
      [1, 0, 0],
      [0, c, -s],
      [0, s, c]
    ];
  }

  function rotationY(angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return [
      [c, 0, s],
      [0, 1, 0],
      [-s, 0, c]
    ];
  }

  function rotationZ(angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return [
      [c, -s, 0],
      [s, c, 0],
      [0, 0, 1]
    ];
  }

  function transpose(m) {
    return [
      [m[0][0], m[1][0], m[2][0]],
      [m[0][1], m[1][1], m[2][1]],
      [m[0][2], m[1][2], m[2][2]]
    ];
  }

  function applyMatrix(m, v) {
    return {
      x: m[0][0] * v.x + m[0][1] * v.y + m[0][2] * v.z,
      y: m[1][0] * v.x + m[1][1] * v.y + m[1][2] * v.z,
      z: m[2][0] * v.x + m[2][1] * v.y + m[2][2] * v.z
    };
  }

  function hexToRgb(hex) {
    const value = parseInt(hex.slice(1), 16);
    return {
      r: (value >> 16) & 255,
      g: (value >> 8) & 255,
      b: value & 255
    };
  }

  function rgbToHex({ r, g, b }) {
    const toHex = v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  function mixColor(hex, light) {
    const base = hexToRgb(hex);
    return rgbToHex({
      r: base.r * (1 - light) + 255 * light,
      g: base.g * (1 - light) + 255 * light,
      b: base.b * (1 - light) + 255 * light
    });
  }

  function darken(hex, amt) {
    const base = hexToRgb(hex);
    return rgbToHex({
      r: base.r * (1 - amt),
      g: base.g * (1 - amt),
      b: base.b * (1 - amt)
    });
  }

  class PocketRealityPortal {
    constructor(canvas, statusEl) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.statusEl = statusEl;
      this.running = false;
      this.permissionState = 'prompt';
      this.lastFrame = 0;
      this.lastMotionTime = performance.now();
      this.orientationAvailable = false;
      this.motionAvailable = false;
      this.usePointerAim = false;
      this.pointerActive = false;
      this.pointerYaw = 0;
      this.pointerPitch = 0;
      this.keyboard = { forward: 0, back: 0, left: 0, right: 0, up: 0, down: 0 };
      this.rotationMatrix = [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1]
      ];
      this.inverseRotation = transpose(this.rotationMatrix);
      this.forward = { x: 0, y: 0, z: -1 };
      this.right = { x: 1, y: 0, z: 0 };
      this.up = { x: 0, y: 1, z: 0 };

      this.state = {
        position: { x: 0, y: 0, z: 0 },
        velocity: { x: 0, y: 0, z: 0 }
      };

      this.objects = this.createObjects();
      this.referencePoints = this.createReferencePoints();

      this.resize = this.resize.bind(this);
      this.update = this.update.bind(this);
      this.handleOrientation = this.handleOrientation.bind(this);
      this.handleMotion = this.handleMotion.bind(this);
      this.handlePointerDown = this.handlePointerDown.bind(this);
      this.handlePointerMove = this.handlePointerMove.bind(this);
      this.handlePointerUp = this.handlePointerUp.bind(this);
      this.handleWheel = this.handleWheel.bind(this);
      this.handleKeyDown = this.handleKeyDown.bind(this);
      this.handleKeyUp = this.handleKeyUp.bind(this);

      this.resize();
      this.updateStatus('Dotknij panelu, aby aktywować portal.');
    }

    createObjects() {
      return [
        { type: 'sphere', position: { x: 0.28, y: 0.05, z: -0.55 }, radius: 0.12, color: '#f8b05c' },
        { type: 'cube', position: { x: -0.24, y: 0.02, z: -0.42 }, size: 0.20, color: '#6da8ff' },
        { type: 'pyramid', position: { x: 0.02, y: -0.10, z: -0.28 }, size: 0.18, color: '#c675ff' },
        { type: 'pillar', position: { x: -0.05, y: -0.35, z: -0.85 }, height: 0.42, color: '#8ae0d6' },
        { type: 'orb', position: { x: -0.18, y: 0.22, z: -0.65 }, radius: 0.06, color: '#ff6d92' }
      ];
    }

    createReferencePoints() {
      return [
        { position: { x: 0, y: -0.35, z: -0.35 }, label: 'Środek', color: '#ffffff' },
        { position: { x: 0.35, y: -0.35, z: -0.35 }, label: 'Wschód', color: '#8ac6ff' },
        { position: { x: -0.35, y: -0.35, z: -0.35 }, label: 'Zachód', color: '#ffb27f' },
        { position: { x: 0, y: -0.35, z: -0.70 }, label: 'Północ', color: '#b58aff' }
      ];
    }

    updateStatus(extra) {
      const pos = this.state.position;
      const lines = [];
      lines.push(`Pozycja: ${(pos.x * 100).toFixed(0)} cm / ${(pos.y * 100).toFixed(0)} cm / ${(pos.z * 100).toFixed(0)} cm`);
      if (this.permissionState === 'denied') {
        lines.push('Brak dostępu do czujników — korzystaj z myszy i klawiatury.');
      } else if (!this.orientationAvailable) {
        lines.push('Czekam na orientację urządzenia...');
      } else {
        lines.push('Przechyl telefon, by rozglądać się po scenie.');
      }
      if (!this.motionAvailable) {
        lines.push('Delikatnie przesuwaj telefon w powietrzu, by zmieniać pozycję kamery.');
      }
      if (this.usePointerAim) {
        lines.push('Tryb testowy: przeciągaj myszą (LPM), WSAD/Spacja/Shift przesuwają kamerę.');
      }
      if (extra) lines.push(extra);
      this.statusEl.textContent = lines.join(' ');
    }

    async requestSensorAccess() {
      if (this.permissionState === 'granted') return;
      this.permissionState = 'pending';
      try {
        if (window.DeviceMotionEvent && typeof DeviceMotionEvent.requestPermission === 'function') {
          const res = await DeviceMotionEvent.requestPermission();
          if (res !== 'granted') {
            this.permissionState = 'denied';
            this.usePointerAim = true;
            this.updateStatus('Odrzucono dostęp do akcelerometru.');
            return;
          }
        }
        if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function') {
          const res = await DeviceOrientationEvent.requestPermission();
          if (res !== 'granted') {
            this.permissionState = 'denied';
            this.usePointerAim = true;
            this.updateStatus('Odrzucono dostęp do żyroskopu.');
            return;
          }
        }
        this.permissionState = 'granted';
      } catch (err) {
        console.warn('Sensor permission error', err);
        this.permissionState = 'denied';
        this.usePointerAim = true;
      }
      this.updateStatus();
    }

    start() {
      if (this.running) return;
      this.running = true;
      this.resize();
      window.addEventListener('resize', this.resize);
      window.addEventListener('deviceorientation', this.handleOrientation);
      window.addEventListener('devicemotion', this.handleMotion);
      this.canvas.addEventListener('pointerdown', this.handlePointerDown);
      this.canvas.addEventListener('pointermove', this.handlePointerMove);
      this.canvas.addEventListener('pointerup', this.handlePointerUp);
      this.canvas.addEventListener('pointercancel', this.handlePointerUp);
      this.canvas.addEventListener('wheel', this.handleWheel, { passive: false });
      window.addEventListener('keydown', this.handleKeyDown);
      window.addEventListener('keyup', this.handleKeyUp);
      this.lastFrame = performance.now();
      this.raf = requestAnimationFrame(this.update);
    }

    stop() {
      this.running = false;
      cancelAnimationFrame(this.raf);
      window.removeEventListener('resize', this.resize);
      window.removeEventListener('deviceorientation', this.handleOrientation);
      window.removeEventListener('devicemotion', this.handleMotion);
      this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
      this.canvas.removeEventListener('pointermove', this.handlePointerMove);
      this.canvas.removeEventListener('pointerup', this.handlePointerUp);
      this.canvas.removeEventListener('pointercancel', this.handlePointerUp);
      this.canvas.removeEventListener('wheel', this.handleWheel);
      window.removeEventListener('keydown', this.handleKeyDown);
      window.removeEventListener('keyup', this.handleKeyUp);
      this.updateStatus('Portal uśpiony.');
    }

    resize() {
      const rect = this.canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = Math.max(1, rect.width);
      const height = Math.max(1, rect.height);
      this.canvas.width = width * dpr;
      this.canvas.height = height * dpr;
      this.logicalWidth = width;
      this.logicalHeight = height;
      this.pixelRatio = dpr;
      this.fov = 70 * DEG2RAD;
      this.focal = (height / 2) / Math.tan(this.fov / 2);
    }

    handlePointerDown(e) {
      if (e.isPrimary) {
        this.pointerActive = true;
        this.pointerLastX = e.clientX;
        this.pointerLastY = e.clientY;
        this.canvas.setPointerCapture(e.pointerId);
        this.requestSensorAccess();
        if (!this.orientationAvailable) {
          this.usePointerAim = true;
          this.updateRotationFromPointer();
          this.updateStatus();
        }
      }
    }

    handlePointerMove(e) {
      if (!this.pointerActive || !e.isPrimary) return;
      const dx = e.clientX - this.pointerLastX;
      const dy = e.clientY - this.pointerLastY;
      this.pointerLastX = e.clientX;
      this.pointerLastY = e.clientY;
      this.pointerYaw -= dx * 0.004;
      this.pointerPitch -= dy * 0.003;
      this.pointerPitch = clamp(this.pointerPitch, -Math.PI / 2 + 0.05, Math.PI / 2 - 0.05);
      this.usePointerAim = true;
      this.updateRotationFromPointer();
      this.updateStatus();
    }

    handlePointerUp(e) {
      if (e.isPrimary) {
        this.pointerActive = false;
        try { this.canvas.releasePointerCapture(e.pointerId); } catch {}
      }
    }

    handleWheel(e) {
      if (!this.usePointerAim) return;
      e.preventDefault();
      this.state.position.z += e.deltaY * 0.0005;
      this.clampPosition();
      this.updateStatus();
    }

    handleKeyDown(e) {
      if (!this.usePointerAim) return;
      switch (e.key.toLowerCase()) {
        case 'w': this.keyboard.forward = 1; break;
        case 's': this.keyboard.back = 1; break;
        case 'a': this.keyboard.left = 1; break;
        case 'd': this.keyboard.right = 1; break;
        case ' ': this.keyboard.up = 1; break;
        case 'shift':
        case 'shiftleft':
        case 'shiftright':
          this.keyboard.down = 1; break;
      }
    }

    handleKeyUp(e) {
      if (!this.usePointerAim) return;
      switch (e.key.toLowerCase()) {
        case 'w': this.keyboard.forward = 0; break;
        case 's': this.keyboard.back = 0; break;
        case 'a': this.keyboard.left = 0; break;
        case 'd': this.keyboard.right = 0; break;
        case ' ': this.keyboard.up = 0; break;
        case 'shift':
        case 'shiftleft':
        case 'shiftright':
          this.keyboard.down = 0; break;
      }
    }

    updateRotationVectors() {
      const m = this.rotationMatrix;
      // camera looks along -Z axis in device space
      this.forward = normalize({ x: -m[0][2], y: -m[1][2], z: -m[2][2] });
      this.up = normalize({ x: m[0][1], y: m[1][1], z: m[2][1] });
      this.right = normalize({ x: m[0][0], y: m[1][0], z: m[2][0] });
      this.inverseRotation = transpose(m);
    }

    updateRotationFromPointer() {
      const yawMatrix = rotationY(this.pointerYaw);
      const pitchMatrix = rotationX(this.pointerPitch);
      this.rotationMatrix = multiplyMatrices(yawMatrix, pitchMatrix);
      this.updateRotationVectors();
    }

    handleOrientation(event) {
      if (event.alpha === null || event.beta === null || event.gamma === null) return;
      if (this.permissionState === 'prompt') {
        // auto request on first orientation event on Android
        this.permissionState = 'granted';
      }
      const alpha = event.alpha * DEG2RAD;
      const beta = event.beta * DEG2RAD;
      const gamma = event.gamma * DEG2RAD;
      const rotZ = rotationZ(alpha);
      const rotX = rotationX(beta);
      const rotY = rotationY(gamma);
      this.rotationMatrix = multiplyMatrices(rotZ, multiplyMatrices(rotX, rotY));
      this.updateRotationVectors();
      this.orientationAvailable = true;
      if (!this.pointerActive) {
        this.usePointerAim = false;
      }
      this.updateStatus();
    }

    handleMotion(event) {
      const now = event.timeStamp || performance.now();
      const dt = clamp((now - this.lastMotionTime) / 1000, 0.001, 0.05);
      this.lastMotionTime = now;
      const acc = event.acceleration || event.accelerationIncludingGravity;
      if (!acc) return;
      let accel = { x: acc.x || 0, y: acc.y || 0, z: acc.z || 0 };
      // convert to world space
      const world = applyMatrix(this.rotationMatrix, accel);
      if (!event.acceleration && event.accelerationIncludingGravity) {
        world.y += G;
      }
      this.state.velocity.x += world.x * dt;
      this.state.velocity.y += world.y * dt;
      this.state.velocity.z += world.z * dt;
      this.motionAvailable = true;
      this.updateStatus();
    }

    clampPosition() {
      const pos = this.state.position;
      pos.x = clamp(pos.x, -WORLD_LIMIT.x, WORLD_LIMIT.x);
      pos.y = clamp(pos.y, -WORLD_LIMIT.y, WORLD_LIMIT.y);
      pos.z = clamp(pos.z, -WORLD_LIMIT.z, WORLD_LIMIT.z);
    }

    integrateKeyboard(dt) {
      if (!this.usePointerAim) return;
      const speed = 0.45;
      let move = { x: 0, y: 0, z: 0 };
      const forward = this.forward;
      const right = this.right;
      const up = this.up;
      if (this.keyboard.forward) {
        move.x += forward.x;
        move.y += forward.y;
        move.z += forward.z;
      }
      if (this.keyboard.back) {
        move.x -= forward.x;
        move.y -= forward.y;
        move.z -= forward.z;
      }
      if (this.keyboard.left) {
        move.x -= right.x;
        move.y -= right.y;
        move.z -= right.z;
      }
      if (this.keyboard.right) {
        move.x += right.x;
        move.y += right.y;
        move.z += right.z;
      }
      if (this.keyboard.up) {
        move.x += up.x;
        move.y += up.y;
        move.z += up.z;
      }
      if (this.keyboard.down) {
        move.x -= up.x;
        move.y -= up.y;
        move.z -= up.z;
      }
      const length = Math.hypot(move.x, move.y, move.z);
      if (length > 0) {
        move.x = (move.x / length) * speed;
        move.y = (move.y / length) * speed;
        move.z = (move.z / length) * speed;
        this.state.position.x += move.x * dt;
        this.state.position.y += move.y * dt;
        this.state.position.z += move.z * dt;
        this.clampPosition();
      }
    }

    update(timestamp) {
      if (!this.running) return;
      const dt = (timestamp - this.lastFrame) / 1000;
      this.lastFrame = timestamp;
      this.integrateKeyboard(dt);
      const vel = this.state.velocity;
      this.state.position.x += vel.x * dt;
      this.state.position.y += vel.y * dt;
      this.state.position.z += vel.z * dt;
      const damping = Math.exp(-4 * dt);
      vel.x *= damping;
      vel.y *= damping;
      vel.z *= damping;
      if (Math.abs(vel.x) < 0.002) vel.x = 0;
      if (Math.abs(vel.y) < 0.002) vel.y = 0;
      if (Math.abs(vel.z) < 0.002) vel.z = 0;
      this.clampPosition();
      this.render();
      this.raf = requestAnimationFrame(this.update);
    }

    projectPoint(point) {
      const diff = {
        x: point.x - this.state.position.x,
        y: point.y - this.state.position.y,
        z: point.z - this.state.position.z
      };
      const x = dot(diff, this.right);
      const y = dot(diff, this.up);
      const z = dot(diff, this.forward);
      if (z <= 0.05) return null;
      const scale = this.focal / z;
      const screenX = this.logicalWidth / 2 + x * scale;
      const screenY = this.logicalHeight / 2 - y * scale;
      return { x: screenX, y: screenY, scale, depth: z };
    }

    render() {
      const ctx = this.ctx;
      if (ctx.resetTransform) ctx.resetTransform(); else ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(this.pixelRatio, this.pixelRatio);
      ctx.clearRect(0, 0, this.logicalWidth, this.logicalHeight);

      const gradient = ctx.createLinearGradient(0, 0, 0, this.logicalHeight);
      gradient.addColorStop(0, '#030611');
      gradient.addColorStop(1, '#0a1b33');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight);

      this.drawFloor(ctx);
      this.drawReferences(ctx);
      this.drawObjects(ctx);
      this.drawReticle(ctx);
    }

    drawFloor(ctx) {
      const step = 0.12;
      const startZ = -1.2;
      const endZ = 0.4;
      const floorY = -0.35;
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = 'rgba(180,200,255,0.18)';
      for (let x = -1.0; x <= 1.0; x += step) {
        const a = this.projectPoint({ x, y: floorY, z: startZ });
        const b = this.projectPoint({ x, y: floorY, z: endZ });
        if (!a || !b) continue;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      for (let z = startZ; z <= endZ; z += step) {
        const a = this.projectPoint({ x: -1.0, y: floorY, z });
        const b = this.projectPoint({ x: 1.0, y: floorY, z });
        if (!a || !b) continue;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      // glow circle around origin
      const origin = this.projectPoint({ x: 0, y: floorY, z: -0.4 });
      if (origin) {
        const radius = 0.18 * origin.scale;
        const glow = ctx.createRadialGradient(origin.x, origin.y, radius * 0.2, origin.x, origin.y, radius);
        glow.addColorStop(0, 'rgba(180,230,255,0.25)');
        glow.addColorStop(1, 'rgba(180,230,255,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(origin.x, origin.y, radius, 0, TAU);
        ctx.fill();
      }
    }

    drawReferences(ctx) {
      ctx.font = '16px Doto, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      for (const ref of this.referencePoints) {
        const proj = this.projectPoint(ref.position);
        if (!proj) continue;
        const size = Math.max(4, 10 * proj.scale);
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, size, 0, TAU);
        ctx.fill();
        ctx.fillStyle = ref.color;
        ctx.fillText(ref.label, proj.x, proj.y + size + 4);
      }
    }

    drawObjects(ctx) {
      const items = [];
      for (const obj of this.objects) {
        const proj = this.projectPoint(obj.position);
        if (!proj) continue;
        items.push({ obj, proj });
      }
      items.sort((a, b) => b.proj.depth - a.proj.depth);
      for (const { obj, proj } of items) {
        switch (obj.type) {
          case 'sphere':
          case 'orb':
            this.drawSphere(ctx, obj, proj);
            break;
          case 'cube':
            this.drawCube(ctx, obj, proj);
            break;
          case 'pyramid':
            this.drawPyramid(ctx, obj, proj);
            break;
          case 'pillar':
            this.drawPillar(ctx, obj, proj);
            break;
        }
      }
    }

    drawSphere(ctx, obj, proj) {
      const radius = obj.radius * proj.scale;
      if (radius < 2) return;
      const light = Math.max(0.15, Math.min(1, (dot(this.forward, LIGHT_DIR) + 1) / 2));
      const inner = mixColor(obj.color, light * 0.5);
      const outer = darken(obj.color, 0.4);
      const gradient = ctx.createRadialGradient(proj.x - radius * 0.35, proj.y - radius * 0.35, radius * 0.1, proj.x, proj.y, radius);
      gradient.addColorStop(0, inner);
      gradient.addColorStop(1, outer);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, radius, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    drawCube(ctx, obj, proj) {
      const size = obj.size * proj.scale;
      const half = size / 2;
      const skew = size * 0.35;
      ctx.fillStyle = darken(obj.color, 0.25);
      ctx.fillRect(proj.x - half, proj.y - half, size, size);
      ctx.fillStyle = mixColor(obj.color, 0.3);
      ctx.beginPath();
      ctx.moveTo(proj.x - half, proj.y - half);
      ctx.lineTo(proj.x - half + skew, proj.y - half - skew);
      ctx.lineTo(proj.x + half + skew, proj.y - half - skew);
      ctx.lineTo(proj.x + half, proj.y - half);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = mixColor(obj.color, 0.1);
      ctx.beginPath();
      ctx.moveTo(proj.x + half, proj.y - half);
      ctx.lineTo(proj.x + half + skew, proj.y - half - skew);
      ctx.lineTo(proj.x + half + skew, proj.y + half - skew);
      ctx.lineTo(proj.x + half, proj.y + half);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 1.1;
      ctx.strokeRect(proj.x - half, proj.y - half, size, size);
    }

    drawPyramid(ctx, obj, proj) {
      const base = obj.size * proj.scale;
      const half = base / 2;
      const height = base * 1.1;
      ctx.fillStyle = mixColor(obj.color, 0.15);
      ctx.beginPath();
      ctx.moveTo(proj.x - half, proj.y + half);
      ctx.lineTo(proj.x + half, proj.y + half);
      ctx.lineTo(proj.x, proj.y - height * 0.6);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = darken(obj.color, 0.35);
      ctx.beginPath();
      ctx.moveTo(proj.x, proj.y - height * 0.6);
      ctx.lineTo(proj.x + half, proj.y + half);
      ctx.lineTo(proj.x, proj.y + half);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(proj.x - half, proj.y + half);
      ctx.lineTo(proj.x, proj.y - height * 0.6);
      ctx.lineTo(proj.x + half, proj.y + half);
      ctx.lineTo(proj.x - half, proj.y + half);
      ctx.stroke();
    }

    drawPillar(ctx, obj, proj) {
      const radius = 0.05 * proj.scale;
      const height = obj.height * proj.scale;
      ctx.fillStyle = mixColor(obj.color, 0.15);
      ctx.beginPath();
      ctx.rect(proj.x - radius, proj.y - height, radius * 2, height);
      ctx.fill();
      const topGradient = ctx.createRadialGradient(proj.x - radius * 0.4, proj.y - height - radius * 0.3, radius * 0.1, proj.x, proj.y - height, radius);
      topGradient.addColorStop(0, mixColor(obj.color, 0.6));
      topGradient.addColorStop(1, darken(obj.color, 0.3));
      ctx.fillStyle = topGradient;
      ctx.beginPath();
      ctx.ellipse(proj.x, proj.y - height, radius, radius * 0.6, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    drawReticle(ctx) {
      const size = 14;
      const cx = this.logicalWidth / 2;
      const cy = this.logicalHeight / 2;
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - size, cy);
      ctx.lineTo(cx + size, cy);
      ctx.moveTo(cx, cy - size);
      ctx.lineTo(cx, cy + size);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.beginPath();
      ctx.arc(cx, cy, 2.5, 0, TAU);
      ctx.fill();
    }
  }

  window.KnockVisualizer = PocketRealityPortal;
})();
