import {validateGame} from './engine.js';
const prefix='ludo-club-v1-';
export function read(key,fallback=null){try{return JSON.parse(localStorage.getItem(prefix+key))??fallback;}catch{return fallback;}}
export function write(key,value){try{localStorage.setItem(prefix+key,JSON.stringify(value));return true;}catch{return false;}}
export function loadGame(){const game=read('game');try{return validateGame(game)?game:null;}catch{return null;}}
export function saveGame(game){return write('game',game);}
export function clearGame(){try{localStorage.removeItem(prefix+'game');}catch{}}
export const emptyStats=()=>({games:0,wins:0,captures:0,rolls:0,sixes:0,finished:0,fastest:null,perfect:0,modes:{},recorded:[]});
export function recordGame(game){const stats=read('stats',emptyStats());if(stats.recorded.includes(game.id))return stats;
 const humans=game.players.map((p,i)=>p.type==='human'?i:-1).filter(i=>i>=0);const winner=game.players.find(p=>p.id===game.rankings[0]);const won=winner.type==='human';stats.games++;if(won){stats.wins++;stats.fastest=stats.fastest===null?game.elapsedMs:Math.min(stats.fastest,game.elapsedMs);if(game.stats.byPlayer[game.players.indexOf(winner)].captured===0)stats.perfect++;}
 for(const i of humans){const p=game.stats.byPlayer[i];for(const key of ['captures','rolls','sixes','finished'])stats[key]+=p[key];}
 const mode=game.players.some(p=>p.type==='bot')?'bot':'local';stats.modes[mode]??={games:0,wins:0};stats.modes[mode].games++;if(won)stats.modes[mode].wins++;stats.recorded.push(game.id);write('stats',stats);return stats;}
