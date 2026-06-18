import { Board } from "./Board";
import { Tile } from "./Tile";
import { BoosterType } from "./BoosterType";
import { ScoreCounter } from "./ScoreCounter";
import { BoosterView } from "../view/BoosterView";
import { InteractionPolicyService, InteractionPolicyState } from "../service/InteractionPolicyService";
import { BombBoosterAction } from "./BombBoosterAction";
import { BoosterActionRegistry } from "./BoosterActionRegistry";
import { IBoosterAction } from "./IBoosterAction";
import { TeleportBoosterAction } from "./TeleportBoosterAction";

export class BoosterHandler {
    private board: Board;
    private activeBooster: BoosterType;
    private boosterView: BoosterView = null;
    private readonly actionRegistry: BoosterActionRegistry;
    private readonly interactionPolicy: InteractionPolicyService;
    private readonly getInteractionState: () => InteractionPolicyState;
    
    constructor(
        board: Board,
        scoreCounter: ScoreCounter,
        boosterView: BoosterView,
        boosterTeleportCount: number,
        boosterBombCount: number,
        interactionPolicy: InteractionPolicyService,
        getInteractionState: () => InteractionPolicyState
    ) {
        this.board = board;
        this.activeBooster = BoosterType.None;
        this.boosterView = boosterView;
        this.interactionPolicy = interactionPolicy;
        this.getInteractionState = getInteractionState;

        const teleportAction = new TeleportBoosterAction(this.board, boosterTeleportCount);
        const bombAction = new BombBoosterAction(this.board, scoreCounter, boosterBombCount);
        this.actionRegistry = new BoosterActionRegistry([teleportAction, bombAction]);

        this.subscribesToBoosterButtonsEvent();
        this.updateBoosterCountsView();
        this.syncBoosterButtonsAvailability();
    }

    public isSelectedBooster(): boolean {
        return this.activeBooster !== BoosterType.None;
    }

    public selectBooster(boosterType: BoosterType) : void {
        if (this.activeBooster === boosterType) {
            this.offActive();
            return;
        }

        const action = this.getAction(boosterType);
        if (!action || action.getRemainingUses() <= 0) {
            this.disableBoosterByType(boosterType);
            return;
        }

        this.offActive();
        this.activeBooster = boosterType;
        this.boosterView.setActiveBooster(boosterType);
    }
    
    public useActiveBoosterIn(tile: Tile) : void {
        if (!this.interactionPolicy.canAcceptBoardInput(this.getInteractionState())) return;

        this.handleBooster(tile);
    }

    public unblockBoosters() : void {
        this.subscribesToBoosterButtonsEvent();
    }
    public blockBoosters() : void {
        this.unsubscribesFromBoosterButtonsEvent();
    }

    private subscribesToBoosterButtonsEvent() : void {
        this.boosterView.node.on(BoosterView.TeleportTapEventName, this.onTapTeleportButton, this);
        this.boosterView.node.on(BoosterView.BombTapEventName, this.onTapBoombButton, this);
    }

    private unsubscribesFromBoosterButtonsEvent() : void {
        this.boosterView.node.off(BoosterView.TeleportTapEventName, this.onTapTeleportButton, this);
        this.boosterView.node.off(BoosterView.BombTapEventName, this.onTapBoombButton, this);
    }
    
    private handleBooster(tile: Tile) : void {
        const action = this.getAction(this.activeBooster);
        if (!action || !action.canActivate(tile)) {
            this.syncBoosterButtonsAvailability();
            return;
        }

        const activateResult = action.activate(tile);

        if (activateResult.shouldConsume) {
            action.consume();
            this.updateBoosterCountsView();
        }

        this.syncBoosterButtonsAvailability();

        if (!activateResult.shouldStayActive) {
            this.offActive();
        }
    }

    private offActive() : void {
        const action = this.getAction(this.activeBooster);
        if (action) {
            action.reset();
        }

        this.activeBooster = BoosterType.None;
        this.boosterView.setActiveBooster(BoosterType.None);
    }

    private onTapBoombButton() : void {
        if (!this.interactionPolicy.canAcceptBoosterInput(this.getInteractionState())) return;

        this.selectBooster(BoosterType.Bomb);
    }

    private onTapTeleportButton() : void {
        if (!this.interactionPolicy.canAcceptBoosterInput(this.getInteractionState())) return;

        this.selectBooster(BoosterType.Teleport);
    }

    private syncBoosterButtonsAvailability() : void {
        const teleportAction = this.getAction(BoosterType.Teleport);
        const bombAction = this.getAction(BoosterType.Bomb);

        if (teleportAction && teleportAction.getRemainingUses() <= 0) {
            this.boosterView.disableTeleport();
        }

        if (bombAction && bombAction.getRemainingUses() <= 0) {
            this.boosterView.disableBomb();
        }
    }

    private updateBoosterCountsView() : void {
        const teleportAction = this.getAction(BoosterType.Teleport);
        const bombAction = this.getAction(BoosterType.Bomb);

        const teleportCount = teleportAction ? teleportAction.getRemainingUses() : 0;
        const bombCount = bombAction ? bombAction.getRemainingUses() : 0;
        this.boosterView.updateView(teleportCount, bombCount);
    }

    private disableBoosterByType(boosterType: BoosterType): void {
        if (boosterType === BoosterType.Bomb) {
            this.boosterView.disableBomb();
            return;
        }

        if (boosterType === BoosterType.Teleport) {
            this.boosterView.disableTeleport();
        }
    }

    private getAction(type: BoosterType): IBoosterAction | null {
        if (type === BoosterType.None) {
            return null;
        }

        return this.actionRegistry.get(type);
    }
}