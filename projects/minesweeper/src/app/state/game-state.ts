import { Injectable } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { derived, immutableSignal } from 'ngx-immutable-signal';
import { filter, find, interval, map, of, startWith, switchMap, takeUntil } from 'rxjs';
import { GAME_CONFIGS } from '../constants/game-configs';
import { Difficulty } from '../models/difficulty';
import { GameProcess } from '../models/game-process';
import { Point, Tile } from '../models/tile';
import { getAdjacentTiles, revealSafeAdjacentTiles, setRandomMine } from './game-state.helpers';

interface State {
  process: GameProcess;
  grid: Tile[][];
  difficulty: Difficulty;
}

@Injectable({ providedIn: 'root' })
export class GameState {
  private store = immutableSignal<State>({ process: GameProcess.Start, grid: [], difficulty: Difficulty.Beginner });

  process = derived(() => this.store().process);
  grid = derived(() => this.store().grid);
  difficulty = derived(() => this.store().difficulty);

  public remainingMines = derived(() => {
    if (this.process() === GameProcess.Start) return GAME_CONFIGS[this.difficulty()].mines;
    if (this.process() === GameProcess.Win) return 0;

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
  private adjacentTiles = (tile: Tile) => derived(() => getAdjacentTiles(this.grid(), tile), 'shallow');

  // example of deriving a parameterized selector
  public adjacentMines = (tile: Tile) => derived(() => this.adjacentTiles(tile)().filter((t) => t.isMine).length);

  public generateNewBoard(): void {
    const { dimensions, mines } = GAME_CONFIGS[this.difficulty()];

    // generate empty grid based on difficulty
    this.store.mutate((state) => {
      state.grid.length = 0;
      for (let y = 0; y < dimensions.y; y++) {
        state.grid[y] = [];
        for (let x = 0; x < dimensions.x; x++) {
          state.grid[y][x] = { isMine: false, isFlagged: false, location: { x, y }, revealed: false };
        }
      }

      for (let i = 0; i < mines; i++) {
        setRandomMine(state.grid);
      }

      state.process = GameProcess.Start;
    });
  }

  public revealTile({ y, x }: Point): void {
    this.store.mutate((state) => {
      const tile = state.grid[y][x];
      if (tile.isFlagged || tile.revealed) return;

      // start game on first click
      if (state.process === GameProcess.Start) {
        state.process = GameProcess.Playing;
        if (tile.isMine) {
          setRandomMine(state.grid);
          tile.isMine = false;
        }
      }

      tile.revealed = true;
      revealSafeAdjacentTiles(state.grid, tile);

      if (tile.isMine) {
        state.process = GameProcess.GameOver;
        return;
      }

      const gameWon = state.grid.flat().every((t) => t.isMine || t.revealed);
      if (gameWon) state.process = GameProcess.Win;
    });
  }

  public flagTile({ y, x }: Point): void {
    this.store.mutate(({ grid }) => {
      const tile = grid[y][x];
      if (tile.revealed) return;
      tile.isFlagged = !tile.isFlagged;
    });
  }

  public setDifficulty(difficulty: Difficulty): void {
    const difficultyChanged = difficulty !== this.difficulty();

    this.store.mutate((state) => {
      state.difficulty = difficulty;
    });

    if (difficultyChanged) {
      this.generateNewBoard();
    }
  }
}
