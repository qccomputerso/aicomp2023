import { Component } from '@angular/core';
import { GameManager } from './game/game_manager';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'aicomp2023';

  startNewGame() {
    const gameManager = new GameManager;
    gameManager.newGame();
  }
}
