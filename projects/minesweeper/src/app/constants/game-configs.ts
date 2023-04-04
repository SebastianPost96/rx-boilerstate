import { Difficulty } from '../models/difficulty';
import { GameConfig } from '../models/game-config';

export const GAME_CONFIGS: Record<Difficulty, GameConfig> = {
  [Difficulty.Beginner]: { dimensions: { x: 9, y: 9 }, mines: 10 },
  [Difficulty.Intermediate]: { dimensions: { x: 16, y: 16 }, mines: 40 },
  [Difficulty.Expert]: { dimensions: { x: 30, y: 16 }, mines: 99 },
};
