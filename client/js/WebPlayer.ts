/**
 * @file client/js/WebPlayer.ts
 */

import { Player, PlayerID, ActionCB } from "../../game/Player"
import { GameState } from "../../game/Game"
import { UserInterface } from "./UserInterface"
import { DesktopInterface } from "./desktop/DesktopInterface"

export class WebPlayer extends Player {
    private ui: UserInterface | null;

    constructor() {
        super("Web Player");
    }

    init(id: PlayerID, state: GameState, action_cb: ActionCB): void {
        this.ui = new DesktopInterface(state, id, action_cb);
        this.ui.startRenderLoop();
    }

    setState(state: GameState): void {
        console.assert(this.ui != null);

        this.ui!.setState(state);
    }
}
