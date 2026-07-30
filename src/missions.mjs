export const MISSION_VERSION = 1;
export const license01 = Object.freeze({
  id: 'license-01', version: MISSION_VERSION, seed: 7319, title: 'Licencja kurierska: Pierwszy łuk',
  cargo: 'Pizza, wciąż teoretycznie ciepła', worldSize: 4400, timeLimit: 240,
  start: { x: 650, y: 2200, angle: 0 },
  planet: { id:'azure', x:2200, y:2200, radius:330, influence:1120, mu:1650000, softening:190, maxAccel:72 },
  stations: [
    { id:'pickup', name:'PORT LIMONKA', x:900, y:2200, radius:55, dockRadius:125, maxDockSpeed:85 },
    { id:'delivery', name:'BŁĘKITNA PRZYSTAŃ', x:3620, y:1540, radius:62, dockRadius:135, maxDockSpeed:82 }
  ],
  asteroids: Array.from({length:8},(_,i)=>({ id:`a${i}`, orbit:620+(i%2)*145, phase:i*Math.PI/4+.18, radius:20+(i%3)*5, speed:0.035+(i%2)*0.008 }))
});
export function validateMission(m) { const required=['id','version','seed','worldSize','start','planet','stations','asteroids']; for(const key of required) if(m[key] == null) throw new TypeError(`Mission missing ${key}`); if(m.stations.length!==2) throw new TypeError('Mission needs two stations'); if(m.asteroids.length!==8) throw new TypeError('license-01 needs eight asteroids'); return true; }
export function mulberry32(seed) { let a=seed>>>0; return () => { a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
