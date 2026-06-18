import { AssetsPath } from "../AssetsPath";
import { GameConfig } from "../config/GameConfig";
import { GameConfigPrefab } from "../config/GameConfigPrefab";
import { GameController } from "../controller/GameContoller";
import { LevelViewFactory } from "../factory/LevelViewFactory";
import { TileViewFactory } from "../factory/TileViewFactory";
import { AssetLoader } from "../service/AssetLoader";

const {ccclass, property} = cc._decorator;

@ccclass
export class EntryPoint extends cc.Component {
    @property(cc.Node)
    private gameNode: cc.Node = null;

    @property(cc.Node)
    private levelParent: cc.Node = null;

    private gameController: GameController;
    private levelViewFactory: LevelViewFactory;
    private tileViewFactory: TileViewFactory;
    private gameConfigNode: GameConfigPrefab;
    private config: GameConfig;

    async onLoad() : Promise<void> {
        await this.loadConfigAssets();
        this.initConfig();
        await this.loadFactoryAssets();
        this.initGameContoller();
    }

    private initConfig() : void {
        this.config = {
            boosterTeleportCount: this.gameConfigNode.boosterTeleportCount,
            boosterBombCount: this.gameConfigNode.boosterBombCount,
            minGroupSize: this.gameConfigNode.minGroupSize,
            tileScore: this.gameConfigNode.tileScore,
            tileWidth: this.gameConfigNode.tileWidth,
            tileHeight: this.gameConfigNode.tileHeight,
            horizontalTileCount: this.gameConfigNode.horizontalTileCount,
            verticalTileCount: this.gameConfigNode.verticalTileCount,
            maxMoves: this.gameConfigNode.maxMoves,
            targetScore: this.gameConfigNode.targetScore,
            superTileThreshold: this.gameConfigNode.superTileThreshold,
            bombRadius: this.gameConfigNode.bombRadius,
            superTileRadius: this.gameConfigNode.superTileRadius,
                    maxAutoShuffles: this.gameConfigNode.maxAutoShuffles,
        };
    }

    private async loadConfigAssets() : Promise<void> {
        const gameConfigPrefab = await AssetLoader.loadAsset(AssetsPath.GameConfig);
        this.gameConfigNode = cc.instantiate(gameConfigPrefab).getComponent(GameConfigPrefab);

        const tileSpriteDateBasePrefab = await AssetLoader.loadAsset(AssetsPath.TileSpriteDataBase);
        cc.instantiate(tileSpriteDateBasePrefab).setParent(this.gameNode);
    }

    private async loadFactoryAssets() : Promise<void> {
        const levelViewPrefab = await AssetLoader.loadAsset(AssetsPath.LevelView);
        const tileViewPrefab = await AssetLoader.loadAsset(AssetsPath.TileView);

        this.tileViewFactory = new TileViewFactory(tileViewPrefab);
        this.levelViewFactory = new LevelViewFactory(levelViewPrefab, this.levelParent, this.config);
    }

    private initGameContoller() : void {
        this.gameController = new GameController(this.config, this.levelViewFactory, this.tileViewFactory, this.gameNode);
        this.gameController.nextLevel();
    }
}