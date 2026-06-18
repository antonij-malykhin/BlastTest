import { TileViewFactory } from "../factory/TileViewFactory";
import { Board, TileDropMove } from "../model/Board";
import { Position, Tile } from "../model/Tile";
import { AnimatorBoardView } from "./AnimatorBoardView";
import { BoardInputRouter } from "./BoardInputRouter";
import { TileView } from "./TileView";

const {ccclass, property} = cc._decorator;

export interface BoardTileSelectedCommand {
    tileId: string;
    row: number;
    column: number;
}

@ccclass
export class BoardView extends cc.Component {
    public static readonly TileSelectedEventName = "tile-selected";

    @property(cc.Label)
    private debugBoard: cc.Label = null;

    @property(AnimatorBoardView)
    private animator: AnimatorBoardView = null;

    @property(cc.Integer)
    private animationBeforeCreateTileDelay = 200;

    private tileViews: Map<string, TileView>;
    private tileViewFactory: TileViewFactory;
    private board: Board;
    private inputRouter: BoardInputRouter;
    private horizontalTileCount: number;
    private verticalTileCount: number;
    private tileWidth: number;
    private tileHeight: number;

    protected onEnable(): void {
        this.node.on(cc.Node.EventType.TOUCH_END, this.onBoardTouchEnd, this);
    }

    protected onDisable(): void {
        this.node.off(cc.Node.EventType.TOUCH_END, this.onBoardTouchEnd, this);
    }

    public initialize(
        tileViewFactory: TileViewFactory,
        width: number,
        height: number,
        tileWidth: number,
        tileHeight: number,
        board: Board,
        canRouteTouch: () => boolean
    ): void {
        this.horizontalTileCount = width;
        this.verticalTileCount = height;
        this.tileWidth = tileWidth;
        this.tileHeight = tileHeight;
        this.board =  board;
        this.tileViewFactory = tileViewFactory;
        this.tileViews = new Map<string, TileView>();
        this.inputRouter = new BoardInputRouter(
            () => this.tileViews,
            canRouteTouch,
            (tileView: TileView) => this.emitTileSelectedCommand(tileView)
        );
        this.setupView(width, tileWidth, height, tileHeight);

        for (let row = 0; row < height; row++) {
            for (let collumn = 0; collumn < width; collumn++) {
                const tile = board.getTileAt(board.getPositionBy(row, collumn));
                if (!tile) continue;
                const tileView = this.tileViewFactory.createTileView(this.node);
                tileView.init(tile, this.getViewTilePosition(row, collumn), new cc.Vec2(tileWidth, tileHeight));
                this.tileViews.set(tile.id, tileView);
            }
        }

        this.updateRenderOrder(height, width);

        this.animator.setup(this.tileViews, this);
    }

    public async updateView(board: Board, selectedTile: Tile): Promise<void> {
        await this.animator.animateSwap(board.swapTile[0], board.swapTile[1]);
        this.updateSwapTiles(board.swapTile[0], board.swapTile[1]);
        if (board.createdMegaTile) {
            await this.animator.animateCollapsesToMegaTile(board.collapseTiles, board.createdMegaTile);
            this.updateMegaTileView(board.createdMegaTile);
        } else {
            await this.animator.animateCollapses(board.collapseTiles);
        }
        await this.delay(this.animationBeforeCreateTileDelay);
        this.updateCollapsedTiles(board.collapseTiles);
        await this.animator.animateFall(board.dropMoves, this.board.config.verticalTileCount);
        this.updateFallenTiles(board.dropMoves);
        this.addNewTileViews(board);
        await this.animator.animateDropNew(board.dropMoves, this.board.config.verticalTileCount);
    }

    public async updateViewAfterShuffle(board: Board): Promise<void> {
        await this.animator.animateCollapses(board.collapseTiles);
        this.updateCollapsedTiles(board.collapseTiles);
        this.addNewTileViewsInPlace(board);
        await this.animator.animateShuffleSpawn();
    }

    private setupView(width: number, tileWidth: number, height: number, tileHeight: number) : void {
        this.node.width = width * tileWidth;
        this.node.height = height * tileHeight;
    }

    private updateRenderOrder(height: number, width: number) : void {
        let siblingIndex = height * width + 1;

        for (let row = 0; row < height; row++) {
            for (let collumn = 0; collumn < width; collumn++) {
                const tile = this.board.getTileAt(this.board.getPositionBy(row, collumn));
                if (!tile) continue;
                const tileView = this.tileViews.get(tile.id);
                if (!tileView) continue;

                tileView.node.setSiblingIndex(siblingIndex);
                siblingIndex--;
            }
        }
    }

    private emitTileSelectedCommand(tileView: TileView): void {
        const command: BoardTileSelectedCommand = {
            tileId: tileView.tileId,
            row: tileView.position.row,
            column: tileView.position.column,
        };

        this.node.emit(BoardView.TileSelectedEventName, command);
    }

    private onBoardTouchEnd(event: cc.Event.EventTouch): void {
        if (!this.inputRouter) return;

        this.inputRouter.routeTouchEnd(event);
    }

    private updateFallenTiles(dropMoves: TileDropMove[]): void {
        for (const dropMove of dropMoves) {
            if (dropMove.fromRow == this.board.config.verticalTileCount) continue;
            
            const tileView = this.tileViews.get(dropMove.tile.id);
            if (!tileView) continue;

            tileView.updateView(dropMove.tile);
        }
    }

    private updateSwapTiles(tile1: Tile, tile2: Tile) : void {
        if (!tile1 || !tile2) return;

        const tileView1 = this.tileViews.get(tile1.id);
        const tileView2 = this.tileViews.get(tile2.id);

        if (!tileView1 || !tileView2) return;

        tileView1.updateView(tile2);
        tileView2.updateView(tile1);
    }

    private updateMegaTileView(createdMegaTile: Tile) : void {
        const megaTileView = this.tileViews.get(createdMegaTile.id);
        if (!megaTileView) return;

        megaTileView.updateView(createdMegaTile);
    }

    private updateCollapsedTiles(collapseTiles: Tile[]) : void {
        for (const tile of collapseTiles) {
            const tileView = this.tileViews.get(tile.id);
            if (!tileView) continue;

            this.tileViews.delete(tile.id);
            this.tileViewFactory.dispose(tileView);
        }
    }

    private addNewTileViews(board: Board) : void {
        for (let row = 0; row < board.config.verticalTileCount; row++) {
            for (let collumn = 0; collumn < board.config.horizontalTileCount; collumn++) {
                const tile = board.getTileAt(board.getPositionBy(row, collumn));
                if (!tile || this.tileViews.has(tile.id)) continue;
                
                const tileView = this.tileViewFactory.createTileView(this.node);
                const startPosition = this.getViewTilePosition(-1, collumn);
                tileView.init(tile, new Position(startPosition.x, startPosition.y, row, collumn), new cc.Vec2(this.tileWidth, this.tileHeight));
                this.tileViews.set(tile.id, tileView);
            }
        }

        this.updateRenderOrder(board.config.verticalTileCount, board.config.horizontalTileCount);
    }

    private addNewTileViewsInPlace(board: Board): void {
        for (let row = 0; row < board.config.verticalTileCount; row++) {
            for (let col = 0; col < board.config.horizontalTileCount; col++) {
                const tile = board.getTileAt(board.getPositionBy(row, col));
                if (!tile || this.tileViews.has(tile.id)) continue;

                const tileView = this.tileViewFactory.createTileView(this.node);
                const viewPosition = this.getViewTilePosition(row, col);
                tileView.init(tile, viewPosition, new cc.Vec2(this.tileWidth, this.tileHeight));
                this.tileViews.set(tile.id, tileView);
            }
        }

        this.updateRenderOrder(board.config.verticalTileCount, board.config.horizontalTileCount);
    }

    public getViewTilePosition(row: number, collumn: number): Position {
        const boardOrigin = this.node.getPosition();

        const boardWidth = this.tileWidth * this.horizontalTileCount;
        const boardHeight = this.tileHeight * this.verticalTileCount;

        const topLeftX = boardOrigin.x - boardWidth / 2;
        const topLeftY = boardOrigin.y + boardHeight / 2;

        const x = topLeftX + collumn * this.tileWidth + this.tileWidth / 2;
        const y = topLeftY - row * this.tileHeight - this.tileHeight / 2;

        return new Position(x, y, row, collumn);
    }

    private printGrid() : void {
        let rowString = "";
        for (let row = 0; row < this.board.config.verticalTileCount; row++) {
            for (let collumn = 0; collumn < this.board.config.horizontalTileCount; collumn++) {
                const debugTile = this.board.getTileAt(this.board.getPositionBy(row, collumn));
                rowString += "[" + row + "," + collumn + "]" + (debugTile ? debugTile.type : "null") + " ";
            }
            rowString += "\n";
        }

        this.debugBoard.string = rowString;
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

