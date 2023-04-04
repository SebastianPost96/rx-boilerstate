export interface Tile {
  isFlagged: boolean;
  isBomb: boolean;
  location: { x: number; y: number };
  revealed: boolean;
}
