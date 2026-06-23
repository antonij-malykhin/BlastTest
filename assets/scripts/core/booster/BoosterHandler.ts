import { Board } from "../board/Board";
import { Tile } from "../board/tile/Tile";
import { BoosterType } from "./BoosterType";
import { ScoreCounter } from "../ScoreCounter";
import { BoosterView } from "../../view/BoosterView";
import { InteractionPolicyService, InteractionPolicyState } from "../../service/InteractionPolicyService";
import { BombBoosterAction } from "./BombBoosterAction";
import { BoosterActionRegistry } from "./BoosterActionRegistry";
import { IBoosterAction } from "./IBoosterAction";
import { TeleportBoosterAction } from "./TeleportBoosterAction";
import { BoardView } from "../../view/BoardView";

export class BoosterHandler {
    private board: Board;
    private activeBooster: BoosterType;
    private boosterView: BoosterView = null;
    private readonly actionRegistry: BoosterActionRegistry;
    private readonly interactionPolicy: InteractionPolicyService;
    private readonly getInteractionState: () => InteractionPolicyState;
    
    constructor(
        board: Board,
        boardView: BoardView,
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

        const teleportAction = new TeleportBoosterAction(this.board, boardView, boosterTeleportCount);
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
        this.boosterView.onBoosterTap(this.onTapBooster);
    }

    private unsubscribesFromBoosterButtonsEvent() : void {
        this.boosterView.offBoosterTap(this.onTapBooster);
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

    private onTapBooster = (boosterType: BoosterType): void => {
        if (!this.interactionPolicy.canAcceptBoosterInput(this.getInteractionState())) return;

        this.selectBooster(boosterType);
    }

    private syncBoosterButtonsAvailability() : void {
        for (const boosterAction of this.actionRegistry.getAllActions()) {
            if (boosterAction.getRemainingUses() <= 0) {
                this.disableBoosterByType(boosterAction.type);
            }
        }
    }

    private updateBoosterCountsView() : void {
        for (const boosterAction of this.actionRegistry.getAllActions()) {
            const remainingUses = boosterAction.getRemainingUses();
            this.boosterView.updateView(boosterAction.type, remainingUses);
        }
    }

    private disableBoosterByType(boosterType: BoosterType): void {
        this.boosterView.disableBooster(boosterType);
    }

    private getAction(type: BoosterType): IBoosterAction | null {
        if (type === BoosterType.None) {
            return null;
        }

        return this.actionRegistry.get(type);
    }
}