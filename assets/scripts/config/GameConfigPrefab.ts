const {ccclass, property} = cc._decorator;

@ccclass
export class GameConfigPrefab extends cc.Component {    
    @property(cc.Integer)
    public tileScore: number = 10;

    @property(cc.Integer)
    public minGroupSize: number = 2;

    @property(cc.Integer)
    public tileWidth: number = 64;

    @property(cc.Integer)
    public tileHeight: number = 64;

    @property(cc.Integer)
    public horizontalTileCount: number = 4;

    @property(cc.Integer)
    public verticalTileCount: number = 4;

    @property(cc.Integer)
    public maxMoves: number = 5;

    @property(cc.Integer)
    public targetScore: number = 100;

    @property(cc.Integer)
    public superTileThreshold: number = 3;

    @property(cc.Integer)
    public bombRadius: number = 2;

    @property(cc.Integer)
    public superTileRadius: number = 2;

    @property(cc.Integer)
    public boosterTeleportCount: number = 5;

    @property(cc.Integer)
    public boosterBombCount: number = 5;

    @property(cc.Integer)
    public maxAutoShuffles: number = 3;
}