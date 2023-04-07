import { ChangeDetectionStrategy, Component } from '@angular/core';
import { GameProcess } from '../../models/game-process';
import { GameState } from '../../state/game-state';

@Component({
  selector: 'app-board',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardComponent {
  public gameProcess = GameProcess;

  constructor(public gameState: GameState) {}

  public byIndex(index: number): number {
    return index;
  }
}
