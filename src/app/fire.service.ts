import { Injectable } from '@angular/core';
import { GameComponent } from './game/game.component';
import { FloorService } from './floor.service';

@Injectable({
  providedIn: 'root'
})
export class FireService {
  constructor(private floorService: FloorService) {}

  updateFires(game: GameComponent) {
    // Don't update fires if player is on stairway (Requirement 3)
    if (game.isStairway(game.playerService.player.x, game.playerService.player.y)) {
      return;
    }

    const firesToSpread: { x: number; y: number }[] = [];
    const firesToRemoveIndexes: number[] = [];

    game.fires.forEach((fire, index) => {
      fire.countdown--;
      if (fire.countdown < 0) {
        firesToSpread.push({ x: fire.x, y: fire.y });
        firesToRemoveIndexes.push(index);
      }
    });

    const newFiresToAdd: { x: number; y: number; countdown: number }[] = [];
    firesToSpread.forEach(fireOrigin => {
      const adjacent = [
        { dx: -1, dy: -1 }, { dx: 0, dy: -1 }, { dx: 1, dy: -1 },
        { dx: -1, dy: 0 },                    { dx: 1, dy: 0 },
        { dx: -1, dy: 1 },  { dx: 0, dy: 1 },  { dx: 1, dy: 1 }
      ];

      adjacent.forEach(dir => {
        const pos = { x: fireOrigin.x + dir.dx, y: fireOrigin.y + dir.dy };

        if (game.playerService.player.x === pos.x && game.playerService.player.y === pos.y) {
          game.playerHealth -= 2;
          game.flashPlayer = true;
          setTimeout(() => game.flashPlayer = false, 500);
          return;
        }

        if (this.isValidFireSpread(pos, game.floorWidth, game.floorHeight, game.grid)) {
          const fireExists = game.fires.some(f => f.x === pos.x && f.y === pos.y) ||
                            newFiresToAdd.some(nf => nf.x === pos.x && nf.y === pos.y);
          const waterExists = game.waterService.hasWater(pos.x, pos.y);

          if (!fireExists && !waterExists) {
            if (game.grid[pos.y]?.[pos.x] === 'inner-wall') game.grid[pos.y][pos.x] = 'empty';
            if (game.grid[pos.y]?.[pos.x] === 'empty') {
              newFiresToAdd.push({ x: pos.x, y: pos.y, countdown: this.floorService.getRandomCountdown() });
            }
          }
        }
      });
    });

    firesToRemoveIndexes.sort((a, b) => b - a).forEach(index => {
      if (index >= 0 && index < game.fires.length) game.fires.splice(index, 1);
    });

    game.fires.push(...newFiresToAdd);

    // Update blue fires
    this.updateBlueFires(game);
  }

  isValidFireSpread(position: { x: number; y: number }, floorWidth: number, floorHeight: number, grid: string[][]): boolean {
    const { x, y } = position;
    if (x < 0 || x >= floorWidth || y < 0 || y >= floorHeight) return false;
    return grid[y][x] !== 'outer-wall';
  }

  private updateBlueFires(game: GameComponent) {
    // Don't update blue fires if player is on stairway (Requirement 3)
    if (game.isStairway(game.playerService.player.x, game.playerService.player.y)) {
      return;
    }

    game.blueFires.forEach(blueFire => {
      if (!blueFire.hasBeenSeen || (game.moves - blueFire.lastMovedTurn) < 2) return;

      const playerPos = game.playerService.player;
      const dx = playerPos.x - blueFire.x;
      const dy = playerPos.y - blueFire.y;

      // Attempt to damage player if adjacent (including diagonally)
      if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) {
        game.playerHealth -= 1;
        game.flashPlayer = true;
        setTimeout(() => game.flashPlayer = false, 500);
      }

      // Try to move towards player (Requirement 2: allow diagonal movement)
      const possibleMoves = [];
      if (dx !== 0) possibleMoves.push({ dx: dx > 0 ? 1 : -1, dy: 0 });  // Horizontal
      if (dy !== 0) possibleMoves.push({ dx: 0, dy: dy > 0 ? 1 : -1 });  // Vertical
      // Add diagonal moves
      if (dx !== 0 && dy !== 0) {
        possibleMoves.push({ 
          dx: dx > 0 ? 1 : -1, 
          dy: dy > 0 ? 1 : -1 
        });
      }

      // Try each possible move in random order
      const shuffledMoves = possibleMoves.sort(() => Math.random() - 0.5);
      for (const move of shuffledMoves) {
        const newX = blueFire.x + move.dx;
        const newY = blueFire.y + move.dy;

        if (
          this.isValidFireSpread({ x: newX, y: newY }, game.floorWidth, game.floorHeight, game.grid) &&
          !game.hasFire(newX, newY) &&
          !game.hasBlueFire(newX, newY) &&
          !game.isPlayerAt(newX, newY)
        ) {
          // Check if moving to inner wall (Requirement 1: blue fires consume inner walls)
          if (game.grid[newY][newX] === 'inner-wall') {
            game.grid[newY][newX] = 'empty';
          }
          
          blueFire.x = newX;
          blueFire.y = newY;
          blueFire.lastMovedTurn = game.moves;
          break;
        }
      }
    });
  }
}