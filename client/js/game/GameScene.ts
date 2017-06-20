/**
 * @file client/js/game/GameScene.ts
 * This is a generic game scene. It responds to events generated
 * by a GameView and communicates with the server.
 */
import { GameView } from "./GameView"
import { GameUIState } from "./GameUIState"
import { MyTurnUIState } from "./MyTurnUIState"
import { NotMyTurnUIState } from "./NotMyTurnUIState"
import { DeployUIState } from "./DeployUIState"

import { DesktopGameView } from "./views/DesktopGameView"

import { UserInterface } from "../UserInterface"
import { Scene } from "../Scene"

import { Action } from "../../../game/Action"
import { Change } from "../../../game/Changes"
import { GameState, GameStateChanger } from "../../../game/GameState"
import { IDPool } from "../../../game/IDPool"
import { Message, MessageType } from "../../../game/Message"
import { System, SystemRegistry } from "../../../game/System"

import { TeamID } from "../../../game/components/Team"

import { deserializeChangeset }
    from "../../../game/serialization/ChangeSerialization"
import { serializeAction }
    from "../../../game/serialization/ActionSerialization"

import { DeploySystem } from "../../../game/systems/DeploySystem"
import { GridSystem } from "../../../game/systems/GridSystem"
import { HangerSystem } from "../../../game/systems/HangerSystem"
import { PowerSystem } from "../../../game/systems/PowerSystem"
import { MovementSystem } from "../../../game/systems/MovementSystem"
import { ItemSystem } from "../../../game/systems/ItemSystem"
import { CombatSystem } from "../../../game/systems/CombatSystem"
import { HealthSystem } from "../../../game/systems/HealthSystem"

import { List } from "immutable"
import * as PIXI from "pixi.js"

export class GameScene extends Scene {
    /**
     * The view being controlled
     * @type {GameView}
     */
    private readonly _view: GameView;
    /**
     * The team considered "friendly"
     * @type {TeamID}
     */
    private readonly _friendly: TeamID;
    /**
     * ID pool for system initialization
     * @type {IDPool}
     */
    private readonly _id_pool: IDPool;
    /**
     * Systems registry
     * @type {SystemRegistry}
     */
    private readonly _systems: SystemRegistry;
    /**
     * The current state of the UI
     * @type {GameUIState}
     */
    private _ui_state: GameUIState;
    /**
     * The current state of the game
     * @type {GameState}
     */
    private _game_state: GameState;
    /**
     * Whether or not we have "ready"'d
     * @type {boolean}
     */
    private _did_ready: boolean;
    /**
     * Bind function handlers for state observer
     */
    private readonly _onChangeUIState = this.changeUIState.bind(this);
    private readonly _onAction = this.sendAction.bind(this);
    private readonly _onEndTurn = this.endTurn.bind(this);

    constructor(ui: UserInterface, friendly: TeamID) {
        super(ui);

        this._friendly = friendly;
        this._game_state = new GameState();
        this._id_pool = new IDPool();

        this._systems = new SystemRegistry(this._id_pool, this._game_state);
        this._systems.register(DeploySystem);
        this._systems.register(GridSystem);
        this._systems.register(HangerSystem);
        this._systems.register(PowerSystem);
        this._systems.register(MovementSystem);
        this._systems.register(ItemSystem);
        this._systems.register(CombatSystem);
        this._systems.register(HealthSystem);

        this._view = new DesktopGameView(ui, this._systems, friendly,
                                         this._game_state);
    }
    /**
     * @see client/js/Scene.ts
     */
    public render(delta: number): void {
        this._view.render(delta);
    }
    /**
     * @see client/js/Scene.ts
     */
    public enter(stage: PIXI.Container, callback: () => void): void {
        this._view.enter(stage, () => {
            let state = undefined;
            if (this._game_state.current_team == this._friendly) {
                state =
                    new MyTurnUIState(this._view, this._systems, this._friendly,
                                      this._game_state);
            } else {
                state =
                    new NotMyTurnUIState(this._view, this._systems,
                                         this._friendly, this._game_state);
            }

            this.changeUIState(state);
            return callback();
        });
    }
    /**
     * @see client/js/Scene.ts
     */
    public exit(callback: () => void): void {
        this._view.exit(callback);
    }
    /**
     * @see client/js/Scene.ts
     */
    public handleMessage(message: Message) {
        if (message.type == MessageType.CHANGESET) {
            const changes = deserializeChangeset(message.data);
            this.handleChanges(changes);

            /* Ready once we receive the first changeset */
            if (!this._did_ready) {
                this._did_ready = true;
                this.emit("message", new Message(MessageType.READY, ""));
            }
        }
    }
    /**
     * Handle a changeset from the server, updating our state and letting all
     * the stakeholders know
     *
     * @param {List<Change>} changes List of changes to apply
     */
    private handleChanges(changes: List<Change>): void {
        const changer =
            new GameStateChanger(this._game_state, this._systems);

        for (const change of changes) {
            changer.makeChange(change);
        }

        this._game_state = changer.state;
        this._systems.setState(this._game_state);
        this._ui_state.setState(this._game_state);
        this._view.setState(this._game_state);
    }
    /**
     * Change the UI state
     *
     * @param {GameUIState} state State to switch to
     */
    private changeUIState(new_state: GameUIState): void {
        if (this._ui_state) {
            this._ui_state.exit();
            this._ui_state.removeListener("action", this._onAction);
            this._ui_state.removeListener("change state", this._onChangeUIState);
            this._ui_state.removeListener("end turn", this._onEndTurn);
        }

        new_state.addListener("action", this._onAction);
        new_state.addListener("change state", this._onChangeUIState);
        new_state.addListener("end turn", this._onEndTurn);
        new_state.enter();
        this._ui_state = new_state;
    }
    /**
     * Send an action to the server
     *
     * @param {Action} action Action to send
     */
    private sendAction(action: Action): void {
        const message =
            new Message(MessageType.ACTION, serializeAction(action));

        this.emit("message", message);
    }
    /**
     * Send an end turn message to the server
     */
    private endTurn(): void {
        const message = new Message(MessageType.END_TURN, "");
        this.emit("message", message);
    }


}
