/**
 * @file client/js/WebPlayer.ts
 */
import { UserInterface } from "./UserInterface"
import { DesktopInterface } from "./desktop/DesktopInterface"
import { Player, PlayerID, ActionCB, EndTurnCB } from "../../game/Player"
import { GlobalState } from "../../game/GlobalState"
import { ASSERT } from "../../game/util"

export class WebPlayer extends Player {
    private ui: UserInterface | null;

    constructor() {
        super("Web Player");
    }

    init(id: PlayerID, state: GlobalState, actionFn: ActionCB,
         endTurnFn: EndTurnCB): void {
        this.ui = new DesktopInterface(id, state, actionFn, endTurnFn);
        this.ui.startRenderLoop();
    }

    update(state: GlobalState): void {
        ASSERT(this.ui != null);

        this.ui!.update(state);
    }
}
