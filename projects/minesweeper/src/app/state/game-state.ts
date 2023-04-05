import { Injectable } from '@angular/core';
import { State } from 'projects/boiler-state/src/public-api';
import { GAME_CONFIGS } from '../constants/game-configs';
import { Difficulty } from '../models/difficulty';
import { GameProcess } from '../models/game-process';
import { Point, Tile } from '../models/tile';
import { getAdjacentMines, getAdjacentTiles, isSafe, setRandomMine } from './helpers';

interface GameModel {
  process: GameProcess;
  grid: Tile[][];
  difficulty: Difficulty;
}

@Injectable({ providedIn: 'root' })
export class GameState extends State<GameModel> {
  constructor() {
    super({ process: GameProcess.Start, grid: [], difficulty: Difficulty.Expert });
  }

  public process$ = this.select(({ process }) => process);
  public grid$ = this.select(({ grid }) => grid);
  public difficulty$ = this.select(({ difficulty }) => difficulty);

  public remainingMines$ = this.derive(this.grid$, (grid) => {
    let mines = 0;
    let flags = 0;
    for (const tile of grid.flat()) {
      if (tile.isMine) mines++;
      if (tile.isFlagged) flags++;
    }
    return mines - flags;
  });
  public adjacentMines = this.deriveDynamic(this.grid$, ([grid], tile: Tile) => getAdjacentMines(grid, tile));

  public startGame(): void {
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

      state.process = GameProcess.Playing;
    });
  }

  public revealTile(location: Point): void {
    this.updateState((state) => {
      function revealSafeAdjacentTiles(tile: Tile) {
        if (!isSafe(state.grid, tile)) return;
        const tilesToReveal = getAdjacentTiles(state.grid, tile).filter((t) => !t.revealed);
        tilesToReveal.forEach((t) => {
          t.revealed = true;
          revealSafeAdjacentTiles(t);
        });
      }

      const tile = state.grid[location.y][location.x];
      const isFirstTile = () => state.grid.every((array) => array.every((item) => !item.revealed));
      if (tile.isMine && isFirstTile()) {
        setRandomMine(state.grid);
        tile.isMine = false;
      }
      tile.revealed = true;
      revealSafeAdjacentTiles(tile);

      if (tile.isMine) state.process = GameProcess.GameOver;
    });
  }

  public flagTile(location: Point): void {
    this.updateState((state) => {
      const tile = state.grid[location.y][location.x];
      tile.isFlagged = !tile.isFlagged;
    });
  }

  public setDifficulty(difficulty: Difficulty): void {
    this.updateState((state) => {
      state.difficulty = difficulty;
    });
  }

  public setProcess(process: GameProcess): void {
    this.updateState((state) => {
      state.process = process;
    });
  }
}
