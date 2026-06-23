import { GameConfig } from "../../../config/GameConfig";
import { Board } from "../Board";
import { Position, Tile, TileType } from "./Tile";

export class TileMatcher {
    private readonly config: GameConfig;
    private readonly board: Board;

    constructor(config: GameConfig, board: Board) {
        this.config = config;
        this.board = board;
    }

    public findMatches(tile: Tile): Tile[] {
        return this.findGroupFrom(tile);
    }

    public findGroupFrom(tile: Tile): Tile[] {
        if (!tile.isNormalTile()) return [];

        const visited = this.createVisitedMatrix();
        return this.collectGroupIterative(tile.position, tile.type, visited);
    }

    public hasAnyValidGroup(minGroupSize: number = 2): boolean {
        if (minGroupSize <= 1) {
            return true;
        }

        const visited = this.createVisitedMatrix();

        for (let row = 0; row < this.config.verticalTileCount; row++) {
            for (let column = 0; column < this.config.horizontalTileCount; column++) {
                if (visited[row][column]) continue;

                const position = this.board.getPositionBy(row, column);
                const tile = this.board.getTileAt(position);
                if (!tile || !tile.isNormalTile()) {
                    visited[row][column] = true;
                    continue;
                }

                const group = this.collectGroupIterative(position, tile.type, visited, minGroupSize);
                if (group.length >= minGroupSize) {
                    return true;
                }
            }
        }

        return false;
    }

    private createVisitedMatrix(): boolean[][] {
        const visited: boolean[][] = [];
        for (let row = 0; row < this.config.verticalTileCount; row++) {
            visited.push(new Array(this.config.horizontalTileCount).fill(false));
        }

        return visited;
    }

    private collectGroupIterative(
        position: Position,
        type: TileType,
        visited: boolean[][],
        stopAtSize?: number
    ) : Tile[] {
        if (!this.board.isPositionValid(position)) return [];

        const stack: Position[] = [position];
        const group: Tile[] = [];

        while (stack.length > 0) {
            const current = stack.pop();
            if (!current) continue;

            if (!this.board.isPositionValid(current)) continue;
            if (visited[current.row][current.column]) continue;

            const tile = this.board.getTileAt(current);
            if (!tile || tile.type !== type) continue;

            visited[current.row][current.column] = true;
            group.push(tile);

            if (stopAtSize && group.length >= stopAtSize) {
                return group;
            }

            stack.push(this.board.getRightNeighborsPosition(current));
            stack.push(this.board.getLeftNeighborsPosition(current));
            stack.push(this.board.getBottomNeighborsPosition(current));
            stack.push(this.board.getTopNeighborsPosition(current));
        }

        return group;
    }
}