export function createPortalControls(THREE, options) {
  const {
    camera,
    canvas,
    sensorManager,
    worldLimit,
    motionScale,
    dampingFactor,
    initialPosition = new THREE.Vector3()
  } = options;

  const position = initialPosition.clone();
  const velocity = new THREE.Vector3();
  const pointerQuaternion = new THREE.Quaternion();
  const pointerEuler = new THREE.Euler(0, 0, 0, 'YXZ');
  let pointerYaw = 0;
  let pointerPitch = 0;
  let pointerActive = false;
  let lastMotionTimestamp = 0;

  function updatePointerQuaternion() {
    pointerEuler.set(pointerPitch, pointerYaw, 0);
    pointerQuaternion.setFromEuler(pointerEuler);
  }

  updatePointerQuaternion();

  sensorManager.setFallbackQuaternionGetter(() => pointerQuaternion);

  sensorManager.onMotion((vec, dt) => {
    velocity.addScaledVector(vec, dt * motionScale);
    lastMotionTimestamp = performance.now();
  });

  sensorManager.onOrientation(quaternion => {
    // orientation handled in update loop via sensorManager state
    void quaternion;
  });

  function clampPosition() {
    position.x = THREE.MathUtils.clamp(position.x, -worldLimit.x, worldLimit.x);
    position.y = THREE.MathUtils.clamp(position.y, -worldLimit.y, worldLimit.y);
    position.z = THREE.MathUtils.clamp(position.z, -worldLimit.z, worldLimit.z);
  }

  function handlePointerDown(event) {
    if (!event.isPrimary) return;
    pointerActive = true;
    pointerLastX = event.clientX;
    pointerLastY = event.clientY;
    try { canvas.setPointerCapture(event.pointerId); } catch (err) { void err; }
    sensorManager.requestPermissions().catch(() => {});
  }

  function handlePointerMove(event) {
    if (!pointerActive || !event.isPrimary) return;
    const dx = event.clientX - pointerLastX;
    const dy = event.clientY - pointerLastY;
    pointerLastX = event.clientX;
    pointerLastY = event.clientY;
    pointerYaw -= dx * 0.004;
    pointerPitch -= dy * 0.003;
    const limit = Math.PI / 2 - 0.05;
    pointerPitch = Math.max(-limit, Math.min(limit, pointerPitch));
    updatePointerQuaternion();
  }

  function handlePointerUp(event) {
    if (!event.isPrimary) return;
    pointerActive = false;
    try { canvas.releasePointerCapture(event.pointerId); } catch (err) { void err; }
  }

  let pointerLastX = 0;
  let pointerLastY = 0;

  function start(positionOverride) {
    position.copy(positionOverride || initialPosition);
    velocity.set(0, 0, 0);
    updatePointerQuaternion();
    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('pointercancel', handlePointerUp);
  }

  function stop() {
    canvas.removeEventListener('pointerdown', handlePointerDown);
    canvas.removeEventListener('pointermove', handlePointerMove);
    canvas.removeEventListener('pointerup', handlePointerUp);
    canvas.removeEventListener('pointercancel', handlePointerUp);
    pointerActive = false;
  }

  function update(dt) {
    const damping = Math.exp(-dampingFactor * dt);
    velocity.multiplyScalar(damping);
    if (velocity.lengthSq() < 1e-6) {
      velocity.set(0, 0, 0);
    }

    position.addScaledVector(velocity, dt);
    clampPosition();
    camera.position.copy(position);

    const state = sensorManager.getState();
    if (state.hasOrientation) {
      camera.quaternion.copy(sensorManager.deviceQuaternion);
    } else {
      camera.quaternion.copy(pointerQuaternion);
    }
  }

  function getState() {
    return {
      position,
      pointerActive,
      pointerQuaternion,
      lastMotionTimestamp
    };
  }

  return {
    start,
    stop,
    update,
    getState
  };
}
