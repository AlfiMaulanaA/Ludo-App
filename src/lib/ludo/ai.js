import { FINISH, getGlobalTile, isSafe } from './board.js';
import { getValidMoves, canPieceMove } from './engine.js';

export function scoreMove(game, piece) {
  const targetProgress = piece.progress < 0 ? 0 : piece.progress + game.diceValue;
  const targetTile = getGlobalTile(piece.color, targetProgress);

  let score = (targetProgress - Math.max(0, piece.progress)) * 2 + targetProgress * 0.7;

  // Coming out of Base bonus
  if (piece.progress < 0) score += 30;

  // Reaching Finish center bonus
  if (targetProgress === FINISH) score += 180;

  // Entering Home Path lane bonus
  if (targetProgress >= 51) score += 40;

  // Landing on Safe Tile bonus
  if (isSafe(targetTile, game.settings)) score += 35;

  // Capture evaluation
  if (targetTile !== null && !isSafe(targetTile, game.settings)) {
    for (const opponent of game.players.filter(p => p.id !== piece.playerId)) {
      for (const otherPiece of opponent.pieces) {
        // Target land captures enemy piece
        if (otherPiece.globalTileIndex === targetTile) {
          score += 120 + Math.max(0, otherPiece.progress);
        }
        // Danger calculation: check if enemy could counter-capture on their next roll
        if (otherPiece.progress >= 0 && otherPiece.progress <= 50) {
          for (let dice = 1; dice <= 6; dice++) {
            if (
              getGlobalTile(otherPiece.color, otherPiece.progress + dice) === targetTile &&
              canPieceMove(game, otherPiece, dice)
            ) {
              score -= 45 + targetProgress * 0.6;
            }
          }
        }
      }
    }
  }

  // Block formation bonus
  if (
    game.settings.enableBlockRule &&
    targetTile !== null &&
    game.players
      .find(p => p.id === piece.playerId)
      .pieces.some(p => p.id !== piece.id && p.globalTileIndex === targetTile)
  ) {
    score += 30;
  }

  return score;
}

export function chooseMove(game, difficulty = 'medium', randomFn = Math.random) {
  const moves = getValidMoves(game);
  if (!moves || moves.length === 0) return null;

  if (difficulty === 'easy') {
    return moves[Math.floor(randomFn() * moves.length)];
  }

  const scoredMoves = moves
    .map(piece => ({
      piece,
      score: scoreMove(game, piece) + (difficulty === 'medium' ? randomFn() * 60 : 0)
    }))
    .sort((a, b) => b.score - a.score);

  return scoredMoves[0].piece;
}
