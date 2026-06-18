import { TileDropMove } from "../model/Board";
import { Position, Tile } from "../model/Tile";
import { BoardView } from "./BoardView";
import { TileView } from "./TileView";

const {ccclass, property} = cc._decorator;

@ccclass
export class AnimatorBoardView extends cc.Component {
    
    @property(cc.Integer)
    private animationTileFallDuration = 0.25;
    
    @property(cc.Integer)
    private animationSimpleTileCollapseDelay = 0.05;

    @property(cc.Integer)
    private animationSwapDuration = 0.2;

    @property(cc.Integer)
    private animationCollapseToMegaTileDuration = 0.3;

    @property(cc.Integer)
    private animationCollapseToMegaTileScale = 0.3;

    @property(cc.Integer)
    private animationMegaTileScaleUpDuration = 0.2;

    @property(cc.Integer)
    private animationMegaTileScaleUpValue = 1.3;

    @property(cc.Integer)
    private animationMegaTileCommonScaleValue = 1.0;

    @property(cc.Integer)
    private animationDropNewDelayBetweenEach = 0.25;

    @property(cc.Integer)
    private animationDropNewDuration = 0.35;

    @property(cc.Integer)
    private animationCollapseSimpleTileDuration = 0.2;

    @property(cc.Integer)
    private animationCollapseSimpleTileScaleDownValue = 0;

    @property(cc.Integer)
    private animationShuffleSpawnDuration = 0.2;

    private boardView: BoardView;
    private tileViews: Map<string, TileView>;

    public setup(tileViews: Map<string, TileView>, boardView: BoardView) : void {
        this.tileViews = tileViews;
        this.boardView = boardView;
    }

    public async animateSwap(tile1: Tile, tile2: Tile) :  Promise<void> {
        if (!tile1 || !tile2) return;

        const node1 = this.tileViews.get(tile1.id)?.node;
        const node2 = this.tileViews.get(tile2.id)?.node;

        if (!node1 || !node2) return;

        const pos1 = node1.position.clone();
        const pos2 = node2.position.clone();

        await Promise.all([
            new Promise(resolve => cc.tween(node1).to(this.animationSwapDuration, { position: pos2 }).call(resolve).start()),
            new Promise(resolve => cc.tween(node2).to(this.animationSwapDuration, { position: pos1 }).call(resolve).start()),
        ]);
    }

    public async animateCollapsesToMegaTile(collapseTiles: Tile[], megaTile: Tile) : Promise<void> {
        const animations: Promise<void>[] = [];

        const centerPos = this.boardView.getViewTilePosition(megaTile.position.row, megaTile.position.column);

        for (const tile of collapseTiles) {
            const tileView = this.tileViews.get(tile.id);
            if (!tileView) continue;

            const node = tileView.node;

            animations.push(new Promise(resolve => {
                cc.tween(node)
                    .to(this.animationCollapseToMegaTileDuration, { position: new cc.Vec3(centerPos.x, centerPos.y), scale: this.animationCollapseToMegaTileScale }, { easing: 'backIn' })
                    .call(() => {
                        tileView.node.active = false;
                        resolve();
                    })
                    .start();
            }));
        }

        await Promise.all(animations);

        const megaTileView = this.tileViews.get(megaTile.id);
        if (megaTileView) {
            const megaTileAnimation = new Promise<void>(resolve => {
                cc.tween(megaTileView.node)
                    .to(this.animationMegaTileScaleUpDuration, { scale: this.animationMegaTileScaleUpValue }, { easing: 'sineOut' })
                    .to(this.animationMegaTileScaleUpDuration, { scale: this.animationMegaTileCommonScaleValue }, { easing: 'backIn' })
                    .call(() => {
                        resolve();
                    })
                    .start();
            });

            await megaTileAnimation;
        }
    }

    public async animateDropNew(dropMoves: TileDropMove[], verticalTileCount: number) : Promise<void> {
        const animations: Promise<void>[] = [];

        dropMoves.forEach(tile => {
            if (tile.fromRow === verticalTileCount) {
                const tileView = this.tileViews.get(tile.tile.id);
                if (!tileView) return;
                const node = tileView.node;
                const tileNewViewPosition = this.boardView.getViewTilePosition(tile.toRow, tile.column);
                animations.push(new Promise(resolve => {
                    cc.tween(node)
                    .delay(this.animationDropNewDelayBetweenEach)
                    .to(this.animationDropNewDuration, { position: new cc.Vec3(tileNewViewPosition.x, tileNewViewPosition.y) }, { easing: 'bounceOut' })
                    .call(() => resolve())
                    .start();
                }));
            }
        });

        await Promise.all(animations);
    }

    public async animateCollapses(collapseTiles: Tile[]) : Promise<void> {
        const animations: Promise<void>[] = [];
        collapseTiles.forEach(tile => {
            let i = 0;
            const tileView = this.tileViews.get(tile.id);
            if (tileView) {
                animations.push(new Promise(resolve => {
                    cc.tween(tileView.node)
                        .to(this.animationCollapseSimpleTileDuration, { scale: this.animationCollapseSimpleTileScaleDownValue }, { easing: 'backIn' })
                        .delay(i * this.animationSimpleTileCollapseDelay)
                        .call(() => {
                            tileView.node.active = false;
                            resolve();
                        })
                        .start();
                }));
            }
            i++;
        });

        await Promise.all(animations);
    }

    public async animateShuffleSpawn(): Promise<void> {
        const animations: Promise<void>[] = [];

        this.tileViews.forEach(tileView => {
            const node = tileView.node;
            if (!node || !cc.isValid(node)) return;

            node.scale = 0;
            node.active = true;

            animations.push(new Promise(resolve => {
                cc.tween(node)
                    .to(this.animationShuffleSpawnDuration, { scale: 1.2 }, { easing: 'backOut' })
                    .to(this.animationShuffleSpawnDuration * 0.5, { scale: 1.0 })
                    .call(() => resolve())
                    .start();
            }));
        });

        await Promise.all(animations);
    }

    public async animateFall(dropMoves: TileDropMove[], verticalTileCount: number) : Promise<void> {
        const animations: Promise<void>[] = [];

        this.animationTileFallDuration;

        for (const dropMove of dropMoves) {
            if (dropMove.fromRow == verticalTileCount) continue;

            const tileViewNewPosition = this.boardView.getViewTilePosition(dropMove.toRow, dropMove.column);
            const tileView = this.tileViews.get(dropMove.tile.id);
            if (!tileView) continue;

            const node = tileView.node;
            if (node && cc.isValid(node)) {
                animations.push(new Promise(resolve => {
                    cc.tween(node)
                        .to(this.animationTileFallDuration, { position: new cc.Vec3(tileViewNewPosition.x, tileViewNewPosition.y) }, { easing: 'quadOut' })
                        .call(() => resolve())
                        .start();
                }));
            }
        }

        await Promise.all(animations);
    }
}