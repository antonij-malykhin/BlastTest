import { BoosterType } from "./BoosterType";
import { Tile } from "./Tile";

export interface BoosterActivateResult {
    shouldConsume: boolean;
    shouldStayActive: boolean;
}

export interface IBoosterAction {
    readonly type: BoosterType;

    canActivate(tile: Tile): boolean;
    activate(tile: Tile): BoosterActivateResult;
    consume(): void;
    getRemainingUses(): number;
    reset(): void;
}
