import { ChangeDetectionStrategy, Component } from '@angular/core';
import { GameState } from '../../state/game-state';

@Component({
  selector: 'app-board',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardComponent {
  constructor(public state: GameState) {}

  public byIndex(index: number): number {
    return index;
  }
}
