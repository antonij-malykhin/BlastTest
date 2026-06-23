import { BoosterType } from "../core/booster/BoosterType";
import LocalEventEmitter from "../infrastucture/EventEmitter";
import { BoosterItemView } from "./BoosterItemView";

const { ccclass, property } = cc._decorator;

export const BoosterTapEventName = "booster-tapped";

export interface BoosterViewEvents {
    "booster-tapped": BoosterType;
}

@ccclass
export class BoosterView extends cc.Component {
    @property([BoosterItemView])
    private boosterItems: BoosterItemView[] = [];

    private selectedBoosterItem: BoosterItemView = null;
    private readonly boosterEventEmitter = new LocalEventEmitter<BoosterViewEvents>();

    public updateView(boosterType: BoosterType, count: number): void {
        this.updateBoosterCount(boosterType, count);
    }

    public setActiveBooster(boosterType: BoosterType): void {
        this.dismissHighlights();

        if (boosterType === BoosterType.None) {
            this.selectedBoosterItem = null;
            return;
        }

        const item = this.getItemByType(boosterType);
        if (!item) return;

        this.selectedBoosterItem = item;
        this.selectedBoosterItem.highlightSelection();
    }

    public onBoosterTap(callback: (boosterType: BoosterType) => void): void {
        this.boosterEventEmitter.on(BoosterTapEventName, callback);
    }

    public offBoosterTap(callback: (boosterType: BoosterType) => void): void {
        this.boosterEventEmitter.off(BoosterTapEventName, callback);
    }

    public disableBooster(type: BoosterType): void {
        const item = this.getItemByType(type);
        if (!item) return;

        item.disable();

        if (this.selectedBoosterItem && this.selectedBoosterItem.type === type) {
            this.dismissHighlights();
            this.selectedBoosterItem = null;
        }
    }

    protected onLoad(): void {
        for (const item of this.boosterItems) {
            if (!item) continue;

            item.initialize(this.boosterEventEmitter);
        }
    }

    private dismissHighlights(): void {
        if (!this.selectedBoosterItem) return;

        this.selectedBoosterItem.dismissHighlight();
    }

    private updateBoosterCount(type: BoosterType, value: number): void {
        const item = this.getItemByType(type);
        if (!item) return;

        item.setCount(value);
    }

    private getItemByType(type: BoosterType): BoosterItemView | null {
        for (const item of this.boosterItems) {
            if (item && item.type === type) {
                return item;
            }
        }

        return null;
    }
}
