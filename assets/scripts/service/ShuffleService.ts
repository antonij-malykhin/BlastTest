import { Board } from "../core/board/Board";
import { AvailableMovesDetectionService } from "./AvailableMovesDetectionService";

export class ShuffleService {
    private readonly board: Board;
    private readonly availableMovesDetectionService: AvailableMovesDetectionService;

    constructor(board: Board, availableMovesDetectionService: AvailableMovesDetectionService) {
        this.board = board;
        this.availableMovesDetectionService = availableMovesDetectionService;
    }

    public shuffleBoard(): void {
        this.board.shuffleBoard();
    }

    public hasAvailableMoves(): boolean {
        return this.availableMovesDetectionService.hasAvailableMoves();
    }
}
