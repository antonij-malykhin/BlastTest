import { Board } from "./Board";
import { ITileEffect } from "./ITileEffect";
import { Tile, TileType } from "./Tile";

export class BoardClearTileEffect implements ITileEffect {
    public readonly type = TileType.BOMB;

    public apply(board: Board, tile: Tile): Tile[] {
        return board.getAllTiles();
    }
}

