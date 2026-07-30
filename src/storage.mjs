import { SIM_VERSION } from './simulation.mjs';
const KEY='orbitalna-przesylka-ghost-v1';
export function saveGhost(storage,mission,state,samples){const ghost={format:1,simulation:SIM_VERSION,mission:mission.id,seed:mission.seed,assist:state.ship.assist,samples};storage?.setItem(KEY,JSON.stringify(ghost));return ghost;}
export function loadGhost(storage,mission,assist){try{const g=JSON.parse(storage?.getItem(KEY));return g?.format===1&&g.simulation===SIM_VERSION&&g.mission===mission.id&&g.seed===mission.seed&&g.assist===assist?g:null;}catch{return null;}}
export const memoryStorage=()=>{const data=new Map();return {setItem:(k,v)=>data.set(k,v),getItem:k=>data.get(k)||null};};
