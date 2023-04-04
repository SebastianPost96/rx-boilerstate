import { Pipe, PipeTransform } from '@angular/core';
import { Tile } from '../models/tile';

@Pipe({
  name: 'tileIcon',
})
export class TileIconPipe implements PipeTransform {
  transform(tile: Tile, adjacentMines: number): string {
    if (tile.revealed) {
      if (tile.isMine) return '/assets/tile/mine-red.jpg';

      return '/assets/tile/revealed.svg';
    }

    if (tile.isFlagged) return '/assets/tile/flag.svg';
    return '/assets/tile/unopened.svg';
  }
}
