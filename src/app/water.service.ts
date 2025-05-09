import { Injectable } from '@angular/core';
import { GameComponent } from './game/game.component';
import { CONSTANTS } from './constants';

@Injectable({
  providedIn: 'root'
})
export class WaterService {
  waterCells: { x: number; y: number }[] = [];
  private waterAnimationInterval: any;
  private readonly BASE_WATER_RANGE = CONSTANTS.BASE_WATER_RANGE;
  private readonly BASE_HOSE_DAMAGE = 3;

  constructor() {}

  private getHoseDamage(game: GameComponent): number {
    let damage = this.BASE_HOSE_DAMAGE;
    const level = game.hoseLevels[game.hoseType];
    for (let i = 0; i < level; i++) {
      damage += Math.floor(damage / 3);
    }
    return damage;
  }

  shootWater(game: GameComponent, direction: { dx: number; dy: number }) {
    this.clearWater();
    const damage = this.getHoseDamage(game);

    switch (game.hoseType) {
      case 'Basic':
        this.shootBasic(game, direction, damage);
        break;
      case 'Spread':
        this.shootSpread(game, direction, damage);
        break;
      case 'Wide':
        this.shootWide(game, direction, damage);
        break;
      case 'Launch':
        this.shootLaunch(game, direction, damage);
        break;
    }

    game.updateVisibleGrid();
    this.startWaterAnimation(game);
  }

  private shootBasic(game: GameComponent, direction: { dx: number; dy: number }, damage: number) {
    const playerX = game.playerService.player.x;
    const playerY = game.playerService.player.y;
    const level = game.hoseLevels[game.hoseType];
    const forwardRange = this.BASE_WATER_RANGE + level; // Base range (3) + 1 per level
    const isDiagonal = direction.dx !== 0 && direction.dy !== 0;

    // Forward spray
    let currentX = playerX + direction.dx;
    let currentY = playerY + direction.dy;
    let distance = 1;

    while (distance <= forwardRange) {
        if (this.isValidPosition(game, currentX, currentY)) {
            this.waterCells.push({ x: currentX, y: currentY });
            this.extinguishFire(game, currentX, currentY, damage);
        } else {
            break;
        }
        currentX += direction.dx;
        currentY += direction.dy;
        distance++;
    }

    // Surrounding spray based on level
    if (level > 0) {
        const backwardDir = { dx: -direction.dx, dy: -direction.dy }; // Opposite direction

        // Level 1: Single tile behind
        if (level >= 1) {
            this.addWaterIfValid(game, playerX + backwardDir.dx, playerY + backwardDir.dy, damage);
        }

        // Level 2: Add perpendicular tiles (3 total surrounding)
        if (level >= 2) {
            if (direction.dx === 0) { // Vertical shot
                this.addWaterIfValid(game, playerX - 1, playerY + backwardDir.dy, damage);
                this.addWaterIfValid(game, playerX + 1, playerY + backwardDir.dy, damage);
            } else if (direction.dy === 0) { // Horizontal shot
                this.addWaterIfValid(game, playerX + backwardDir.dx, playerY - 1, damage);
                this.addWaterIfValid(game, playerX + backwardDir.dx, playerY + 1, damage);
            } else { // Diagonal shot
                this.addWaterIfValid(game, playerX + backwardDir.dx, playerY, damage);
                this.addWaterIfValid(game, playerX, playerY + backwardDir.dy, damage);
            }
        }

        // Level 3: Modified pattern for diagonal and cardinal directions
        if (level >= 3) {
            if (!isDiagonal) {
                this.addWaterIfValid(game, playerX - 1, playerY, damage);      // Left
                this.addWaterIfValid(game, playerX + 1, playerY, damage);      // Right
                this.addWaterIfValid(game, playerX, playerY - 1, damage);      // Up
                this.addWaterIfValid(game, playerX, playerY + 1, damage);      // Down
                this.addWaterIfValid(game, playerX + backwardDir.dx, playerY + backwardDir.dy, damage); // Behind
                
                if (direction.dx === 0 && direction.dy === -1) { // Up
                    this.addWaterIfValid(game, playerX - 1, playerY + 1, damage);
                } else if (direction.dx === 0 && direction.dy === 1) { // Down
                    this.addWaterIfValid(game, playerX - 1, playerY - 1, damage);
                } else if (direction.dx === -1 && direction.dy === 0) { // Left
                    this.addWaterIfValid(game, playerX + 1, playerY - 1, damage);
                } else if (direction.dx === 1 && direction.dy === 0) { // Right
                    this.addWaterIfValid(game, playerX - 1, playerY - 1, damage);
                }
            } else {
                const surroundingTiles = [
                    { dx: -1, dy: -1 }, { dx: -1, dy: 0 }, { dx: -1, dy: 1 },
                    { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
                    { dx: 1, dy: -1 }, { dx: 1, dy: 0 }, { dx: 1, dy: 1 }
                ];
                surroundingTiles.forEach(tile => {
                    if (!(tile.dx === direction.dx && tile.dy === direction.dy) &&
                        !(tile.dx === direction.dx && tile.dy === 0) &&
                        !(tile.dx === 0 && tile.dy === direction.dy)) {
                        this.addWaterIfValid(game, playerX + tile.dx, playerY + tile.dy, damage);
                    }
                });
            }
        }

        // Level 4: All 8 surrounding tiles
        if (level >= 4) {
            this.addWaterIfValid(game, playerX - 1, playerY - 1, damage);
            this.addWaterIfValid(game, playerX - 1, playerY, damage);
            this.addWaterIfValid(game, playerX - 1, playerY + 1, damage);
            this.addWaterIfValid(game, playerX, playerY - 1, damage);
            this.addWaterIfValid(game, playerX, playerY + 1, damage);
            this.addWaterIfValid(game, playerX + 1, playerY - 1, damage);
            this.addWaterIfValid(game, playerX + 1, playerY, damage);
            this.addWaterIfValid(game, playerX + 1, playerY + 1, damage);
        }

        // Level 5: Extended pattern for diagonal shooting
        if (level >= 5) {
            if (!isDiagonal) {
                // Cardinal directions - add more surrounding tiles
                this.addWaterIfValid(game, playerX - 2, playerY, damage);
                this.addWaterIfValid(game, playerX + 2, playerY, damage);
                this.addWaterIfValid(game, playerX, playerY - 2, damage);
                this.addWaterIfValid(game, playerX, playerY + 2, damage);
            } else {
                // Diagonal shooting - match specified pattern
                // Add cross pattern around player
                this.addWaterIfValid(game, playerX - 1, playerY - 1, damage); // Up-left
                this.addWaterIfValid(game, playerX - 1, playerY + 1, damage); // Down-left
                this.addWaterIfValid(game, playerX + 1, playerY - 1, damage); // Up-right
                this.addWaterIfValid(game, playerX + 1, playerY + 1, damage); // Down-right
                // Add staggered tiles in direction
                this.addWaterIfValid(game, playerX - 2, playerY - 2, damage);
                this.addWaterIfValid(game, playerX - 2, playerY + 2, damage);
                this.addWaterIfValid(game, playerX + 2, playerY - 2, damage);
                this.addWaterIfValid(game, playerX + 2, playerY + 2, damage);
                // Add center cross
                this.addWaterIfValid(game, playerX - 1, playerY, damage);
                this.addWaterIfValid(game, playerX + 1, playerY, damage);
                this.addWaterIfValid(game, playerX, playerY - 1, damage);
                this.addWaterIfValid(game, playerX, playerY + 1, damage);
            }
        }

        // Level 6: Extended pattern for diagonal shooting
        if (level >= 6) {
            if (!isDiagonal) {
                // Cardinal directions - fill more surrounding tiles
                this.addWaterIfValid(game, playerX - 2, playerY - 1, damage);
                this.addWaterIfValid(game, playerX - 2, playerY + 1, damage);
                this.addWaterIfValid(game, playerX + 2, playerY - 1, damage);
                this.addWaterIfValid(game, playerX + 2, playerY + 1, damage);
            } else {
                // Diagonal shooting - match specified pattern
                // Add additional staggered tiles
                this.addWaterIfValid(game, playerX - 2, playerY, damage);
                this.addWaterIfValid(game, playerX + 2, playerY, damage);
                this.addWaterIfValid(game, playerX, playerY - 2, damage);
                this.addWaterIfValid(game, playerX, playerY + 2, damage);
                // Fill in gaps for cross pattern
                this.addWaterIfValid(game, playerX - 1, playerY - 2, damage);
                this.addWaterIfValid(game, playerX - 1, playerY + 2, damage);
                this.addWaterIfValid(game, playerX + 1, playerY - 2, damage);
                this.addWaterIfValid(game, playerX + 1, playerY + 2, damage);
            }
        }
    }
}

  private shootSpread(game: GameComponent, direction: { dx: number; dy: number }, damage: number) {
    const playerX = game.playerService.player.x;
    const playerY = game.playerService.player.y;
    const isHorizontal = direction.dy === 0;
    const isVertical = direction.dx === 0;
    const isDiagonal = direction.dx !== 0 && direction.dy !== 0;

    if (game.hoseLevels[game.hoseType] === 0) {
      if (isHorizontal) {
        this.addWaterIfValid(game, playerX + direction.dx, playerY - 1, damage);
        this.addWaterIfValid(game, playerX + direction.dx, playerY, damage);
        this.addWaterIfValid(game, playerX + direction.dx, playerY + 1, damage);
      } else if (isVertical) {
        this.addWaterIfValid(game, playerX - 1, playerY + direction.dy, damage);
        this.addWaterIfValid(game, playerX, playerY + direction.dy, damage);
        this.addWaterIfValid(game, playerX + 1, playerY + direction.dy, damage);
      } else if (isDiagonal) {
        this.addWaterIfValid(game, playerX + direction.dx, playerY + direction.dy, damage);
        this.addWaterIfValid(game, playerX, playerY + direction.dy, damage);
        this.addWaterIfValid(game, playerX + direction.dx, playerY, damage);
      }
    } else {
      const spreadDirections = this.getSpreadDirections(direction);
      const range = 1 + game.hoseLevels[game.hoseType];

      spreadDirections.forEach(dir => {
        let currentX = playerX;
        let currentY = playerY;
        for (let i = 0; i < range; i++) {
          currentX += dir.dx;
          currentY += dir.dy;
          if (!this.isValidPosition(game, currentX, currentY)) break;
          this.addWaterIfValid(game, currentX, currentY, damage);
        }
      });
    }
  }
  
  private getSpreadDirections(direction: { dx: number; dy: number }): { dx: number; dy: number }[] {
    // Returns three directions based on the primary direction
    const directions: { dx: number; dy: number }[] = [];
  
    // Primary direction
    directions.push({ dx: direction.dx, dy: direction.dy });
  
    // Add two adjacent directions
    if (direction.dx === 0 && direction.dy === -1) { // Up
      directions.push({ dx: -1, dy: -1 }); // Up-Left
      directions.push({ dx: 1, dy: -1 });  // Up-Right
    } else if (direction.dx === 0 && direction.dy === 1) { // Down
      directions.push({ dx: -1, dy: 1 });  // Down-Left
      directions.push({ dx: 1, dy: 1 });   // Down-Right
    } else if (direction.dx === -1 && direction.dy === 0) { // Left
      directions.push({ dx: -1, dy: -1 }); // Up-Left
      directions.push({ dx: -1, dy: 1 });  // Down-Left
    } else if (direction.dx === 1 && direction.dy === 0) { // Right
      directions.push({ dx: 1, dy: -1 });  // Up-Right
      directions.push({ dx: 1, dy: 1 });   // Down-Right
    } else if (direction.dx === -1 && direction.dy === -1) { // Up-Left
      directions.push({ dx: 0, dy: -1 });  // Up
      directions.push({ dx: -1, dy: 0 });  // Left
    } else if (direction.dx === 1 && direction.dy === -1) { // Up-Right
      directions.push({ dx: 0, dy: -1 });  // Up
      directions.push({ dx: 1, dy: 0 });   // Right
    } else if (direction.dx === -1 && direction.dy === 1) { // Down-Left
      directions.push({ dx: 0, dy: 1 });   // Down
      directions.push({ dx: -1, dy: 0 });  // Left
    } else if (direction.dx === 1 && direction.dy === 1) { // Down-Right
      directions.push({ dx: 0, dy: 1 });   // Down
      directions.push({ dx: 1, dy: 0 });   // Right
    }
  
    return directions;
  }

  private shootWide(game: GameComponent, direction: { dx: number; dy: number }, damage: number) {
    const playerX = game.playerService.player.x;
    const playerY = game.playerService.player.y;
    const isHorizontal = direction.dy === 0;
    const isVertical = direction.dx === 0;
    const isDiagonal = direction.dx !== 0 && direction.dy !== 0;

    if (isHorizontal) {
      this.addWaterIfValid(game, playerX + direction.dx, playerY - 1, damage);
      this.addWaterIfValid(game, playerX + direction.dx, playerY, damage);
      this.addWaterIfValid(game, playerX + direction.dx, playerY + 1, damage);
    } else if (isVertical) {
      this.addWaterIfValid(game, playerX - 1, playerY + direction.dy, damage);
      this.addWaterIfValid(game, playerX, playerY + direction.dy, damage);
      this.addWaterIfValid(game, playerX + 1, playerY + direction.dy, damage);
    } else if (isDiagonal) {
      this.addWaterIfValid(game, playerX + direction.dx, playerY + direction.dy, damage);
      this.addWaterIfValid(game, playerX, playerY + direction.dy, damage);
      this.addWaterIfValid(game, playerX + direction.dx, playerY, damage);
    }

    for (let level = 1; level <= game.hoseLevels[game.hoseType]; level++) {
      const offset = level + 1;
      if (isHorizontal) {
        this.addWaterIfValid(game, playerX + direction.dx * offset, playerY - 1, damage);
        this.addWaterIfValid(game, playerX + direction.dx * offset, playerY, damage);
        this.addWaterIfValid(game, playerX + direction.dx * offset, playerY + 1, damage);
      } else if (isVertical) {
        this.addWaterIfValid(game, playerX - 1, playerY + direction.dy * offset, damage);
        this.addWaterIfValid(game, playerX, playerY + direction.dy * offset, damage);
        this.addWaterIfValid(game, playerX + 1, playerY + direction.dy * offset, damage);
      } else if (isDiagonal) {
        this.addWaterIfValid(game, playerX + direction.dx * offset, playerY + direction.dy * offset, damage);
        this.addWaterIfValid(game, playerX + direction.dx * (offset - 1), playerY + direction.dy * offset, damage);
        this.addWaterIfValid(game, playerX + direction.dx * offset, playerY + direction.dy * (offset - 1), damage);
      }
    }
  }

  private shootLaunch(game: GameComponent, direction: { dx: number; dy: number }, damage: number) {
    const playerX = game.playerService.player.x;
    const playerY = game.playerService.player.y;
    const level = game.hoseLevels[game.hoseType];
    const isDiagonal = direction.dx !== 0 && direction.dy !== 0;

    // Define patterns for cardinal directions (right as base)
    const cardinalPatterns = [
        // Level 0: [ ][ ][ ][ ][ ], [P][ ][w][w][w], [ ][ ][ ][ ][ ] (3 squares)
        [{ dx: 2, dy: 0 }, { dx: 3, dy: 0 }, { dx: 4, dy: 0 }],
        // Level 1: [ ][ ][ ][w][ ], [P][ ][w][w][w], [ ][ ][ ][w][ ] (5 squares)
        [{ dx: 2, dy: 0 }, { dx: 3, dy: 0 }, { dx: 4, dy: 0 }, { dx: 3, dy: -1 }, { dx: 3, dy: 1 }],
        // Level 2: [ ][ ][w][w][w], [P][ ][w][w][w], [ ][ ][w][w][w] (9 squares)
        [{ dx: 2, dy: -1 }, { dx: 2, dy: 0 }, { dx: 2, dy: 1 }, 
         { dx: 3, dy: -1 }, { dx: 3, dy: 0 }, { dx: 3, dy: 1 }, 
         { dx: 4, dy: -1 }, { dx: 4, dy: 0 }, { dx: 4, dy: 1 }],
        // Level 3: [ ][ ][ ][w][ ][ ], [ ][ ][w][w][w][ ], [P][w][w][w][w][w], [ ][ ][w][w][w][ ], [ ][ ][ ][w][ ][ ] (13 squares)
        [{ dx: 1, dy: 0 }, { dx: 2, dy: -1 }, { dx: 2, dy: 0 }, { dx: 2, dy: 1 }, 
         { dx: 3, dy: -1 }, { dx: 3, dy: 0 }, { dx: 3, dy: 1 }, 
         { dx: 4, dy: -1 }, { dx: 4, dy: 0 }, { dx: 4, dy: 1 }, { dx: 5, dy: 0 }, 
         { dx: 3, dy: -2 }, { dx: 3, dy: 2 }],
        // Level 4: [ ][w][ ][w][ ][w], [ ][ ][w][w][w][ ], [P][w][w][w][w][w], [ ][ ][w][w][w][ ], [ ][w][ ][w][ ][w] (17 squares)
        [{ dx: 1, dy: 0 }, { dx: 1, dy: -2 }, { dx: 1, dy: 2 }, 
         { dx: 2, dy: -1 }, { dx: 2, dy: 0 }, { dx: 2, dy: 1 }, 
         { dx: 3, dy: -1 }, { dx: 3, dy: 0 }, { dx: 3, dy: 1 }, 
         { dx: 4, dy: -1 }, { dx: 4, dy: 0 }, { dx: 4, dy: 1 }, { dx: 5, dy: 0 }, 
         { dx: 3, dy: -2 }, { dx: 3, dy: 2 }, { dx: 5, dy: -2 }, { dx: 5, dy: 2 }],
        // Level 5: [ ][w][w][w][ ][w], [ ][ ][w][w][w][w], [P][w][w][w][w][w], [ ][w][w][w][w][ ], [ ][w][ ][w][w][w] (21 squares)
        [{ dx: 1, dy: 0 },   
         { dx: 1, dy: -2 },  
         { dx: 1, dy: 1 },  
         { dx: 1, dy: 2 },   
         { dx: 2, dy: -2 }, 
         { dx: 2, dy: -1 },  { dx: 2, dy: 0 }, { dx: 2, dy: 1 }, 
         { dx: 3, dy: -2 },  { dx: 3, dy: -1 }, { dx: 3, dy: 0 }, { dx: 3, dy: 1 }, { dx: 3, dy: 2 },
         { dx: 4, dy: -1 },  { dx: 4, dy: 0 }, { dx: 4, dy: 1 }, { dx: 4, dy: 2 }, 
         { dx: 5, dy: 0 },   
         { dx: 5, dy: -2 },  
         { dx: 5, dy: 2 },   
         { dx: 5, dy: -1 }   
        ],
        // Level 6: [ ][w][w][w][w][w], [ ][w][w][w][w][w], [P][w][w][w][w][w], [ ][w][w][w][w][w], [ ][w][w][w][w][w] (25 squares)
        [{ dx: 1, dy: -2 }, { dx: 1, dy: -1 }, { dx: 1, dy: 0 }, { dx: 1, dy: 1 }, { dx: 1, dy: 2 }, 
         { dx: 2, dy: -2 }, { dx: 2, dy: -1 }, { dx: 2, dy: 0 }, { dx: 2, dy: 1 }, { dx: 2, dy: 2 }, 
         { dx: 3, dy: -2 }, { dx: 3, dy: -1 }, { dx: 3, dy: 0 }, { dx: 3, dy: 1 }, { dx: 3, dy: 2 }, 
         { dx: 4, dy: -2 }, { dx: 4, dy: -1 }, { dx: 4, dy: 0 }, { dx: 4, dy: 1 }, { dx: 4, dy: 2 }, 
         { dx: 5, dy: -2 }, { dx: 5, dy: -1 }, { dx: 5, dy: 0 }, { dx: 5, dy: 1 }, { dx: 5, dy: 2 }],
        // Level 7: [ ][ ][ ][w][w][ ][ ], [ ][w][w][w][w][w][ ], [ ][w][w][w][w][w][ ], [P][w][w][w][w][w][w], [ ][w][w][w][w][w][ ], [ ][w][w][w][w][w][ ], [ ][ ][ ][w][w][ ][ ]
        [{ dx: 1, dy: -1 }, { dx: 1, dy: 0 }, { dx: 1, dy: 1 }, 
         { dx: 2, dy: -2 }, { dx: 2, dy: -1 }, { dx: 2, dy: 0 }, { dx: 2, dy: 1 }, { dx: 2, dy: 2 }, 
         { dx: 3, dy: -2 }, { dx: 3, dy: -1 }, { dx: 3, dy: 0 }, { dx: 3, dy: 1 }, { dx: 3, dy: 2 }, 
         { dx: 4, dy: -2 }, { dx: 4, dy: -1 }, { dx: 4, dy: 0 }, { dx: 4, dy: 1 }, { dx: 4, dy: 2 }, 
         { dx: 5, dy: -2 }, { dx: 5, dy: -1 }, { dx: 5, dy: 0 }, { dx: 5, dy: 1 }, { dx: 5, dy: 2 }, 
         { dx: 6, dy: -1 }, { dx: 6, dy: 0 }, { dx: 6, dy: 1 }],
        // Level 8: [ ][ ][w][w][w][w][ ], [ ][w][w][w][w][w][ ], [ ][w][w][w][w][w][w], [P][w][w][w][w][w][w], [ ][w][w][w][w][w][w], [ ][w][w][w][w][w][ ], [ ][ ][w][w][w][w][ ]
        [{ dx: 1, dy: -1 }, { dx: 1, dy: 0 }, { dx: 1, dy: 1 }, 
         { dx: 2, dy: -2 }, { dx: 2, dy: -1 }, { dx: 2, dy: 0 }, { dx: 2, dy: 1 }, { dx: 2, dy: 2 }, 
         { dx: 3, dy: -2 }, { dx: 3, dy: -1 }, { dx: 3, dy: 0 }, { dx: 3, dy: 1 }, { dx: 3, dy: 2 }, 
         { dx: 4, dy: -2 }, { dx: 4, dy: -1 }, { dx: 4, dy: 0 }, { dx: 4, dy: 1 }, { dx: 4, dy: 2 }, 
         { dx: 5, dy: -2 }, { dx: 5, dy: -1 }, { dx: 5, dy: 0 }, { dx: 5, dy: 1 }, { dx: 5, dy: 2 }, 
         { dx: 6, dy: -2 }, { dx: 6, dy: -1 }, { dx: 6, dy: 0 }, { dx: 6, dy: 1 }, { dx: 6, dy: 2 }],
        // Level 9: [ ][w][w][w][w][w][w], [ ][w][w][w][w][w][w], [ ][w][w][w][w][w][w], [P][w][w][w][w][w][w], [ ][w][w][w][w][w][w], [ ][w][w][w][w][w][w], [ ][w][w][w][w][w][w]
        [{ dx: 1, dy: -3 }, { dx: 1, dy: -2 }, { dx: 1, dy: -1 }, { dx: 1, dy: 0 }, { dx: 1, dy: 1 }, { dx: 1, dy: 2 }, { dx: 1, dy: 3 }, 
         { dx: 2, dy: -3 }, { dx: 2, dy: -2 }, { dx: 2, dy: -1 }, { dx: 2, dy: 0 }, { dx: 2, dy: 1 }, { dx: 2, dy: 2 }, { dx: 2, dy: 3 }, 
         { dx: 3, dy: -3 }, { dx: 3, dy: -2 }, { dx: 3, dy: -1 }, { dx: 3, dy: 0 }, { dx: 3, dy: 1 }, { dx: 3, dy: 2 }, { dx: 3, dy: 3 }, 
         { dx: 4, dy: -3 }, { dx: 4, dy: -2 }, { dx: 4, dy: -1 }, { dx: 4, dy: 0 }, { dx: 4, dy: 1 }, { dx: 4, dy: 2 }, { dx: 4, dy: 3 }, 
         { dx: 5, dy: -3 }, { dx: 5, dy: -2 }, { dx: 5, dy: -1 }, { dx: 5, dy: 0 }, { dx: 5, dy: 1 }, { dx: 5, dy: 2 }, { dx: 5, dy: 3 }, 
         { dx: 6, dy: -3 }, { dx: 6, dy: -2 }, { dx: 6, dy: -1 }, { dx: 6, dy: 0 }, { dx: 6, dy: 1 }, { dx: 6, dy: 2 }, { dx: 6, dy: 3 }]
    ];

    // Select the pattern based on the level (cap at level 9)
    const pattern = cardinalPatterns[Math.min(level, 9)];

    // Apply the pattern, adjusting based on direction
    pattern.forEach(offset => {
        let newX, newY;

        if (!isDiagonal) {
            // Cardinal directions
            if (direction.dx === 1 && direction.dy === 0) { // Right
                newX = playerX + offset.dx;
                newY = playerY + offset.dy;
            } else if (direction.dx === -1 && direction.dy === 0) { // Left
                newX = playerX - offset.dx;
                newY = playerY + offset.dy;
            } else if (direction.dx === 0 && direction.dy === -1) { // Up
                newX = playerX + offset.dy;
                newY = playerY - offset.dx;
            } else if (direction.dx === 0 && direction.dy === 1) { // Down
                newX = playerX - offset.dy;
                newY = playerY + offset.dx;
            }
        } else {
            // Diagonal directions - center the pattern 3 squares away
            const centerX = playerX + (direction.dx * 3);
            const centerY = playerY + (direction.dy * 3);
            const referenceX = playerX + 3;
            const referenceY = playerY;
            const patternX = playerX + offset.dx;
            const patternY = playerY + offset.dy;
            const deltaX = patternX - referenceX;
            const deltaY = patternY - referenceY;
            newX = centerX + deltaX;
            newY = centerY + deltaY;
        }

        this.addWaterIfValid(game, newX!, newY!, damage);
    });
}

  private addWaterIfValid(game: GameComponent, x: number, y: number, damage: number) {
    if (this.isValidPosition(game, x, y)) {
      this.waterCells.push({ x, y });
      this.extinguishFire(game, x, y, damage);
    }
  }

  private isValidPosition(game: GameComponent, x: number, y: number): boolean {
    return (
      x >= 0 && x < game.floorWidth &&
      y >= 0 && y < game.floorHeight &&
      game.grid[y][x] !== 'outer-wall' &&
      game.grid[y][x] !== 'inner-wall'
    );
  }

  private extinguishFire(game: GameComponent, x: number, y: number, damage: number) {
    const fireIndex = game.fires.findIndex(f => f.x === x && f.y === y);
    if (fireIndex !== -1) game.fires.splice(fireIndex, 1);

    const blueFireIndex = game.blueFires.findIndex(f => f.x === x && f.y === y);
    if (blueFireIndex !== -1) {
      const blueFire = game.blueFires[blueFireIndex];
      blueFire.health -= damage;
      blueFire.flash = true; // Trigger flash
      setTimeout(() => {
        blueFire.flash = false; // Reset flash after animation
        game.updateVisibleGrid(); // Ensure UI updates
      }, 500); // Match animation duration

      if (blueFire.health <= 0) {
        game.blueFires.splice(blueFireIndex, 1);
      }
    }
  }

  private startWaterAnimation(game: GameComponent) {
    if (this.waterAnimationInterval) {
      clearInterval(this.waterAnimationInterval);
    }

    this.waterAnimationInterval = setTimeout(() => {
      this.waterCells = [];
    }, 500);
  }

  clearWater() {
    this.waterCells = [];
    if (this.waterAnimationInterval) {
      clearInterval(this.waterAnimationInterval);
    }
  }

  hasWater(x: number, y: number): boolean {
    return this.waterCells.some(cell => cell.x === x && cell.y === y);
  }
}