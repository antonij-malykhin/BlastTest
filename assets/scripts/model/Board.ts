import { GameConfig } from "../config/GameConfig";
import { TileFactory } from "../factory/TileFactory";
import { Position, Tile } from "./Tile";

export interface TileDropMove {
    tile: Tile;
    fromRow: number;
    toRow: number;
    column: number;
}

export class Board {
    public readonly config: GameConfig;
    
    public tilesForMoveDown: Tile[];
    public dropMoves: TileDropMove[];
    public swapTile: [Tile, Tile];
    public createdSuperTile: Tile;
    public createdSuperTileStartPosition: Position;

    private tileFactory: TileFactory;
    private grid: Tile[][];
    
    constructor(config: GameConfig, tileFactory: TileFactory) {
        this.config = config;
        this.tileFactory = tileFactory;
        this.initializeGrid();
    }
    
    private initializeGrid(): void {
        this.grid = [];
        for (let row = 0; row < this.config.verticalTileCount; row++) {
            this.grid[row] = [];
            for (let column = 0; column < this.config.horizontalTileCount; column++) {
                this.grid[row][column] = this.tileFactory.createNormalTile(this.getPositionBy(row,column));
            }
        }
        
        this.clearDropMoves();
    }
    
    public prepareTilesForMoveDown(tiles: Tile[]) : void {
        this.tilesForMoveDown = tiles;
    }

    public addDropMoves(dropMoves: TileDropMove[]) : void {
        this.dropMoves = dropMoves;
    }

    public clearDropMoves() : void {
        this.tilesForMoveDown = [];
        this.dropMoves = [];
        this.swapTile = [null, null];
        this.createdSuperTileStartPosition = null;
        this.createdSuperTile = null;
    }

    public shuffleBoard(): void {
        this.clearDropMoves();

        const normalTiles: Tile[] = [];
        for (let row = 0; row < this.config.verticalTileCount; row++) {
            for (let col = 0; col < this.config.horizontalTileCount; col++) {
                const tile = this.grid[row][col];
                if (tile && tile.isNormalTile()) {
                    normalTiles.push(tile);
                }
            }
        }

        this.tilesForMoveDown = [...normalTiles];

        for (const tile of normalTiles) {
            const pos = tile.position;
            this.grid[pos.row][pos.column] = this.tileFactory.createNormalTile(pos);
        }
    }
    
    public createSuperTile(position: Position) : void {
        this.createdSuperTileStartPosition = position;
        const currentTile = this.grid[position.row][position.column];
        if (!currentTile) {
            this.grid[position.row][position.column] = this.tileFactory.createSuperTile(position);
            this.createdSuperTile = this.grid[position.row][position.column];
            return;
        }

        const generatedSuperTile = this.tileFactory.createSuperTile(position);
        this.grid[position.row][position.column] = new Tile(currentTile.id, generatedSuperTile.type, position);
        this.createdSuperTile = this.grid[position.row][position.column];
    }

    public getTileAt(position: Position): Tile | null {
        if (!this.isPositionValid(position)) return null;
        return this.grid[position.row][position.column];
    }

    public swapTilesAt(firstPosition: Position, secondPosition: Position): void {
        const firstRow = firstPosition.row;
        const firstColumn = firstPosition.column;
        const secondRow = secondPosition.row;
        const secondColumn = secondPosition.column;

        const temp = this.grid[firstRow][firstColumn];
        this.grid[firstRow][firstColumn] = this.grid[secondRow][secondColumn];
        this.grid[secondRow][secondColumn] = temp;

        const positionTemp = this.grid[firstRow][firstColumn].position;
        this.grid[firstRow][firstColumn].position = this.grid[secondRow][secondColumn].position;
        this.grid[secondRow][secondColumn].position = positionTemp;
    }

    public getAllTiles(): Tile[] {
        return ([] as Tile[]).concat(...this.grid);
    }

    public getTileById(tileId: string): Tile | null {
        if (!tileId) return null;

        for (let row = 0; row < this.config.verticalTileCount; row++) {
            for (let column = 0; column < this.config.horizontalTileCount; column++) {
                const tile = this.grid[row][column];
                if (tile && tile.id === tileId) {
                    return tile;
                }
            }
        }

        return null;
    }

    public removeTiles(tiles: Tile[]): void {
        tiles.forEach(tile => {
            if (this.isPositionValid(tile.position)) {
                this.grid[tile.position.row][tile.position.column] = null;
            }
        });

        this.moveDownColumns();
        this.fillEmptySpaces();
    }

    public getPositionBy(row: number, collumn: number): Position {
        return new Position(0, 0, row, collumn);
    }

    public getTopNeighborsPosition(position: Position): Position | null {
        if (position.row == 0) return null;

        return this.getPositionBy(position.row - 1, position.column);
    }

    public getBottomNeighborsPosition(position: Position): Position | null {
        if (position.row == this.config.verticalTileCount - 1) return null;

        return this.getPositionBy(position.row + 1, position.column);
    }

    public getLeftNeighborsPosition(position: Position): Position | null {
        if (position.column == 0) return null;

        return this.getPositionBy(position.row, position.column - 1);
    }

    public getRightNeighborsPosition(position: Position): Position | null {
        if (position.column == this.config.horizontalTileCount - 1) return null;

        return this.getPositionBy(position.row, position.column + 1);
    }

    public isPositionValid(position: Position): boolean {
        if (!position) return false;

        return position.row >= 0 && position.row < this.config.verticalTileCount  &&
               position.column >= 0 && position.column < this.config.horizontalTileCount;
    }

    private moveDownColumns(): void {
        for (let collumn = 0; collumn < this.config.horizontalTileCount; collumn++) {
            let emptyY = this.config.verticalTileCount;
                // Идем снизу вверх
                for (let row = this.config.verticalTileCount - 1; row >= 0; row--) {
                    // Находим первую пустую ячейку
                    if (this.grid[row][collumn] === null && emptyY === this.config.verticalTileCount) {
                        emptyY = row;
                    }
                    // Если нашли тайл над пустой ячейкой
                    else if (this.grid[row][collumn] !== null && emptyY !== this.config.verticalTileCount) {
                        // Перемещаем тайл вниз
                        this.grid[emptyY][collumn] = this.grid[row][collumn];
                        this.grid[emptyY][collumn].position = new Position(0, 0, emptyY, collumn);
                        this.grid[row][collumn] = null;

                        this.dropMoves.push({
                            tile: this.grid[emptyY][collumn],
                            fromRow: row,
                            toRow: emptyY,
                            column: collumn,
                        });
                        // Ищем следующую пустую ячейку выше
                        while (emptyY >= 0 && this.grid[emptyY][collumn] !== null) {
                            emptyY--;
                        }
                    }
                }
        }
    }

    private fillEmptySpaces(): void {
        for (let row = 0; row < this.config.verticalTileCount; row++) {
            for (let collumn = 0; collumn < this.config.horizontalTileCount; collumn++) {
                if (this.grid[row][collumn] === null) {
                    const newPosition = this.getPositionBy(row, collumn);
                    this.grid[row][collumn] = this.tileFactory.createNormalTile(newPosition);

                    this.dropMoves.push({
                        tile: this.grid[row][collumn],
                        fromRow: this.config.verticalTileCount,
                        toRow: row,
                        column: collumn,
                    });
                }
            }
        }
    }
}
