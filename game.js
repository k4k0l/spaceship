const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const topbar = document.getElementById('topbar');
const livesEl = document.getElementById('lives');
const armorEl = document.getElementById('armor');
const scoreEl = document.getElementById('score');

let lives = 5;
let armor = 5;
let score = 0;

let armorFlashTime = 0;

function updateUI() {
  livesEl.textContent = 'Lives: ' + String(lives).padStart(2, '0');
  let armorHTML = '';
  for(let i=0;i<armor;i++) armorHTML += '|';
  if(armorFlashTime>0) armorHTML += '<span class="flash">|</span>';
  armorEl.innerHTML = 'Armor: ' + armorHTML;
  scoreEl.textContent = 'Score: ' + String(score).padStart(5, '0');
}

function resizeCanvas() {
  canvas.width = Math.max(window.innerWidth * 0.5, 800);
  canvas.height = Math.max(window.innerHeight * 0.5, 600);
  document.getElementById('container').style.width = canvas.width + 'px';
  topbar.style.width = canvas.width + 'px';
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();
updateUI();

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
  mass: 10,
  thrust: {
    x: Math.cos(startAngle) * 0.5,
    y: Math.sin(startAngle) * 0.5
  },
  canShoot: true,
  dead: false,
  invincible: 0,
  flash: 0
};

let keys = {};
let bullets = [];
let asteroids = [];
let lastTime = 0;
let shipFragments = [];
let asteroidFragments = [];
let particles = [];
let gameOver = false;
let restartTimer = 0;
let respawnTimer = 0;
const palette = ['#fff','#0ff','#f0f','#ff0','#0f0','#f00','#00f','#f80'];

function wrapDraw(drawFn, x, y, r){
  drawFn(x,y);
  if(x<r) drawFn(x+canvas.width, y);
  if(x>canvas.width-r) drawFn(x-canvas.width, y);
  if(y<r) drawFn(x, y+canvas.height);
  if(y>canvas.height-r) drawFn(x, y-canvas.height);
  if(x<r && y<r) drawFn(x+canvas.width, y+canvas.height);
  if(x<r && y>canvas.height-r) drawFn(x+canvas.width, y-canvas.height);
  if(x>canvas.width-r && y<r) drawFn(x-canvas.width, y+canvas.height);
  if(x>canvas.width-r && y>canvas.height-r) drawFn(x-canvas.width, y-canvas.height);
}

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
  const health = Math.ceil(radius/15);
  const mass = radius * radius / 100;
  asteroids.push({ x, y, dx, dy, radius, points, color, health, mass });
}

function breakAsteroid(a, impactAngle) {
  const count = Math.max(2, Math.floor(a.radius / 15));
  for (let i = 0; i < count; i++) {
    const angle = impactAngle + Math.PI + (Math.random() - 0.5) * Math.PI / 2;
    const speed = Math.random() * 0.5 + 0.2;
    const dx = Math.cos(angle) * speed;
    const dy = Math.sin(angle) * speed;
    let radius = a.radius / 2 * (0.5 + Math.random() * 0.5);
    radius = Math.max(radius, 8);
    const pts = [];
    const pc = Math.floor(Math.random() * 5) + 5;
    for (let j = 0; j < pc; j++) {
      const ang = (j / pc) * Math.PI * 2;
      const r = radius * (0.7 + Math.random() * 0.3);
      pts.push({ x: Math.cos(ang) * r, y: Math.sin(ang) * r });
    }
    const color = palette[Math.floor(Math.random() * palette.length)];
    const health = Math.max(1, a.health - 1);
    const mass = radius * radius / 100;
    asteroids.push({ x: a.x, y: a.y, dx, dy, radius, points: pts, color, health, mass });
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
    const speed = Math.random() * 0.3 + 0.1;
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
  lives--;
  updateUI();
  if(lives <= 0){
    gameOver = true;
    restartTimer = 5;
  } else {
    respawnTimer = 1;
  }
}

function spawnShip(){
  ship.dead = false;
  ship.x = canvas.width/2;
  ship.y = canvas.height/2;
  ship.angle = 0;
  const ang = Math.random()*Math.PI*2;
  ship.thrust.x = Math.cos(ang)*0.5;
  ship.thrust.y = Math.sin(ang)*0.5;
  ship.invincible = 3;
  armor = 5;
  shipFragments = [];
  updateUI();
}

function explodeAsteroid(a){
  a.points.forEach((p,i)=>{
    const next=a.points[(i+1)%a.points.length];
    asteroidFragments.push({
      x:a.x,
      y:a.y,
      x1:p.x,
      y1:p.y,
      x2:next.x,
      y2:next.y,
      dx: (p.x+next.x)/20,
      dy: (p.y+next.y)/20,
      life:1
    });
  });
}

function handleShipHit(a){
  if(ship.invincible>0 || ship.dead) return;
  armorFlashTime = 2;
  if(armor>0) armor--;
  ship.flash = 2;
  if(a){
    a.health -= 1;
    score += Math.pow(2,a.health+1);
    if(a.health<=0){
      const angle=Math.atan2(a.dy,a.dx);
      breakAsteroid(a,angle);
      explodeAsteroid(a);
      asteroids.splice(asteroids.indexOf(a),1);
    }
  }
  updateUI();
  if(armor<=0) explodeShip();
}

function restartGame(){
  lives = 5;
  score = 0;
  bullets = [];
  asteroids = [];
  asteroidFragments = [];
  shipFragments = [];
  particles = [];
  gameOver = false;
  respawnTimer = 0;
  spawnInitialAsteroids(Math.floor(Math.random()*10)+1);
  spawnShip();
}

function update(dt){
  if(gameOver){
    shipFragments.forEach(f=>{f.x+=f.dx;f.y+=f.dy;f.rot+=f.dr;});
    asteroidFragments.forEach(f=>{f.x+=f.dx;f.y+=f.dy;f.life-=dt;});
    particles.forEach(p=>{p.x+=p.dx;p.y+=p.dy;p.life-=dt;});
    asteroidFragments=asteroidFragments.filter(f=>f.life>0);
    particles=particles.filter(p=>p.life>0);
    restartTimer-=dt;
    if(restartTimer<=0) restartGame();
    return;
  }

  shipFragments.forEach(f=>{f.x+=f.dx;f.y+=f.dy;f.rot+=f.dr;});
  asteroidFragments.forEach(f=>{f.x+=f.dx;f.y+=f.dy;f.life-=dt;});
  particles.forEach(p=>{p.x+=p.dx;p.y+=p.dy;p.life-=dt;});
  asteroidFragments=asteroidFragments.filter(f=>f.life>0);
  particles=particles.filter(p=>p.life>0);

  if(ship.dead){
    respawnTimer-=dt;
    if(respawnTimer<=0) spawnShip();
  } else {
    if(keys[KEY_LEFT]) ship.angle-=3*dt;
    if(keys[KEY_RIGHT]) ship.angle+=3*dt;

    if(keys[KEY_UP]){
      ship.thrust.x += Math.cos(ship.angle)*0.1;
      ship.thrust.y += Math.sin(ship.angle)*0.1;
    } else {
      ship.thrust.x *= 0.99;
      ship.thrust.y *= 0.99;
    }
    ship.x += ship.thrust.x;
    ship.y += ship.thrust.y;

    if(ship.x < 0) ship.x += canvas.width;
    if(ship.x > canvas.width) ship.x -= canvas.width;
    if(ship.y < 0) ship.y += canvas.height;
    if(ship.y > canvas.height) ship.y -= canvas.height;

    if(keys[KEY_SPACE] && ship.canShoot){
      bullets.push({
        x: ship.x + Math.cos(ship.angle)*ship.radius,
        y: ship.y + Math.sin(ship.angle)*ship.radius,
        dx: Math.cos(ship.angle)*5 + ship.thrust.x,
        dy: Math.sin(ship.angle)*5 + ship.thrust.y,
        life: 60,
        mass: 1
      });
      ship.canShoot = false;
    }
    if(!keys[KEY_SPACE]) ship.canShoot = true;
  }

  if(ship.invincible>0) ship.invincible -= dt;
  if(ship.flash>0) ship.flash -= dt;
  if(armorFlashTime>0) { armorFlashTime -= dt; if(armorFlashTime<=0) updateUI(); }

  bullets.forEach((b,bi)=>{
    b.x += b.dx; b.y += b.dy; b.life -=1;
    if(!ship.dead && Math.hypot(b.x-ship.x,b.y-ship.y)<ship.radius){
      bullets.splice(bi,1);
      handleShipHit(null);
    }
  });
  bullets = bullets.filter(b=>b.life>0);

  asteroids.forEach(a=>{
    a.x += a.dx; a.y += a.dy;
    if(a.x< -a.radius) a.x += canvas.width+a.radius*2;
    if(a.x> canvas.width+a.radius) a.x -= canvas.width+a.radius*2;
    if(a.y< -a.radius) a.y += canvas.height+a.radius*2;
    if(a.y> canvas.height+a.radius) a.y -= canvas.height+a.radius*2;
  });

  bullets.forEach((b,bi)=>{
    asteroids.forEach((a,ai)=>{
      const dx = b.x - a.x; const dy = b.y - a.y;
      if(Math.hypot(dx,dy)<a.radius){
        const dist=Math.hypot(dx,dy); const nx=dx/dist; const ny=dy/dist;
        a.dx += nx*(b.mass/a.mass);
        a.dy += ny*(b.mass/a.mass);
        bullets.splice(bi,1);
        a.health -=1; score += Math.pow(2,a.health+1); updateUI();
        particles.push({x:b.x,y:b.y,dx:nx,dy:ny,life:1});
        if(a.health<=0){
          asteroids.splice(ai,1);
          breakAsteroid(a, Math.atan2(-ny,-nx));
          explodeAsteroid(a);
        }
      }
    });
  });

  asteroids.forEach((a,ai)=>{
    if(!ship.dead && Math.hypot(ship.x-a.x, ship.y-a.y)<ship.radius+a.radius){
      const dx = a.x - ship.x; const dy = a.y - ship.y; const dist=Math.hypot(dx,dy); const nx=dx/dist; const ny=dy/dist;
      a.dx += nx*(ship.mass/a.mass);
      a.dy += ny*(ship.mass/a.mass);
      ship.thrust.x -= nx*(a.mass/ship.mass);
      ship.thrust.y -= ny*(a.mass/ship.mass);
      particles.push({x:ship.x+nx*ship.radius, y:ship.y+ny*ship.radius, dx:nx,dy:ny,life:1});
      handleShipHit(a);
    }
  });
}

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  function drawShipAt(x,y){
    ctx.save();
    ctx.translate(x,y);
    ctx.rotate(ship.angle);
    ctx.beginPath();
    ctx.moveTo(ship.radius,0);
    ctx.lineTo(-ship.radius,ship.radius/2);
    ctx.lineTo(-ship.radius,-ship.radius/2);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  ctx.strokeStyle = ship.flash>0 ? 'red' : 'white';
  if(!ship.dead){
    if(ship.invincible<=0 || Math.floor(ship.invincible*10)%2===0){
      wrapDraw(drawShipAt, ship.x, ship.y, ship.radius);
    }
  } else {
    shipFragments.forEach(f=>{
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
  bullets.forEach(b => wrapDraw((x,y)=>ctx.fillRect(x-2,y-2,4,4), b.x, b.y, 2));

  // Draw asteroids
  asteroids.forEach(a => {
    ctx.strokeStyle = a.color;
    function drawAst(x,y){
      ctx.beginPath();
      ctx.moveTo(x + a.points[0].x, y + a.points[0].y);
      for(let i=1;i<a.points.length;i++) ctx.lineTo(x + a.points[i].x, y + a.points[i].y);
      ctx.closePath();
      ctx.stroke();
    }
    wrapDraw(drawAst, a.x, a.y, a.radius);
  });

  asteroidFragments.forEach(f=>{
    ctx.save();
    ctx.translate(f.x,f.y);
    ctx.beginPath();
    ctx.moveTo(f.x1,f.y1);
    ctx.lineTo(f.x2,f.y2);
    ctx.strokeStyle='white';
    ctx.globalAlpha = f.life;
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.restore();
  });

  particles.forEach(p=>{
    ctx.fillStyle='white';
    ctx.globalAlpha = p.life;
    wrapDraw((x,y)=>ctx.fillRect(x,y,2,2), p.x, p.y, 2);
    ctx.globalAlpha=1;
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
