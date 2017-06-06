/**
 * @file client/js/game/DeployUIState.ts
 *
 * The UIState for when the player is deploying a ship from the hanger.
 * Deploying is a two step process:
 *
 *      1) The player must choose an entity providing a deploy zone
 *      2) Once chosen, the player must choose one of the locations within that
 *         zone to deploy the ship to
 */
import { GameUIState, UIStateEvent } from "./GameUIState"
import { NotMyTurnUIState } from "./NotMyTurnUIState"
import { MyTurnUIState } from "./MyTurnUIState"
import { GameView, CancelPos, HexStyle } from "./GameView"

import { Deploy } from "../../../game/Action"
import { ComponentType } from "../../../game/Component"
import { Entity } from "../../../game/Entity"
import { GameState } from "../../../game/GameState"
import { Vec2 } from "../../../game/Math"
import { SystemRegistry } from "../../../game/System"
import { Observer } from "../../../game/util"

import { TeamID } from "../../../game/components/Team"
import { HexPosition } from "../../../game/components/HexPosition"
import { DeployZone } from "../../../game/components/DeployZone"

import { DeploySystem } from "../../../game/systems/DeploySystem"

import { Set } from "immutable"

type TargetInfo = {
    target: Entity,
    origin: Vec2,
    indices: number[],
    locs: Vec2[]
};

export class DeployUIState extends Observer<UIStateEvent> implements GameUIState {
    /**
     * Game view
     * @type {GameView}
     */
    private readonly _view: GameView;
    /**
     * System registry
     * @type {SystemRegistry}
     */
    private readonly _systems: SystemRegistry;
    /**
     * Friendly team
     * @type {TeamID}
     */
    private readonly _friendly: TeamID;
    /**
     * The entity being deployed
     * @type {Entity}
     */
    private readonly _deploying: Entity;
    /**
     * Game state
     * @type {GameState}
     */
    private _game_state: GameState;
    /**
     * Deploy target info, once selected
     * @type {TargetInfo | undefined}
     */
    private _deploy_zone_info: TargetInfo | undefined;
    /**
     * Set of valid targets for the entity
     *
     * @type {Set<TargetInfo>}
     */
    private _valid_targets: Set<TargetInfo>;
    /**
     * Handler references
     */
    private readonly _onCancel = this.onCancel.bind(this);
    private readonly _onEndTurn = this.onEndTurn.bind(this);
    private readonly _onHexSelected = this.onHexSelected.bind(this);

    constructor(view: GameView, systems: SystemRegistry, friendly: TeamID,
                game_state: GameState, deploying: Entity) {
        super();

        this._view = view;
        this._systems = systems;
        this._friendly = friendly;

        this._deploying = deploying;
        this._deploy_zone_info = undefined;
        this._valid_targets = Set<TargetInfo>();

        this.setState(game_state);
    }
    /**
     * @see client/js/game/GameUIState
     */
    public setState(state: GameState): void {
        this._game_state = state;

        if (this._game_state.current_team != this._friendly) {
            const uistate = new NotMyTurnUIState(
                this._view, this._systems, this._friendly, this._game_state);
            this.emit("change state", uistate);
        }

        /* Cache targets */
        const deploy_system = this._systems.lookup(DeploySystem);
        const targets = deploy_system.getDeployTargets(
            this._systems, this._deploying);

        this._valid_targets = targets.map((entry: [Entity, number[]]) => {
            const [target, indices] = entry;
            const pos = this._game_state.getComponent<HexPosition>(
                target, ComponentType.HEX_POSITION)!;

            const origin = new Vec2(pos.data.x, pos.data.y);

            const zone = this._game_state.getComponent<DeployZone>(
                target, ComponentType.DEPLOY_ZONE)!;

            const locs = [];

            for (let i = 0; i < indices.length; ++i) {
                const loc = zone.data.targets[indices[i]];
                const vec = new Vec2(loc.x, loc.y).add(origin);
                locs.push(vec);
            }

            return {
                target: target,
                origin: origin,
                indices: indices,
                locs: locs
            };
        });
    }
    /**
     * @see client/js/game/GameUIState
     */
    public enter(): void {
        this._view.setHangerTargeting(false);
        this._view.setGridTargeting(true);
        this._view.setItems(false);
        this._view.setCancelPos(CancelPos.MOVE);

        this._view.addListener("cancel", this._onCancel);
        this._view.addListener("end turn", this._onEndTurn);
        this._view.addListener("hex click", this._onHexSelected);

        /* Highlight potential targets */
        for (const info of this._valid_targets) {
            this._view.setHexStyle(info.origin, HexStyle.TARGET);
        }
    }
    /**
     * @see client/js/game/GameUIState
     */
    public exit(): void {
        this._view.removeListener("cancel", this._onCancel);
        this._view.removeListener("hex click", this._onHexSelected);
        this._view.removeListener("end turn", this._onEndTurn);

        this._view.setCancelPos(CancelPos.HIDDEN);

        this._view.clearHexStyles();
    }
    private onCancel(): void {
        this.emit("change state", new MyTurnUIState(
            this._view, this._systems, this._friendly, this._game_state));
    }
    private onEndTurn(): void {
        this.emit("end turn");
    }
    private onHexSelected(hex: Vec2): void {
        /* Case 1: We've already selected a deploy zone and this hex is within
         * that entity's zone. Deploy the ship.
         */
        if (this._deploy_zone_info != undefined) {
            for (let i = 0; i < this._deploy_zone_info.locs.length; ++i) {
                if (this._deploy_zone_info.locs[i].equals(hex)) {
                    const action =
                        new Deploy(this._deploying,
                                   this._deploy_zone_info.target,
                                   this._deploy_zone_info.indices[i]);
                    this.emit("action", action);

                    /* Once deployed, return to normal state */
                    this.emit("change state", new MyTurnUIState(
                        this._view, this._systems, this._friendly,
                        this._game_state));
                    return;
                }
            }
        }

        const new_info = this._valid_targets.find((info) => {
            return info.origin.equals(hex);
        });

        /* If we haven't clicked on a target, then there's nothing to do */
        if (new_info == undefined) {
            return;
        }

        if (this._deploy_zone_info != undefined) {
            /* Make sure we didn't click on the same target, if so do nothing */
            if (this._deploy_zone_info.origin.equals(new_info.origin)) return;

            /* Case 2: We've already selected a target, but now we're selecting
             * a NEW target. Clear the hexes we've already highlighted
             */
            this._view.setHexStyle(this._deploy_zone_info.origin,
                                   HexStyle.NORMAL);

            for (const old_loc of this._deploy_zone_info.locs) {
                this._view.setHexStyle(old_loc, HexStyle.NORMAL);
            }
        }

        /* At this point, it's as if we've selected a target for the first time.
         * Highlight the appropriate hexes
         */
        this._deploy_zone_info = new_info;

        this._view.setHexStyle(this._deploy_zone_info.origin,
                               HexStyle.TARGET_SELECTED);

        for (const loc of this._deploy_zone_info.locs) {
            this._view.setHexStyle(loc, HexStyle.TARGET);
        }
    }
}
