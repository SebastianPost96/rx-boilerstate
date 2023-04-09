import { Pipe, PipeTransform } from '@angular/core';
import { Tile } from '../models/tile';
import { GameProcess } from '../models/game-process';

const images = {
  wrongFlag: 'assets/tile/wrong-flag.png',
  mine: 'assets/tile/mine.png',
  mineRed: 'assets/tile/mine-red.jpg',
  flag: 'assets/tile/flag.svg',
  revealed: 'assets/tile/revealed.svg',
  unopened: 'assets/tile/unopened.svg',
  1: 'assets/tile/1.svg',
  2: 'assets/tile/2.svg',
  3: 'assets/tile/3.svg',
  4: 'assets/tile/4.svg',
  5: 'assets/tile/5.svg',
  6: 'assets/tile/6.svg',
  7: 'assets/tile/7.svg',
  8: 'assets/tile/8.svg',
};

// preload images and keep them cached for smoother experience
const preloadedImages = [];
Object.values(images).forEach((url) => {
  const img = new Image();
  img.src = url;
  preloadedImages.push(img);
});

@Pipe({
  name: 'tileImage',
})
export class TileImagePipe implements PipeTransform {
  transform(tile: Tile, mouseover: boolean, adjacentMines: number, gameProcess: GameProcess): string {
    const url = this.getUrl(tile, mouseover, adjacentMines, gameProcess);
    return `url('${url}')`;
  }

  private getUrl(tile: Tile, mouseover: boolean, adjacentMines: number, gameProcess: GameProcess): string {
    if (gameProcess === GameProcess.GameOver) {
      if (!tile.isMine && tile.isFlagged) return images.wrongFlag;
      if (tile.isMine && !tile.revealed && !tile.isFlagged) return images.mine;
      if (tile.isMine && tile.revealed) return images.mineRed;
    }

    if (tile.isFlagged) return images.flag;

    if (tile.revealed) {
      if (adjacentMines) return images[adjacentMines as never];
      return images.revealed;
    }

    if (mouseover) return images.revealed;

    return images.unopened;
  }
}
