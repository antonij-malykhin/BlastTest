import { Board } from "../Board";
import { Tile, TileType } from "./Tile";

export interface ITileEffect {
    readonly type: TileType;

    apply(board: Board, tile: Tile): Tile[];
}
