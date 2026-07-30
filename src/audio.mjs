export class AudioFeedback {
  constructor(){this.ctx=null;this.last={};}
  unlock(){const C=globalThis.AudioContext||globalThis.webkitAudioContext;if(!C)return;this.ctx ||= new C();if(this.ctx.state==='suspended')this.ctx.resume();}
  tone(freq,duration=.12,volume=.035,type='sine'){if(!this.ctx)return;const o=this.ctx.createOscillator(),g=this.ctx.createGain(),t=this.ctx.currentTime;o.type=type;o.frequency.setValueAtTime(freq,t);g.gain.setValueAtTime(volume,t);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g).connect(this.ctx.destination);o.start(t);o.stop(t+duration);}
  update(state,input){if(input.thrust&&!this.last.thrust)this.tone(105,.18,.025,'sawtooth');if(input.brake&&!this.last.brake)this.tone(74,.2,.025,'triangle');if(state.gravityEntry&&!this.last.gravity)this.tone(330,.35,.025);if(state.dockMessage==='UTRZYMAJ'&&this.last.dock!=='UTRZYMAJ')this.tone(520,.12,.03);if(state.stationIndex>(this.last.station||0))this.tone(760,.4,.045);if(state.slingshot&&!this.last.slingshot)this.tone(940,.3,.04);this.last={thrust:input.thrust,brake:input.brake,gravity:state.gravityEntry,dock:state.dockMessage,station:state.stationIndex,slingshot:state.slingshot};}
}
