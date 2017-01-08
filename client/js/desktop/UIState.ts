/**
 * @file client/js/dekstop/UIState.ts
 */
import { Canvas } from "../Canvas"
import { GameState } from "../../../game/Game"
import { Vec2 } from "../../../game/Math"
import { PlayerID } from "../../../game/Player"
import { Action, ActionType } from "../../../game/Action"
import { Ship  } from "../../../game/Ship"
import { TargetDescription, targetIsOneOf, targetReachable } from "../../../game/Target"
import { Hex } from "./Hex"
import { HexGrid } from "../../../game/HexGrid"

type ActionCB = (action: Action) => void;

 function showInfo(ship: Ship) {
     function setText(id: string, text: string) {
         document.getElementById(id)!.innerHTML = text;
     }

     setText("ship-name", ship.name);
     setText(
         "energy",
         ship.charge.current.toString() + "/" + ship.charge.max.toString());
    setText(
        "health",
        ship.health.current.toString() + "/" + ship.health.max.toString());
    setText("recharge", ship.recharge.value().toString());
    setText("move_cost", ship.move_cost.value().toString());
    setText("pilot-name", ship.pilot_name);
    setText("accuracy", ship.accuracy.value().toString());
    setText("evasion", ship.evasion.value().toString());
    setText("precision", ship.precision.value().toString());

    /* Display items */
    for(let i = 1; i <= 3; ++i) {
        const string = "item" + (i - 1).toString();
        let name = "";
        let desc = "";
        let btn = "";

        if (ship.class.num_slots < i) {
            /* Item slot isn't available */
            name = "(Unavailable)";
            desc = "N/A";
            btn = "N/A";
        } else if (ship.items[i-1] == null) {
            /* Item slot isn't used */
            name = "(Empty)";
            desc = "N/A";
            btn = "N/A";
        } else {
            name = ship.items[i-1]!.name;
            desc = ship.items[i-1]!.description;

            if (ship.items[i-1]!.cooldown_remaining > 0) {
                btn = ship.items[i-1]!.cooldown_remaining.toString();
            } else {
                btn = `Use (${ship.items[i-1]!.energy_cost})`;
            }
        }

        setText(string + "-name", name);
        setText(string + "-description", desc);
        setText(string, btn);
    }
 }

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
    protected readonly report_action: ActionCB;
    protected readonly transition: TransitionFn;
    protected uigrid: HexGrid<Hex>;
    protected state: GameState;

    constructor(friendly: PlayerID, state: GameState, report_action: ActionCB,
                uigrid: HexGrid<Hex>, transition: TransitionFn) {
        this.friendly = friendly;
        this.state = state;
        this.report_action = report_action;
        this.uigrid = uigrid;
        this.transition = transition;
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
    hangerShipClicked(ship: Ship): void { return; }
    render(canvas: Canvas): void { return; }
}

export class OpponentState extends UIState {
    private selected: Ship | null;

    constructor(friendly: PlayerID, state: GameState, report_action: ActionCB,
                uigrid: HexGrid<Hex>, transition: TransitionFn,
                selected: Ship | null) {
        super(friendly, state, report_action, uigrid, transition);

        this.selected = selected;
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
        const ship = this.state.grid.at(hex);

        if (ship == null) return;

        this.setSelected(ship);
    }
    hangerShipClicked(ship: Ship): void {
        this.setSelected(ship);
    }

    /**
     * Transition to the info state when it is no longer the opponent's turn
     */
    setState(state: GameState): void {
        super.setState(state);

        if (this.selected != null) {
            showInfo(this.selected);
        }

        if (this.state.current_player == this.friendly) {
            this.transition(new InfoState(this.friendly, this.state,
                                          this.report_action, this.uigrid,
                                          this.transition, this.selected));
        }
    }

    private setSelected(ship: Ship) {
        if (this.selected != null) {
            if (this.selected.position != null) {
                this.uigrid.at(this.selected.position)!.setRenderStyle("normal");
            } else {
                document.getElementById("ship" + this.selected.id.toString())!
                        .classList.remove("selected");
            }
        }

        showInfo(ship!);
        this.selected = ship;

        if (this.selected.position != null) {
            this.uigrid.at(this.selected.position)!.setRenderStyle("selected");
        } else {
            document.getElementById("ship" + this.selected.id.toString())!
                    .classList.add("selected");
        }
    }
}

export class InfoState extends UIState {
    private selected: Ship | null;
    constructor(friendly: PlayerID, state: GameState, report_action: ActionCB,
                uigrid: HexGrid<Hex>, transition: TransitionFn,
                selected: Ship | null) {
        super(friendly, state, report_action, uigrid, transition);

        this.selected = selected;
    }

    /**
     * Enable action buttons if a ship is selected
     */
    enter(): void {
        this.move_btn.onclick = (e) => {
            const ship = this.selected!;
            const range = Math.floor(ship.charge.current / ship.move_cost.value());
            const paction = {
                type: ActionType.MOVE,
                source: ship.id,
                slot: null,
                desc: new TargetDescription([
                    targetReachable(range)
                ])
            };

            this.transition(new TargetingState(this.friendly, this.state,
                                               this.report_action, this.uigrid,
                                               this.transition, this.move_btn,
                                               paction));
        }

        for (let i = 0; i < this.item_btns.length; ++i) {
            let btn = this.item_btns[i];
            btn.onclick = (e) => {
                const ship = this.selected!;
                const desc = ship.items[i]!.targetRequired();

                if (desc == null) {
                    /* No target required, perform action */
                    this.report_action(
                        new Action(ActionType.ACTIVATE, ship.id, i, null));
                } else {
                    const paction = {
                        type: ActionType.ACTIVATE,
                        source: ship.id,
                        slot: 0,
                        desc: desc!
                    };

                    this.transition(new TargetingState(this.friendly, this.state,
                                                       this.report_action, this.uigrid,
                                                       this.transition, btn,
                                                       paction));
                }
            }
        }

        this.turn_btn.onclick = (e) => {
            const action = new Action(ActionType.END_TURN, null, null, null);
            this.report_action(action);
        }

        this.deploy_btn.onclick = (e) => {
            let deploy_targets = Ship.P1_DEPLOY_TARGETS;

            if (this.friendly == PlayerID.PLAYER_2)
                deploy_targets = Ship.P2_DEPLOY_TARGETS;

            const paction = {
                type: ActionType.DEPLOY,
                source: this.selected!.id,
                slot: 0,
                desc: new TargetDescription([
                    targetIsOneOf(deploy_targets)
                ])
            };

            this.transition(new TargetingState(this.friendly, this.state,
                                               this.report_action, this.uigrid,
                                               this.transition, this.deploy_btn,
                                               paction));
        }
    }

    /**
     * When a hex is clicked, display ship info if present and enable actions
     * @param  {Vec2}    hex Hex that was clicked
     */
    hexClicked(hex: Vec2): void {
        const ship = this.state.grid.at(hex);

        if (ship == null) return;

        this.setSelected(ship);
    }
    hangerShipClicked(ship: Ship): void {
        this.setSelected(ship);
    }

    /**
     * If we need to select targets, transition to targeting state
     * @param  {GameState}  state Current state
     */
    setState(state: GameState): void {
        super.setState(state);

        if (this.selected != null) {
            showInfo(this.selected);
        }

        if (this.state.current_player != this.friendly) {
            this.transition(new OpponentState(this.friendly, this.state,
                                              this.report_action, this.uigrid,
                                              this.transition, this.selected));
        }
    }

    render(canvas: Canvas): void {
        let actions_enabled = false;
        let ship = this.selected;

        if (ship != null && ship.player == this.friendly) {
                actions_enabled = ship.position != null;
        }

        this.move_btn.disabled = !(actions_enabled &&
                                   ship!.charge.current >= ship!.move_cost.value())

        for (let i = 0; i < this.item_btns.length; ++i) {
            let btn = this.item_btns[i];
            btn.disabled = !(actions_enabled && ship!.items[i] != null &&
                             ship!.charge.current >= ship!.items[i]!.energy_cost &&
                             ship!.items[i]!.cooldown_remaining == 0);
        }
    }

    private setSelected(ship: Ship) {
        if (this.selected != null) {
            if (this.selected.position != null) {
                this.uigrid.at(this.selected.position)!.setRenderStyle("normal");
            } else {
                document.getElementById("ship" + this.selected.id.toString())!
                        .classList.remove("selected");
            }
        }

        showInfo(ship!);
        this.selected = ship;

        if (this.selected.position != null) {
            this.uigrid.at(this.selected.position)!.setRenderStyle("selected");
            this.deploy_btn.disabled = true;
        } else {
            document.getElementById("ship" + this.selected.id.toString())!
                    .classList.add("selected");
            this.deploy_btn.disabled = false;
        }
    }
}

interface PartialAction {
    type: ActionType;
    source: number;
    slot: number | null;
    desc: TargetDescription;
};

export class TargetingState extends UIState {
    private button_text: string;
    private button: HTMLButtonElement;
    private paction: PartialAction;

    constructor(friendly: PlayerID, state: GameState, report_action: ActionCB,
                uigrid: HexGrid<Hex>, transition: TransitionFn,
                button: HTMLButtonElement, paction: PartialAction) {
        super(friendly, state, report_action, uigrid, transition);

        this.button = button;
        this.button_text = button.innerHTML;
        this.paction = paction;
    }
    /**
     * Setup move button to cancel
     */
    enter(): void {
        this.button.disabled = false;
        this.button.innerHTML = "Cancel";

        this.button.onclick = (e) => {
            this.transition(new InfoState(this.friendly, this.state,
                                          this.report_action, this.uigrid,
                                          this.transition,
                                          this.state.getShip(this.paction.source)));
        }

        this.turn_btn.onclick = (e) => {
            const action = new Action(ActionType.END_TURN, null, null, null);
            this.report_action(action);
        }

        /* Highlight valid target */
        for (let [loc, ship] of this.state.grid.cells) {
            if (this.paction.desc.matches(this.paction.source, loc, this.state))
                this.uigrid.at(loc)!.setRenderStyle("target");
        }
    }

    exit(): void {
        this.button.innerHTML = this.button_text;

        /* Clear highlighting */
        for (let [loc, ship] of this.state.grid.cells) {
            this.uigrid.at(loc)!.setRenderStyle("normal");
        }

        let ship = this.state.getShip(this.paction.source);
        this.uigrid.at(ship!.position!)!.setRenderStyle("selected");
    }
    /**
     * Handle a hex being clicked. Either produces an action and transitions to
     * info state or stays in targeting state
     * @param  {Vec2}           hex     Hex clicked
     */
    hexClicked(hex: Vec2): void {
        if (this.paction.desc.matches(this.paction.source, hex, this.state)) {
            this.report_action(new Action(this.paction.type,
                                          this.paction.source, this.paction.slot,
                                          hex));
            this.transition(new InfoState(this.friendly, this.state, this.report_action,
                                 this.uigrid, this.transition,
                                 this.state.getShip(this.paction.source)));
        } else {
            console.log("Invalid target");
        }
    }

    setState(state: GameState): void {
        super.setState(state);

        let ship = this.state.getShip(this.paction.source);
        showInfo(ship!);

        if (this.state.current_player != this.friendly) {
            this.transition(new OpponentState(this.friendly, this.state,
                                     this.report_action, this.uigrid, this.transition,
                                     this.state.getShip(this.paction.source)));
        }
    }
}
