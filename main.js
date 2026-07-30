'use strict';
const $=id=>document.getElementById(id), screens=[...document.querySelectorAll('.screen')];
const ui={objective:$('objective'),distance:$('distance'),hull:$('hull'),cargo:$('cargo'),hullText:$('hullText'),cargoText:$('cargoText'),timer:$('timer'),style:$('style'),assist:$('assist'),radio:$('radio'),radioText:$('radioText'),prompt:$('prompt')};
let game=null,selected=Game.CONTRACTS[0],muted=localStorage.getItem('orbital-muted')==='1';
function show(id){screens.forEach(s=>s.classList.toggle('hidden',s.id!==id))}
function gameChrome(on){['hud','minimap'].forEach(id=>$(id).classList.toggle('hidden',!on));if(!on){$('radio').classList.add('hidden');$('prompt').classList.add('hidden')}}
function renderContracts(){const root=$('contractCards');root.innerHTML='';Game.CONTRACTS.forEach(c=>{const b=document.createElement('button');b.className='card';b.innerHTML=`<i>${c.icon}</i><h3>${c.name}</h3><p>${c.desc}</p><strong>${c.reward}</strong>`;b.onclick=()=>{selected=c;show('briefing')};root.appendChild(b)})}
function start(){if(game)game.destroy();show(null);gameChrome(true);game=new Game($('game'),$('minimap'),ui,{contract:selected,onEnd:summary});game.start()}
function summary(r){gameChrome(false);$('summaryLabel').textContent=r.ok?'KONTRAKT UKOŃCZONY':'KONTRAKT PRZERWANY';$('summaryTitle').textContent=r.ok?'Przesyłka dostarczona!':'Orbita wygrała tę rundę';$('summaryStats').innerHTML=`<div><span>CZAS</span><b>${Game.formatTime(r.time)}</b></div><div><span>ŁADUNEK</span><b>${Math.max(0,Math.round(r.cargo))}%</b></div><div><span>STYL</span><b>×${r.style.toFixed(1)}</b></div><div><span>SLINGSHOT</span><b>${r.bestSling||'—'} px/s</b></div>`;$('summaryQuip').textContent=r.quip;show('summary');refreshBest()}
function home(){if(game){game.destroy();game=null}gameChrome(false);show('menu');refreshBest()}
function refreshBest(){let best=null;for(const c of Game.CONTRACTS){try{const x=JSON.parse(localStorage.getItem(`orbital-ghost-${c.id}`));if(x&&(!best||x.time<best.time))best={...x,name:c.name}}catch{}}$('best').textContent=best?`Rekord: ${Game.formatTime(best.time)} · ${best.name}`:'Brak ukończonych tras'}
function tone(){if(muted)return;const A=window.AudioContext||window.webkitAudioContext,a=new A,o=a.createOscillator(),g=a.createGain();o.frequency.value=520;g.gain.value=.035;o.connect(g).connect(a.destination);o.start();o.stop(a.currentTime+.08)}
$('play').onclick=()=>{tone();show('contracts')};$('how').onclick=()=>show('help');$('launch').onclick=start;$('again').onclick=start;$('resume').onclick=()=>{show(null);game.paused=false;game.last=performance.now();gameChrome(true)};$('restart').onclick=start;ui.assist.onclick=()=>{game.assist=!game.assist;game.updateHUD()};
document.querySelectorAll('.back').forEach(b=>b.onclick=()=>show('menu'));document.querySelectorAll('.home').forEach(b=>b.onclick=home);
$('mute').onclick=()=>{muted=!muted;localStorage.setItem('orbital-muted',muted?'1':'0');$('mute').textContent=`DŹWIĘK: ${muted?'OFF':'ON'}`};
addEventListener('keydown',e=>{if(e.code==='Escape'&&game?.running){game.paused=!game.paused;if(game.paused){gameChrome(false);show('pause')}else{show(null);gameChrome(true);game.last=performance.now()}}});
$('mute').textContent=`DŹWIĘK: ${muted?'OFF':'ON'}`;renderContracts();refreshBest();gameChrome(false);
