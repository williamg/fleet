/**
 * @file client/js/desktop/GameScreen.ts
 * Describes the scene the user sees when playing the game
 */
import { TargetWindow } from "./TargetWindow"
import { HangerWindow } from "./HangerWindow"
import { Grid } from "./Grid"
import { Scene } from "../Scene"
import { UserInterface, MessageCB } from "../UserInterface"
import { LOG } from "../../../game/util"
import { TeamID } from "../../../game/components/Team"
import { GameState, GameStateChanger } from "../../../game/GameState"
import { Change } from "../../../game/Changes"
import { System } from "../../../game/System"
import { GridSystem } from "../../../game/systems/GridSystem"
import { HangerSystem } from "../../../game/systems/HangerSystem"
import { Messengers } from "../../../game/Messenger"
import { IDPool } from "../../../game/IDPool"
import { Entity } from "../../../game/Entity"
import { Message, MessageType } from "../../../game/Message"
import { deserializeChangeset } from "../../../game/serialization/ChangeSerialization"

import { List } from "immutable"

export class GameScreen extends Scene {
    private readonly _sendMessage: MessageCB;
    private readonly _systems: System[];
    private readonly _messengers: Messengers = new Messengers();
    private readonly _friendly: TeamID;
    private readonly _grid_system: GridSystem;
    private readonly _hanger_system: HangerSystem;

    private _target_window: TargetWindow | undefined;
    private _hanger_window: HangerWindow | undefined;
    private _grid: Grid | undefined;
    private _state: GameState;
    private _did_ready: boolean;

    constructor(ui: UserInterface, sendMessage: MessageCB, friendly: TeamID) {
        super(ui);

        this._sendMessage = sendMessage;
        this._friendly = friendly;
        this._state = new GameState();
        this._did_ready = false;

        this._grid_system = new GridSystem(new IDPool(), this._messengers);
        this._hanger_system = new HangerSystem(new IDPool(), this._messengers);
        this._systems = [ this._grid_system, this._hanger_system ];
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
        this._grid = new Grid(this._grid_system);
        this._grid.x = 1920 / 2;
        this._grid.y = 1080 / 2;

        this._target_window = new TargetWindow(this._state, this._friendly);
        this._target_window.x = 0;
        this._target_window.y = 1080 - this._target_window.height;

        this._hanger_window =
            new HangerWindow(this._ui, this._hanger_system, this._state,
                             this._friendly);
        this._hanger_window.x = 1920 - this._hanger_window.width;
        this._hanger_window.y = 1080 - this._hanger_window.height;

        /* Hookup events */
        this._hanger_window.on(HangerWindow.SHIP_SELECTED, (ent: Entity) => {
            this._target_window!.setTarget(ent);
        });

        stage.addChild(this._grid);
        stage.addChild(this._target_window);
        stage.addChild(this._hanger_window);

        callback();
    }

    public render(delta: number): void {
        if (this._grid) {
            this._grid.render(this._state);
        }
    }

    private handleChanges(changeset: List<Change>): void {
        const mutable_state = new GameStateChanger(this._state, this._systems);

        for (const change of changeset) {
            mutable_state.makeChange(change);
        }

        this._state = mutable_state.state;

        if (this._hanger_window) {
            this._hanger_window.setState(this._state);
        }

        if (this._target_window) {
            this._target_window.setState(this._state);
        }
    }
}
