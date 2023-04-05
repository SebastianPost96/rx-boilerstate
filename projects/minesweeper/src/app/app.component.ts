import { ChangeDetectionStrategy, Component } from '@angular/core';
import { GameState } from './state/game-state';
import { Difficulty } from './models/difficulty';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  public difficulties = Object.values(Difficulty);
  constructor(public state: GameState) {
    state.startGame();
  }
}
