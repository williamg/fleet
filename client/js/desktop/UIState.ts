/**
 * @file client/js/dekstop/UIState.ts
 */
import { Canvas } from "../Canvas"
import { GameState } from "../../../game/Game"
import { Vec2 } from "../../../game/Math"
import { PlayerID } from "../../../game/Player"
import { Move, Deploy, EndTurn, Activate, Action, ActionType } from "../../../game/Action"
import { Ship, ShipInfo } from "../../../game/Ship"
import { ShipItem } from "../../../game/ShipItem"
import { TargetDescription, targetIsOneOf, targetReachable, targetIsDeployable } from "../../../game/Target"
import { Hex } from "./Hex"
import { HexGrid } from "../../../game/HexGrid"
import { GridEntity, EntityID, EntityType } from "../../../game/GridEntity"

export interface UICallbacks {
    report_action: (action: Action) => void;
    set_ship_selected: (ship: Ship) => void;
    set_hanger_selected: (index: number) => void;
    transition: (state: UIState) => void;
    get_selected_ship: () => Ship | null;
    get_selected_hanger_ship: () => number | null;
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
    protected state: GameState;

    constructor(friendly: PlayerID, state: GameState, uigrid: HexGrid<Hex>,
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
    setState(state: GameState): void {
        this.state = state;
    };
    hexClicked(hex: Vec2): void { return; }
    hangerShipClicked(index: number): void { return; }
    render(canvas: Canvas): void { return; }
}

export class OpponentState extends UIState {
    constructor(friendly: PlayerID, state: GameState, uigrid: HexGrid<Hex>,
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

        if (entity == null || entity.type != EntityType.SHIP) return;

        this.callbacks.set_ship_selected(entity as Ship);
    }
    /**
     * Display info for the selected hanger ship
     * @param {number} index Index of the hanger ship
     */
    hangerShipClicked(index: number): void {
        this.callbacks.set_hanger_selected(index);
    }
    /**
     * Transition to the info state when it is no longer the opponent's turn
     */
    setState(state: GameState): void {
        super.setState(state);

        if (this.state.current_player == this.friendly) {
            this.callbacks.transition(
                new InfoState(this.friendly, this.state,
                              this.uigrid, this.callbacks));
        }
    }
}

export class InfoState extends UIState {
    constructor(friendly: PlayerID, state: GameState, uigrid: HexGrid<Hex>,
                callbacks: UICallbacks) {
        super(friendly, state, uigrid, callbacks);
    }
    /**
     * Enable action buttons if a ship is selected
     */
    enter(): void {
        this.move_btn.onclick = (e) => {
            const ship = this.callbacks.get_selected_ship()!;
            const range = Math.floor(ship.charge.current / ship.move_cost.value());
            const desc = new TargetDescription([
                targetReachable(ship.position, range)
            ]);

            function make_move(dest: Vec2) {
                this.callbacks.report_action(new Move(ship.id, dest));
            }

            this.callbacks.transition(new TargetingState(this.friendly, this.state,
                                               this.uigrid, this.callbacks,
                                               this.move_btn, desc, make_move));
        }

        for (let i = 0; i < this.item_btns.length; ++i) {
            let btn = this.item_btns[i];
            btn.onclick = (e) => {
                const ship = this.callbacks.get_selected_ship()!;
                const desc = ship.items[i]!.targetRequired();

                if (desc == null) {
                    /* No target required, perform action */
                    this.callbacks.report_action(new Activate(ship.id, i, null));
                    return;
                }

                function use_item(target: Vec2) {
                    this.callbacks.report_action(new Activate(ship.id, i, target));
                }

                this.callbacks.transition(
                    new TargetingState(this.friendly, this.state, this.uigrid,
                                       this.callbacks, btn, desc, use_item));
            }
        }

        this.turn_btn.onclick = (e) => {
            this.callbacks.report_action(new EndTurn());
        }

        this.deploy_btn.onclick = (e) => {
            const idx = this.callbacks.get_selected_hanger_ship()!;
            const desc = new TargetDescription([
                targetIsDeployable(this.friendly)
            ]);

            function deploy(dest: Vec2) {
                this.callbacks.report_action(new Deploy(idx, dest));
                this.callbacks.set_ship_selected(this.state.grid.at(dest)! as Ship);
            }

            this.callbacks.transition(
                new TargetingState(this.friendly, this.state, this.uigrid,
                                   this.callbacks, this.deploy_btn, desc,
                                   deploy));
        }
    }

    /**
     * When a hex is clicked, display ship info if present and enable actions
     * @param  {Vec2}    hex Hex that was clicked
     */
    hexClicked(hex: Vec2): void {
        const entity = this.state.grid.at(hex);

        if (entity == null || entity.type != EntityType.SHIP) return;

        this.callbacks.set_ship_selected(entity as Ship);
    }
    hangerShipClicked(index: number): void {
        this.callbacks.set_hanger_selected(index);
    }

    /**
     * If we need to select targets, transition to targeting state
     * @param  {GameState}  state Current state
     */
    setState(state: GameState): void {
        super.setState(state);

        if (this.state.current_player != this.friendly) {
            this.callbacks.transition(
                new OpponentState(this.friendly, this.state,
                                  this.uigrid, this.callbacks));
        }
    }

    render(canvas: Canvas): void {
        let actions_enabled = false;
        let ship = this.callbacks.get_selected_ship();

        if (ship != null && ship.player == this.friendly) {
                actions_enabled = true;
        }

        this.move_btn.disabled = !(actions_enabled &&
                                   ship!.charge.current >= ship!.move_cost.value());
        this.deploy_btn.disabled = this.callbacks.get_selected_hanger_ship() == null;

        for (let i = 0; i < this.item_btns.length; ++i) {
            let btn = this.item_btns[i];
            btn.disabled = !(actions_enabled && ship!.items[i] != null &&
                             ship!.charge.current >= ship!.items[i]!.energy_cost &&
                             ship!.items[i]!.cooldown_remaining == 0);
        }
    }
}

export class TargetingState extends UIState {
    private button_text: string;
    private button: HTMLButtonElement;
    private desc: TargetDescription;
    private target_cb: (target: Vec2) => void;

    constructor(friendly: PlayerID, state: GameState, uigrid: HexGrid<Hex>,
                callbacks: UICallbacks, button: HTMLButtonElement,
                desc: TargetDescription, target_cb: (target: Vec2) => void) {
        super(friendly, state, uigrid, callbacks);

        this.button = button;
        this.button_text = button.innerHTML;
        this.desc = desc;
        this.target_cb = target_cb;
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
            this.callbacks.report_action(new EndTurn());
        }

        /* Highlight valid target */
        for (let [loc, ship] of this.state.grid.cells) {
            if (this.desc.matches(loc, this.state))
                this.uigrid.at(loc)!.setRenderStyle("target");
        }
    }

    exit(): void {
        this.button.innerHTML = this.button_text;

        /* Clear highlighting */
        for (let [loc, ship] of this.state.grid.cells) {
            this.uigrid.at(loc)!.setRenderStyle("normal");
        }
    }
    /**
     * Handle a hex being clicked. Either produces an action and transitions to
     * info state or stays in targeting state
     * @param  {Vec2}           hex     Hex clicked
     */
    hexClicked(hex: Vec2): void {
        if (this.desc.matches(hex, this.state)) {
            this.target_cb(hex);
            this.callbacks.transition(
                new InfoState(this.friendly, this.state, this.uigrid,
                              this.callbacks));
        } else {
            console.log("Invalid target");
        }
    }

    setState(state: GameState): void {
        super.setState(state);

        if (this.state.current_player != this.friendly) {
            this.callbacks.transition(
                new OpponentState(this.friendly, this.state, this.uigrid,
                                  this.callbacks));
        }
    }
}
