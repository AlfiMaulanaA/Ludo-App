export const COLORS = ['red', 'green', 'yellow', 'blue'];
export const LABELS = {red:'Merah', green:'Hijau', yellow:'Kuning', blue:'Biru'};
export const SYMBOLS = {red:'◆', green:'♣', yellow:'☀', blue:'●'};
export const OFFSETS = {red:0, green:13, yellow:26, blue:39};
export const TRACK = [[6,1],[6,2],[6,3],[6,4],[6,5],[5,6],[4,6],[3,6],[2,6],[1,6],[0,6],[0,7],[0,8],[1,8],[2,8],[3,8],[4,8],[5,8],[6,9],[6,10],[6,11],[6,12],[6,13],[6,14],[7,14],[8,14],[8,13],[8,12],[8,11],[8,10],[8,9],[9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[14,7],[14,6],[13,6],[12,6],[11,6],[10,6],[9,6],[8,5],[8,4],[8,3],[8,2],[8,1],[8,0],[7,0],[6,0]];
export const HOME = {red:[[7,1],[7,2],[7,3],[7,4],[7,5]],green:[[1,7],[2,7],[3,7],[4,7],[5,7]],yellow:[[7,13],[7,12],[7,11],[7,10],[7,9]],blue:[[13,7],[12,7],[11,7],[10,7],[9,7]]};
export const BASE = {red:[[2,2],[2,4],[4,2],[4,4]],green:[[2,10],[2,12],[4,10],[4,12]],yellow:[[10,10],[10,12],[12,10],[12,12]],blue:[[10,2],[10,4],[12,2],[12,4]]};
// A full circuit ends at the square before the starting square's entry junction.
// Progress 0..50: shared track; 51..55: private lane; 56: center finish.
export const FINISH = 56;
export function getGlobalTile(color, progress) { return progress >= 0 && progress <= 50 ? (OFFSETS[color] + progress) % 52 : null; }
export function isSafe(tile, settings) { return tile !== null && ([8,21,34,47].includes(tile) || (settings.safeStarts && [0,13,26,39].includes(tile))); }
export function position(color, progress, index=0) { if(progress < 0) return BASE[color][index]; if(progress <= 50) return TRACK[getGlobalTile(color,progress)]; if(progress < FINISH) return HOME[color][progress-51]; return [7,7]; }
export function syncPiece(piece, settings) { piece.state = piece.progress < 0 ? 'BASE' : piece.progress === FINISH ? 'FINISHED' : piece.progress >= 51 ? 'HOME_PATH' : 'ACTIVE'; piece.globalTileIndex = getGlobalTile(piece.color,piece.progress); piece.isSafe = piece.progress >= 51 || isSafe(piece.globalTileIndex,settings); }
