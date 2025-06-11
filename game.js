const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = Math.max(window.innerWidth * 0.5, 800);
  canvas.height = Math.max(window.innerHeight * 0.5, 600);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const KEY_LEFT = 37;
const KEY_UP = 38;
const KEY_RIGHT = 39;
const KEY_SPACE = 32;

const startAngle = Math.random() * Math.PI * 2;
const ship = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  angle: 0,
  radius: 20,
  thrust: {
    x: Math.cos(startAngle) * 0.5,
    y: Math.sin(startAngle) * 0.5
  },
  canShoot: true,
  dead: false
};

let keys = {};
let bullets = [];
let asteroids = [];
let lastTime = 0;
let shipFragments = [];
let gameOver = false;
let restartTimer = 0;
const palette = ['#fff','#0ff','#f0f','#ff0','#0f0','#f00','#00f','#f80'];

function spawnInitialAsteroids(num) {
  for (let i = 0; i < num; i++) {
    spawnAsteroid();
  }
}

// Input handling
window.addEventListener('keydown', e => { keys[e.keyCode] = true; });
window.addEventListener('keyup', e => { keys[e.keyCode] = false; });

function spawnAsteroid() {
  if (asteroids.length >= 10) return;
  const x = Math.random() * canvas.width;
  const y = Math.random() * canvas.height;
  const angle = Math.random() * Math.PI * 2;
  const speed = Math.random() * 0.5 + 0.2;
  const dx = Math.cos(angle) * speed;
  const dy = Math.sin(angle) * speed;
  const radius = Math.random() * 30 + 20;
  const points = [];
  const count = Math.floor(Math.random() * 5) + 5;
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const r = radius * (0.7 + Math.random() * 0.3);
    points.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
  }
  const color = palette[Math.floor(Math.random()*palette.length)];
  asteroids.push({ x, y, dx, dy, radius, points, color });
}

function breakAsteroid(a, impactAngle) {
  const count = Math.max(2, Math.floor(a.radius / 15));
  for (let i = 0; i < count; i++) {
    const angle = impactAngle + Math.PI + (Math.random() - 0.5) * Math.PI / 2;
    const speed = Math.random() * 0.5 + 0.2;
    const dx = Math.cos(angle) * speed;
    const dy = Math.sin(angle) * speed;
    const radius = a.radius / 2 * (0.5 + Math.random() * 0.5);
    const pts = [];
    const pc = Math.floor(Math.random() * 5) + 5;
    for (let j = 0; j < pc; j++) {
      const ang = (j / pc) * Math.PI * 2;
      const r = radius * (0.7 + Math.random() * 0.3);
      pts.push({ x: Math.cos(ang) * r, y: Math.sin(ang) * r });
    }
    const color = palette[Math.floor(Math.random() * palette.length)];
    asteroids.push({ x: a.x, y: a.y, dx, dy, radius, points: pts, color });
  }
}

function explodeShip() {
  ship.dead = true;
  shipFragments = [];
  const pts = [
    { x: ship.radius, y: 0 },
    { x: -ship.radius, y: ship.radius / 2 },
    { x: -ship.radius, y: -ship.radius / 2 }
  ];
  for (let i = 0; i < pts.length; i++) {
    const p1 = pts[i];
    const p2 = pts[(i + 1) % pts.length];
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 1 + 0.5;
    shipFragments.push({
      x: ship.x,
      y: ship.y,
      x1: p1.x,
      y1: p1.y,
      x2: p2.x,
      y2: p2.y,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
      rot: 0,
      dr: (Math.random() - 0.5) * 5
    });
  }
  gameOver = true;
  restartTimer = 5;
}

function restartGame(){
  ship.dead = false;
  ship.x = canvas.width / 2;
  ship.y = canvas.height / 2;
  ship.angle = 0;
  const ang = Math.random() * Math.PI * 2;
  ship.thrust.x = Math.cos(ang) * 0.5;
  ship.thrust.y = Math.sin(ang) * 0.5;
  shipFragments = [];
  bullets = [];
  asteroids = [];
  gameOver = false;
  spawnInitialAsteroids(Math.floor(Math.random()*10)+1);
}

function update(dt){
  if(gameOver){
    shipFragments.forEach(f => {
      f.x += f.dx;
      f.y += f.dy;
      f.rot += f.dr;
    });
    restartTimer -= dt;
    if(restartTimer <= 0){
      restartGame();
    }
    return;
  }
  // Ship rotation
  if(keys[KEY_LEFT]) ship.angle -= 3*dt;
  if(keys[KEY_RIGHT]) ship.angle += 3*dt;

  // Thrust
  if(keys[KEY_UP]){
    ship.thrust.x += Math.cos(ship.angle)*0.1;
    ship.thrust.y += Math.sin(ship.angle)*0.1;
  } else {
    ship.thrust.x *= 0.99;
    ship.thrust.y *= 0.99;
  }
  ship.x += ship.thrust.x;
  ship.y += ship.thrust.y;

  // Screen wrap
  if(ship.x < 0) ship.x += canvas.width;
  if(ship.x > canvas.width) ship.x -= canvas.width;
  if(ship.y < 0) ship.y += canvas.height;
  if(ship.y > canvas.height) ship.y -= canvas.height;

  // Shooting
  if(keys[KEY_SPACE] && ship.canShoot){
    bullets.push({
      x: ship.x + Math.cos(ship.angle)*ship.radius,
      y: ship.y + Math.sin(ship.angle)*ship.radius,
      dx: Math.cos(ship.angle)*5 + ship.thrust.x,
      dy: Math.sin(ship.angle)*5 + ship.thrust.y,
      life: 60
    });
    ship.canShoot = false;
  }
  if(!keys[KEY_SPACE]) ship.canShoot = true;

  bullets.forEach((b, bi) => {
    b.x += b.dx;
    b.y += b.dy;
    b.life -= 1;
    if(!ship.dead && Math.hypot(b.x - ship.x, b.y - ship.y) < ship.radius){
      bullets.splice(bi,1);
      explodeShip();
    }
  });
  bullets = bullets.filter(b => b.life > 0);

  asteroids.forEach(a => {
    a.x += a.dx; a.y += a.dy;
    if(a.x< -a.radius) a.x = canvas.width+a.radius;
    if(a.x> canvas.width+a.radius) a.x = -a.radius;
    if(a.y< -a.radius) a.y = canvas.height+a.radius;
    if(a.y> canvas.height+a.radius) a.y = -a.radius;
  });

  // Collision detection bullets vs asteroids
  bullets.forEach((b, bi) => {
    asteroids.forEach((a, ai) => {
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      if(Math.hypot(dx, dy) < a.radius){
        const angle = Math.atan2(a.y - b.y, a.x - b.x);
        asteroids.splice(ai,1);
        bullets.splice(bi,1);
        breakAsteroid(a, angle);
      }
    });
  });

  // Collision detection ship vs asteroids
  asteroids.forEach((a, ai) => {
    if(!ship.dead && Math.hypot(ship.x - a.x, ship.y - a.y) < ship.radius + a.radius){
      const angle = Math.atan2(a.y - ship.y, a.x - ship.x);
      asteroids.splice(ai,1);
      explodeShip();
      breakAsteroid(a, angle);
    }
  });

}

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // Draw ship or fragments
  ctx.strokeStyle = 'white';
  if(!ship.dead){
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.beginPath();
    ctx.moveTo(ship.radius,0);
    ctx.lineTo(-ship.radius,ship.radius/2);
    ctx.lineTo(-ship.radius,-ship.radius/2);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  } else {
    shipFragments.forEach(f => {
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(f.rot);
      ctx.beginPath();
      ctx.moveTo(f.x1, f.y1);
      ctx.lineTo(f.x2, f.y2);
      ctx.stroke();
      ctx.restore();
    });
  }

  // Draw bullets
  ctx.fillStyle='white';
  bullets.forEach(b => ctx.fillRect(b.x-2,b.y-2,4,4));

  // Draw asteroids
  asteroids.forEach(a => {
    ctx.beginPath();
    ctx.moveTo(a.x + a.points[0].x, a.y + a.points[0].y);
    for (let i = 1; i < a.points.length; i++) {
      ctx.lineTo(a.x + a.points[i].x, a.y + a.points[i].y);
    }
    ctx.closePath();
    ctx.strokeStyle = a.color;
    ctx.stroke();
  });

  if(gameOver){
    ctx.fillStyle = 'white';
    ctx.font = '48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width/2, canvas.height/2);
    ctx.font = '24px sans-serif';
    ctx.fillText('Restarting in ' + Math.ceil(restartTimer), canvas.width/2, canvas.height/2 + 40);
  }
}

function loop(timestamp){
  const dt = (timestamp - lastTime)/1000;
  lastTime = timestamp;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

spawnInitialAsteroids(Math.floor(Math.random()*10)+1);
requestAnimationFrame(loop);
