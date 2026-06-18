import { ITileEffect } from "./ITileEffect";
import { TileType } from "./Tile";

export class TileEffectRegistry {
    private readonly effectsByType: Partial<Record<TileType, ITileEffect>> = {};

    constructor(effects: ITileEffect[]) {
        for (const effect of effects) {
            this.effectsByType[effect.type] = effect;
        }
    }

    public get(type: TileType): ITileEffect | null {
        return this.effectsByType[type] || null;
    }
}
