import { Position, Tile } from "../model/Tile";
import { TileSpriteDatabase } from "../service/TileSpriteDataBase";

const { ccclass, property } = cc._decorator;

@ccclass
export class TileView extends cc.Component {
    @property(cc.Sprite)
    private sprite: cc.Sprite = null;

    @property(cc.Label)
    private label: cc.Label = null;
    
    @property(cc.Integer)
    private animationTileRemoveDuration = 0.2;

    @property(cc.Integer)
    private animationTileRemoveScaleDownValue = 0;

    @property(cc.Integer)
    private animationTileRemoveOpacityDownValue = 0;

    @property(cc.Integer)
    private animationTileAppearDuration = 0.3;

    @property(cc.Integer)
    private animationTileAppearScaleUpValue = 1;

    public tileId: string = null;
    public position: Position = null;

    public init(tile: Tile, position: Position, scale: cc.Vec2): void {
        this.tileId = tile.id;
        this.position = position;
        this.node.setPosition(cc.v3(position.x, position.y));
        this.node.width = scale.x;
        this.node.height = scale.y;
        this.updateView(tile);
    }

    public updateView(tile: Tile | null): void {
        this.label.string = "";
        if (!tile) {
            this.tileId = null;
            this.position = null;
            this.node.active = false;
            return;
        }

        this.node.active = true;
        this.tileId = tile.id;
        this.position = tile.position;
        this.sprite.spriteFrame = TileSpriteDatabase.instance.getSpriteForType(tile.type);
        this.sprite.sizeMode = TileSpriteDatabase.instance.getSizeModeForType(tile.type);
    }

    public animateRemove(): Promise<void> {
        return new Promise(resolve => {
            cc.tween(this.node)
                .to(this.animationTileRemoveDuration, { scale: this.animationTileRemoveScaleDownValue, opacity: this.animationTileRemoveOpacityDownValue })
                .call(() => {
                    this.node.active = false;
                    resolve();
                })
                .start();
        });
    }

    public animateAppear(): Promise<void> {
        this.node.setScale(0);
        this.node.active = true;
        
        return new Promise(resolve => {
            cc.tween(this.node)
                .to(this.animationTileAppearDuration, { scale: this.animationTileAppearScaleUpValue }, { easing: 'backOut' })
                .call(resolve)
                .start();
        });
    }

}