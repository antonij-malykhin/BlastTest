import { TileMatcher } from "../model/TileMatcher";

export class AvailableMovesDetectionService {
    private readonly tileMatcher: TileMatcher;
    private readonly minGroupSize: number;

    constructor(tileMatcher: TileMatcher, minGroupSize: number) {
        this.tileMatcher = tileMatcher;
        this.minGroupSize = minGroupSize;
    }

    public hasAvailableMoves(): boolean {
        return this.tileMatcher.hasAnyValidGroup(this.minGroupSize);
    }
}
