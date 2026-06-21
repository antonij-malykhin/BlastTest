import { Board } from "./Board";
import { BoardClearTileEffect } from "./BoardClearTileEffect";
import { ColumnClearTileEffect } from "./ColumnClearTileEffect";
import { MoveCounter } from "./MoveCounter";
import { RadiusClearTileEffect } from "./RadiusClearTileEffect";
import { RowClearTileEffect } from "./RowClearTileEffect";
import { ScoreCounter } from "./ScoreCounter";
import { Tile } from "./Tile";
import { TileEffectRegistry } from "./TileEffectRegistry";

export class SuperTileHandler {
    private readonly board: Board;
    private readonly scoreCounter: ScoreCounter;
    private readonly moveCounter: MoveCounter;
    private readonly effectRegistry: TileEffectRegistry;

    constructor(board: Board, scoreCounter: ScoreCounter, moveCounter: MoveCounter) {
        this.board = board;
        this.scoreCounter = scoreCounter;
        this.moveCounter = moveCounter;
        this.effectRegistry = new TileEffectRegistry([
            new BoardClearTileEffect(),
            new ColumnClearTileEffect(),
            new RadiusClearTileEffect(),
            new RowClearTileEffect(),
        ]);
    }

    public handleSuperTile(tile: Tile) : void {
        let effectedTiles = this.getEffectedTiles(tile);
        const uniqueEffectedTiles = new Set<Tile>(effectedTiles);
        for (const effectedTile of effectedTiles) {
            if (effectedTile.isSuperTile() && !effectedTile.superTileActivated && effectedTile !== tile) {
                const additionalEffectedTiles = this.getEffectedTiles(effectedTile);
                for (const additionalTile of additionalEffectedTiles) {
                    uniqueEffectedTiles.add(additionalTile);
                }
            }
        }

        effectedTiles = Array.from(uniqueEffectedTiles);
        
        this.board.prepareTilesForMoveDown(effectedTiles);
        this.board.removeTiles(effectedTiles);

        this.scoreCounter.updateScore(effectedTiles);
        this.moveCounter.updateMovesLeft();
    }

    private getEffectedTiles(tile: Tile) {
        if (tile.isSuperTile() && tile.superTileActivated) {
            return [];
        }

        const effect = this.effectRegistry.get(tile.type);
        if (!effect) {
            return [];
        }

        const removeTiles = effect.apply(this.board, tile);
        tile.superTileActivated = true;
        return removeTiles;
    }
}