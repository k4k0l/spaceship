(function () {
  if (!('THREE' in window)) {
    console.error('Three.js was not loaded. PocketRealityPortal is disabled.');
    return;
  }

  const moduleUrl = './easter-egg/app.js';
  let portalModulePromise = null;

  function ensurePortalModule() {
    if (!portalModulePromise) {
      portalModulePromise = import(moduleUrl).then(module => {
        if (module && module.PocketRealityPortal) {
          window.KnockVisualizer = module.PocketRealityPortal;
        }
        return module;
      }).catch(err => {
        console.error('Failed to load pocket reality portal module.', err);
        portalModulePromise = null;
        throw err;
      });
    }
    return portalModulePromise;
  }

  ensurePortalModule();
  window.ensurePocketRealityPortal = ensurePortalModule;
})();
