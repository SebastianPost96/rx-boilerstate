import { ChangeDetectionStrategy, Component } from '@angular/core';
import { GameState } from './state/game-state';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  constructor(public state: GameState) {}
}
