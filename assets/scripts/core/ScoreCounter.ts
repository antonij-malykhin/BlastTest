import { GameState } from "./GameState";
import { Tile } from "./board/tile/Tile";

export class ScoreCounter {
    private score: number;
    private tileScore: number;
    private state: GameState;
    
    constructor(tileScore: number, state: GameState) {
        this.score = 0;
        this.tileScore = tileScore;
        this.state = state;
    }
    
    public updateScore(matches: Tile[]) : void {
        const score = matches.length * this.tileScore;
        this.score += score;
        this.state.updateScore(this.score);
    }
}