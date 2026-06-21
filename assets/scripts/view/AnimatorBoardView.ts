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
    private animationCollapseToSuperTileDuration = 0.3;

    @property(cc.Integer)
    private animationCollapseToSuperTileScale = 0.3;

    @property(cc.Integer)
    private animationSuperTileScaleUpDuration = 0.2;

    @property(cc.Integer)
    private animationSuperTileScaleUpValue = 1.3;

    @property(cc.Integer)
    private animationSuperTileCommonScaleValue = 1.0;

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

    public animateHighlight(tileView: TileView) {
        cc.tween(tileView.node)
            .to(0.15, { scale: 1.2 }, { easing: 'backOut' })
            .start();
    }

    public animateUnhighlight(tileView: TileView) {
        cc.tween(tileView.node)
            .to(0.15, { scale: 1.0 }, { easing: 'backIn' })
            .start();
    }

    public async animateSwap(firstTileId: string, secondTileId: string) :  Promise<void> {
        if (!firstTileId || !secondTileId) return;

        const node1 = this.tileViews.get(firstTileId)?.node;
        const node2 = this.tileViews.get(secondTileId)?.node;
        if (!node1 || !node2) return;

        const pos1 = node1.position.clone();
        const pos2 = node2.position.clone();

        await Promise.all([
            new Promise(resolve => cc.tween(node1).to(this.animationSwapDuration, { position: pos2 }).call(resolve).start()),
            new Promise(resolve => cc.tween(node2).to(this.animationSwapDuration, { position: pos1 }).call(resolve).start()),
        ]);
    }

    public async animateCollapsesToSuperTile(collapseTiles: Tile[], dropMoves: TileDropMove[], megaTile: Tile) : Promise<void> {
        const animations: Promise<void>[] = [];

        let superTilePositionBeforeCollapse: Position;

        for (const dropMove of dropMoves) {
            if (dropMove.tile.id === megaTile.id && dropMove.fromRow !== dropMove.toRow) {
                superTilePositionBeforeCollapse = this.boardView.getViewTilePosition(dropMove.fromRow, dropMove.column);
                break;
            }
        }

        if (!superTilePositionBeforeCollapse) {
            superTilePositionBeforeCollapse = this.boardView.getViewTilePosition(megaTile.position.row, megaTile.position.column);
        }

        for (const tile of collapseTiles) {
            const tileView = this.tileViews.get(tile.id);
            if (!tileView) continue;

            const node = tileView.node;

            animations.push(new Promise(resolve => {
                cc.tween(node)
                    .to(this.animationCollapseToSuperTileDuration, { position: new cc.Vec3(superTilePositionBeforeCollapse.x, superTilePositionBeforeCollapse.y), scale: this.animationCollapseToSuperTileScale }, { easing: 'backIn' })
                    .call(() => {
                        tileView.node.active = false;
                        resolve();
                    })
                    .start();
            }));
        }

        await Promise.all(animations);

        const superTileView = this.tileViews.get(megaTile.id);
        if (superTileView) {
            const superTileAnimation = new Promise<void>(resolve => {
                cc.tween(superTileView.node)
                    .to(this.animationSuperTileScaleUpDuration, { scale: this.animationSuperTileScaleUpValue }, { easing: 'sineOut' })
                    .to(this.animationSuperTileScaleUpDuration, { scale: this.animationSuperTileCommonScaleValue }, { easing: 'backIn' })
                    .call(() => {
                        resolve();
                    })
                    .start();
            });

            await superTileAnimation;
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