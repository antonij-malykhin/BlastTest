import LocalEventEmitter from "../infrastucture/EventEmitter";
import { BoosterType } from "../core/booster/BoosterType";
import { BoosterTapEventName, BoosterViewEvents } from "./BoosterView";

const { ccclass, property } = cc._decorator;

@ccclass
export class BoosterItemView extends cc.Component {
    @property({ type: cc.Enum(BoosterType) })
    private boosterType: BoosterType = BoosterType.None;

    @property(cc.Label)
    private countLabel: cc.Label = null;

    @property(cc.Button)
    private button: cc.Button = null;

    @property(cc.Integer)
    private emptyBoosterOpacity = 100;

    @property(cc.Float)
    private animationScaleUpDuration = 0.4;

    @property(cc.Float)
    private animationScaleUpValue = 1.15;

    @property(cc.Float)
    private animationScaleDownDuration = 0.4;

    @property(cc.Float)
    private animationScaleDownValue = 1.0;

    private eventEmitter: LocalEventEmitter<BoosterViewEvents> = null;

    public get type(): BoosterType {
        return this.boosterType;
    }

    public initialize(eventEmitter: LocalEventEmitter<BoosterViewEvents>): void {
        this.eventEmitter = eventEmitter;
    }

    public setCount(value: number): void {
        if (!this.countLabel) return;

        this.countLabel.string = `${value}`;
    }

    public disable(): void {
        if (!this.button) return;

        this.button.interactable = false;
        this.button.node.opacity = this.emptyBoosterOpacity;
        this.dismissHighlight();
    }

    public highlightSelection(): void {
        if (!this.button || !this.button.node) return;

        const node = this.button.node;
        node.stopAllActions();
        cc.tween(node)
            .repeatForever(
                cc.tween()
                    .to(this.animationScaleUpDuration, { scale: this.animationScaleUpValue }, { easing: "sineOut" })
                    .to(this.animationScaleDownDuration, { scale: this.animationScaleDownValue }, { easing: "sineIn" })
            )
            .start();
    }

    public dismissHighlight(): void {
        if (!this.button || !this.button.node) return;

        this.button.node.stopAllActions();
        this.button.node.scale = 1;
    }

    protected onEnable(): void {
        if (!this.button || !this.button.node) return;

        this.button.node.on(cc.Node.EventType.TOUCH_END, this.onTapButton, this);
    }

    protected onDisable(): void {
        if (!this.button || !this.button.node) return;

        this.button.node.off(cc.Node.EventType.TOUCH_END, this.onTapButton, this);
    }

    private onTapButton(): void {
        if (!this.button || !this.button.interactable || !this.eventEmitter) return;

        this.eventEmitter.emit(BoosterTapEventName, this.boosterType);
    }
}
