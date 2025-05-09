import { Injectable } from '@angular/core';
import { PlayerService } from './player.service';
import { CONSTANTS } from './constants';

@Injectable({
  providedIn: 'root'
})
export class FloorService {
  private readonly MAX_RECURSION_DEPTH = CONSTANTS.MAX_RECURSION_DEPTH;
  private recursionCount = 0;

  constructor(private playerService: PlayerService) {}

  getRandomCountdown(): number {
    return Math.floor(Math.random() * 5) + 4;
  }

  initializeFloor(floorWidth: number, floorHeight: number, currentFloor: number): { 
    grid: string[][], 
    fires: { x: number; y: number; countdown: number }[],
    blueFires: { x: number; y: number; hasBeenSeen: boolean; lastMovedTurn: number; health: number }[],
    stairway: { x: number; y: number }, 
    upgrade: { x: number; y: number },
    basicHosePickup: { x: number; y: number },
    spreadHosePickup: { x: number; y: number },
    wideHosePickup: { x: number; y: number },
    launchHosePickup: { x: number; y: number }
  } {
    const grid: string[][] = [];
    const fires: { x: number; y: number; countdown: number }[] = [];
    const blueFires: { x: number; y: number; hasBeenSeen: boolean; lastMovedTurn: number; health: number }[] = [];
    const stairway: { x: number; y: number } = { x: 0, y: 0 };
    const upgrade: { x: number; y: number } = { x: 0, y: 0 };
    const basicHosePickup: { x: number; y: number } = { x: -1, y: -1 };
    const spreadHosePickup: { x: number; y: number } = { x: -1, y: -1 };
    const wideHosePickup: { x: number; y: number } = { x: -1, y: -1 };
    const launchHosePickup: { x: number; y: number } = { x: -1, y: -1 };

    // Initialize grid
    for (let y = 0; y < floorHeight; y++) {
      grid[y] = [];
      for (let x = 0; x < floorWidth; x++) {
        grid[y][x] = (x === 0 || x === floorWidth - 1 || y === 0 || y === floorHeight - 1) ? 'outer-wall' : 'empty';
      }
    }

    this.recursionCount = 0;
    this.generateRandomLayout(grid, floorWidth, floorHeight, fires, blueFires, stairway, upgrade, basicHosePickup, spreadHosePickup, wideHosePickup, launchHosePickup, currentFloor);

    return { grid, fires, blueFires, stairway, upgrade, basicHosePickup, spreadHosePickup, wideHosePickup, launchHosePickup };
  }

  private generateRandomLayout(
    grid: string[][],
    floorWidth: number,
    floorHeight: number,
    fires: { x: number; y: number; countdown: number }[],
    blueFires: { x: number; y: number; hasBeenSeen: boolean; lastMovedTurn: number; health: number; flash?: boolean }[],
    stairway: { x: number; y: number },
    upgrade: { x: number; y: number },
    basicHosePickup: { x: number; y: number },
    spreadHosePickup: { x: number; y: number },
    wideHosePickup: { x: number; y: number },
    launchHosePickup: { x: number; y: number },
    currentFloor: number
  ): void {  // Add :void here
    if (this.recursionCount++ >= this.MAX_RECURSION_DEPTH) {
      console.warn('Max recursion depth reached; using fallback layout');
      this.createFallbackLayout(grid, floorWidth, floorHeight, fires, stairway, upgrade, currentFloor);
      return;
    }
  
    const innerCells = (floorWidth - 2) * (floorHeight - 2);
    const occupied = new Set<string>();
  
    // Modified getRandomEmptyPosition to respect invalid fire positions
    const getRandomEmptyPosition = (avoidInvalidFirePositions: boolean = false): { x: number; y: number } | null => {
      const available: { x: number; y: number }[] = [];
      for (let y = 1; y < floorHeight - 1; y++) {
        for (let x = 1; x < floorWidth - 1; x++) {
          if (grid[y][x] === 'empty' && 
              !occupied.has(`${x},${y}`) &&
              (!avoidInvalidFirePositions || !invalidFirePositions.has(`${x},${y}`))) {
            available.push({ x, y });
          }
        }
      }
      if (available.length === 0) return null;
      const index = Math.floor(Math.random() * available.length);
      const pos = available[index];
      occupied.add(`${pos.x},${pos.y}`);
      return pos;
    };
  
    const playerPos = getRandomEmptyPosition();
    if (!playerPos) {
      this.generateRandomLayout(grid, floorWidth, floorHeight, fires, blueFires, stairway, upgrade, basicHosePickup, spreadHosePickup, wideHosePickup, launchHosePickup, currentFloor);
      return;
    }
    this.playerService.player = { x: playerPos.x, y: playerPos.y };

    // Mark positions adjacent to player (including diagonals) as unavailable for fires (Requirement 4)
    const invalidFirePositions = new Set<string>();
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const x = playerPos.x + dx;
        const y = playerPos.y + dy;
        if (x > 0 && x < floorWidth - 1 && y > 0 && y < floorHeight - 1) {
          invalidFirePositions.add(`${x},${y}`);
        }
      }
    }
  
    do {
      const stairwayPos = getRandomEmptyPosition();
      if (!stairwayPos) {
        this.generateRandomLayout(grid, floorWidth, floorHeight, fires, blueFires, stairway, upgrade, basicHosePickup, spreadHosePickup, wideHosePickup, launchHosePickup, currentFloor);
        return;
      }
      stairway.x = stairwayPos.x;
      stairway.y = stairwayPos.y;
    } while (!this.isValidStairwayPosition(this.playerService.player, stairway, grid, floorWidth, floorHeight, fires));
    grid[stairway.y][stairway.x] = 'stairway';
  
    const wallCount = Math.floor(innerCells * CONSTANTS.WALL_DENSITY);
    for (let i = 0; i < wallCount; i++) {
      const wallPos = getRandomEmptyPosition();
      if (wallPos) grid[wallPos.y][wallPos.x] = 'inner-wall';
    }
  
   // Modified fire count (Requirement 5: reduce fires on floor 2)
    const fireCount = currentFloor === 1 ? 1 : 
                     //currentFloor === 2 ? Math.min(2, Math.floor(innerCells * CONSTANTS.FIRE_DENSITY_BASE)) :
                     currentFloor === 2 ? 3 :
                     Math.min(Math.floor(innerCells * CONSTANTS.FIRE_DENSITY_BASE) + currentFloor - 1, 
                             innerCells * CONSTANTS.FIRE_DENSITY_MAX);
    for (let i = 0; i < fireCount; i++) {
      const firePos = getRandomEmptyPosition(true); // Use invalid fire positions
      if (firePos) fires.push({ x: firePos.x, y: firePos.y, countdown: this.getRandomCountdown() });
    }

  // Modified blue fire count
  const blueFireCount = currentFloor >= 3 ? Math.min(Math.floor((currentFloor - 2) / 3) + 1, 2) : 0;
  for (let i = 0; i < blueFireCount; i++) {
    const blueFirePos = getRandomEmptyPosition(true); // Use invalid fire positions
    if (blueFirePos) {
      blueFires.push({ 
        x: blueFirePos.x, 
        y: blueFirePos.y, 
        hasBeenSeen: false, 
        lastMovedTurn: -2,
        health: 10,
        flash: false
      });
    }
  }

    // Place upgrade
    const upgradePos = getRandomEmptyPosition();
    if (upgradePos) {
      upgrade.x = upgradePos.x;
      upgrade.y = upgradePos.y;
    }

    // Place pickups (50% chance each, no overlap)
    const pickups = [
      { pos: basicHosePickup, chance: 0.5 },
      { pos: spreadHosePickup, chance: 0.5 },
      { pos: wideHosePickup, chance: 0.5 },
      { pos: launchHosePickup, chance: 0.5 }
    ];
    for (const pickup of pickups) {
      if (Math.random() < pickup.chance) {
        const pickupPos = getRandomEmptyPosition();
        if (pickupPos) {
          pickup.pos.x = pickupPos.x;
          pickup.pos.y = pickupPos.y;
        }
      }
    }

    if (!this.pathExists(this.playerService.player, stairway, grid, floorWidth, floorHeight, fires, CONSTANTS.MIN_PATH_LENGTH)) {
      this.generateRandomLayout(grid, floorWidth, floorHeight, fires, blueFires, stairway, upgrade, basicHosePickup, spreadHosePickup, wideHosePickup, launchHosePickup, currentFloor);
    }
  }

  private createFallbackLayout(
    grid: string[][],
    floorWidth: number,
    floorHeight: number,
    fires: { x: number; y: number; countdown: number }[],
    stairway: { x: number; y: number },
    upgrade: { x: number; y: number },
    currentFloor: number
  ) {
    this.playerService.player = { x: 1, y: 1 };
    stairway.x = floorWidth - 2;
    stairway.y = floorHeight - 2;
    grid[stairway.y][stairway.x] = 'stairway';
    upgrade.x = Math.floor(floorWidth / 2);
    upgrade.y = Math.floor(floorHeight / 2);
    const fireCount = currentFloor === 1 ? 1 : Math.min(3 + currentFloor - 1, 5);
    fires.length = 0;
    fires.push({ x: floorWidth - 3, y: floorHeight - 3, countdown: this.getRandomCountdown() });
  }

  private isValidStairwayPosition(start: { x: number; y: number }, end: { x: number; y: number }, grid: string[][], floorWidth: number, floorHeight: number, fires: { x: number; y: number; countdown: number }[]): boolean {
    return this.pathExists(start, end, grid, floorWidth, floorHeight, fires, 4);
  }

  private pathExists(start: { x: number; y: number }, end: { x: number; y: number }, grid: string[][], floorWidth: number, floorHeight: number, fires: { x: number; y: number; countdown: number }[], minLength: number = 0): boolean {
    const queue: { pos: { x: number; y: number }, distance: number }[] = [{ pos: start, distance: 0 }];
    const visited = new Map<string, number>();
    visited.set(`${start.x},${start.y}`, 0);

    while (queue.length > 0) {
      const { pos: current, distance } = queue.shift()!;
      if (current.x === end.x && current.y === end.y) return distance >= minLength;

      const directions = [
        { dx: -1, dy: -1 }, { dx: 0, dy: -1 }, { dx: 1, dy: -1 },
        { dx: -1, dy: 0 },                     { dx: 1, dy: 0 },
        { dx: -1, dy: 1 },  { dx: 0, dy: 1 },  { dx: 1, dy: 1 }
      ];

      for (const dir of directions) {
        const newPos = { x: current.x + dir.dx, y: current.y + dir.dy };
        const key = `${newPos.x},${newPos.y}`;
        const newDistance = distance + 1;

        if (
          newPos.x >= 0 && newPos.x < floorWidth &&
          newPos.y >= 0 && newPos.y < floorHeight &&
          (!visited.has(key) || visited.get(key)! > newDistance) &&
          grid[newPos.y][newPos.x] !== 'outer-wall' &&
          grid[newPos.y][newPos.x] !== 'inner-wall' &&
          !this.hasFire(newPos.x, newPos.y, fires)
        ) {
          queue.push({ pos: newPos, distance: newDistance });
          visited.set(key, newDistance);
        }
      }
    }
    return false;
  }

  private hasFire(x: number, y: number, fires: { x: number; y: number; countdown: number }[]): boolean {
    return fires.some(fire => fire.x === x && fire.y === y);
  }
}