import { BoardView } from "./BoardView";
import { BoosterView } from "./BoosterView";
import { MoveCounterView } from "./MoveCounterView";
import { ScoreCounterView } from "./ScoreCounterView";

const  {ccclass, property} = cc._decorator;

@ccclass
export class LevelView extends cc.Component {
    @property(BoardView)
    public boardView: BoardView = null;

    @property(BoosterView)
    public boosterView: BoosterView = null;

    @property(ScoreCounterView)
    private scoreCounterView: ScoreCounterView = null;
    
    @property(MoveCounterView)
    private moveCounterView: MoveCounterView = null;
    

    public init(targetScore: number, startMovesCount: number) : void {
        this.scoreCounterView.init(targetScore);
        this.moveCounterView.updateMoves(startMovesCount);
    }

    public hide() : void {
        this.node.active = false;
    }

    public updateScore(score: number) : void {
        this.scoreCounterView.updateScore(score);
    }

    public updateMoves(moves: number) : void {
        this.moveCounterView.updateMoves(moves);
    }
}