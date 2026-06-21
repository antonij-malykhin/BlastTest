import { Board } from "./Board";
import { BoosterType } from "./BoosterType";
import { BoosterActivateResult, IBoosterAction } from "./IBoosterAction";
import { ScoreCounter } from "./ScoreCounter";
import { Tile } from "./Tile";

export class BombBoosterAction implements IBoosterAction {
    public readonly type = BoosterType.Bomb;

    private remainingUses: number;

    constructor(
        private readonly board: Board,
        private readonly scoreCounter: ScoreCounter,
        initialUses: number,
    ) {
        this.remainingUses = Math.max(0, initialUses);
    }

    public canActivate(tile: Tile): boolean {
        return !!tile && this.remainingUses > 0;
    }

    public activate(tile: Tile): BoosterActivateResult {
        if (!this.canActivate(tile)) {
            return { shouldConsume: false, shouldStayActive: false };
        }

        const removeTiles: Tile[] = [];
        const centerRow = tile.position.row;
        const centerColumn = tile.position.column;
        const radius = this.board.config.bombRadius;

        for (let row = centerRow - radius; row <= centerRow + radius; row++) {
            for (let column = centerColumn - radius; column <= centerColumn + radius; column++) {
                const tileAtPosition = this.board.getTileAt(this.board.getPositionBy(row, column));
                if (!tileAtPosition) continue;
                removeTiles.push(tileAtPosition);
            }
        }

        this.board.prepareTilesForMoveDown(removeTiles);
        this.board.removeTiles(removeTiles);
        this.scoreCounter.updateScore(removeTiles);

        return {
            shouldConsume: true,
            shouldStayActive: false,
        };
    }

    public consume(): void {
        this.remainingUses = Math.max(0, this.remainingUses - 1);
    }

    public getRemainingUses(): number {
        return this.remainingUses;
    }

    public reset(): void {
        // No temporary state for bomb action.
    }
}

