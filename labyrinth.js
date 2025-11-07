(function () {
  if (!('THREE' in window)) {
    console.error('Three.js was not loaded. Labyrinth experience is disabled.');
    return;
  }

  const moduleUrl = './easter-egg/labyrinth.js';
  let labyrinthModulePromise = null;

  function ensureLabyrinthGame() {
    if (!labyrinthModulePromise) {
      labyrinthModulePromise = import(moduleUrl).then(module => {
        if (module && module.LabyrinthGame) {
          window.LabyrinthGame = module.LabyrinthGame;
        }
        return module;
      }).catch(err => {
        console.error('Failed to load labyrinth module.', err);
        labyrinthModulePromise = null;
        throw err;
      });
    }
    return labyrinthModulePromise;
  }

  window.ensureLabyrinthGame = ensureLabyrinthGame;
})();
