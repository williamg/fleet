/**
 * @file game/WebPlayer.ts
 * Class for a player that controlled by a human
 */

import { GameInputHandler } from "./GameInputHandler"
import { Player, PlayerID, ActionCB, EndTurnCB } from "../../../game/Player"

export type OnInitFn =
    (id: PlayerID, inputHandler: GameInputHandler, state: GlobalState) => void;
export type OnUpdateFn = (state: GlobalState) => void;

export class WebPlayer extends Player {
    private readonly on_init: OnInitFn;
    private readonly on_update: OnUpdateFn;
    private input_handler: GameInputHandler;
    private id: PlayerID;

    constructor(on_init: OnInitFn, on_update: OnUpdate) {
        super("Mr. Human");

        this.on_init = on_init;
        this.on_update = on_update;
    }

    public init(id: PlayerID, state: GlobalState, actionFn: ActionCB,
                endTurnFn: EndTurnCB): void {
        this.id = id;
        this.input_handler = new GameInputHandler(actionFn, endTurnFn);

        this.on_init(this.id, this.input_handler, state);
    }

    public update(state: GlobalState): void {
        this.on_update(state);
    }
}
