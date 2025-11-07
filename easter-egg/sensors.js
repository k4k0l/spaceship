export function createSensorManager(THREE, options = {}) {
  const {
    allowRoll = false,
    minAcceleration = 0.12
  } = options;

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

  const deviceQuaternion = new THREE.Quaternion();
  const absoluteQuaternion = new THREE.Quaternion();
  let referenceQuaternion = null;
  const referenceInverse = new THREE.Quaternion();

  let fallbackQuaternionGetter = null;

  let permissionState = 'prompt';
  let orientationAllowed = 'DeviceOrientationEvent' in window;
  let motionAllowed = 'DeviceMotionEvent' in window;
  let orientationAvailable = false;
  let motionAvailable = false;
  let hasOrientation = false;
  let screenOrientation = getScreenOrientation();
  let lastMotionTimestamp = 0;
  let sensorRequestInFlight = null;

  let orientationListenersAttached = false;
  let motionListenersAttached = false;

  const orientationHandlers = new Set();
  const motionHandlers = new Set();

  const orientationChangeHandler = () => {
    screenOrientation = getScreenOrientation();
  };

  function notifyOrientation() {
    for (const handler of orientationHandlers) {
      handler(deviceQuaternion);
    }
  }

  function notifyMotion(vec, dt) {
    for (const handler of motionHandlers) {
      handler(vec, dt);
    }
  }

  function handleOrientation(event) {
    if (event.alpha === null) {
      orientationAvailable = false;
      hasOrientation = false;
      return;
    }

    const alpha = THREE.MathUtils.degToRad(event.alpha || 0);
    const beta = THREE.MathUtils.degToRad(event.beta || 0);
    const gamma = THREE.MathUtils.degToRad(event.gamma || 0);
    const orient = THREE.MathUtils.degToRad(screenOrientation || 0);

    setObjectQuaternion(absoluteQuaternion, alpha, beta, gamma, orient);

    if (!referenceQuaternion) {
      referenceQuaternion = absoluteQuaternion.clone();
      referenceInverse.copy(referenceQuaternion).invert();
    }

    deviceQuaternion.copy(referenceInverse);
    deviceQuaternion.multiply(absoluteQuaternion);

    if (!allowRoll) {
      tmpEuler.setFromQuaternion(deviceQuaternion, 'YXZ');
      tmpEuler.z = 0;
      deviceQuaternion.setFromEuler(tmpEuler);
    }

    orientationAvailable = true;
    hasOrientation = true;
    notifyOrientation();
  }

  function handleMotion(event) {
    if (!event.acceleration) {
      motionAvailable = false;
      return;
    }

    const now = performance.now();
    if (!lastMotionTimestamp) {
      lastMotionTimestamp = now;
      return;
    }

    const dt = event.interval ? event.interval / 1000 : (now - lastMotionTimestamp) / 1000;
    lastMotionTimestamp = now;
    if (!dt || dt > 0.2) return;

    tmpVec.set(event.acceleration.x || 0, event.acceleration.y || 0, event.acceleration.z || 0);
    if (tmpVec.length() < minAcceleration) {
      return;
    }

    let basisQuat = null;
    if (hasOrientation) {
      basisQuat = deviceQuaternion;
    } else if (fallbackQuaternionGetter) {
      basisQuat = fallbackQuaternionGetter();
    }

    if (!basisQuat) return;

    tmpVec.applyQuaternion(basisQuat);
    motionAvailable = true;
    notifyMotion(tmpVec.clone(), dt);
  }

  function attachOrientationListener() {
    if (!orientationAllowed || orientationListenersAttached) return;
    window.addEventListener('deviceorientation', handleOrientation, true);
    orientationListenersAttached = true;
  }

  function attachMotionListener() {
    if (!motionAllowed || motionListenersAttached) return;
    window.addEventListener('devicemotion', handleMotion, true);
    motionListenersAttached = true;
  }

  function detachOrientationListener() {
    if (!orientationListenersAttached) return;
    window.removeEventListener('deviceorientation', handleOrientation, true);
    orientationListenersAttached = false;
  }

  function detachMotionListener() {
    if (!motionListenersAttached) return;
    window.removeEventListener('devicemotion', handleMotion, true);
    motionListenersAttached = false;
  }

  async function requestPermissions() {
    if (sensorRequestInFlight) return sensorRequestInFlight;

    sensorRequestInFlight = (async () => {
      let orientationGranted = orientationAllowed;
      let motionGranted = motionAllowed;

      if (orientationAllowed && typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        try {
          orientationGranted = (await DeviceOrientationEvent.requestPermission()) === 'granted';
        } catch (err) {
          console.warn('Orientation permission error', err);
          orientationGranted = false;
        }
      }

      if (orientationGranted) {
        attachOrientationListener();
      } else {
        detachOrientationListener();
      }

      if (motionAllowed && typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
        try {
          motionGranted = (await DeviceMotionEvent.requestPermission()) === 'granted';
        } catch (err) {
          console.warn('Motion permission error', err);
          motionGranted = false;
        }
      }

      if (motionGranted) {
        attachMotionListener();
      } else {
        detachMotionListener();
      }

      permissionState = (!orientationGranted && !motionGranted) ? 'denied' : 'granted';
      return permissionState;
    })();

    try {
      return await sensorRequestInFlight;
    } finally {
      sensorRequestInFlight = null;
    }
  }

  function start() {
    window.addEventListener('orientationchange', orientationChangeHandler);
    if (!(window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function')) {
      attachOrientationListener();
    }
    if (!(window.DeviceMotionEvent && typeof DeviceMotionEvent.requestPermission === 'function')) {
      attachMotionListener();
    }
  }

  function stop() {
    window.removeEventListener('orientationchange', orientationChangeHandler);
    detachOrientationListener();
    detachMotionListener();
    lastMotionTimestamp = 0;
  }

  function reset() {
    orientationAvailable = false;
    motionAvailable = false;
    hasOrientation = false;
    referenceQuaternion = null;
    lastMotionTimestamp = 0;
  }

  function setFallbackQuaternionGetter(getter) {
    fallbackQuaternionGetter = getter;
  }

  function onOrientation(handler) {
    orientationHandlers.add(handler);
    return () => orientationHandlers.delete(handler);
  }

  function onMotion(handler) {
    motionHandlers.add(handler);
    return () => motionHandlers.delete(handler);
  }

  function getState() {
    return {
      permissionState,
      orientationAllowed,
      motionAllowed,
      orientationAvailable,
      motionAvailable,
      hasOrientation,
      screenOrientation
    };
  }

  return {
    start,
    stop,
    reset,
    requestPermissions,
    setFallbackQuaternionGetter,
    onOrientation,
    onMotion,
    getState,
    get deviceQuaternion() {
      return deviceQuaternion;
    }
  };
}
