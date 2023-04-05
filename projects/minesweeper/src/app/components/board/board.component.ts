import { ChangeDetectionStrategy, Component } from '@angular/core';
import { GameState } from '../../state/game-state';
import { GameProcess } from '../../models/game-process';

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
