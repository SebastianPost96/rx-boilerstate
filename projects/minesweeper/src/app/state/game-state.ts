import { Injectable, computed } from '@angular/core';
import { filter, find, interval, map, of, startWith, switchMap, takeUntil } from 'rxjs';
import { GAME_CONFIGS } from '../constants/game-configs';
import { Difficulty } from '../models/difficulty';
import { GameProcess } from '../models/game-process';
import { Point, Tile } from '../models/tile';
import { getAdjacentTiles, revealSafeAdjacentTiles, setRandomMine } from './game-state.helpers';
import { toObservable } from '@angular/core/rxjs-interop';
import { shallowEqual } from 'fast-equals';
import { produce } from 'immer';
import { SimpleSignal, fromSimple } from 'ngx-simple-signal';

@Injectable({ providedIn: 'root' })
export class GameState {
  @SimpleSignal(GameProcess.Start) process!: GameProcess;
  @SimpleSignal([]) grid!: Tile[][];
  @SimpleSignal(Difficulty.Beginner) difficulty!: Difficulty;

  public remainingMines = computed(() => {
    if (this.process === GameProcess.Start) return GAME_CONFIGS[this.difficulty].mines;
    if (this.process === GameProcess.Win) return 0;

    let mines = 0;
    let flags = 0;
    for (const tile of this.grid.flat()) {
      if (tile.isMine) mines++;
      if (tile.isFlagged) flags++;
    }
    return mines - flags;
  });

  // example of rxjs interop
  private process$ = toObservable(fromSimple(() => this.process));
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
  private adjacentTiles = (tile: Tile) => computed(() => getAdjacentTiles(this.grid, tile), { equal: shallowEqual });

  // example of deriving a parameterized selector
  public adjacentMines = (tile: Tile) => computed(() => this.adjacentTiles(tile)().filter((t) => t.isMine).length);

  public generateNewBoard(): void {
    const { dimensions, mines } = GAME_CONFIGS[this.difficulty];

    // generate empty grid based on difficulty
    this.grid = produce(this.grid, (grid) => {
      grid.length = 0;
      for (let y = 0; y < dimensions.y; y++) {
        grid[y] = [];
        for (let x = 0; x < dimensions.x; x++) {
          grid[y][x] = { isMine: false, isFlagged: false, location: { x, y }, revealed: false };
        }
      }

      for (let i = 0; i < mines; i++) {
        setRandomMine(grid);
      }
    });

    this.process = GameProcess.Start;
  }

  public revealTile({ y, x }: Point): void {
    this.grid = produce(this.grid, (grid) => {
      const tile = grid[y][x];
      if (tile.isFlagged || tile.revealed) return;

      // start game on first click
      if (this.process === GameProcess.Start) {
        this.process = GameProcess.Playing;
        if (tile.isMine) {
          setRandomMine(grid);
          tile.isMine = false;
        }
      }

      tile.revealed = true;
      revealSafeAdjacentTiles(grid, tile);

      if (tile.isMine) {
        this.process = GameProcess.GameOver;
        return;
      }

      const gameWon = grid.flat().every((t) => t.isMine || t.revealed);
      if (gameWon) this.process = GameProcess.Win;
    });
  }

  public flagTile({ y, x }: Point): void {
    this.grid = produce(this.grid, (grid) => {
      const tile = grid[y][x];
      if (tile.revealed) return;
      tile.isFlagged = !tile.isFlagged;
    });
  }

  public setDifficulty(difficulty: Difficulty): void {
    const difficultyChanged = difficulty !== this.difficulty;

    this.difficulty = difficulty;

    if (difficultyChanged) {
      this.generateNewBoard();
    }
  }
}
