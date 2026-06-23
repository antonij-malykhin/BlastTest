import { Board } from "../board/Board";
import { ITileEffect } from "../board/tile/ITileEffect";
import { Tile, TileType } from "../board/tile/Tile";

export class ColumnClearTileEffect implements ITileEffect {
    public readonly type = TileType.COL_CLEAR;

    public apply(board: Board, tile: Tile): Tile[] {
        const removeTiles: Tile[] = [];

        for (let row = 0; row < board.config.verticalTileCount; row++) {
            const tileAtPosition = board.getTileAt(board.getPositionBy(row, tile.position.column));
            if (!tileAtPosition) continue;
            removeTiles.push(tileAtPosition);
        }

        return removeTiles;
    }
}

