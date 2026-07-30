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
