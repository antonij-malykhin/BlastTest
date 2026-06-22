import { BoardTileSelectedCommand } from "./view/BoardView";

export const ScoreChangedEvent = "score-changed";
export const MovesChangedEvent = "moves-changed";
export const LevelWinEvent = "level-win";
export const LevelLoseEvent = "level-lose";
export const RestartEventName = "restart";

// Файл: GameEvents.ts
export interface GameEvents {
  "score-changed" : { score: number; };
  "moves-changed" : { moves: number; };
  "level-win" : {};
  "level-lose" : {};
}


export const TileSelectedEventName = "tile-selected";

export interface BoardEvents {
  "tile-selected": BoardTileSelectedCommand;
}
