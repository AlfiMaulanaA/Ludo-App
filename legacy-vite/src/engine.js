import {COLORS, FINISH, getGlobalTile, isSafe, syncPiece} from './board.js';
export const DEFAULT_SETTINGS = {autoMove:true,turnTimer:0,tripleSix:true,bonusTurnOnCapture:true,enableBlockRule:false,safeStarts:true,musicVolume:20,sfxVolume:65,mute:false,animationSpeed:1,reduceMotion:false,haptic:false};
export function rollDice(random = () => { const n = new Uint32Array(1); do { crypto.getRandomValues(n); } while(n[0] >= 4294967292); return n[0] / 4294967292; }) {return Math.floor(random()*6)+1;}
export function createGame(config, settings={}) {
 const merged={...DEFAULT_SETTINGS,...settings};
 return {version:1,id:globalThis.crypto?.randomUUID?.() ?? String(Date.now()),players:config.map((p,i)=>({...p,id:`p${i}`,isFinished:false,rank:null,pieces:Array.from({length:4},(_,j)=>{const piece={id:`p${i}-${j}`,playerId:`p${i}`,color:p.color,progress:-1};syncPiece(piece,merged);return piece;})})),currentPlayerIndex:0,diceValue:null,consecutiveSixes:0,turnState:'WAITING_FOR_ROLL',rankings:[],settings:merged,events:[],stats:{rolls:0,sixes:0,captures:0,finished:0,byPlayer:config.map(()=>({captures:0,captured:0,rolls:0,sixes:0,finished:0}))},elapsedMs:0,turns:1};
}
export const currentPlayer = game => game.players[game.currentPlayerIndex];
export function canPieceMove(game,piece,dice) {
 if(!Number.isInteger(dice)||dice<1||dice>6||piece.progress===FINISH) return false;
 if(piece.progress < 0 && dice!==6) return false;
 const target=piece.progress < 0 ? 0 : piece.progress+dice;
 if(target>FINISH) return false;
 if(game.settings.enableBlockRule) {
  for(let progress=Math.max(0,piece.progress+1);progress<=target;progress++) {
   const tile=getGlobalTile(piece.color,progress); if(tile===null) continue;
   if(game.players.some(p=>p.id!==piece.playerId && p.pieces.filter(x=>x.globalTileIndex===tile).length>=2)) return false;
  }
 }
 return true;
}
export const getValidMoves = (game,player=currentPlayer(game),dice=game.diceValue) => player.pieces.filter(p=>canPieceMove(game,p,dice));
export function getNextPlayer(game) {for(let n=1;n<=game.players.length;n++){const i=(game.currentPlayerIndex+n)%game.players.length;if(!game.players[i].isFinished) return i;}return -1;}
export const checkFinish = piece => piece.progress===FINISH;
export const checkPlayerVictory = player => player.pieces.every(checkFinish);
export function checkCapture(game,piece) {
 if(piece.globalTileIndex===null || isSafe(piece.globalTileIndex,game.settings))return [];
 const victims=game.players.filter(p=>p.id!==piece.playerId).flatMap(p=>p.pieces).filter(p=>p.globalTileIndex===piece.globalTileIndex);
 for(const victim of victims){victim.progress=-1;syncPiece(victim,game.settings);game.stats.byPlayer[game.players.findIndex(p=>p.id===victim.playerId)].captured++;}
 game.stats.captures+=victims.length;game.stats.byPlayer[game.currentPlayerIndex].captures+=victims.length;
 return victims.map(p=>p.id);
}
function endTurn(game,bonus=false){
 game.turnState='TURN_END';
 if(!bonus || currentPlayer(game).isFinished){game.currentPlayerIndex=getNextPlayer(game);game.consecutiveSixes=0;}
 game.diceValue=null;game.turns++;game.turnState='WAITING_FOR_ROLL';
}
// Commands are the only game mutation boundary. UI animation uses snapshots of this state.
export function dispatch(game, action) {
 const player=currentPlayer(game);
 if(action.type==='ROLL_DICE'){
  if(game.turnState!=='WAITING_FOR_ROLL')return false;
  const value=action.value ?? rollDice();if(!Number.isInteger(value)||value<1||value>6)return false;
  game.events=[];game.diceValue=value;game.stats.rolls++;game.stats.byPlayer[game.currentPlayerIndex].rolls++;
  if(value===6){game.stats.sixes++;game.stats.byPlayer[game.currentPlayerIndex].sixes++;game.consecutiveSixes++;}else game.consecutiveSixes=0;
  if(game.settings.tripleSix && game.consecutiveSixes===3){game.events.push({type:'TRIPLE_SIX'});endTurn(game);return true;}
  game.turnState='SELECTING_PIECE';
  if(!getValidMoves(game).length){game.events.push({type:'NO_MOVES'});endTurn(game,value===6);}
  return true;
 }
 if(action.type==='MOVE_PIECE'){
  if(game.turnState!=='SELECTING_PIECE')return false;
  const piece=player.pieces.find(p=>p.id===action.pieceId);if(!piece||!canPieceMove(game,piece,game.diceValue))return false;
  game.events=[];game.turnState='MOVING_PIECE';const from=piece.progress;piece.progress=from<0?0:from+game.diceValue;syncPiece(piece,game.settings);
  game.events.push({type:'MOVE_PIECE',pieceId:piece.id,from,to:piece.progress});
  game.turnState='RESOLVING_CAPTURE';const captured=checkCapture(game,piece);if(captured.length)game.events.push({type:'CAPTURE_PIECE',pieces:captured});
  if(checkFinish(piece)){game.stats.finished++;game.stats.byPlayer[game.currentPlayerIndex].finished++;game.events.push({type:'PIECE_FINISHED',pieceId:piece.id});}
  game.turnState='CHECKING_WINNER';
  if(checkPlayerVictory(player)){player.isFinished=true;player.rank=game.rankings.length+1;game.rankings.push(player.id);game.events.push({type:'PLAYER_FINISHED',playerId:player.id});}
  if(game.rankings.length>=game.players.length-1){const last=game.players.find(p=>!p.isFinished);if(last){last.rank=game.players.length;game.rankings.push(last.id);}game.turnState='GAME_OVER';return true;}
  endTurn(game,game.diceValue===6 || (captured.length>0 && game.settings.bonusTurnOnCapture));return true;
 }
 return false;
}
export function validateGame(g){
 if(!g||g.version!==1||!Array.isArray(g.players)||g.players.length<2||g.players.length>4)return false;
 if(!['WAITING_FOR_ROLL','SELECTING_PIECE','GAME_OVER'].includes(g.turnState))return false;
 if(!Number.isInteger(g.currentPlayerIndex)||!g.players[g.currentPlayerIndex]||!g.stats||!g.settings||!Array.isArray(g.rankings))return false;
 if(new Set(g.players.map(p=>p.color)).size!==g.players.length)return false;
 if(!g.players.every((p,i)=>COLORS.includes(p.color)&&p.id===`p${i}`&&typeof p.name==='string'&&['human','bot'].includes(p.type)&&Array.isArray(p.pieces)&&p.pieces.length===4&&p.pieces.every((x,j)=>x.id===`p${i}-${j}`&&x.color===p.color&&x.playerId===p.id&&Number.isInteger(x.progress)&&x.progress>=-1&&x.progress<=FINISH)))return false;
 g.settings={...DEFAULT_SETTINGS,...g.settings};g.players.forEach(p=>p.pieces.forEach(x=>syncPiece(x,g.settings)));
 return g.turnState!=='SELECTING_PIECE'||(Number.isInteger(g.diceValue)&&g.diceValue>=1&&g.diceValue<=6&&getValidMoves(g).length>0);
}
