import { setupMiniScene } from './scene.js';
import { createSensorManager } from './sensors.js';
import { createPortalControls } from './controls.js';

const THREE = window.THREE;

if (!THREE) {
  throw new Error('Three.js is required for the pocket reality portal.');
}

const WORLD_LIMIT = new THREE.Vector3(0.45, 0.35, 0.75);
const MOTION_SCALE = 0.018;
const DAMPING_FACTOR = 5.5;

export class PocketRealityPortal {
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

    this.camera = new THREE.PerspectiveCamera(70, 1, 0.05, 15);
    const { scene, dynamics, initialPosition } = setupMiniScene(THREE, this.camera);
    this.scene = scene;
    this.dynamics = dynamics;
    this.initialPosition = initialPosition;

    this.sensorManager = createSensorManager(THREE, { allowRoll: false, minAcceleration: 0.12 });
    this.controls = createPortalControls(THREE, {
      camera: this.camera,
      canvas: this.canvas,
      sensorManager: this.sensorManager,
      worldLimit: WORLD_LIMIT,
      motionScale: MOTION_SCALE,
      dampingFactor: DAMPING_FACTOR,
      initialPosition: this.initialPosition
    });

    this.clock = new THREE.Clock();
    this.time = 0;
    this.statusMessage = '';
    this.lastStatusUpdate = 0;
    this.running = false;

    this.boundResize = this.resize.bind(this);
    this.boundAnimate = this.animate.bind(this);

    this.resize();
    this.updateStatus('Dotknij panelu, aby aktywować portal.');
  }

  resize() {
    const width = this.canvas.clientWidth || this.canvas.width || 1;
    const height = this.canvas.clientHeight || this.canvas.height || 1;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  updateStatus(extra) {
    const controlsState = this.controls.getState();
    const sensorState = this.sensorManager.getState();

    const pos = controlsState.position;
    const lines = [];
    lines.push(`Pozycja: ${(pos.x * 100).toFixed(0)} cm / ${(pos.y * 100).toFixed(0)} cm / ${(pos.z * 100).toFixed(0)} cm.`);

    if (!this.running) {
      lines.push('Portal uśpiony.');
    } else if (sensorState.permissionState === 'prompt') {
      lines.push('Dotknij panelu, aby udzielić dostępu do czujników.');
    } else if (sensorState.permissionState === 'denied') {
      lines.push('Brak dostępu do czujników — użyj myszy, by się rozejrzeć.');
    } else {
      if (sensorState.orientationAllowed) {
        if (sensorState.hasOrientation) {
          lines.push('Przechyl telefon, aby rozglądać się po scenie.');
        } else {
          lines.push('Czekam na orientację urządzenia...');
        }
      } else {
        lines.push('Żyroskop niedostępny — użyj myszy, by się rozejrzeć.');
      }

      if (sensorState.motionAllowed) {
        if (sensorState.motionAvailable || (performance.now() - controlsState.lastMotionTimestamp) < 2000) {
          lines.push('Delikatnie przesuwaj telefon w powietrzu, by zmieniać pozycję.');
        } else {
          lines.push('Porusz telefonem w przestrzeni, aby przesunąć kamerę.');
        }
      } else {
        lines.push('Czujnik ruchu niedostępny — pozycja pozostanie statyczna.');
      }
    }

    if (controlsState.pointerActive) {
      lines.push('Sterowanie myszą aktywne.');
    }

    if (extra) {
      lines.push(extra);
    }

    const message = lines.join(' ');
    if (message !== this.statusMessage) {
      this.statusEl.textContent = message;
      this.statusMessage = message;
    }
  }

  async start() {
    if (this.running) return;
    this.running = true;
    this.time = 0;
    this.statusMessage = '';
    this.lastStatusUpdate = 0;
    this.clock.start();

    this.sensorManager.reset();
    this.sensorManager.start();
    this.controls.start(this.initialPosition);

    this.resize();
    window.addEventListener('resize', this.boundResize);
    window.addEventListener('orientationchange', this.boundResize);

    this.updateStatus();
    this.raf = requestAnimationFrame(this.boundAnimate);
  }

  stop() {
    if (!this.running) return;
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.clock.stop();

    this.controls.stop();
    this.sensorManager.stop();

    window.removeEventListener('resize', this.boundResize);
    window.removeEventListener('orientationchange', this.boundResize);

    this.updateStatus();
  }

  animate() {
    if (!this.running) return;

    const dt = this.clock.getDelta();
    this.time += dt;

    this.controls.update(dt);

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
}

if (typeof window !== 'undefined') {
  window.KnockVisualizer = PocketRealityPortal;
}

export default PocketRealityPortal;
