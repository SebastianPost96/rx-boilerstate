import { Pipe, PipeTransform } from '@angular/core';
import { Tile } from '../models/tile';
import { GameProcess } from '../models/game-process';

@Pipe({
  name: 'tileImage',
})
export class TileImagePipe implements PipeTransform {
  transform(tile: Tile, mouseover: boolean, adjacentMines: number, gameProcess: GameProcess): string {
    if (gameProcess === GameProcess.GameOver) {
      if (!tile.isMine && tile.isFlagged) return `url('assets/tile/wrong-flag.png')`;
      if (tile.isMine && !tile.revealed && !tile.isFlagged) return `url('assets/tile/mine.png')`;
      if (tile.isMine && tile.revealed) return `url('assets/tile/mine-red.jpg')`;
    }

    if (tile.isFlagged) return `url('assets/tile/flag.svg')`;

    if (tile.revealed) {
      if (adjacentMines) return `url('assets/tile/${adjacentMines}.svg')`;
      return `url('assets/tile/revealed.svg')`;
    }

    if (mouseover) return `url('assets/tile/revealed.svg')`;

    return `url('assets/tile/unopened.svg')`;
  }
}
