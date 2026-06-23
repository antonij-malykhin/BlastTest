import { RestartEventName } from "../infrastucture/GameEvents";

const  {ccclass, property} = cc._decorator;

@ccclass
export class GameView extends cc.Component {
    @property(cc.Node)
    private winNode: cc.Node = null;

    @property(cc.Node)
    private loseNode: cc.Node = null;

    @property(cc.Button)
    private loseRestartButton: cc.Button = null;

    @property(cc.Button)
    private winRestartButton: cc.Button = null;

    public showWin() : void {
        this.loseNode.active = false;
        this.winNode.active = true;
    }

    public showLose() : void {
        this.winNode.active = false;
        this.loseNode.active = true;
    }

    public hideWin() : void {
        this.winNode.active = false;
    }

    public hideLose() : void {
        this.loseNode.active = false;
    }

    protected onLoad(): void {
        this.loseRestartButton.node.on(cc.Node.EventType.TOUCH_END, this.onTapRestartButton, this);
        this.winRestartButton.node.on(cc.Node.EventType.TOUCH_END, this.onTapRestartButton, this);
    }

    protected onDestroy(): void {
        this.loseRestartButton.node.off(cc.Node.EventType.TOUCH_END, this.onTapRestartButton, this);
        this.winRestartButton.node.off(cc.Node.EventType.TOUCH_END, this.onTapRestartButton, this);
    }

    private onTapRestartButton() : void {
        this.node.emit(RestartEventName);
    }
}