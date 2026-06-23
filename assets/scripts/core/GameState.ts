import { GameConfig } from "../config/GameConfig";
import LocalEventEmitter from "../infrastucture/EventEmitter";
import { GameEvents, MovesChangedEvent, ScoreChangedEvent } from "../infrastucture/GameEvents";

export class GameState {
    private readonly winScore: number;

    private score: number;
    private movesLeft: number;
    private shuffleCount: number;
    private forcedLose: boolean;
    private isLevelLoseValue: boolean;
    private isLevelWinValue: boolean;
    
    public gameEventEmitter = new LocalEventEmitter<GameEvents>();

    constructor(
        winScore: number,
        score: number,
        movesLeft: number,
        isGameOver: boolean,
        isGameWon: boolean,
        shuffleCount: number
    ) {
        this.winScore = winScore;
        this.score = score;
        this.movesLeft = movesLeft;
        this.isLevelLoseValue = isGameOver;
        this.isLevelWinValue = isGameWon;
        this.shuffleCount = shuffleCount;
        this.forcedLose = isGameOver;

        this.resolveEndState();
    }

    public get isLevelLose(): boolean {
        return this.isLevelLoseValue;
    }

    public get isLevelWin(): boolean {
        return this.isLevelWinValue;
    }
    
    public static initial(config: GameConfig): GameState {
        return new GameState(config.targetScore, 0, config.maxMoves, false, false, 0);
    }

    public updateScore(score: number): void {
        this.score = score;
        this.gameEventEmitter.emit(ScoreChangedEvent, { score: this.score });
        this.resolveEndState();
    }

    public updateMovesLeft(movesLeft: number): void {
        this.movesLeft = movesLeft;
        this.gameEventEmitter.emit(MovesChangedEvent, { moves: this.movesLeft });
        this.resolveEndState();
    }

    public markLevelLost(): void {
        this.forcedLose = true;
        this.resolveEndState();
    }

    public incrementShuffleCount(): void {
        this.shuffleCount++;
    }

    public canShuffle(maxAutoShuffles: number): boolean {
        return this.shuffleCount < maxAutoShuffles;
    }

    public reset(config: GameConfig) : void {
        this.score = 0;
        this.movesLeft = config.maxMoves;
        this.shuffleCount = 0;
        this.forcedLose = false;

        this.resolveEndState();
    }

    private resolveEndState(): void {
        const isTargetReached = this.score >= this.winScore;
        if (isTargetReached) {
            this.isLevelWinValue = true;
            this.isLevelLoseValue = false;
            return;
        }

        this.isLevelWinValue = false;
        this.isLevelLoseValue = this.movesLeft <= 0 || this.forcedLose;
    }
}