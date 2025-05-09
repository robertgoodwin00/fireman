// game.component.ts
import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WaterService } from '../water.service';
import { PlayerService } from '../player.service';
import { FloorService } from '../floor.service';
import { InputService } from '../input.service';
import { FireService } from '../fire.service';
import { CONSTANTS } from '../constants';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class GameComponent implements OnInit {
  // --- Configuration ---
  readonly viewportWidth = CONSTANTS.VIEWPORT_WIDTH;
  readonly viewportHeight = CONSTANTS.VIEWPORT_HEIGHT;
  readonly cellSize = CONSTANTS.CELL_SIZE;

  floorWidth = 12;
  floorHeight = 12;
  currentFloor = 1;
  grid: string[][] = [];
  visibleGrid: string[][] = [];
  viewportOffsetX = 0;
  viewportOffsetY = 0;
  fires: { x: number; y: number; countdown: number }[] = [];
  blueFires: { x: number; y: number; hasBeenSeen: boolean; lastMovedTurn: number; health: number; flash?: boolean }[] = []; // Added optional flash property
  moves = 0;
  stairway: { x: number; y: number } = { x: 0, y: 0 };
  playerHealth = CONSTANTS.INITIAL_PLAYER_HEALTH;
  gameWon = false;
  gameLost = false;
  flashPlayer = false;
  hoseType: 'Basic' | 'Spread' | 'Wide' | 'Launch' = 'Basic';
  hoseLevels: { [key in 'Basic' | 'Spread' | 'Wide' | 'Launch']: number } = {
    'Basic': 0, 'Spread': 0, 'Wide': 0, 'Launch': 0
  };
  upgradePosition: { x: number; y: number } = { x: 0, y: 0 };
  basicHosePickup: { x: number; y: number } = { x: -1, y: -1 };
  spreadHosePickup: { x: number; y: number } = { x: -1, y: -1 };
  wideHosePickup: { x: number; y: number } = { x: -1, y: -1 };
  launchHosePickup: { x: number; y: number } = { x: -1, y: -1 };


  constructor(
    public waterService: WaterService,
    public playerService: PlayerService,
    private floorService: FloorService,
    private inputService: InputService,
    private fireService: FireService // Add FireService
  ) {}

  ngOnInit() {
    this.initializeFloor();
  }

  initializeFloor() {
    this.waterService.clearWater();
    const floorIndex = this.currentFloor - 1;
    const dimensions = this.getRandomDimensions(floorIndex);
    this.floorWidth = dimensions.width;
    this.floorHeight = dimensions.height;

    const floorData = this.floorService.initializeFloor(this.floorWidth, this.floorHeight, this.currentFloor);
    this.grid = floorData.grid;
    this.fires = floorData.fires;
    this.blueFires = floorData.blueFires.map(fire => ({ ...fire, flash: false })); // Ensure flash is always defined
    this.stairway = floorData.stairway;
    this.upgradePosition = floorData.upgrade;
    this.basicHosePickup = floorData.basicHosePickup;
    this.spreadHosePickup = floorData.spreadHosePickup;
    this.wideHosePickup = floorData.wideHosePickup;
    this.launchHosePickup = floorData.launchHosePickup;
    this.updateVisibleGrid();
    console.log('Blue fires after init:', this.blueFires); // Debug log
  }

  private getRandomDimensions(floorIndex: number): { width: number; height: number } {
    if (floorIndex === 0) return { width: 12, height: 12 };

    const minArea = CONSTANTS.MIN_AREA_LIMITS[floorIndex];
    const maxArea = CONSTANTS.MAX_AREA_LIMITS[floorIndex];
    const possiblePairs: { width: number; height: number }[] = [];
    const minDim = Math.ceil(Math.sqrt(minArea));
    const maxDim = Math.floor(Math.sqrt(maxArea)) + 1;

    for (let w = minDim; w <= maxDim; w++) {
      for (let h = minDim; h <= maxDim; h++) {
        const area = w * h;
        if (area >= minArea && area <= maxArea) {
          possiblePairs.push({ width: w, height: h });
        }
      }
    }

    const randomIndex = Math.floor(Math.random() * possiblePairs.length);
    return possiblePairs[randomIndex];
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    this.inputService.handleKeyboardEvent(event, this);
  }

  tookTurn() {
    this.moves++;
    this.fireService.updateFires(this); 
    this.checkForUpgrade();
    this.checkWinLoseCondition();
  }

  updateVisibleGrid() {
    const playerX = this.playerService.player.x;
    const playerY = this.playerService.player.y;

    let idealOffsetX = playerX - Math.floor(this.viewportWidth / 2);
    let idealOffsetY = playerY - Math.floor(this.viewportHeight / 2);

    this.viewportOffsetX = Math.max(0, Math.min(idealOffsetX, this.floorWidth - this.viewportWidth));
    this.viewportOffsetY = Math.max(0, Math.min(idealOffsetY, this.floorHeight - this.viewportHeight));

    this.visibleGrid = [];
    for (let y = 0; y < this.viewportHeight; y++) {
      const gridY = this.viewportOffsetY + y;
      this.visibleGrid[y] = [];
      for (let x = 0; x < this.viewportWidth; x++) {
        const gridX = this.viewportOffsetX + x;
        if (gridY >= 0 && gridY < this.floorHeight && gridX >= 0 && gridX < this.floorWidth) {
          this.visibleGrid[y][x] = this.grid[gridY][gridX];
        } else {
          this.visibleGrid[y][x] = 'outer-wall';
        }
      }
    }

    // Check for blue fires in viewport and mark as seen
    this.blueFires.forEach(blueFire => {
      const inViewportX = blueFire.x >= this.viewportOffsetX && blueFire.x < this.viewportOffsetX + this.viewportWidth;
      const inViewportY = blueFire.y >= this.viewportOffsetY && blueFire.y < this.viewportOffsetY + this.viewportHeight;
      if (inViewportX && inViewportY) {
        blueFire.hasBeenSeen = true;
      }
    });
  }

  // Helper functions remain mostly the same, just update gridSize references
  isPlayerAt(potentialX: number, potentialY: number): boolean {
    return this.playerService.isPlayerAt(potentialX, potentialY);
  }

  hasFire(potentialX: number, potentialY: number): boolean {
    return this.fires.some(fire => fire.x === potentialX && fire.y === potentialY);
  }

  hasBlueFire(potentialX: number, potentialY: number): boolean {
    return this.blueFires.some(fire => fire.x === potentialX && fire.y === potentialY);
  }

  getBlueFireHealth(potentialX: number, potentialY: number): number | null {
    const blueFire = this.blueFires.find(f => f.x === potentialX && f.y === potentialY);
    return blueFire ? blueFire.health : null;
  }

  isBlueFireFlashing(potentialX: number, potentialY: number): boolean {
    const blueFire = this.blueFires.find(f => f.x === potentialX && f.y === potentialY);
    return blueFire?.flash || false;
  }

  getFireCountdown(potentialX: number, potentialY: number): number | null {
    const fire = this.fires.find(f => f.x === potentialX && f.y === potentialY);
    return fire ? fire.countdown : null;
  }

  hasWater(potentialX: number, potentialY: number): boolean {
    return this.waterService.hasWater(potentialX, potentialY);
  }

  isStairway(potentialX: number, potentialY: number): boolean {
    return this.stairway.x === potentialX && this.stairway.y === potentialY;
  }


  checkForUpgrade() {
    if (this.playerService.player.x === this.upgradePosition.x && 
        this.playerService.player.y === this.upgradePosition.y) {
      this.hoseLevels[this.hoseType]++; // Increment the level of the current hose
      this.upgradePosition = { x: -1, y: -1 };
    }
    if (this.playerService.player.x === this.basicHosePickup.x && 
        this.playerService.player.y === this.basicHosePickup.y) {
      this.hoseType = 'Basic'; // Switch to Basic, retain its level
      this.basicHosePickup = { x: -1, y: -1 };
    }
    if (this.playerService.player.x === this.spreadHosePickup.x && 
        this.playerService.player.y === this.spreadHosePickup.y) {
      this.hoseType = 'Spread'; // Switch to Spread, retain its level
      this.spreadHosePickup = { x: -1, y: -1 };
    }
    if (this.playerService.player.x === this.wideHosePickup.x && 
        this.playerService.player.y === this.wideHosePickup.y) {
      this.hoseType = 'Wide'; // Switch to Wide, retain its level
      this.wideHosePickup = { x: -1, y: -1 };
    }
    if (this.playerService.player.x === this.launchHosePickup.x && 
        this.playerService.player.y === this.launchHosePickup.y) {
      this.hoseType = 'Launch'; // Switch to Launch, retain its level
      this.launchHosePickup = { x: -1, y: -1 };
    }
  }

  isBasicHosePickupAt(x: number, y: number): boolean { return this.basicHosePickup.x === x && this.basicHosePickup.y === y; }
  isSpreadHosePickupAt(x: number, y: number): boolean { return this.spreadHosePickup.x === x && this.spreadHosePickup.y === y; }
  isWideHosePickupAt(x: number, y: number): boolean { return this.wideHosePickup.x === x && this.wideHosePickup.y === y; }
  isLaunchHosePickupAt(x: number, y: number): boolean { return this.launchHosePickup.x === x && this.launchHosePickup.y === y; }


  // Add helper method for upgrade
  isUpgradeAt(x: number, y: number): boolean {
    return this.upgradePosition.x === x && this.upgradePosition.y === y;
  }

  // Update getHoseDisplay method
  getHoseDisplay(): string {
    return `${this.hoseType} ${this.hoseLevels[this.hoseType] > 0 ? '+' + this.hoseLevels[this.hoseType] : ''}`.trim();
  }

  checkWinLoseCondition() {
    if (this.playerService.player.x === this.stairway.x && this.playerService.player.y === this.stairway.y) {
      if (this.currentFloor === 10) {
        this.gameWon = true;
      } else {
        this.currentFloor++;
        this.moves = 0;
        this.initializeFloor();
      }
    }
    if (this.playerHealth <= 0) this.gameLost = true;
  }

  restartGame() {
    this.playerService.resetPlayer();
    this.floorWidth = 12;
    this.floorHeight = 12;
    this.currentFloor = 1;
    this.fires = [];
    this.blueFires = [];
    this.moves = 0;
    this.playerHealth = CONSTANTS.INITIAL_PLAYER_HEALTH;
    this.gameWon = false;
    this.gameLost = false;
    this.hoseType = 'Basic';
    this.hoseLevels = { 'Basic': 0, 'Spread': 0, 'Wide': 0, 'Launch': 0 };
    this.waterService.clearWater();
    this.initializeFloor();
  }

}