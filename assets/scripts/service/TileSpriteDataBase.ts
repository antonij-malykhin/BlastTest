import { TileSpriteConfig } from "../config/TileSpriteConfig";
import { TileType } from "../core/board/tile/Tile";

const { ccclass, property } = cc._decorator;

@ccclass
export class TileSpriteDatabase extends cc.Component {
    @property(TileSpriteConfig)
    public config: TileSpriteConfig = null;

    public static instance: TileSpriteDatabase;

    onLoad() {
        TileSpriteDatabase.instance = this;
    }

    public getSpriteForType(type: number): cc.SpriteFrame {
        return this.config.getSpriteByType(type);
    }

    public getSizeModeForType(type: TileType): cc.Sprite.SizeMode {
        switch (type) {
            case TileType.COL_CLEAR:
                return cc.Sprite.SizeMode.TRIMMED;
            case TileType.ROW_CLEAR:
                return cc.Sprite.SizeMode.TRIMMED;
            default:
                return cc.Sprite.SizeMode.TRIMMED;
        }
    }
}