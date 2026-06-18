import { Board } from "./Board";
import { ITileEffect } from "./ITileEffect";
import { Tile, TileType } from "./Tile";

export class RowClearTileEffect implements ITileEffect {
    public readonly type = TileType.ROW_CLEAR;

    public apply(board: Board, tile: Tile): Tile[] {
        const removeTiles: Tile[] = [];

        for (let column = 0; column < board.config.horizontalTileCount; column++) {
            const tileAtPosition = board.getTileAt(board.getPositionBy(tile.position.row, column));
            if (!tileAtPosition) continue;
            removeTiles.push(tileAtPosition);
        }

        return removeTiles;
    }
}

