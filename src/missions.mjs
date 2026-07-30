export const MISSION_VERSION = 2;

export const CONTRACTS = Object.freeze([
  { id:'jelly', name:'Delikatna galaretka', icon:'hex', rule:'Przeciążenie powyżej 42 px/s² narusza ładunek', difficulty:'ŁATWY', route:'Bezpieczny łuk', reward:1200, color:'#c8ff58' },
  { id:'goose', name:'Zła gęś', icon:'wing', rule:'Zapowiedziany impuls boczny co 32 s', difficulty:'ŚREDNI', route:'Nerwowy skrót', reward:1550, color:'#ffc857' },
  { id:'singularity', name:'Mini-osobliwość', icon:'orbit', rule:'Przyciąga lekki gruz w promieniu 260 m', difficulty:'TRUDNY', route:'Gęsty pierścień', reward:1900, color:'#bca7ff' }
]);

const stations = [
  { id:'courier', type:'courier', name:'PORT LIMONKA', x:820, y:2220, radius:55, dockRadius:138, maxDockSpeed:88 },
  { id:'workshop', type:'workshop', name:'WARSZTAT PERYGEUM', x:2550, y:690, radius:62, dockRadius:142, maxDockSpeed:82 },
  { id:'kiosk', type:'kiosk', name:'KIOSK APogeum', x:4010, y:2240, radius:58, dockRadius:140, maxDockSpeed:86 },
  { id:'delivery', type:'delivery', name:'BŁĘKITNA PRZYSTAŃ', x:2440, y:4010, radius:66, dockRadius:145, maxDockSpeed:78 }
];
const asteroids = Array.from({length:12},(_,i)=>({ id:`a${i}`, orbit:570+(i%4)*165, phase:i*Math.PI/6+.18, radius:18+(i%3)*5, speed:(.025+(i%3)*.007)*(i%2?-1:1), fragments:0 }));

export const stage2Mission = {
  id:'round-01', version:MISSION_VERSION, seed:7319, title:'Ekspres przez Perygeum', worldSize:4800, timeLimit:720,
  start:{x:610,y:2220,angle:0},
  planets:[
    {id:'giant',kind:'giant',x:2390,y:2240,radius:360,influence:1180,mu:1800000,softening:205,maxAccel:70},
    {id:'moon',kind:'moon',x:3700,y:3380,radius:145,influence:520,mu:410000,softening:95,maxAccel:82}
  ],
  stations, asteroids,
  dust:[{id:'shortcut-dust',x:3300,y:2220,radius:430,softEdge:150,drag:.42,flow:{x:-.18,y:.05}}],
  legs:[
    {title:'NAUKA',target:'courier',safe:'Podejdź od zachodu',risk:'—'},
    {title:'WYBÓR SKRÓTU',target:'workshop',safe:'Północny objazd +35 s',risk:'Łuk gazowego olbrzyma'},
    {title:'KOMPLIKACJA',target:'kiosk',safe:'Nad polem pyłu +28 s',risk:'Pył: szybsza linia, słabszy ciąg'},
    {title:'EKSPRESOWY FINAŁ',target:'delivery',safe:'Zewnętrzna orbita księżyca',risk:'Ciasny łuk + premia stylu'}
  ]
};
stage2Mission.planet = stage2Mission.planets[0];
Object.freeze(stage2Mission);

// Alias keeps Stage 1 fixtures and compatible ghosts explicit.
export const license01 = stage2Mission;
export const SEEDS = Object.freeze({onboarding:7319,standard:18427,hard:99041});
export function missionForSeed(seed=SEEDS.onboarding){return {...stage2Mission,seed};}
export function contractById(id){return CONTRACTS.find(c=>c.id===id)||CONTRACTS[0];}
export function validateMission(m){const required=['id','version','seed','worldSize','start','planets','stations','asteroids','dust','legs'];for(const key of required)if(m[key]==null)throw new TypeError(`Mission missing ${key}`);if(m.stations.length!==4)throw new TypeError('Round needs four stations');if(m.asteroids.length!==12)throw new TypeError('Round starts with twelve asteroids');if(m.planets.length!==2)throw new TypeError('Round needs two gravity bodies');return true;}
export function mulberry32(seed){let a=seed>>>0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
