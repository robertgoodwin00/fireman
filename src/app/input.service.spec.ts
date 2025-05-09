import { TestBed } from '@angular/core/testing';
import { InputService } from './input.service';
import { GameComponent } from './game/game.component';
import { WaterService } from './water.service';
import { PlayerService } from './player.service';
import { FloorService } from './floor.service';

describe('InputService', () => {
  let service: InputService;
  let game: GameComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [InputService, GameComponent, WaterService, PlayerService, FloorService]
    });
    service = TestBed.inject(InputService);
    game = TestBed.inject(GameComponent);

    // Initialize game state with spies to avoid recursion issues
    spyOn(game, 'initializeFloor').and.callFake(() => {
      game.grid = Array(10).fill(null).map(() => Array(10).fill('empty'));
      game.grid[0] = game.grid[9] = game.grid.map(row => row.slice())[0].fill('outer-wall');
      game.grid.forEach(row => { row[0] = row[9] = 'outer-wall'; });
      game.fires = [{ x: 5, y: 5, countdown: 3 }];
      game.stairway = { x: 8, y: 8 };
      game.playerService.player = { x: 1, y: 1 };
    });
    game.gridSize = 10;
    game.currentFloor = 1;
    game.initializeFloor();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should handle movement input (ArrowUp)', () => {
    spyOn(game.playerService, 'movePlayer').and.returnValue(true);
    spyOn(game, 'tookTurn');

    const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
    service.handleKeyboardEvent(event, game);

    expect(game.playerService.movePlayer).toHaveBeenCalledWith({ dx: 0, dy: -1 }, game.grid, game.gridSize, game.fires);
    expect(game.tookTurn).toHaveBeenCalled();
  });

  it('should handle water shooting with Shift + ArrowRight', () => {
    spyOn(game.waterService, 'shootWater');
    spyOn(game, 'tookTurn');

    const event = new KeyboardEvent('keydown', { key: 'ArrowRight', shiftKey: true });
    service.handleKeyboardEvent(event, game);

    expect(game.waterService.shootWater).toHaveBeenCalledWith(game, { dx: 1, dy: 0 });
    expect(game.tookTurn).toHaveBeenCalled();
  });

  it('should handle wait action (.)', () => {
    spyOn(game, 'tookTurn');

    const event = new KeyboardEvent('keydown', { key: '.' });
    service.handleKeyboardEvent(event, game);

    expect(game.tookTurn).toHaveBeenCalled();
  });

  it('should not process input when game is won or lost', () => {
    spyOn(game.playerService, 'movePlayer');
    spyOn(game.waterService, 'shootWater');
    spyOn(game, 'tookTurn');

    game.gameWon = true;
    const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
    service.handleKeyboardEvent(event, game);

    expect(game.playerService.movePlayer).not.toHaveBeenCalled();
    expect(game.waterService.shootWater).not.toHaveBeenCalled();
    expect(game.tookTurn).not.toHaveBeenCalled();

    game.gameWon = false;
    game.gameLost = true;
    service.handleKeyboardEvent(event, game);

    expect(game.playerService.movePlayer).not.toHaveBeenCalled();
    expect(game.waterService.shootWater).not.toHaveBeenCalled();
    expect(game.tookTurn).not.toHaveBeenCalled();
  });
});