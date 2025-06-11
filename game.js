const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const statusEl = document.getElementById('status');

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
let respawnTimer = 0;
let spawnInvul = 0;
let flashTimer = 0;
let particles = [];
let asteroidLines = [];
let lives = 5;
let armor = 5;
let score = 0;
const palette = ['#fff','#0ff','#f0f','#ff0','#0f0','#f00','#00f','#f80'];

function updateTopbar(){
  scoreEl.textContent = 'Score: ' + String(Math.floor(score)).padStart(5,'0');
  statusEl.innerHTML = 'Lives: ' + String(lives).padStart(2,'0') + '&nbsp;&nbsp;Armor: ' + '|'.repeat(armor);
}

function addScore(hp){
  score += Math.pow(2,hp);
  if(score>99999) score = 99999;
  updateTopbar();
}

function spawnParticles(x,y,count,color){
  for(let i=0;i<count;i++){
    const ang = Math.random()*Math.PI*2;
    const spd = Math.random()*1+0.5;
    particles.push({x,y,dx:Math.cos(ang)*spd,dy:Math.sin(ang)*spd,life:1,color});
  }
}

function explodeAsteroid(a){
  for(let i=0;i<a.points.length;i++){
    const p1=a.points[i];
    const p2=a.points[(i+1)%a.points.length];
    const ang=Math.atan2((p1.y+p2.y)/2,(p1.x+p2.x)/2);
    asteroidLines.push({x:a.x,y:a.y,x1:p1.x,y1:p1.y,x2:p2.x,y2:p2.y,dx:Math.cos(ang),dy:Math.sin(ang),life:1,color:a.color});
  }
}

updateTopbar();

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
  const hp = Math.max(1, Math.round(radius/15));
  const mass = radius * 0.5;
  asteroids.push({ x, y, dx, dy, radius, points, color, hp, mass });
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
    const hp = Math.max(1, a.hp - 1);
    const mass = radius * 0.5;
    if(radius > 12){
      asteroids.push({ x: a.x, y: a.y, dx, dy, radius, points: pts, color, hp, mass });
    }
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
      dr: (Math.random() - 0.5) * 2
    });
  }
  lives -= 1;
  updateTopbar();
  if(lives <= 0){
    gameOver = true;
    restartTimer = 5;
  } else {
    respawnTimer = 1;
  }
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
  lives = 5;
  armor = 5;
  score = 0;
  updateTopbar();
  spawnInitialAsteroids(Math.floor(Math.random()*10)+1);
}

function respawnShip(){
  ship.dead = false;
  ship.x = canvas.width/2;
  ship.y = canvas.height/2;
  ship.angle = 0;
  const ang = Math.random()*Math.PI*2;
  ship.thrust.x = Math.cos(ang)*0.5;
  ship.thrust.y = Math.sin(ang)*0.5;
  armor = 5;
  spawnInvul = 3;
  shipFragments = [];
  updateTopbar();
  let tries=0;
  while(asteroids.some(a=>Math.hypot(ship.x-a.x,ship.y-a.y)<ship.radius+a.radius+20) && tries<50){
    ship.x = Math.random()*canvas.width;
    ship.y = Math.random()*canvas.height;
    tries++;
  }
}

function update(dt){
  if(gameOver){
    shipFragments.forEach(f=>{f.x+=f.dx;f.y+=f.dy;f.rot+=f.dr*dt;});
    particles.forEach(p=>{p.x+=p.dx;p.y+=p.dy;p.life-=dt;});
    particles = particles.filter(p=>p.life>0);
    asteroidLines.forEach(l=>{l.x+=l.dx;l.y+=l.dy;l.life-=dt;});
    asteroidLines = asteroidLines.filter(l=>l.life>0);
    restartTimer -= dt;
    if(restartTimer<=0) restartGame();
    return;
  }

  if(ship.dead){
    shipFragments.forEach(f=>{f.x+=f.dx;f.y+=f.dy;f.rot+=f.dr*dt;});
    respawnTimer -= dt;
    if(respawnTimer<=0) respawnShip();
  } else {
    if(keys[KEY_LEFT]) ship.angle -= 3*dt;
    if(keys[KEY_RIGHT]) ship.angle += 3*dt;
    if(keys[KEY_UP]){
      ship.thrust.x += Math.cos(ship.angle)*0.1;
      ship.thrust.y += Math.sin(ship.angle)*0.1;
    } else {
      ship.thrust.x *= 0.99;
      ship.thrust.y *= 0.99;
    }
    ship.x += ship.thrust.x;
    ship.y += ship.thrust.y;
    if(ship.x<0) ship.x += canvas.width;
    if(ship.x>canvas.width) ship.x -= canvas.width;
    if(ship.y<0) ship.y += canvas.height;
    if(ship.y>canvas.height) ship.y -= canvas.height;
    if(keys[KEY_SPACE] && ship.canShoot){
      bullets.push({x:ship.x+Math.cos(ship.angle)*ship.radius,y:ship.y+Math.sin(ship.angle)*ship.radius,dx:Math.cos(ship.angle)*5+ship.thrust.x,dy:Math.sin(ship.angle)*5+ship.thrust.y,life:2});
      ship.canShoot=false;
    }
    if(!keys[KEY_SPACE]) ship.canShoot=true;
  }

  spawnInvul = Math.max(0, spawnInvul - dt);
  flashTimer = Math.max(0, flashTimer - dt);

  bullets.forEach((b,bi)=>{
    b.x+=b.dx; b.y+=b.dy; b.life-=dt;
    if(b.x<0) b.x+=canvas.width;
    if(b.x>canvas.width) b.x-=canvas.width;
    if(b.y<0) b.y+=canvas.height;
    if(b.y>canvas.height) b.y-=canvas.height;
    if(!ship.dead && spawnInvul<=0 && Math.hypot(b.x-ship.x,b.y-ship.y)<ship.radius){
      bullets.splice(bi,1);
      spawnParticles(b.x,b.y,5,'#f00');
      armor-=1; flashTimer=2; updateTopbar();
      if(armor<=0) explodeShip();
    }
  });
  bullets = bullets.filter(b=>b.life>0);

  asteroids.forEach(a=>{
    a.x+=a.dx; a.y+=a.dy;
    if(a.x < -a.radius) a.x += canvas.width + a.radius*2;
    if(a.x > canvas.width + a.radius) a.x -= canvas.width + a.radius*2;
    if(a.y < -a.radius) a.y += canvas.height + a.radius*2;
    if(a.y > canvas.height + a.radius) a.y -= canvas.height + a.radius*2;
  });

  bullets.forEach((b,bi)=>{
    asteroids.forEach((a,ai)=>{
      if(Math.hypot(b.x-a.x,b.y-a.y)<a.radius){
        bullets.splice(bi,1);
        addScore(a.hp);
        spawnParticles(b.x,b.y,5,a.color);
        a.dx += b.dx*0.5/a.mass;
        a.dy += b.dy*0.5/a.mass;
        a.hp -= 1;
        if(a.hp<=0){
          asteroids.splice(ai,1);
          explodeAsteroid(a);
          breakAsteroid(a, Math.atan2(a.y-b.y,a.x-b.x));
        }
      }
    });
  });

  for(let i=0;i<asteroids.length;i++){
    const a=asteroids[i];
    for(let j=i+1;j<asteroids.length;j++){
      const b=asteroids[j];
      if(Math.hypot(a.x-b.x,a.y-b.y)<a.radius+b.radius){
        const ang=Math.atan2(b.y-a.y,b.x-a.x);
        const force=0.5;
        a.dx-=Math.cos(ang)*force*b.mass/a.mass;
        a.dy-=Math.sin(ang)*force*b.mass/a.mass;
        b.dx+=Math.cos(ang)*force*a.mass/b.mass;
        b.dy+=Math.sin(ang)*force*a.mass/b.mass;
        const cx=(a.x+b.x)/2;
        const cy=(a.y+b.y)/2;
        spawnParticles(cx,cy,5,a.color);
        spawnParticles(cx,cy,5,b.color);
        a.hp-=0.5;
        b.hp-=0.5;
        if(a.hp<=0){
          asteroids.splice(i,1);
          explodeAsteroid(a);
          breakAsteroid(a, ang+Math.PI);
          i--; break;
        }
        if(b.hp<=0){
          asteroids.splice(j,1);
          explodeAsteroid(b);
          breakAsteroid(b, ang);
          j--;
        }
      }
    }
  }

  asteroids.forEach((a,ai)=>{
    if(!ship.dead && Math.hypot(ship.x-a.x, ship.y-a.y) < ship.radius + a.radius){
      const ang = Math.atan2(a.y - ship.y, a.x - ship.x);
      const force = 0.5;
      ship.thrust.x -= Math.cos(ang)*force*a.mass/5;
      ship.thrust.y -= Math.sin(ang)*force*a.mass/5;
      a.dx += Math.cos(ang)*force*5/a.mass;
      a.dy += Math.sin(ang)*force*5/a.mass;
      if(spawnInvul<=0){
        armor-=1; flashTimer=2; updateTopbar();
        spawnParticles(ship.x+Math.cos(ang)*ship.radius, ship.y+Math.sin(ang)*ship.radius,10,'#f00');
        a.hp -=1;
        if(armor<=0) explodeShip();
      }
      if(a.hp<=0){
        asteroids.splice(ai,1);
        explodeAsteroid(a);
        breakAsteroid(a, ang);
      }
    }
  });

  particles.forEach(p=>{p.x+=p.dx;p.y+=p.dy;p.life-=dt;});
  particles = particles.filter(p=>p.life>0);
  asteroidLines.forEach(l=>{l.x+=l.dx;l.y+=l.dy;l.life-=dt;});
  asteroidLines = asteroidLines.filter(l=>l.life>0);
}

function drawWrapped(x,y,r,fn){
  for(let ox=-1;ox<=1;ox++){
    for(let oy=-1;oy<=1;oy++){
      const nx=x+ox*canvas.width;
      const ny=y+oy*canvas.height;
      if(nx+r<0||nx-r>canvas.width||ny+r<0||ny-r>canvas.height) continue;
      ctx.save();
      ctx.translate(ox*canvas.width,oy*canvas.height);
      fn();
      ctx.restore();
    }
  }
}

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  asteroidLines.forEach(l=>{
    ctx.save();
    ctx.globalAlpha = l.life;
    drawWrapped(l.x,l.y,0,()=>{ctx.beginPath();ctx.moveTo(l.x1,l.y1);ctx.lineTo(l.x2,l.y2);ctx.strokeStyle=l.color;ctx.stroke();});
    ctx.restore();
  });

  particles.forEach(p=>{
    ctx.save();
    ctx.globalAlpha = Math.max(0,p.life);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x,p.y,2,2);
    ctx.restore();
  });

  ctx.strokeStyle = flashTimer>0 ? '#f00' : '#fff';
  if(!ship.dead){
    if(spawnInvul<=0 || Math.floor(spawnInvul*10)%2===0){
      drawWrapped(ship.x, ship.y, ship.radius, ()=>{
        ctx.beginPath();
        ctx.moveTo(ship.x + ship.radius, ship.y);
        ctx.lineTo(ship.x - ship.radius, ship.y + ship.radius/2);
        ctx.lineTo(ship.x - ship.radius, ship.y - ship.radius/2);
        ctx.closePath();
        ctx.stroke();
      });
    }
  } else {
    shipFragments.forEach(f=>{
      drawWrapped(f.x,f.y,0,()=>{
        ctx.save();
        ctx.translate(f.x,f.y);
        ctx.rotate(f.rot);
        ctx.beginPath();
        ctx.moveTo(f.x1,f.y1);
        ctx.lineTo(f.x2,f.y2);
        ctx.stroke();
        ctx.restore();
      });
    });
  }

  ctx.fillStyle='white';
  bullets.forEach(b=>drawWrapped(b.x,b.y,2,()=>ctx.fillRect(b.x-2,b.y-2,4,4)));

  asteroids.forEach(a=>{
    ctx.strokeStyle=a.color;
    drawWrapped(a.x,a.y,a.radius,()=>{
      ctx.beginPath();
      ctx.moveTo(a.points[0].x + a.x, a.points[0].y + a.y);
      for(let i=1;i<a.points.length;i++) ctx.lineTo(a.points[i].x + a.x, a.points[i].y + a.y);
      ctx.closePath();
      ctx.stroke();
    });
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
