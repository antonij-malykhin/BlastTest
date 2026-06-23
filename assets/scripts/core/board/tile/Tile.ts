export enum TileType {
    BLUE = 0,
    PURPURE = 1,
    YELLOW = 2,
    GREEN = 3,
    RED = 4,
    BOMB = 5,
    COL_CLEAR = 6,
    RADIUS_CLEAR = 7,
    ROW_CLEAR = 8,
}

export class Position {
    constructor(
        public readonly x: number,
        public readonly y: number,
        public readonly row: number,
        public readonly column: number
    ) {}
}

export class Tile {
    public readonly id: string;
    public readonly type: TileType;
    public position: Position;
    public superTileActivated: boolean;
    
    constructor(id: string, type: TileType, position: Position) {
        this.id = id;
        this.type = type;
        this.position = position;
    }

    public isSuperTile(): boolean {
        return [
            TileType.ROW_CLEAR,
            TileType.COL_CLEAR,
            TileType.RADIUS_CLEAR,
            TileType.BOMB
        ].includes(this.type);
    }

    public isNormalTile(): boolean {
        return !this.isSuperTile();
    }
}

