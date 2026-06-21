import { Board } from "./Board";
import { MoveCounter } from "./MoveCounter";
import { ScoreCounter } from "./ScoreCounter";
import { Tile } from "./Tile";
import { TileMatcher } from "./TileMatcher";

export class SimpleTileHandler {
    private readonly board: Board;
    private readonly scoreCounter: ScoreCounter;
    private readonly moveCounter: MoveCounter;
    private readonly tileMatcher: TileMatcher;
    private readonly superTileThreshold: number;

    constructor(board: Board, scoreCounter: ScoreCounter, moveCounter: MoveCounter, tileMatcher: TileMatcher, superTileThreshold: number) {
        this.board = board;
        this.scoreCounter = scoreCounter;
        this.moveCounter = moveCounter;
        this.tileMatcher = tileMatcher;
        this.superTileThreshold = superTileThreshold;
    }
    
    public handleSimpleTile(tile: Tile): void {
        let matches = this.tileMatcher.findGroupFrom(tile);
        if (matches.length < 2) return;

        if (matches.length >= this.superTileThreshold) {
            this.board.createSuperTile(tile.position);
            matches = matches.filter(match => match !== tile);
        }

        this.board.prepareTilesForMoveDown(matches);
        this.board.removeTiles(matches);
        
        this.scoreCounter.updateScore(matches);
        this.moveCounter.updateMovesLeft();
    }
}