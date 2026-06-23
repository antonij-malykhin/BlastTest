import { TileType } from "../core/board/tile/Tile";

const { ccclass, property} = cc._decorator;

const TileTypeEnum = cc.Enum(TileType);

@ccclass('TileSpriteEntry')
export class TileSpriteEntry {
    @property({ type: TileTypeEnum })
    public type: TileType = TileType.RED;

    @property(cc.SpriteFrame)
    public sprite: cc.SpriteFrame = null;
}
