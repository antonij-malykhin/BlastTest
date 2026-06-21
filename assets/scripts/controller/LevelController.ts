import { GameConfig } from "../config/GameConfig";
import LocalEventEmitter from "../EventEmitter";
import { TileFactory } from "../factory/TileFactory";
import { TileViewFactory } from "../factory/TileViewFactory";
import { GameEvents, LevelLoseEvent, LevelWinEvent, MovesChangedEvent, ScoreChangedEvent } from "../GameEvents";
import { Board } from "../model/Board";
import { BoosterHandler } from "../model/BoosterHandler";
import { BoosterType } from "../model/BoosterType";
import { GameState } from "../model/GameState";
import { MoveCounter } from "../model/MoveCounter";
import { ScoreCounter } from "../model/ScoreCounter";
import { SimpleTileHandler } from "../model/SimpleTileHandler";
import { SuperTileHandler } from "../model/SuperTileHandler";
import { Position } from "../model/Tile";
import { TileMatcher } from "../model/TileMatcher";
import { AvailableMovesDetectionService } from "../service/AvailableMovesDetectionService";
import { InteractionPolicyService } from "../service/InteractionPolicyService";
import { ShuffleService } from "../service/ShuffleService";
import { BoardTileSelectedCommand, BoardUpdateViewModel, BoardView } from "../view/BoardView";
import { BoosterView } from "../view/BoosterView";
import { LevelView } from "../view/LevelView";

export class LevelController {
    public gameEventEmitter = new LocalEventEmitter<GameEvents>();
    
    private readonly board: Board;
    private readonly tileMatcher: TileMatcher;
    private readonly superTileHandler: SuperTileHandler;
    private readonly boosterHandler: BoosterHandler;
    private readonly simpleTileHandler: SimpleTileHandler;
    private readonly availableMovesDetectionService: AvailableMovesDetectionService;
    private readonly shuffleService: ShuffleService;
    private readonly state: GameState;
    private readonly config: GameConfig;
    private readonly levelView: LevelView;
    private readonly interactionPolicy: InteractionPolicyService;

    private updateInProgress: boolean;

    constructor(
        levelView: LevelView,
        config: GameConfig,
        tileViewFactory: TileViewFactory,
        state: GameState
    ) {
        this.state = state;
        this.config = config;
        this.interactionPolicy = new InteractionPolicyService();

        const scoreCounter = new ScoreCounter(config.tileScore, this.state);
        const moveCounter = new MoveCounter(config.maxMoves, this.state);
        const tileFactory = new TileFactory();

        this.board = new Board(config, tileFactory);
        this.tileMatcher = new TileMatcher(config, this.board);
        this.availableMovesDetectionService = new AvailableMovesDetectionService(this.tileMatcher, config.minGroupSize);

        
        this.levelView = levelView;
        
        this.levelView.boardView.initialize(
            tileViewFactory,
            config.horizontalTileCount,
            config.verticalTileCount,
            config.tileWidth,
            config.tileHeight,
            this.board,
            () => this.interactionPolicy.canAcceptBoardInput(this.getInteractionState())
        );
        
        this.levelView.boardView.node.on(BoardView.TileSelectedEventName, this.handleTileSelected, this);
        this.levelView.node.on(BoosterView.BombTapEventName, this.handleBoombButton, this);
        this.levelView.node.on(BoosterView.TeleportTapEventName, this.handleTeleportButton, this);
        
        this.shuffleService = new ShuffleService(this.board, this.availableMovesDetectionService);
        this.simpleTileHandler = new SimpleTileHandler(this.board, scoreCounter, moveCounter, this.tileMatcher, config.superTileThreshold);
        this.superTileHandler = new SuperTileHandler(this.board, scoreCounter, moveCounter);
        this.boosterHandler = new BoosterHandler(
            this.board,
            this.levelView.boardView,
            scoreCounter,
            levelView.boosterView,
            config.boosterTeleportCount,
            config.boosterBombCount,
            this.interactionPolicy,
            () => this.getInteractionState()
        );


        this.state.gameEventEmitter.on(ScoreChangedEvent, this.handleScoreChanged);
        this.state.gameEventEmitter.on(MovesChangedEvent, this.handleMovesChanged);
    }

    public destroy() : void {
        this.state.gameEventEmitter.off(ScoreChangedEvent, this.handleScoreChanged);
        this.state.gameEventEmitter.off(MovesChangedEvent, this.handleMovesChanged);

        this.levelView.boardView.node.off(BoardView.TileSelectedEventName, this.handleTileSelected, this);
        this.levelView.node.off(BoosterView.BombTapEventName, this.handleBoombButton, this);
        this.levelView.node.off(BoosterView.TeleportTapEventName, this.handleTeleportButton, this);
        this.levelView.destroy();
    }

    public hide() : void {
        this.levelView.hide();
    }

    private async selectTile(position: Position): Promise<void> {
        if (!this.interactionPolicy.canAcceptBoardInput(this.getInteractionState())) return;

        const tile = this.board.getTileAt(position);
        if (!tile) return;

        if (this.boosterHandler.isSelectedBooster()) {
            this.boosterHandler.useActiveBoosterIn(tile);
        } else if(tile.isSuperTile()) {
            this.superTileHandler.handleSuperTile(tile);
        } else {
            this.simpleTileHandler.handleSimpleTile(tile);
        }

        this.updateInProgress = true;

        try {
            const boardUpdateViewModel = this.createBoardUpdateViewModel();
            await this.levelView.boardView.updateView(boardUpdateViewModel);

            if (!this.boosterHandler.isSelectedBooster()) {
                this.board.clearDropMoves();

                if (!this.state.isLevelWin && !this.state.isLevelLose) {
                    await this.performAutoShuffleIfNeeded();
                }
            }
        } finally {
            this.updateInProgress = false;
        }

        if (this.state.isLevelLose) {
            this.gameEventEmitter.emit(LevelLoseEvent, null);
        } else if (this.state.isLevelWin) {
            this.gameEventEmitter.emit(LevelWinEvent, null);
        }
    }

    private async performAutoShuffleIfNeeded(): Promise<void> {
        while (!this.shuffleService.hasAvailableMoves()) {
            if (!this.state.canShuffle(this.config.maxAutoShuffles)) {
                this.state.markLevelLost();
                return;
            }

            this.state.incrementShuffleCount();
            this.shuffleService.shuffleBoard();

            await this.levelView.boardView.updateViewAfterShuffle(this.board);
            this.board.clearDropMoves();
        }
    }
    
    private handleTeleportButton() : void {
        if (!this.interactionPolicy.canAcceptBoosterInput(this.getInteractionState())) return;

        this.boosterHandler.selectBooster(BoosterType.Teleport);
    }

    private handleBoombButton() : void {
        if (!this.interactionPolicy.canAcceptBoosterInput(this.getInteractionState())) return;

        this.boosterHandler.selectBooster(BoosterType.Bomb);
    }

    private handleMovesChanged = (event: {moves: number}) : void => {
        this.levelView.updateMoves(event.moves);
    }

    private handleScoreChanged = (event: {score: number}) : void => {
        this.levelView.updateScore(event.score);
    }

    private async handleTileSelected(command: BoardTileSelectedCommand): Promise<void> {
        if (!command) return;

        const tile = this.board.getTileById(command.tileId) || this.board.getTileAt(this.board.getPositionBy(command.row, command.column));
        if (!tile) return;

        const position = tile.position;
        await this.selectTile(position);
    }

    private createBoardUpdateViewModel(): BoardUpdateViewModel {
        const newTiles = this.board.dropMoves
            .filter(move => move.fromRow === this.config.verticalTileCount)
            .map(move => move.tile);

        const firstSwapTileViewModel = this.levelView.boardView.createTileViewModel(this.board.swapTile[0]);
        const secondSwapTileViewModel = this.levelView.boardView.createTileViewModel(this.board.swapTile[1]);

        return {
            swapTileModels: [firstSwapTileViewModel, secondSwapTileViewModel],
            collapseTiles: this.board.tilesForMoveDown,
            dropMoves: this.board.dropMoves,
            createdSuperTile: this.board.createdSuperTile,
            newTiles,
            verticalTileCount: this.config.verticalTileCount,
        };
    }

    private getInteractionState() {
        return {
            isAnimationInProgress: this.updateInProgress,
            isLevelFinished: this.state.isLevelLose || this.state.isLevelWin,
            isBoosterModeActive: this.boosterHandler ? this.boosterHandler.isSelectedBooster() : false,
        };
    }
}
