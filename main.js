import Game from './game.js';

const canvas = document.getElementById('game');
const scoreEl = document.getElementById('score');
const statusEl = document.getElementById('status');
const timerEl = document.getElementById('timer');

const game = new Game(canvas, scoreEl, statusEl, timerEl);

game.start();
