import { GameConfig } from "../config/GameConfig";
import { LevelViewFactory } from "../factory/LevelViewFactory";
import { TileViewFactory } from "../factory/TileViewFactory";
import { LevelLoseEvent, LevelWinEvent, RestartEventName } from "../GameEvents";
import { GameState } from "../model/GameState";
import { GameView } from "../view/GameView";
import { LevelController } from "./LevelController";

export class GameController {
    private readonly state: GameState;
    private readonly gameView: GameView;
    private readonly config: GameConfig;
    private readonly levelViewFactory: LevelViewFactory;
    private readonly tileViewFactory: TileViewFactory;
    private readonly gameNode: cc.Node;
    private level: LevelController;

    constructor(
        config: GameConfig,
        levelViewFactory: LevelViewFactory,
        tileViewFactory: TileViewFactory,
        gameNode: cc.Node
    ) {
        this.config = config;
        this.levelViewFactory = levelViewFactory;
        this.tileViewFactory = tileViewFactory;
        this.gameNode = gameNode;

        this.state = GameState.initial(config);

        this.gameView = this.gameNode.getComponent(GameView);
        this.gameView.node.on(RestartEventName, this.onTapRestartButton, this);
    }

    
    public nextLevel() : void {
        this.gameView.hideLose();
        this.gameView.hideWin();

        if (this.level) {
            this.level.gameEventEmitter.off(LevelWinEvent, this.handleWinLevel);
            this.level.gameEventEmitter.off(LevelLoseEvent, this.handleLoseLevel);
            this.disposeLevel();
        }

        const levelView = this.levelViewFactory.createLevel();
        levelView.init(this.config.targetScore, this.config.maxMoves);
        
        this.level = new LevelController(levelView, this.config, this.tileViewFactory, this.state);
        this.level.gameEventEmitter.on(LevelWinEvent, this.handleWinLevel);
        this.level.gameEventEmitter.on(LevelLoseEvent, this.handleLoseLevel);
    }
    
    private disposeLevel() : void {
        this.level.hide();
        this.level.destroy();
    }
    
    private levelLose() : void {
        this.gameView.showLose();
    }
    
    private levelWin() : void {
        this.gameView.showWin();
    }

    private onTapRestartButton() : void {
        this.state.reset(this.config);
        this.nextLevel();
    }

    private handleWinLevel = () : void => {
        this.levelWin();
    }

    private handleLoseLevel = () : void => {
        this.levelLose();
    }
}