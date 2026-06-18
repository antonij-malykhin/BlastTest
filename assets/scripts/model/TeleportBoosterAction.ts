import { Board } from "./Board";
import { BoosterType } from "./BoosterType";
import { BoosterActivateResult, IBoosterAction } from "./IBoosterAction";
import { Tile } from "./Tile";

export class TeleportBoosterAction implements IBoosterAction {
    public readonly type = BoosterType.Teleport;

    private remainingUses: number;
    private firstSelectionTile: Tile | null = null;

    constructor(
        private readonly board: Board,
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

        if (this.firstSelectionTile == null) {
            this.firstSelectionTile = tile;
            return {
                shouldConsume: false,
                shouldStayActive: true,
            };
        }

        if (this.firstSelectionTile.id === tile.id) {
            return {
                shouldConsume: false,
                shouldStayActive: true,
            };
        }

        this.swapTiles(this.firstSelectionTile, tile);
        this.board.swapTile = [this.firstSelectionTile, tile];
        this.firstSelectionTile = null;

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
        this.firstSelectionTile = null;
    }

    private swapTiles(firstTile: Tile, secondTile: Tile): void {
        this.board.swapTilesAt(firstTile.position, secondTile.position);
    }
}

