import { Injectable } from '@angular/core';
import { State } from '../../../../rx-boilerstate/src/public-api';
import { filter, find, interval, map, of, startWith, switchMap, takeUntil } from 'rxjs';
import { GAME_CONFIGS } from '../constants/game-configs';
import { Difficulty } from '../models/difficulty';
import { GameProcess } from '../models/game-process';
import { Point, Tile } from '../models/tile';
import { getAdjacentTiles, revealSafeAdjacentTiles, setRandomMine } from './helpers';

interface GameModel {
  process: GameProcess;
  grid: Tile[][];
  difficulty: Difficulty;
}

@Injectable({ providedIn: 'root' })
export class GameState extends State<GameModel> {
  constructor() {
    super({ process: GameProcess.Start, grid: [], difficulty: Difficulty.Beginner });
  }

  public process$ = this.select(({ process }) => process);
  public grid$ = this.select(({ grid }) => grid);
  public difficulty$ = this.select(({ difficulty }) => difficulty);

  public remainingMines$ = this.derive(this.grid$, this.process$, this.difficulty$, (grid, process, difficulty) => {
    if (process === GameProcess.Start) return GAME_CONFIGS[difficulty].mines;
    if (process === GameProcess.Win) return 0;

    let mines = 0;
    let flags = 0;
    for (const tile of grid.flat()) {
      if (tile.isMine) mines++;
      if (tile.isFlagged) flags++;
    }
    return mines - flags;
  });

  // example of rxjs interop
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
  private adjacentTiles = (tile: Tile) =>
    this.derive(this.grid$, (grid) => getAdjacentTiles(grid, tile)).defineChange('shallow');
  // example of deriving dynamic state
  public adjacentMines = (tile: Tile) =>
    this.derive(this.adjacentTiles(tile), (tiles) => tiles.filter((t) => t.isMine).length);

  public generateNewBoard(): void {
    this.updateState((state) => {
      const { dimensions, mines } = GAME_CONFIGS[state.difficulty];

      state.grid = [];
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

  public revealTile(location: Point): void {
    this.updateState((state) => {
      const tile = state.grid[location.y][location.x];

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

  public flagTile(location: Point): void {
    this.updateState((state) => {
      const tile = state.grid[location.y][location.x];
      tile.isFlagged = !tile.isFlagged;
    });
  }

  public setDifficulty(difficulty: Difficulty): void {
    const difficultyChanged = difficulty !== this.asSelector().snapshot.difficulty;

    this.updateState((state) => {
      state.difficulty = difficulty;
    });

    if (difficultyChanged) {
      this.generateNewBoard();
    }
  }
}
