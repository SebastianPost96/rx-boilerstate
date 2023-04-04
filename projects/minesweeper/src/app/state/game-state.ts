import { Injectable } from '@angular/core';
import { Difficulty } from '../models/difficulty';
import { GameProcess } from '../models/game-process';
import { Tile } from '../models/tile';
import { GameConfig } from '../models/game-config';
import { GAME_CONFIGS } from '../constants/game-configs';
import { State } from 'projects/boiler-state/src/public-api';

interface GameModel {
  process: GameProcess;
  tiles: Tile[][];
  difficulty: Difficulty;
}

@Injectable({ providedIn: 'root' })
export class GameState extends State<GameModel> {
  constructor() {
    super({ process: 'start', tiles: [], difficulty: 'Beginner' }, { debug: true });
  }

  // #region Selectors
  public process$ = this.select(({ process }) => process);
  public tiles$ = this.select(({ tiles }) => tiles);
  public difficulty$ = this.select(({ difficulty }) => difficulty);
  // #endregion

  // #region Selector Factories

  // #endregion

  // #region Actions
  public startGame(): void {
    this.updateState((state) => {
      function generateTiles(setting: GameConfig) {
        state.tiles = [];
        for (let y = 0; y < setting.dimensions.y; y++) {
          state.tiles[y] = [];
          for (let x = 0; x < setting.dimensions.x; x++) {
            state.tiles[y][x] = { isBomb: false, isFlagged: false, location: { x, y }, revealed: false };
          }
        }
      }

      const config = GAME_CONFIGS[state.difficulty];
      generateTiles(config);
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
  // #endregion
}
