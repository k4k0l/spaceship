const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const KEY_LEFT = 37;
const KEY_UP = 38;
const KEY_RIGHT = 39;
const KEY_SPACE = 32;

const ship = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  angle: 0,
  radius: 20,
  thrust: {x:0, y:0},
  canShoot: true
};

let keys = {};
let bullets = [];
let asteroids = [];
let lastTime = 0;

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
  asteroids.push({ x, y, dx, dy, radius, points });
}

function update(dt){
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

  bullets.forEach(b => {
    b.x += b.dx; b.y += b.dy; b.life -=1;
  });
  bullets = bullets.filter(b => b.life>0);

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
        asteroids.splice(ai,1);
        bullets.splice(bi,1);
      }
    });
  });

  // Collision detection ship vs asteroids
  for(let a of asteroids){
    if(Math.hypot(ship.x-a.x, ship.y-a.y) < ship.radius+a.radius){
      alert('Game Over!');
      document.location.reload();
    }
  }

}

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // Draw ship
  ctx.save();
  ctx.translate(ship.x, ship.y);
  ctx.rotate(ship.angle);
  ctx.beginPath();
  ctx.moveTo(ship.radius,0);
  ctx.lineTo(-ship.radius,ship.radius/2);
  ctx.lineTo(-ship.radius,-ship.radius/2);
  ctx.closePath();
  ctx.strokeStyle = 'white';
  ctx.stroke();
  ctx.restore();

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
    ctx.stroke();
  });
}

function loop(timestamp){
  const dt = (timestamp - lastTime)/1000;
  lastTime = timestamp;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

spawnInitialAsteroids(5);
requestAnimationFrame(loop);
