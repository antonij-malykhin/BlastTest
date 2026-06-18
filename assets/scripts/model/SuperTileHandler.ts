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
        const effect = this.effectRegistry.get(tile.type);
        if (!effect) {
            return;
        }

        const removeTiles = effect.apply(this.board, tile);
        if (removeTiles.length === 0) {
            return;
        }

        this.board.setCollapseTiles(removeTiles);
        this.board.removeTiles(removeTiles.map(m => m.position));

        this.scoreCounter.updateScore(removeTiles);
        this.moveCounter.updateMovesLeft();
    }
}