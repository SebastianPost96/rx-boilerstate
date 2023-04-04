import { Injectable } from '@angular/core';
import { State } from 'projects/boiler-state/src/public-api';
import { GAME_CONFIGS } from '../constants/game-configs';
import { Difficulty } from '../models/difficulty';
import { GameProcess } from '../models/game-process';
import { Point, Tile } from '../models/tile';

interface GameModel {
  process: GameProcess;
  tiles: Tile[][];
  difficulty: Difficulty;
}

@Injectable({ providedIn: 'root' })
export class GameState extends State<GameModel> {
  constructor() {
    super({ process: GameProcess.Start, tiles: [], difficulty: Difficulty.Beginner }, { debug: true });
  }

  public process$ = this.select(({ process }) => process);
  public tiles$ = this.select(({ tiles }) => tiles);
  public difficulty$ = this.select(({ difficulty }) => difficulty);

  public adjacentTiles = this.deriveDynamic(this.tiles$, ([tiles], { x, y }: Point) => {
    return [
      tiles[y - 1]?.[x - 1],
      tiles[y - 1]?.[x],
      tiles[y - 1]?.[x + 1],
      tiles[y]?.[x - 1],
      tiles[y]?.[x + 1],
      tiles[y + 1]?.[x - 1],
      tiles[y + 1]?.[x],
      tiles[y + 1]?.[x + 1],
    ].filter((tile) => tile);
  });

  public startGame(): void {
    this.updateState((state) => {
      const { dimensions, mines } = GAME_CONFIGS[state.difficulty];

      state.tiles = [];
      for (let y = 0; y < dimensions.y; y++) {
        state.tiles[y] = [];
        for (let x = 0; x < dimensions.x; x++) {
          state.tiles[y][x] = { isMine: false, isFlagged: false, location: { x, y }, revealed: false };
        }
      }

      for (let i = 0; i < mines; i++) {
        setRandomMine(state.tiles);
      }

      state.process = GameProcess.Playing;
    });
  }

  public revealTile(location: Point): void {
    this.updateState((state) => {
      const tile = state.tiles[location.y][location.x];
      const isFirstTile = () => state.tiles.every((array) => array.every((item) => !item.revealed));
      if (tile.isMine && isFirstTile()) {
        setRandomMine(state.tiles);
        tile.isMine = false;
      }
      tile.revealed = true;
    });

    // TODO: reveal adjacent tiles
  }

  public flagTile(location: Point): void {
    this.updateState((state) => {
      const tile = state.tiles[location.y][location.x];
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

function setRandomMine(tiles: Tile[][]): void {
  function getRandomInt(max: number) {
    return Math.floor(Math.random() * max);
  }

  const selectedTile = tiles[getRandomInt(tiles.length)][getRandomInt(tiles[0].length)];
  if (selectedTile.isMine) {
    setRandomMine(tiles);
  } else {
    selectedTile.isMine = true;
  }
}
