import { TileType } from "../core/board/tile/Tile";
import { TileSpriteEntry } from "../service/TileSpriteEntry";

const { ccclass, property} = cc._decorator;

@ccclass('TileSpriteConfig')
export class TileSpriteConfig {
    @property({ type: [TileSpriteEntry] })
    public entries: TileSpriteEntry[] = [];

    public getSpriteByType(type: TileType): cc.SpriteFrame {
        return this.entries.find(e => e.type === type)?.sprite || null;
    }
}
