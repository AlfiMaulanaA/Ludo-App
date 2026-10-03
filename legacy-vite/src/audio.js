export class AudioManager {
 constructor(settings){this.settings=settings;this.context=null;this.music=null;this.step=0;}
 unlock(){this.context??=new (window.AudioContext||window.webkitAudioContext)();if(this.context.state==='suspended')this.context.resume();}
 tone(frequency,duration,volume,type='sine'){if(this.settings.mute||!this.context||!volume)return;const oscillator=this.context.createOscillator(),gain=this.context.createGain(),now=this.context.currentTime;oscillator.type=type;oscillator.frequency.value=frequency;gain.gain.setValueAtTime(volume*.14,now);gain.gain.exponentialRampToValueAtTime(.001,now+duration);oscillator.connect(gain);gain.connect(this.context.destination);oscillator.start();oscillator.stop(now+duration);}
 play(type){const notes={click:[520],dice:[220,330,440],move:[660],capture:[330,180],finish:[523,659,784],victory:[523,659,784,1047]}[type]||[440];notes.forEach((n,i)=>setTimeout(()=>this.tone(n,.18,this.settings.sfxVolume/100,'triangle'),i*85));if(this.settings.haptic&&['capture','finish'].includes(type))navigator.vibrate?.(50);}
 start(){if(this.music)return;this.music=setInterval(()=>{const notes=[262,330,392,330,294,349,440,349];this.tone(notes[this.step++%notes.length],.7,this.settings.musicVolume/100);},650);}
 stop(){clearInterval(this.music);this.music=null;}
}
