import {FINISH,getGlobalTile,isSafe} from './board.js';
import {getValidMoves,canPieceMove} from './engine.js';
export function scoreMove(game,piece){
 const target=piece.progress<0?0:piece.progress+game.diceValue,tile=getGlobalTile(piece.color,target);
 let score=(target-Math.max(0,piece.progress))*2+target*.7;
 if(piece.progress<0)score+=25;if(target===FINISH)score+=150;if(target>=51)score+=35;
 if(isSafe(tile,game.settings))score+=30;
 if(tile!==null&&!isSafe(tile,game.settings))for(const opponent of game.players.filter(p=>p.id!==piece.playerId))for(const other of opponent.pieces){
  if(other.globalTileIndex===tile)score+=100+Math.max(0,other.progress);
  if(other.progress>=0&&other.progress<=50)for(let dice=1;dice<=6;dice++)if(getGlobalTile(other.color,other.progress+dice)===tile&&canPieceMove(game,other,dice))score-=40+target*.6;
 }
 if(game.settings.enableBlockRule&&tile!==null&&game.players.find(p=>p.id===piece.playerId).pieces.some(p=>p.id!==piece.id&&p.globalTileIndex===tile))score+=25;
 return score;
}
export function chooseMove(game, difficulty='medium',random=Math.random){const moves=getValidMoves(game);if(!moves.length)return null;if(difficulty==='easy')return moves[Math.floor(random()*moves.length)];return moves.map(piece=>({piece,score:scoreMove(game,piece)+(difficulty==='medium'?random()*65:0)})).sort((a,b)=>b.score-a.score)[0].piece;}
