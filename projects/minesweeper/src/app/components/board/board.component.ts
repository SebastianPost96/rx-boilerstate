import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { GameProcess } from '../../models/game-process';
import { GameState } from '../../state/game-state';
import { filter, interval, map, of, startWith, switchMap, takeUntil, tap } from 'rxjs';

@Component({
  selector: 'app-board',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardComponent {
  public gameProcess = GameProcess;

  constructor(public gameState: GameState, private cd: ChangeDetectorRef) {}

  // workaround because async pipe does not detect changes when a subject switchmaps into interval
  timer$ = this.gameState.timer$.pipe(tap(() => queueMicrotask(() => this.cd.detectChanges())));

  public byIndex(index: number): number {
    return index;
  }
}
