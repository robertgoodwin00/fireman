import { Injectable } from '@angular/core';
import { GameComponent } from './game/game.component';

@Injectable({
  providedIn: 'root'
})
export class InputService {
  constructor() {}

  handleKeyboardEvent(event: KeyboardEvent, game: GameComponent) {
    if (game.gameWon || game.gameLost) return;

    let direction: { dx: number; dy: number } | null = null;
    let tookAction = false;

    switch (event.key) {
      case 'ArrowUp': case 'Numpad8': case '8': direction = { dx: 0, dy: -1 }; break;
      case 'ArrowDown': case 'Numpad2': case '2': direction = { dx: 0, dy: 1 }; break;
      case 'ArrowLeft': case 'Numpad4': case '4': direction = { dx: -1, dy: 0 }; break;
      case 'ArrowRight': case 'Numpad6': case '6': direction = { dx: 1, dy: 0 }; break;
      case 'Numpad7': case '7': case 'Home': direction = { dx: -1, dy: -1 }; break;
      case 'Numpad9': case '9': case 'PageUp': direction = { dx: 1, dy: -1 }; break;
      case 'Numpad1': case '1': case 'End': direction = { dx: -1, dy: 1 }; break;
      case 'Numpad3': case '3': case 'PageDown': direction = { dx: 1, dy: 1 }; break;
      case '.': tookAction = true; break;
    }

    if (event.shiftKey && direction) {
      game.waterService.shootWater(game, direction);
      tookAction = true;
    } else if (direction) {
      if (game.playerService.movePlayer(direction, game.grid, game.floorWidth, game.floorHeight, game.fires)) {
        game.updateVisibleGrid();
        // Removed checkForUpgrade call - moved to GameComponent
        tookAction = true;
      }
    }

    if (tookAction) {
      game.tookTurn();
    }
  }
}