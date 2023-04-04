export interface Tile {
  isFlagged: boolean;
  isMine: boolean;
  location: Point;
  revealed: boolean;
}

export interface Point {
  x: number;
  y: number;
}
