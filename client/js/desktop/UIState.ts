/**
 * @file client/js/dekstop/UIState.ts
 */
import { Hex } from "./Hex"
import { Canvas } from "../Canvas"
import { GlobalState } from "../../../game/GlobalState"
import { Vec2 } from "../../../game/Math"
import { PlayerID } from "../../../game/Player"
import { Move, Deploy, Activate, Action, ActionType } from "../../../game/Action"
import { HexGrid, MAP_COORDS } from "../../../game/HexGrid"
import { Entity, EntityID } from "../../../game/Entity"
import { Movement, Position } from "../../../game/components/Positioning"
import { Deployable } from "../../../game/components/Deployable"
import { Charge } from "../../../game/components/Charge"
import { Item } from "../../../game/components/Item"
import { Team } from "../../../game/components/Team"
import { ASSERT, LOG } from "../../../game/util"

export interface UICallbacks {
    reportAction: (action: Action) => void;
    endTurn: () => void;
    setSelected: (entity: Entity | null) => void;
    transition: (state: UIState) => void;
    getSelected: () => Entity | null;
};

/**
 * The UI is managed with an FSM model. In general, the user will transition
 * between the following states:
 *
 *  - OPPONENT: When it's the opponent's turn.
 *  - INFO: It is the user's turn; they can view info about other ships and
 *    make moves
 *  - TARGET_SELECTION: The user wants to perform an action the requires
 *  selecting a target.
 *
 * Each state implementation controls which UI buttons/elements are visible/
 * available.
 */
export type TransitionFn = (state: UIState) => void;

export abstract class UIState {
    protected readonly friendly: PlayerID;
    protected readonly move_btn: HTMLButtonElement;
    protected readonly deploy_btn: HTMLButtonElement;
    protected readonly item_btns: HTMLButtonElement[];
    protected readonly turn_btn: HTMLButtonElement;
    protected readonly callbacks: UICallbacks;
    protected uigrid: HexGrid<Hex>;
    protected state: GlobalState;

    constructor(friendly: PlayerID, state: GlobalState, uigrid: HexGrid<Hex>,
                callbacks: UICallbacks) {
        this.friendly = friendly;
        this.state = state;
        this.uigrid = uigrid;
        this.callbacks = callbacks;
        this.move_btn = document.getElementById("move")! as HTMLButtonElement;
        this.deploy_btn =
            document.getElementById("deploy")! as HTMLButtonElement;
        this.turn_btn = document.getElementById("turn")! as HTMLButtonElement;
        this.item_btns = new Array(3);

        for (let i = 0; i < 3; ++i) {
            const name = "item" + i.toString();
            this.item_btns[i] =
                document.getElementById(name)! as HTMLButtonElement;
        }
    }

    enter(): void {}
    exit(): void {}
    update(state: GlobalState): void {
        this.state = state;
    };
    hexClicked(hex: Vec2): void { return; }
    hangerShipClicked(index: number): void { return; }
    render(canvas: Canvas): void { return; }
}

export class OpponentState extends UIState {
    constructor(friendly: PlayerID, state: GlobalState, uigrid: HexGrid<Hex>,
                callbacks: UICallbacks) {
        super(friendly, state, uigrid, callbacks);
    }

    /**
     * Disable all action buttons, since it isn't this user's turn
     */
    enter(): void {
        this.move_btn.disabled = true;
        this.turn_btn.disabled = true;
        this.deploy_btn.disabled = true;

        for (let button of this.item_btns) {
            button.disabled = true;
        }
    }

    /**
     * Allow turn switching
     */
    exit(): void {
        this.turn_btn.disabled = false;
    }

    /**
     * Display info for the ship on this hex, if present
     * @param  {Vec2}      hex   Hex to display
     */
    hexClicked(hex: Vec2): void {
        const entity = this.state.grid.at(hex);

        if (entity == null) return;

        this.callbacks.setSelected(Entity.getEntity(entity)!);
    }
    /**
     * Display info for the selected hanger ship
     * @param {EntityID} entity_id ID of ship
     */
    hangerShipClicked(entity_id: EntityID): void {
        this.callbacks.setSelected(Entity.getEntity(entity_id)!);
    }
    /**
     * Transition to the info state when it is no longer the opponent's turn
     */
    update(state: GlobalState): void {
        super.update(state);

        if (this.state.current_player == this.friendly) {
            this.callbacks.transition(
                new InfoState(this.friendly, this.state,
                              this.uigrid, this.callbacks));
        }
    }
}

export class InfoState extends UIState {
    constructor(friendly: PlayerID, state: GlobalState, uigrid: HexGrid<Hex>,
                callbacks: UICallbacks) {
        super(friendly, state, uigrid, callbacks);
    }
    /**
     * Enable action buttons if a ship is selected
     */
    enter(): void {
        this.move_btn.onclick = (e) => {
            const ent = this.callbacks.getSelected()!;
            const movement = ent.getComponent(Movement)!;
            const targetFilter = movement.destinationFilter();
            const targets = targetFilter.filter(MAP_COORDS);

            function make_move(dest: Vec2) {
                this.callbacks.report_action(new Move(ent.id, dest));
            }

            const targeting =
                new TargetingState(this.friendly, this.state, this.uigrid,
                                   this.callbacks, this.move_btn, targets,
                                   make_move);
            this.callbacks.transition(targeting);
        }

        for (let i = 0; i < this.item_btns.length; ++i) {
            let btn = this.item_btns[i];
            btn.onclick = (e) => {
                const id = parseInt(btn.getAttribute("item-id")!);
                const entity = this.callbacks.getSelected();

                const items = entity!.getComponents(Item);
                const item: Item = items.filter((i) => { return i.id == id; })[0];
                const filter = item.targetFilter();

                if (filter == null) {
                    /* No target required, perform action */
                    this.callbacks.reportAction(new Activate(entity!.id, id, null));
                    return;
                }

                const target_ents = filter.filter([...Entity.all()]);
                const targets = target_ents.map(function (e) {
                    return e.getComponent(Position)!.position;
                });

                function use_item(target: Vec2) {
                    const target_id = this.state.grid.at(target)!;
                    this.callbacks.report_action(
                        new Activate(entity!.id, id, target_id));
                }

                this.callbacks.transition(
                    new TargetingState(this.friendly, this.state, this.uigrid,
                                       this.callbacks, btn, targets, use_item));
            }
        }

        this.turn_btn.onclick = (e) => {
            this.callbacks.endTurn();
        }

        this.deploy_btn.onclick = (e) => {
            const entity = this.callbacks.getSelected()!;
            const deployable = entity.getComponent(Deployable)!;
            const targets = deployable.targetFilter().filter(MAP_COORDS);

            function deploy(dest: Vec2) {
                this.callbacks.reportAction(new Deploy(entity.id, dest));
            }

            this.callbacks.transition(
                new TargetingState(this.friendly, this.state, this.uigrid,
                                   this.callbacks, this.deploy_btn, targets,
                                   deploy));
        }
    }
    /**
     * When a hex is clicked, display ship info if present and enable actions
     * @param  {Vec2}    hex Hex that was clicked
     */
    hexClicked(hex: Vec2): void {
        const entity = this.state.grid.at(hex)!;
        this.callbacks.setSelected(Entity.getEntity(entity)!);
    }

    hangerShipClicked(id: EntityID): void {
        this.callbacks.setSelected(Entity.getEntity(id)!);
    }
    update(state: GlobalState): void {
        super.update(state);

        if (this.state.current_player != this.friendly) {
            this.callbacks.transition(
                new OpponentState(this.friendly, this.state,
                                  this.uigrid, this.callbacks));
        }
    }

    render(canvas: Canvas): void {
        let actions_enabled = false;
        let ship = this.callbacks.getSelected();

        if (ship == null) return;

        const team = ship.getComponent(Team);

        if (team == null || team.team != this.friendly) return;

        const charge = ship.getComponent(Charge);
        const movement = ship.getComponent(Movement);
        const deployable = ship.getComponent(Deployable);
        const items = ship.getComponents(Item);

        this.move_btn.disabled =
            movement == null ||
            charge!.current_charge < movement!.move_cost.value();
        this.deploy_btn.disabled = deployable == null;

        for (let i = 0; i < this.item_btns.length; ++i) {
            let btn = this.item_btns[i];
            btn.disabled =
                items.length <= i || items[i].cooldown_remaining > 0 ||
                items[i].cost > charge!.current_charge;
        }
    }
}

export class TargetingState extends UIState {
    private button_text: string;
    private button: HTMLButtonElement;
    private targets: Vec2[];
    private targetFn: (target: Vec2) => void;

    constructor(friendly: PlayerID, state: GlobalState, uigrid: HexGrid<Hex>,
                callbacks: UICallbacks, button: HTMLButtonElement,
                targets: Vec2[], targetFn: (target: Vec2) => void) {
        super(friendly, state, uigrid, callbacks);

        this.button = button;
        this.button_text = button.innerHTML;
        this.targets = targets;
        this.targetFn = targetFn;
    }
    /**
     * Setup move button to cancel
     */
    enter(): void {
        this.button.disabled = false;
        this.button.innerHTML = "Cancel";

        this.button.onclick = (e) => {
            this.callbacks.transition(new InfoState(this.friendly, this.state,
                                                    this.uigrid, this.callbacks));
        }

        this.turn_btn.onclick = (e) => {
            this.callbacks.endTurn();
        }

        /* Highlight valid target */
        for (const target of this.targets) {
            this.uigrid.at(target)!.setRenderStyle("target");
        }
    }

    exit(): void {
        this.button.innerHTML = this.button_text;

        /* Clear highlighting */
        for (let target of this.targets) {
            this.uigrid.at(target)!.setRenderStyle("normal");
        }
    }
    /**
     * Handle a hex being clicked. Either produces an action and transitions to
     * info state or stays in targeting state
     * @param  {Vec2}           hex     Hex clicked
     */
    hexClicked(hex: Vec2): void {
        for (let target of this.targets) {
            if (target.equals(hex)) {
                this.targetFn(target);
                this.callbacks.transition(
                    new InfoState(this.friendly, this.state, this.uigrid,
                                  this.callbacks));
                return;
            }
        }

        LOG.DEBUG("Invalid target");
    }

    update(state: GlobalState): void {
        super.update(state);

        if (this.state.current_player != this.friendly) {
            this.callbacks.transition(
                new OpponentState(this.friendly, this.state, this.uigrid,
                                  this.callbacks));
        }
    }
}
