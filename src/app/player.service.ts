import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PlayerService {
  player = { x: 1, y: 1 };

  constructor() {}

  movePlayer(direction: { dx: number; dy: number }, grid: string[][], floorWidth: number, floorHeight: number, fires: { x: number; y: number; countdown: number }[]): boolean {
    const oldX = this.player.x;
    const oldY = this.player.y;
    const newPosition = {
      x: this.player.x + direction.dx,
      y: this.player.y + direction.dy
    };

    if (this.isValidMove(newPosition, grid, floorWidth, floorHeight, fires)) {
      this.player.x = newPosition.x;
      this.player.y = newPosition.y;
      return true;
    }
    return false;
  }

  isValidMove(position: { x: number; y: number }, grid: string[][], floorWidth: number, floorHeight: number, fires: { x: number; y: number; countdown: number }[]): boolean {
    const { x, y } = position;
    if (x < 0 || x >= floorWidth || y < 0 || y >= floorHeight) return false;
    const hasFire = fires.some(fire => fire.x === x && fire.y === y);
    if (hasFire) return false;
    const cellType = grid[y]?.[x];
    if (cellType === 'outer-wall' || cellType === 'inner-wall') return false;
    return true;
  }

  isPlayerAt(potentialX: number, potentialY: number): boolean {
    return this.player.x === potentialX && this.player.y === potentialY;
  }

  resetPlayer() {
    this.player = { x: 1, y: 1 };
  }
}