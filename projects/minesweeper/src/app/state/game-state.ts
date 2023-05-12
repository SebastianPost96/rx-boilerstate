import { Injectable, signal, computed } from '@angular/core';
import { filter, find, interval, map, of, startWith, switchMap, takeUntil } from 'rxjs';
import { GAME_CONFIGS } from '../constants/game-configs';
import { Difficulty } from '../models/difficulty';
import { GameProcess } from '../models/game-process';
import { Point, Tile } from '../models/tile';
import { getAdjacentTiles, revealSafeAdjacentTiles, setRandomMine } from './game-state.helpers';
import { toObservable } from '@angular/core/rxjs-interop';
import { shallowEqual } from 'fast-equals';
import { produce } from 'immer';

@Injectable({ providedIn: 'root' })
export class GameState {
  process = signal(GameProcess.Start);
  grid = signal<Tile[][]>([]);
  difficulty = signal(Difficulty.Beginner);

  public remainingMines = computed(() => {
    const process = this.process();
    if (process === GameProcess.Start) return GAME_CONFIGS[this.difficulty()].mines;
    if (process === GameProcess.Win) return 0;

    let mines = 0;
    let flags = 0;
    for (const tile of this.grid().flat()) {
      if (tile.isMine) mines++;
      if (tile.isFlagged) flags++;
    }
    return mines - flags;
  });

  // example of rxjs interop
  private process$ = toObservable(this.process);
  public timer$ = this.process$.pipe(
    filter((process) => process === GameProcess.Playing || process === GameProcess.Start),
    switchMap((process) =>
      process === GameProcess.Start
        ? of(0)
        : interval(1000).pipe(
            map((i) => i + 1),
            startWith(0),
            takeUntil(this.process$.pipe(find((p) => p !== GameProcess.Playing)))
          )
    )
  );

  // example of custom change detection
  private adjacentTiles = (tile: Tile) => computed(() => getAdjacentTiles(this.grid(), tile), { equal: shallowEqual });

  // example of deriving a parameterized selector
  public adjacentMines = (tile: Tile) => computed(() => this.adjacentTiles(tile)().filter((t) => t.isMine).length);

  public generateNewBoard(): void {
    const { dimensions, mines } = GAME_CONFIGS[this.difficulty()];

    // generate empty grid based on difficulty
    this.grid.update((grid) =>
      produce(grid, (draft) => {
        draft.length = 0;
        for (let y = 0; y < dimensions.y; y++) {
          draft[y] = [];
          for (let x = 0; x < dimensions.x; x++) {
            draft[y][x] = { isMine: false, isFlagged: false, location: { x, y }, revealed: false };
          }
        }

        for (let i = 0; i < mines; i++) {
          setRandomMine(draft);
        }
      })
    );

    this.process.set(GameProcess.Start);
  }

  public revealTile({ y, x }: Point): void {
    this.grid.update((grid) =>
      produce(grid, (draft) => {
        const tile = draft[y][x];
        if (tile.isFlagged || tile.revealed) return;

        // start game on first click
        if (this.process() === GameProcess.Start) {
          this.process.set(GameProcess.Playing);
          if (tile.isMine) {
            setRandomMine(draft);
            tile.isMine = false;
          }
        }

        tile.revealed = true;
        revealSafeAdjacentTiles(draft, tile);

        if (tile.isMine) {
          this.process.set(GameProcess.GameOver);
          return;
        }

        const gameWon = draft.flat().every((t) => t.isMine || t.revealed);
        if (gameWon) this.process.set(GameProcess.Win);
      })
    );
  }

  public flagTile({ y, x }: Point): void {
    this.grid.update((grid) =>
      produce(grid, (draft) => {
        const tile = draft[y][x];
        if (tile.revealed) return;
        tile.isFlagged = !tile.isFlagged;
      })
    );
  }

  public setDifficulty(difficulty: Difficulty): void {
    const difficultyChanged = difficulty !== this.difficulty();

    this.difficulty.set(difficulty);

    if (difficultyChanged) {
      this.generateNewBoard();
    }
  }
}
