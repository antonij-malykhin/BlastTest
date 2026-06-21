import { Position, Tile, TileType } from "../model/Tile";

export class TileFactory {
    private nextTileId = 0;

    public createRandomTile(position: Position): Tile {
        const rand = Math.random();
        let type: TileType;

        if (rand < 0.7) {
            type = this.getRandomNormalType();
        }  else {
            type = this.getRandomSuperType();
        }

        return new Tile(this.createTileId(), type, position);
    }

    public createNormalTile(position: Position): Tile {
        return new Tile(this.createTileId(), this.getRandomNormalType(), position);
    }

    public createSuperTile(position: Position): Tile {
        let type: TileType;

        type = this.getRandomSuperType();

        return new Tile(this.createTileId(), type, position);
    }

    private createTileId(): string {
        this.nextTileId++;
        return `tile-${this.nextTileId}`;
    }

    private getRandomNormalType(): TileType {
        const types = [TileType.RED, TileType.BLUE, TileType.GREEN, 
                      TileType.YELLOW, TileType.PURPURE];
        return types[Math.floor(Math.random() * types.length)];
    }

    private getRandomSuperType(): TileType {
        const rand = Math.random();
        if (rand < 0.8) {
            const types = [TileType.ROW_CLEAR, TileType.COL_CLEAR];
            return types[Math.floor(Math.random() * types.length)];
        } else if (rand < 0.95) {
            return TileType.RADIUS_CLEAR;
        } else {
            return TileType.BOMB;
        }
    }
}