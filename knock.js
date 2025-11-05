(function () {
  if (typeof THREE === 'undefined') {
    console.error('Three.js was not loaded. PocketRealityPortal is disabled.');
    return;
  }

  const WORLD_LIMIT = new THREE.Vector3(0.45, 0.35, 0.75);
  const MOTION_SCALE = 0.018;
  const MIN_ACCELERATION = 0.12;
  const DAMPING_FACTOR = 5.5;

  const zee = new THREE.Vector3(0, 0, 1);
  const euler = new THREE.Euler();
  const tmpEuler = new THREE.Euler();
  const q0 = new THREE.Quaternion();
  const q1 = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));
  const tmpVec = new THREE.Vector3();

  function getScreenOrientation() {
    if (window.screen && window.screen.orientation && typeof window.screen.orientation.angle === 'number') {
      return window.screen.orientation.angle;
    }
    return typeof window.orientation === 'number' ? window.orientation : 0;
  }

  function setObjectQuaternion(quaternion, alpha, beta, gamma, orient) {
    euler.set(beta, alpha, -gamma, 'YXZ');
    quaternion.setFromEuler(euler);
    quaternion.multiply(q1);
    quaternion.multiply(q0.setFromAxisAngle(zee, -orient));
  }

  class PocketRealityPortal {
    constructor(canvas, statusEl) {
      this.canvas = canvas;
      this.statusEl = statusEl;

      this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
      this.renderer.setPixelRatio(window.devicePixelRatio || 1);
      if ('outputColorSpace' in this.renderer) {
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      } else {
        this.renderer.outputEncoding = THREE.sRGBEncoding;
      }

      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x050b19);
      this.scene.fog = new THREE.Fog(0x050b19, 2, 6);

      this.camera = new THREE.PerspectiveCamera(70, 1, 0.05, 15);
      this.position = new THREE.Vector3(0, 0.1, 0);
      this.velocity = new THREE.Vector3();
      this.camera.position.copy(this.position);
      this.camera.lookAt(new THREE.Vector3(0, 0.1, -1));

      this.clock = new THREE.Clock();
      this.time = 0;

      this.deviceQuaternion = new THREE.Quaternion();
      this.absoluteQuaternion = new THREE.Quaternion();
      this.referenceQuaternion = null;
      this.referenceInverse = new THREE.Quaternion();
      this.pointerQuaternion = new THREE.Quaternion();

      this.permissionState = 'prompt';
      this.orientationAllowed = 'DeviceOrientationEvent' in window;
      this.motionAllowed = 'DeviceMotionEvent' in window;
      this.orientationAvailable = false;
      this.motionAvailable = false;
      this.hasOrientation = false;
      this.usePointerAim = !this.orientationAllowed;
      this.pointerActive = false;
      this.pointerYaw = 0;
      this.pointerPitch = 0;
      this.lastMotionTimestamp = 0;
      this.screenOrientation = getScreenOrientation();

      this.orientationListenerAttached = false;
      this.motionListenerAttached = false;
      this.sensorRequestInFlight = null;

      this.statusMessage = '';
      this.lastStatusUpdate = 0;

      this.allowRoll = false;

      this.dynamics = [];

      this.initScene();

      this.boundResize = this.resize.bind(this);
      this.boundAnimate = this.animate.bind(this);
      this.boundHandleOrientation = this.handleOrientation.bind(this);
      this.boundHandleMotion = this.handleMotion.bind(this);
      this.boundOrientationChange = this.handleScreenOrientation.bind(this);
      this.boundPointerDown = this.handlePointerDown.bind(this);
      this.boundPointerMove = this.handlePointerMove.bind(this);
      this.boundPointerUp = this.handlePointerUp.bind(this);

      this.resize();
      this.updatePointerQuaternion();
      this.updateStatus('Dotknij panelu, aby aktywować portal.');
    }

    initScene() {
      const ambient = new THREE.AmbientLight(0x4d6cff, 0.35);
      const key = new THREE.DirectionalLight(0xffffff, 0.8);
      key.position.set(0.8, 1.6, 0.4);
      const fill = new THREE.PointLight(0x5cc4ff, 1.0, 6);
      fill.position.set(-0.6, 0.9, -0.2);
      const rim = new THREE.PointLight(0xff758c, 0.6, 4);
      rim.position.set(0.3, 0.4, -1.2);
      this.scene.add(ambient, key, fill, rim);

      const grid = new THREE.GridHelper(4, 24, 0x4261c9, 0x152447);
      grid.position.y = -0.36;
      this.scene.add(grid);

      const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x081125, roughness: 0.9, metalness: 0.05 });
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), floorMaterial);
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = -0.37;
      this.scene.add(floor);

      const atmosphereMaterial = new THREE.MeshBasicMaterial({ color: 0x0e1b3a, wireframe: true, transparent: true, opacity: 0.12 });
      const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(2.5, 24, 16), atmosphereMaterial);
      this.scene.add(atmosphere);

      const objects = [];

      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 32, 24),
        new THREE.MeshStandardMaterial({ color: 0xf8b05c, roughness: 0.35, metalness: 0.2 })
      );
      sphere.position.set(0.28, 0.05, -0.55);
      this.scene.add(sphere);
      objects.push({ mesh: sphere, rotateAxis: new THREE.Vector3(0, 1, 0), rotateSpeed: 0.3, bobAmplitude: 0.03, bobSpeed: 1.6 });

      const cube = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.2, 0.2),
        new THREE.MeshStandardMaterial({ color: 0x6da8ff, roughness: 0.4, metalness: 0.25 })
      );
      cube.position.set(-0.24, 0.02, -0.42);
      this.scene.add(cube);
      objects.push({ mesh: cube, rotateAxis: new THREE.Vector3(1, 1, 0).normalize(), rotateSpeed: 0.45, bobAmplitude: 0.02, bobSpeed: 1.2 });

      const pyramid = new THREE.Mesh(
        new THREE.ConeGeometry(0.14, 0.22, 4),
        new THREE.MeshStandardMaterial({ color: 0xc675ff, roughness: 0.3, metalness: 0.4 })
      );
      pyramid.position.set(0.02, -0.1, -0.28);
      pyramid.rotation.y = Math.PI / 4;
      this.scene.add(pyramid);
      objects.push({ mesh: pyramid, rotateAxis: new THREE.Vector3(0, 1, 0), rotateSpeed: -0.35, bobAmplitude: 0.025, bobSpeed: 1.9 });

      const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 0.42, 12),
        new THREE.MeshStandardMaterial({ color: 0x8ae0d6, roughness: 0.5, metalness: 0.1 })
      );
      pillar.position.set(-0.05, -0.35 + 0.21, -0.85);
      this.scene.add(pillar);

      const orb = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 24, 18),
        new THREE.MeshStandardMaterial({ color: 0xff6d92, emissive: 0x551126, emissiveIntensity: 0.6, roughness: 0.25 })
      );
      orb.position.set(-0.18, 0.22, -0.65);
      this.scene.add(orb);
      objects.push({ mesh: orb, rotateAxis: new THREE.Vector3(0, 1, 0), rotateSpeed: 0.6, bobAmplitude: 0.05, bobSpeed: 2.3 });

      objects.forEach(obj => {
        obj.baseY = obj.mesh.position.y;
      });
      this.dynamics = objects;

      const labels = new THREE.Group();
      const labelMaterial = new THREE.LineBasicMaterial({ color: 0x3b5aa8 });
      const labelGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, -0.35, -0.35),
        new THREE.Vector3(0, -0.35, -0.75)
      ]);
      const forward = new THREE.Line(labelGeometry, labelMaterial);
      labels.add(forward);
      const pole = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.08, 12), new THREE.MeshStandardMaterial({ color: 0x3b5aa8, roughness: 0.6 }));
      pole.position.set(0, -0.35 + 0.04, -0.75);
      labels.add(pole);
      this.scene.add(labels);
    }

    updatePointerQuaternion() {
      tmpEuler.set(this.pointerPitch, this.pointerYaw, 0, 'YXZ');
      this.pointerQuaternion.setFromEuler(tmpEuler);
    }

    resize() {
      const width = this.canvas.clientWidth || this.canvas.width || 1;
      const height = this.canvas.clientHeight || this.canvas.height || 1;
      this.renderer.setSize(width, height, false);
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
    }

    handleScreenOrientation() {
      this.screenOrientation = getScreenOrientation();
    }

    async ensureSensorListeners() {
      if (this.sensorRequestInFlight) return this.sensorRequestInFlight;

      const request = async () => {
        let orientationGranted = this.orientationAllowed;
        let motionGranted = this.motionAllowed;

        if (this.orientationAllowed && typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
          try {
            orientationGranted = (await DeviceOrientationEvent.requestPermission()) === 'granted';
          } catch (err) {
            console.warn('Orientation permission error', err);
            orientationGranted = false;
          }
        }

        if (orientationGranted) {
          this.attachOrientationListener();
        } else {
          this.orientationAllowed = false;
        }

        if (this.motionAllowed && typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
          try {
            motionGranted = (await DeviceMotionEvent.requestPermission()) === 'granted';
          } catch (err) {
            console.warn('Motion permission error', err);
            motionGranted = false;
          }
        }

        if (motionGranted) {
          this.attachMotionListener();
        } else {
          this.motionAllowed = false;
        }

        if (!orientationGranted && !motionGranted) {
          this.permissionState = 'denied';
          this.usePointerAim = true;
        } else {
          this.permissionState = 'granted';
        }

        this.updateStatus();
      };

      this.sensorRequestInFlight = request();
      await this.sensorRequestInFlight;
      this.sensorRequestInFlight = null;
    }

    attachOrientationListener() {
      if (this.orientationListenerAttached) return;
      window.addEventListener('deviceorientation', this.boundHandleOrientation, true);
      this.orientationListenerAttached = true;
    }

    attachMotionListener() {
      if (this.motionListenerAttached) return;
      window.addEventListener('devicemotion', this.boundHandleMotion, true);
      this.motionListenerAttached = true;
    }

    handlePointerDown(event) {
      if (!event.isPrimary) return;
      this.pointerActive = true;
      this.usePointerAim = true;
      this.pointerLastX = event.clientX;
      this.pointerLastY = event.clientY;
      try { this.canvas.setPointerCapture(event.pointerId); } catch (err) {}
      this.ensureSensorListeners();
    }

    handlePointerMove(event) {
      if (!this.pointerActive || !event.isPrimary) return;
      const dx = event.clientX - this.pointerLastX;
      const dy = event.clientY - this.pointerLastY;
      this.pointerLastX = event.clientX;
      this.pointerLastY = event.clientY;
      this.pointerYaw -= dx * 0.004;
      this.pointerPitch -= dy * 0.003;
      const limit = Math.PI / 2 - 0.05;
      this.pointerPitch = Math.max(-limit, Math.min(limit, this.pointerPitch));
      this.updatePointerQuaternion();
    }

    handlePointerUp(event) {
      if (!event.isPrimary) return;
      this.pointerActive = false;
      try { this.canvas.releasePointerCapture(event.pointerId); } catch (err) {}
    }

    handleOrientation(event) {
      if (event.alpha === null) {
        this.orientationAvailable = false;
        return;
      }

      const alpha = THREE.MathUtils.degToRad(event.alpha || 0);
      const beta = THREE.MathUtils.degToRad(event.beta || 0);
      const gamma = THREE.MathUtils.degToRad(event.gamma || 0);
      const orient = THREE.MathUtils.degToRad(this.screenOrientation || 0);

      setObjectQuaternion(this.absoluteQuaternion, alpha, beta, gamma, orient);

      if (!this.referenceQuaternion) {
        this.referenceQuaternion = this.absoluteQuaternion.clone();
        this.referenceInverse.copy(this.referenceQuaternion).invert();
      }

      this.deviceQuaternion.copy(this.referenceInverse);
      this.deviceQuaternion.multiply(this.absoluteQuaternion);

      if (!this.allowRoll) {
        tmpEuler.setFromQuaternion(this.deviceQuaternion, 'YXZ');
        tmpEuler.z = 0;
        this.deviceQuaternion.setFromEuler(tmpEuler);
      }

      this.orientationAvailable = true;
      this.hasOrientation = true;
    }

    handleMotion(event) {
      if (!event.acceleration) {
        this.motionAvailable = false;
        return;
      }

      const now = performance.now();
      if (!this.lastMotionTimestamp) {
        this.lastMotionTimestamp = now;
        return;
      }

      const dt = (event.interval ? event.interval / 1000 : (now - this.lastMotionTimestamp) / 1000);
      this.lastMotionTimestamp = now;
      if (!dt || dt > 0.2) return;

      const acc = event.acceleration;
      tmpVec.set(acc.x || 0, acc.y || 0, acc.z || 0);
      if (tmpVec.length() < MIN_ACCELERATION) {
        return;
      }

      let basisQuat = null;
      if (this.hasOrientation) {
        basisQuat = this.deviceQuaternion;
      } else if (this.usePointerAim) {
        basisQuat = this.pointerQuaternion;
      }

      if (!basisQuat) return;

      tmpVec.applyQuaternion(basisQuat);
      this.velocity.addScaledVector(tmpVec, dt * MOTION_SCALE);
      this.motionAvailable = true;
    }

    clampPosition() {
      this.position.x = THREE.MathUtils.clamp(this.position.x, -WORLD_LIMIT.x, WORLD_LIMIT.x);
      this.position.y = THREE.MathUtils.clamp(this.position.y, -WORLD_LIMIT.y, WORLD_LIMIT.y);
      this.position.z = THREE.MathUtils.clamp(this.position.z, -WORLD_LIMIT.z, WORLD_LIMIT.z);
    }

    updateStatus(extra) {
      const lines = [];
      lines.push(`Pozycja: ${(this.position.x * 100).toFixed(0)} cm / ${(this.position.y * 100).toFixed(0)} cm / ${(this.position.z * 100).toFixed(0)} cm.`);

      if (!this.running) {
        lines.push('Portal uśpiony.');
      } else if (this.permissionState === 'prompt') {
        lines.push('Dotknij panelu, aby udzielić dostępu do czujników.');
      } else if (this.permissionState === 'denied') {
        lines.push('Brak dostępu do czujników — użyj myszy, by się rozejrzeć.');
      } else {
        if (this.orientationAllowed) {
          if (this.hasOrientation) {
            lines.push('Przechyl telefon, aby rozglądać się po scenie.');
          } else {
            lines.push('Czekam na orientację urządzenia...');
          }
        } else {
          lines.push('Żyroskop niedostępny — użyj myszy, by się rozejrzeć.');
        }
        if (this.motionAllowed) {
          if (this.motionAvailable) {
            lines.push('Delikatnie przesuwaj telefon w powietrzu, by zmieniać pozycję.');
          } else {
            lines.push('Porusz telefonem w przestrzeni, aby przesunąć kamerę.');
          }
        } else {
          lines.push('Czujnik ruchu niedostępny — pozycja pozostanie statyczna.');
        }
      }

      if (extra) lines.push(extra);
      const message = lines.join(' ');
      if (message !== this.statusMessage) {
        this.statusEl.textContent = message;
        this.statusMessage = message;
      }
    }

    animate() {
      if (!this.running) return;

      const dt = this.clock.getDelta();
      this.time += dt;

      const damping = Math.exp(-DAMPING_FACTOR * dt);
      this.velocity.multiplyScalar(damping);
      if (this.velocity.lengthSq() < 1e-6) this.velocity.set(0, 0, 0);

      this.position.addScaledVector(this.velocity, dt);
      this.clampPosition();
      this.camera.position.copy(this.position);

      if (this.hasOrientation) {
        this.camera.quaternion.copy(this.deviceQuaternion);
      } else if (this.usePointerAim) {
        this.camera.quaternion.copy(this.pointerQuaternion);
      }

      for (const obj of this.dynamics) {
        if (obj.rotateAxis && obj.rotateSpeed) {
          obj.mesh.rotateOnAxis(obj.rotateAxis, obj.rotateSpeed * dt);
        }
        if (obj.bobAmplitude) {
          obj.mesh.position.y = obj.baseY + Math.sin(this.time * obj.bobSpeed) * obj.bobAmplitude;
        }
      }

      this.renderer.render(this.scene, this.camera);

      const now = performance.now();
      if (now - this.lastStatusUpdate > 500) {
        this.updateStatus();
        this.lastStatusUpdate = now;
      }

      this.raf = requestAnimationFrame(this.boundAnimate);
    }

    async start() {
      if (this.running) return;
      this.running = true;
      this.clock.start();
      this.time = 0;
      this.lastMotionTimestamp = 0;
      this.orientationAvailable = false;
      this.motionAvailable = false;
      this.referenceQuaternion = null;
      this.hasOrientation = false;

      this.resize();
      window.addEventListener('resize', this.boundResize);
      window.addEventListener('orientationchange', this.boundOrientationChange);
      this.canvas.addEventListener('pointerdown', this.boundPointerDown);
      this.canvas.addEventListener('pointermove', this.boundPointerMove);
      this.canvas.addEventListener('pointerup', this.boundPointerUp);
      this.canvas.addEventListener('pointercancel', this.boundPointerUp);

      if (!(window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function')) {
        this.attachOrientationListener();
      }
      if (!(window.DeviceMotionEvent && typeof DeviceMotionEvent.requestPermission === 'function')) {
        this.attachMotionListener();
      }

      await this.ensureSensorListeners();

      this.updateStatus();
      this.raf = requestAnimationFrame(this.boundAnimate);
    }

    stop() {
      if (!this.running) return;
      this.running = false;
      cancelAnimationFrame(this.raf);
      this.clock.stop();

      window.removeEventListener('resize', this.boundResize);
      window.removeEventListener('orientationchange', this.boundOrientationChange);
      window.removeEventListener('deviceorientation', this.boundHandleOrientation, true);
      window.removeEventListener('devicemotion', this.boundHandleMotion, true);
      this.orientationListenerAttached = false;
      this.motionListenerAttached = false;

      this.canvas.removeEventListener('pointerdown', this.boundPointerDown);
      this.canvas.removeEventListener('pointermove', this.boundPointerMove);
      this.canvas.removeEventListener('pointerup', this.boundPointerUp);
      this.canvas.removeEventListener('pointercancel', this.boundPointerUp);

      this.referenceQuaternion = null;
      this.velocity.set(0, 0, 0);
      this.updateStatus('Portal uśpiony.');
    }
  }

  window.KnockVisualizer = PocketRealityPortal;
})();
