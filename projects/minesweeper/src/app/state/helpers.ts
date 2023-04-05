import { Point, Tile } from '../models/tile';

export function setRandomMine(tiles: Tile[][]): void {
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

// 3x3 area
export function getAdjacentTiles(grid: Tile[][], tile: Tile): Tile[] {
  const { x, y } = tile.location;
  const neighbors = [
    grid[y - 1]?.[x - 1],
    grid[y - 1]?.[x],
    grid[y - 1]?.[x + 1],
    grid[y]?.[x - 1],
    grid[y]?.[x + 1],
    grid[y + 1]?.[x - 1],
    grid[y + 1]?.[x],
    grid[y + 1]?.[x + 1],
  ];
  return neighbors.filter((tile) => tile);
}

export function getAdjacentMines(grid: Tile[][], tile: Tile): number {
  return getAdjacentTiles(grid, tile).filter((tile) => tile.isMine).length;
}

export function isSafe(grid: Tile[][], tile: Tile): boolean {
  return !tile.isMine && !getAdjacentMines(grid, tile);
}
