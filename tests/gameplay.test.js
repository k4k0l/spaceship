'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const Game = require('../game.js');

function context() {
  return new Proxy({}, { get(target, key) {
    if (!(key in target)) target[key] = () => {};
    return target[key];
  }, set(target, key, value) { target[key] = value; return true; } });
}

function element() { return { textContent: '', innerHTML: '', style: {} }; }

function createGame() {
  const mission = element();
  global.document = { getElementById: id => id === 'mission' ? mission : null };
  global.window = {
    innerWidth: 1024, innerHeight: 768,
    addEventListener() {}, removeEventListener() {}
  };
  const canvas = { style: {}, width: 0, height: 0, getContext: context };
  const minimap = { width: 0, height: 0, getContext: context };
  const ui = [element(), element(), element(), element(), element()];
  return { game: new Game(canvas, minimap, ...ui, {
    worldSize: 3000, minAsteroids: 4, maxAsteroids: 4,
    maxPlanets: 2, minEnemies: 0, maxEnemies: 0
  }), mission };
}

test('single-player world starts with a route and orbital asteroid belt', () => {
  const { game, mission } = createGame();
  assert.equal(game.planets.length, 2);
  assert.equal(game.stations.length, 4);
  assert.equal(game.asteroids.length, 4);
  assert.ok(game.asteroids.every(asteroid => asteroid.orbit));
  assert.match(mission.textContent, /Cargo:/);
  game.destroy();
});

test('slow docking advances the delivery route and awards score', () => {
  const { game } = createGame();
  const target = game.stations[game.currentStation];
  game.ship.x = target.x;
  game.ship.y = target.y;
  game.ship.thrust.x = 0;
  game.ship.thrust.y = 0;
  const stationBefore = game.currentStation;
  game.checkDelivery(Game.FIXED_DT);
  assert.equal(game.deliveries, 1);
  assert.notEqual(game.currentStation, stationBefore);
  assert.ok(game.score >= 250);
  game.destroy();
});

test('high-speed station contact asks the player to brake', () => {
  const { game, mission } = createGame();
  const target = game.stations[game.currentStation];
  game.ship.x = target.x;
  game.ship.y = target.y;
  game.ship.thrust.x = Game.DOCKING_SPEED + 1;
  game.checkDelivery(Game.FIXED_DT);
  assert.equal(game.deliveries, 0);
  assert.match(mission.textContent, /Too fast/);
  game.destroy();
});
