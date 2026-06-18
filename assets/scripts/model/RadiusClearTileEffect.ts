import { Board } from "./Board";
import { ITileEffect } from "./ITileEffect";
import { Tile, TileType } from "./Tile";

export class RadiusClearTileEffect implements ITileEffect {
    public readonly type = TileType.RADIUS_CLEAR;

    public apply(board: Board, tile: Tile): Tile[] {
        const removeTiles: Tile[] = [];
        const centerRow = tile.position.row;
        const centerColumn = tile.position.column;
        const radius = board.config.superTileRadius;

        for (let row = centerRow - radius; row <= centerRow + radius; row++) {
            for (let column = centerColumn - radius; column <= centerColumn + radius; column++) {
                const tileAtPosition = board.getTileAt(board.getPositionBy(row, column));
                if (!tileAtPosition) continue;
                removeTiles.push(tileAtPosition);
            }
        }

        return removeTiles;
    }
}

