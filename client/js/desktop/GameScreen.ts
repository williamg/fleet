/**
 * @file client/js/desktop/GameScreen.ts
 * Describes the scene the user sees when playing the game
 */
import { TargetWindow } from "./TargetWindow"
import { HangerWindow } from "./HangerWindow"
import { Grid } from "./Grid"
import { Scene } from "../Scene"
import { GameUIState } from "./GameUIState"
import { MyTurn } from "./MyTurn"
import { OtherPlayerTurn } from "./OtherPlayerTurn"
import { UserInterface, MessageCB } from "../UserInterface"

import { Observer, LOG } from "../../../game/util"
import { TeamID } from "../../../game/components/Team"
import { GameState, GameStateChanger } from "../../../game/GameState"
import { Change } from "../../../game/Changes"
import { Action } from "../../../game/Action"
import { Messengers } from "../../../game/Messenger"
import { IDPool } from "../../../game/IDPool"
import { Entity } from "../../../game/Entity"
import { Message, MessageType } from "../../../game/Message"
import { deserializeChangeset } from "../../../game/serialization/ChangeSerialization"
import { serializeAction } from "../../../game/serialization/ActionSerialization"
import { System } from "../../../game/System"
import { GridSystem } from "../../../game/systems/GridSystem"
import { HangerSystem } from "../../../game/systems/HangerSystem"
import { DeploySystem } from "../../../game/systems/DeploySystem"


import { List } from "immutable"

export type GameUIEvent = "hanger selected" | "hex clicked" | "move" |
                          "deploy" | "item" | "endturn" | "cancel"
export type UIObserver = Observer<GameUIEvent>

export type UISystems = {
    hanger: HangerSystem,
    deploy: DeploySystem,
    grid: GridSystem
};

export class GameScreen extends Scene {
    private readonly _sendMessage: MessageCB;
    private readonly _systems: System[];
    private readonly _messengers: Messengers = new Messengers();
    private readonly _friendly: TeamID;
    private readonly _ui_systems: UISystems;
    private readonly _observer: UIObserver;

    private _target_window: TargetWindow | undefined;
    private _hanger_window: HangerWindow | undefined;
    private _grid: Grid | undefined;
    private _state: GameState;
    private _uistate: GameUIState | undefined;
    private _did_ready: boolean;

    constructor(ui: UserInterface, sendMessage: MessageCB, friendly: TeamID) {
        super(ui);

        this._sendMessage = sendMessage;
        this._friendly = friendly;
        this._state = new GameState();
        this._did_ready = false;

        this._ui_systems = {
            grid: new GridSystem(new IDPool(), this._messengers, this._state),
            hanger: new HangerSystem(new IDPool(), this._messengers, this._state),
            deploy: new DeploySystem(new IDPool(), this._messengers, this._state)
        };

        this._systems = [ this._ui_systems.grid, this._ui_systems.hanger,
                          this._ui_systems.deploy ];

        this._observer = new Observer<GameUIEvent>(30);
    }

    public handleMessage(message: Message) {
        if (message.type == MessageType.CHANGESET) {
            const changes = deserializeChangeset(message.data);
            this.handleChanges(changes);

            if (!this._did_ready) {
                this._did_ready = true;
                this._sendMessage(new Message(MessageType.READY, ""));
            }
        }
    }

    public enter(stage: PIXI.Container, callback: () => void): void {
        this._grid = new Grid(this._ui_systems.grid, this._observer, 
                              this._friendly);
        this._grid.x = 1920 / 2;
        this._grid.y = 1080 / 2;

        this._target_window = new TargetWindow(this._observer,
                                               this._state, this._friendly);
        this._target_window.x = 0;
        this._target_window.y = 1080 - this._target_window.height;

        this._hanger_window =
            new HangerWindow(this._ui, this._observer, this._ui_systems.hanger,
                             this._state, this._friendly);
        this._hanger_window.x = 1920 - this._hanger_window.width;
        this._hanger_window.y = 1080 - this._hanger_window.height;

        stage.addChild(this._grid);
        stage.addChild(this._target_window);
        stage.addChild(this._hanger_window);

        const params = {
            setUIState: this.setUIState.bind(this),
            executeAction: this.executeAction.bind(this),
            systems: this._ui_systems,
            observer: this._observer,
            friendly: this._friendly,
            target_window: this._target_window,
            hanger_window: this._hanger_window,
            grid: this._grid,
            state: this._state
        };

        if (this._state.current_team == this._friendly) {
            this._uistate = new MyTurn(params);
        } else {
            this._uistate = new OtherPlayerTurn(params);
        }

        this._uistate.enter();

        callback();
    }

    public render(delta: number): void {
        if (this._grid) {
            this._grid.render(this._state);
        }
    }
    private setUIState(new_state: GameUIState): void {
        if (this._uistate != undefined) {
            this._uistate.exit();
        }

        new_state.enter();
        this._uistate = new_state;
    }
    private executeAction(action: Action): void {
        const serialized = serializeAction(action);
        const msg = new Message(MessageType.ACTION, serialized);
        this._sendMessage(msg);
    }
    private handleChanges(changeset: List<Change>): void {
        const mutable_state = new GameStateChanger(this._state, this._systems);

        for (const change of changeset) {
            mutable_state.makeChange(change);
        }

        this._state = mutable_state.state;

        for (const system of this._systems) {
            system.setState(this._state);
        }

        if (this._uistate) {
            this._uistate.setState(this._state);
        }

        if (this._hanger_window) {
            this._hanger_window.setState(this._state);
        }

        if (this._target_window) {
            this._target_window.setState(this._state);
        }

    }
}
