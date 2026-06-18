export interface InteractionPolicyState {
    isAnimationInProgress: boolean;
    isLevelFinished: boolean;
    isBoosterModeActive: boolean;
}

export class InteractionPolicyService {
    public canAcceptBoardInput(state: InteractionPolicyState): boolean {
        return !state.isAnimationInProgress && !state.isLevelFinished;
    }

    public canAcceptBoosterInput(state: InteractionPolicyState): boolean {
        return !state.isAnimationInProgress && !state.isLevelFinished;
    }

    public isBoosterModeActive(state: InteractionPolicyState): boolean {
        return state.isBoosterModeActive;
    }
}