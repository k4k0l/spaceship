'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const Game = require('../game.js');

test('wrap normalizes coordinates on both sides of the world', () => {
  assert.equal(Game.wrap(3001, 3000), 1);
  assert.equal(Game.wrap(-1, 3000), 2999);
});

test('wrappedDelta selects the shortest direction across a seam', () => {
  assert.equal(Game.wrappedDelta(2990, 10, 3000), 20);
  assert.equal(Game.wrappedDelta(10, 2990, 3000), -20);
  assert.equal(Game.wrappedDelta(100, 140, 3000), 40);
});

test('wrappedDistance makes collisions continuous at world seams', () => {
  assert.equal(Game.wrappedDistance({ x: 2995, y: 100 }, { x: 5, y: 100 }, 3000), 10);
  assert.equal(Game.wrappedDistance({ x: 100, y: 2997 }, { x: 100, y: 3 }, 3000), 6);
});

test('fixed step and frame cap are safe, explicit simulation contracts', () => {
  assert.equal(Game.FIXED_DT, 1 / 60);
  assert.ok(Game.MAX_FRAME_TIME >= Game.FIXED_DT);
  assert.ok(Game.MAX_FRAME_TIME <= 0.25);
});

test('segment-circle intersection handles hits and misses', () => {
  assert.equal(Game.segCircleIntersect(-2, 0, 2, 0, 0, 0, 1), true);
  assert.equal(Game.segCircleIntersect(-2, 2, 2, 2, 0, 0, 1), false);
});

test('seeded generator is deterministic and bounded', () => {
  const a = Game.mulberry32(42);
  const b = Game.mulberry32(42);
  for (let i = 0; i < 100; i++) {
    const value = a();
    assert.equal(value, b());
    assert.ok(value >= 0 && value < 1);
  }
});

test('gravity edge easing is smooth and clamped', () => {
  assert.equal(Game.smoothstep(-1), 0);
  assert.equal(Game.smoothstep(0), 0);
  assert.equal(Game.smoothstep(0.5), 0.5);
  assert.equal(Game.smoothstep(1), 1);
  assert.equal(Game.smoothstep(2), 1);
});

test('camera look-ahead is capped and follows velocity', () => {
  assert.deepEqual(Game.cameraLookAhead(0, 0, 100), { x: 0, y: 0 });
  assert.deepEqual(Game.cameraLookAhead(400, 0, 100), { x: 100, y: 0 });
  const diagonal = Game.cameraLookAhead(30, 40, 100);
  assert.equal(Math.round(Math.hypot(diagonal.x, diagonal.y) * 10) / 10, 27.5);
});

test('time formatter produces stable mission clock', () => {
  assert.equal(Game.formatTime(0), '00:00');
  assert.equal(Game.formatTime(65.9), '01:05');
});

test('contracts have unique gameplay rules', () => {
  assert.equal(Game.CONTRACTS.length, 3);
  assert.equal(new Set(Game.CONTRACTS.map(contract => contract.rule)).size, 3);
});

test('campaign contains six distinct, playable routes', () => {
  assert.equal(Game.MISSIONS.length, 6);
  assert.equal(new Set(Game.MISSIONS.map(m => m.id)).size, 6);
  for (const mission of Game.MISSIONS) {
    assert.ok(mission.stations.length >= 2);
    assert.ok(mission.asteroids >= 0);
    assert.ok(Game.CONTRACTS.includes(mission.contract));
  }
});
