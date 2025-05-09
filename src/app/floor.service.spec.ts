import { TestBed } from '@angular/core/testing';
import { FloorService } from './floor.service';
import { PlayerService } from './player.service';

describe('FloorService', () => {
  let service: FloorService;
  let playerService: PlayerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FloorService, PlayerService]
    });
    service = TestBed.inject(FloorService);
    playerService = TestBed.inject(PlayerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize a floor with correct grid size', () => {
    const gridSize = 10;
    const currentFloor = 1;
    const { grid, fires, stairway } = service.initializeFloor(gridSize, currentFloor);

    expect(grid.length).toBe(gridSize);
    expect(grid[0].length).toBe(gridSize);
    expect(fires.length).toBeGreaterThanOrEqual(1);
    expect(stairway.x).toBeGreaterThan(0);
    expect(stairway.x).toBeLessThan(gridSize - 1);
    expect(stairway.y).toBeGreaterThan(0);
    expect(stairway.y).toBeLessThan(gridSize - 1);
  });

  it('should ensure minimum path length of 4 between player and stairway', () => {
    const gridSize = 10;
    const currentFloor = 1;
    const { grid, fires, stairway } = service.initializeFloor(gridSize, currentFloor);
    const playerPos = playerService.player;

    const minPathLength = 4;
    const pathExists = service['pathExists'](playerPos, stairway, grid, gridSize, fires, minPathLength);
    expect(pathExists).toBeTrue();
  });

  it('should increase fire count with floor level', () => {
    const gridSize = 10;
    const floor1 = service.initializeFloor(gridSize, 1);
    const floor2 = service.initializeFloor(gridSize, 2);
    const floor3 = service.initializeFloor(gridSize, 3);

    expect(floor1.fires.length).toBe(1);
    expect(floor2.fires.length).toBeGreaterThanOrEqual(2);
    expect(floor3.fires.length).toBeGreaterThanOrEqual(3);
  });

  it('should use fallback layout when recursion limit is exceeded', () => {
    const gridSize = 10;
    const currentFloor = 1;

    // Mock pathExists to always return false to force recursion limit
    spyOn<any>(service, 'pathExists').and.returnValue(false);
    spyOn(console, 'warn'); // Spy on console.warn to avoid cluttering output

    const { grid, fires, stairway } = service.initializeFloor(gridSize, currentFloor);

    expect(console.warn).toHaveBeenCalledWith('Max recursion depth reached; using fallback layout');
    expect(playerService.player).toEqual({ x: 1, y: 1 });
    expect(stairway).toEqual({ x: gridSize - 2, y: gridSize - 2 });
    expect(fires.length).toBe(1); // Fallback layout has 1 fire on floor 1
  });
});