import {COLORS,LABELS,SYMBOLS,TRACK,HOME,BASE,position,isSafe,OFFSETS} from './board.js';
export class BoardView {
 constructor(host,onPiece,settings){this.host=host;this.settings=settings;this.buttons=new Map();host.className='board';host.setAttribute('aria-label','Papan Ludo');
 for(const color of COLORS){const base=document.createElement('div');base.className=`base ${color}`;base.innerHTML=`<div class="base-inner"><span class="base-label">${SYMBOLS[color]} ${LABELS[color]}</span></div>`;host.append(base);for(const [row,col] of BASE[color]){const slot=document.createElement('div');slot.className='base-slot';this.place(slot,row,col);host.append(slot);}}
 TRACK.forEach(([row,col],index)=>{const cell=document.createElement('div');cell.className='tile';const start=COLORS.find(c=>OFFSETS[c]===index);if(start)cell.classList.add(start,'start');cell.textContent=isSafe(index,settings)?'✦':start?'↗':'';cell.dataset.index=index;this.place(cell,row,col);host.append(cell);});
 for(const color of COLORS)for(const [row,col] of HOME[color]){const cell=document.createElement('div');cell.className=`tile lane ${color}`;this.place(cell,row,col);host.append(cell);}
 const finish=document.createElement('div');finish.className='finish';finish.innerHTML='<span>♛</span>';host.append(finish);this.onPiece=onPiece;
 }
 place(element,row,col){element.style.top=`${row/15*100}%`;element.style.left=`${col/15*100}%`;}
 render(game,valid=[],displayPositions={}){
 const occupied=new Map();
 for(const player of game.players)for(const [i,piece] of player.pieces.entries()){
  let button=this.buttons.get(piece.id);if(!button){button=document.createElement('button');button.className=`piece ${player.color}`;button.textContent=String(i+1);button.addEventListener('click',()=>this.onPiece(piece.id));this.buttons.set(piece.id,button);this.host.append(button);}
  const progress=displayPositions[piece.id]??piece.progress;const [row,col]=position(player.color,progress,i),key=`${row},${col}`;const list=occupied.get(key)||[];list.push(button);occupied.set(key,list);this.place(button,row,col);
  button.disabled=!valid.includes(piece.id);button.classList.toggle('legal',!button.disabled);button.classList.toggle('done',progress===56);button.setAttribute('aria-label',`${player.name}, bidak ${i+1}, ${progress<0?'di base':progress===56?'selesai':`langkah ${progress}`}${button.disabled?'':', bisa digerakkan'}`);button.title=button.getAttribute('aria-label');
 }
 for(const list of occupied.values())list.forEach((button,i)=>{const count=list.length;button.style.setProperty('--dx',`${count>1?((i%2)-.5)*32:0}%`);button.style.setProperty('--dy',`${count>1?(Math.floor(i/2)-(Math.ceil(count/2)-1)/2)*27:0}%`);button.style.setProperty('--scale',count>1?Math.max(.48,1-count*.07):1);button.style.zIndex=button.disabled?10+i:30+i;});
 }
 flash(ids){ids.forEach(id=>{const button=this.buttons.get(id);button?.classList.add('captured');setTimeout(()=>button?.classList.remove('captured'),650);});}
}
