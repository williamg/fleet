/**
 * @file client/js/dekstop/Deploy.ts
 *
 * The UIState for when the player has indiciated they want to deploy a ship.
 * Facilitates target selection.
 */
import { GameUIState, SetUIStateCB, GameUIStateParams } from "./GameUIState"
import { UIObserver, UISystems } from "./GameScreen"
import { OtherPlayerTurn } from "./OtherPlayerTurn"
import { MyTurn } from "./MyTurn"
import { TargetWindow, CancelPos } from "./TargetWindow"
import { HangerWindow } from "./HangerWindow"
import { Grid } from "./Grid"
import { GameState } from "../../../game/GameState"
import { Entity } from "../../../game/Entity"
import { Vec2 } from "../../../game/Math"
import { ComponentType } from "../../../game/Component"
import { TeamID } from "../../../game/components/Team"
import { HexPosition } from "../../../game/components/HexPosition"
import { DeployZone } from "../../../game/components/DeployZone"
import { Deploy } from "../../../game/Action"

import { Set } from "immutable"

export class DeployState extends GameUIState {
    /**
     * The entity being deployed
     * @type {Entity}
     */
    private readonly _entity: Entity;
    private _targets: Set<Entity>;
    private _target_selected: Entity | undefined;
    /**
     * TIL: Calling bind() on a function returns a different function after
     * subsequent calls, even if you're bind()ing the same function. So these
     * variables store bound handlers so that adds and removes are successful
     */
    private readonly _onCancel = this.onCancel.bind(this);
    private readonly _onHexSelected = this.onHexSelected.bind(this);

    constructor(params: GameUIStateParams, entity: Entity) {
        super(params);

        this._entity = entity;
        this._target_selected = undefined;
        this._targets = this._params.systems.deploy.targetsFor(this._entity);
    }
    /**
     * When our turn ends, transition into the other player's turn state
     *
     * @param {GameState} state New game state
     */
    public setState(state: GameState): void {
        super.setState(state);

        if (state.current_team != this._params.friendly) {
            const state = new OtherPlayerTurn(this._params);
            this._params.setUIState(state);
            return;
        }

        this._targets = this._params.systems.deploy.targetsFor(this._entity);
        this.showTargets();
    }
    /**
     * Set up event handlers on enter
     */
    public enter(): void {
        this._params.observer.addListener("cancel", this._onCancel);
        this._params.observer.addListener("hex clicked", this._onHexSelected)

        this._params.target_window.setCancelButton(CancelPos.MOVE);

        this.showTargets();

    }
    /**
     * Tear down event handlers on exit
     */
    public exit(): void {
        this._params.observer.removeListener("cancel", this._onCancel);
        this._params.observer.removeListener("hex clicked", this._onHexSelected);

        this._params.target_window.setCancelButton(CancelPos.HIDDEN);
        this._params.grid.clearHexStyles();
    }
    private showTargets(): void {
        for (const target of this._targets) {
            const pos = this._params.state.getComponent<HexPosition>(
                target, ComponentType.HEX_POSITION)!;
            const posvec = new Vec2(pos.data.x, pos.data.y);

            this._params.grid.setHexStyle(posvec, {
                color: 0x0000FF, alpha: 1.0
            });
        }
    }
    private onCancel(): void {
        this._params.setUIState(new MyTurn(this._params));
    }
    private onHexSelected(hex: Vec2): void {
        if (this._target_selected) {
            const pos = this._params.state.getComponent<HexPosition>(
                this._target_selected, ComponentType.HEX_POSITION)!;
            const locations = this._params.state.getComponent<DeployZone>(
                this._target_selected, ComponentType.DEPLOY_ZONE)!;

            for (let i = 0; i < locations.data.targets.length; ++i) {
                const loc = locations.data.targets[i];
                const vec = new Vec2(loc.x + pos.data.x, loc.y + pos.data.y);

                if (hex.equals(vec)) {
                    this._params.executeAction(
                        new Deploy(this._entity, this._target_selected, i));
                    this._params.setUIState(new MyTurn(this._params));
                    return;
                }
            }
        }

        /* Either no target selected, or the user didn't click on a valid
         * location
         */
        const target = this._targets.find((target: Entity) => {
            const pos = this._params.state.getComponent<HexPosition>(
                target, ComponentType.HEX_POSITION)!;
            return pos.data.x == hex.x && pos.data.y == hex.y;
        });

        if (!target) return;

        this._target_selected = target;

        const pos = this._params.state.getComponent<HexPosition>(
            target, ComponentType.HEX_POSITION)!;


        this._params.grid.clearHexStyles();
        this._params.grid.setHexStyle(new Vec2(pos.data.x, pos.data.y), {
            color: 0xFFFF00,
            alpha: 1
        });

        const locations = this._params.state.getComponent<DeployZone>(
            target, ComponentType.DEPLOY_ZONE)!;

        for (const loc of locations.data.targets) {
            const vec = new Vec2(loc.x + pos.data.x, loc.y + pos.data.y);

            if (this._params.systems.grid.inBounds(vec) &&
                this._params.systems.grid.occupancyStatus(vec) == "free") {
                this._params.grid.setHexStyle(vec, {
                    color: 0x0000FF,
                    alpha: 1
                });
            }
        }


    }
}
