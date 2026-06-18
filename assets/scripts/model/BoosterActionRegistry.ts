import { BoosterType } from "./BoosterType";
import { IBoosterAction } from "./IBoosterAction";

export class BoosterActionRegistry {
    private readonly actionsByType: Partial<Record<BoosterType, IBoosterAction>> = {};

    constructor(actions: IBoosterAction[]) {
        for (const action of actions) {
            this.actionsByType[action.type] = action;
        }
    }

    public get(type: BoosterType): IBoosterAction | null {
        return this.actionsByType[type] || null;
    }
}
