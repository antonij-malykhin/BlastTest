import LocalEventEmitter from "../EventEmitter";
import { TileViewFactory } from "../factory/TileViewFactory";
import { BoardEvents, TileSelectedEventName } from "../GameEvents";
import { Board, TileDropMove } from "../model/Board";
import { Position, Tile } from "../model/Tile";
import { AnimatorBoardView } from "./AnimatorBoardView";
import { BoardInputRouter } from "./BoardInputRouter";
import { TileView, TileViewModel } from "./TileView";

const {ccclass, property} = cc._decorator;

export interface BoardTileSelectedCommand {
    tileId: string;
    row: number;
    column: number;
}

export interface BoardUpdateViewModel {
    swapTileModels: [TileViewModel, TileViewModel];
    collapseTiles: Tile[];
    dropMoves: TileDropMove[];
    createdSuperTile: Tile | null;
    newTiles: Tile[];
    verticalTileCount: number;
}

@ccclass
export class BoardView extends cc.Component {
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
    private highlightedTiles: TileView[] = [];
    private eventEmmiter: LocalEventEmitter<BoardEvents>;

    protected onEnable(): void {
        this.node.on(cc.Node.EventType.TOUCH_END, this.onBoardTouchEnd, this, true);
    }

    protected onDisable(): void {
        this.node.off(cc.Node.EventType.TOUCH_END, this.onBoardTouchEnd, this, true);
    }

    public initialize(
        tileViewFactory: TileViewFactory,
        width: number,
        height: number,
        tileWidth: number,
        tileHeight: number,
        board: Board,
        boardEventEmmiter: LocalEventEmitter<BoardEvents>,
        canRouteTouch: () => boolean
    ): void {
        this.horizontalTileCount = width;
        this.verticalTileCount = height;
        this.tileWidth = tileWidth;
        this.tileHeight = tileHeight;
        this.board =  board;
        this.tileViewFactory = tileViewFactory;
        this.tileViews = new Map<string, TileView>();
        this.eventEmmiter = boardEventEmmiter;
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
                const tileViewModel = this.createTileViewModel(tile);
                tileView.init(tileViewModel, new cc.Vec2(tileWidth, tileHeight));
                this.tileViews.set(tile.id, tileView);
            }
        }

        this.updateRenderOrder();

        this.animator.setup(this.tileViews, this);
    }

    public async updateView(viewModel: BoardUpdateViewModel): Promise<void> {
        if (viewModel.swapTileModels[0] !== null && viewModel.swapTileModels[1] !== null) {
            await this.animator.animateSwap(viewModel.swapTileModels[0].tileId, viewModel.swapTileModels[1].tileId);
            this.updateSwapTiles(viewModel.swapTileModels[0], viewModel.swapTileModels[1]);
        }
        
        if (viewModel.createdSuperTile) {
            await this.animator.animateCollapsesToSuperTile(viewModel.collapseTiles, viewModel.dropMoves, viewModel.createdSuperTile);
            this.updateSuperTileView(viewModel.createdSuperTile);
        } else {
            await this.animator.animateCollapses(viewModel.collapseTiles);
        }
        await this.delay(this.animationBeforeCreateTileDelay);
        this.updateCollapsedTiles(viewModel.collapseTiles);
        this.updateFallenTiles(viewModel.dropMoves);
        this.addNewTileViews(viewModel.newTiles);
        //await this.animator.animateFall(viewModel.dropMoves, viewModel.verticalTileCount);
        //await this.animator.animateDropNew(viewModel.dropMoves, viewModel.verticalTileCount);
        await this.animator.animateFallAll(viewModel.dropMoves, viewModel.verticalTileCount);
    }

    public async updateViewAfterShuffle(board: Board): Promise<void> {
        await this.animator.animateCollapses(board.tilesForMoveDown);
        this.updateCollapsedTiles(board.tilesForMoveDown);
        this.addNewTileViewsInPlace(board);
        await this.animator.animateShuffleSpawn();
    }

    public highlightTile(tileId: string) {
        const tileView = this.tileViews.get(tileId);
        if (!tileView) return;

        this.highlightedTiles.push(tileView);
        this.animator.animateHighlight(tileView);
    }

    private setupView(width: number, tileWidth: number, height: number, tileHeight: number) : void {
        this.node.width = width * tileWidth;
        this.node.height = height * tileHeight;
    }

    public createTileViewModel(tile: Tile) : TileViewModel | null {
        if (!tile) return null;

        let viewPostion = this.getViewTilePosition(tile.position.row, tile.position.column);
        return {
            tileId: tile.id,
            position: viewPostion,
            type: tile.type
        };
    }

    private updateRenderOrder() : void {
        const tileViewsInOrder = Array.from(this.tileViews.values())
            .filter(tileView => !!tileView.position)
            .sort((left, right) => {
                if (left.position.row !== right.position.row) {
                    return left.position.row - right.position.row;
                }

                return left.position.column - right.position.column;
            });

        let siblingIndex = tileViewsInOrder.length + 1;
        for (const tileView of tileViewsInOrder) {
            tileView.node.setSiblingIndex(siblingIndex);
            siblingIndex--;
        }
    }

    private emitTileSelectedCommand(tileView: TileView): void {
        const command: BoardTileSelectedCommand = {
            tileId: tileView.tileId,
            row: tileView.position.row,
            column: tileView.position.column,
        };

        this.eventEmmiter.emit(TileSelectedEventName, command);
    }

    private onBoardTouchEnd(event: cc.Event.EventTouch): void {
        if (!this.inputRouter) return;

        this.inputRouter.routeTouchEnd(event);
    }

    private updateFallenTiles(dropMoves: TileDropMove[]): void {
        for (const dropMove of dropMoves) {
            if (dropMove.fromRow == this.verticalTileCount) continue;
            
            const tileView = this.tileViews.get(dropMove.tile.id);
            if (!tileView) continue;

            let viewModel = this.createTileViewModel(dropMove.tile);
            tileView.updateView(viewModel);
        }
    }

    private updateSwapTiles(firstTileViewModel: TileViewModel, secondTileViewModel: TileViewModel) : void {
        if (!firstTileViewModel || !secondTileViewModel) return;

        const tileView1 = this.tileViews.get(firstTileViewModel.tileId);
        const tileView2 = this.tileViews.get(secondTileViewModel.tileId);
        if (!tileView1 || !tileView2) return;

        tileView1.updateView(secondTileViewModel);
        tileView2.updateView(firstTileViewModel);
    }

    private updateSuperTileView(createdMegaTile: Tile) : void {
        const megaTileView = this.tileViews.get(createdMegaTile.id);
        if (!megaTileView) return;

        let viewModel = this.createTileViewModel(createdMegaTile);
        megaTileView.updateView(viewModel);
    }

    private updateCollapsedTiles(collapseTiles: Tile[]) : void {
        for (const tile of collapseTiles) {
            const tileView = this.tileViews.get(tile.id);
            if (!tileView) continue;

            this.tileViews.delete(tile.id);
            this.tileViewFactory.dispose(tileView);
        }
    }

    private addNewTileViews(newTiles: Tile[]) : void {
        for (const tile of newTiles) {
            if (!tile || this.tileViews.has(tile.id)) continue;

            const tileView = this.tileViewFactory.createTileView(this.node);
            const startPosition = this.getViewTilePosition(-1, tile.position.column);
            let viewModel = this.createTileViewModel(tile);
            viewModel.position = new Position(startPosition.x, startPosition.y, tile.position.row, tile.position.column);
            tileView.init(
                viewModel,
                new cc.Vec2(this.tileWidth, this.tileHeight)
            );
            this.tileViews.set(tile.id, tileView);
        }

        this.updateRenderOrder();
    }

    private addNewTileViewsInPlace(board: Board): void {
        for (let row = 0; row < board.config.verticalTileCount; row++) {
            for (let col = 0; col < board.config.horizontalTileCount; col++) {
                const tile = board.getTileAt(board.getPositionBy(row, col));
                if (!tile || this.tileViews.has(tile.id)) continue;

                const tileView = this.tileViewFactory.createTileView(this.node);
                let viewModel = this.createTileViewModel(tile);
                tileView.init(viewModel, new cc.Vec2(this.tileWidth, this.tileHeight));
                this.tileViews.set(tile.id, tileView);
            }
        }

        this.updateRenderOrder();
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

