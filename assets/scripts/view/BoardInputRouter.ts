import { TileView } from "./TileView";

export class BoardInputRouter {
    private readonly getTileViews: () => Map<string, TileView>;
    private readonly canRouteTouch: () => boolean;
    private readonly onTileSelected: (tileView: TileView) => void;

    constructor(getTileViews: () => Map<string, TileView>, canRouteTouch: () => boolean, onTileSelected: (tileView: TileView) => void) {
        this.getTileViews = getTileViews;
        this.canRouteTouch = canRouteTouch;
        this.onTileSelected = onTileSelected;
    }

    public routeTouchEnd(event: cc.Event.EventTouch): void {
        if (!this.canRouteTouch()) return;

        const worldPoint = event.getLocation();
        const selectedTileView = this.findTileViewAtWorldPoint(worldPoint);
        if (!selectedTileView) return;

        this.onTileSelected(selectedTileView);
    }

    private findTileViewAtWorldPoint(worldPoint: cc.Vec2): TileView | null {
        const tileViews = this.getTileViews();
        let selectedTileView: TileView | null = null;

        tileViews.forEach(tileView => {
            if (selectedTileView !== null) return;
            if (!tileView.node.active) return;

            const boundingBox = tileView.node.getBoundingBoxToWorld();
            if (boundingBox.contains(worldPoint)) {
                selectedTileView = tileView;
            }
        });

        return selectedTileView;
    }
}