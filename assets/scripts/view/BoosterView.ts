import { BoosterType } from "../model/BoosterType";

const { ccclass, property } = cc._decorator;

@ccclass
export class BoosterView extends cc.Component {
    public static readonly BombTapEventName = 'onTapBoombButton';
    public static readonly TeleportTapEventName = 'onTapTeleportButton';

    @property(cc.Label)
    private teleportCount: cc.Label = null;

    @property(cc.Label)
    private bombCount: cc.Label = null;

    @property(cc.Button)
    private teleportButton: cc.Button = null;
    
    @property(cc.Button)
    private bombButton: cc.Button = null;

    @property(cc.Integer)
    private emptyBoosterOpacity = 100;

    @property(cc.Integer)
    private animationScaleUpDuration = 0.4;
    
    @property(cc.Integer)
    private animationScaleUpValue = 1.15;
    
    @property(cc.Integer)
    private animationScaleDownDuration = 0.4;
    
    @property(cc.Integer)
    private animationScaleDownValue = 1.0;

    private selectedBoosterNode: cc.Node;

    public updateView(teleportCount: number, bompCount: number) : void {
        this.teleportCount.string = `${teleportCount}`;
        this.bombCount.string = `${bompCount}`;
    }

    // TODO: Убрать switch - перенести в отдельные классы BoosterItemView
    public setActiveBooster(Bomb: BoosterType) : void {
        switch (Bomb) {
            case BoosterType.Bomb:
                this.dismissHightlights();
                this.selectedBoosterNode = this.bombButton.node;
                this.hightlightSelection(this.selectedBoosterNode);
                break;
            case BoosterType.Teleport:
                this.dismissHightlights();
                this.selectedBoosterNode = this.teleportButton.node;
                this.hightlightSelection(this.selectedBoosterNode);
                break;
            case  BoosterType.None:
                this.dismissHightlights();
                this.selectedBoosterNode = null;
                break;
        }
    }

    public disableTeleport() : void {
        this.teleportButton.node.opacity = this.emptyBoosterOpacity;
        this.unsubscribeFromTeleportButton();
    }

    public disableBomb() : void {
        this.bombButton.node.opacity = this.emptyBoosterOpacity;
        this.unsubscribeFromBombButton();
    }

    public dismissHightlights() : void {
        if (!this.selectedBoosterNode) return;

        this.selectedBoosterNode.stopAllActions();
        this.selectedBoosterNode.scale = 1;
    }

    protected onLoad(): void {      
        this.subscribeToBombButton();
        this.subscribeToTeleportButton();
    }

    private subscribeToTeleportButton() : void {
        this.teleportButton.node.on(cc.Node.EventType.TOUCH_END, this.onTapTeleportButton, this);
    }

    private subscribeToBombButton() : void {
        this.bombButton.node.on(cc.Node.EventType.TOUCH_END, this.onTapBoombButton, this);
    }

    private unsubscribeFromTeleportButton() : void {
        this.teleportButton.node.off(cc.Node.EventType.TOUCH_END, this.onTapTeleportButton, this);
    }

    private unsubscribeFromBombButton() : void {
        this.bombButton.node.off(cc.Node.EventType.TOUCH_END, this.onTapBoombButton, this);
    }
    
    protected onDestroy(): void {
        this.unsubscribeFromTeleportButton();
        this.unsubscribeFromBombButton();
    }
    
    private hightlightSelection(node: cc.Node) : void {
        this.selectedBoosterNode = node;
        cc.tween(node)
        .repeatForever(
            cc.tween()
                .to(this.animationScaleUpDuration, { scale: this.animationScaleUpValue }, { easing: 'sineOut' })
                .to(this.animationScaleDownDuration, { scale: this.animationScaleDownValue }, { easing: 'sineIn' })
        )
        .start();
    }

    private onTapBoombButton() : void {
        this.node.emit(BoosterView.BombTapEventName);
    }

    private onTapTeleportButton() : void {
        this.node.emit(BoosterView.TeleportTapEventName);
    }
}