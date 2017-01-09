/**
 * @file client/js/DesktopInterface.js
 */

import { Canvas } from "../Canvas"
import { UserInterface } from "../UserInterface"
import { TURN_TIMEOUT, GameState } from "../../../game/Game"
import { Action, ActionType } from "../../../game/Action"
import { Vec2 } from "../../../game/Math"
import { HexGrid, hex_round } from "../../../game/HexGrid"
import { Hex } from "./Hex"
import { Ship, ShipInfo } from "../../../game/Ship"
import { ShipItem } from "../../../game/ShipItem"
import { PlayerID, ActionCB } from "../../../game/Player"
import { UIState, InfoState } from "./UIState"

function setText(id: string, text: string) {
    document.getElementById(id)!.innerHTML = text;
}

function showInfo(ship: Ship | ShipInfo) {

    let recharge, move_cost, charge, max_charge, health, max_health;

    if (ship instanceof Ship) {
        recharge = ship.recharge.value();
        move_cost = ship.move_cost.value();
        charge = ship.charge.current;
        max_charge = ship.charge.max;
        health = ship.health.current;
        max_health = ship.health.max;
    } else {
        recharge = ship.class.recharge;
        move_cost = ship.class.move_cost;
        charge = ship.class.max_charge;
        max_charge = ship.class.max_charge;
        health = ship.class.max_health;
        max_health = ship.class.max_health;
    }

    setText("ship-name", ship.name);
    setText("energy", charge.toString() + "/" + max_charge.toString());
    setText("health", health.toString() + "/" + max_health.toString());
    setText("recharge", recharge.toString());
    setText("move_cost", move_cost.toString());
    setText("pilot-name", ship.pilot.name);
    setText("accuracy", ship.pilot.accuracy.value().toString());
    setText("evasion", ship.pilot.evasion.value().toString());
    setText("precision", ship.pilot.precision.value().toString());

    displayItems(ship.items);
}

function displayItems(items: ShipItem[]) {
    /* Display items */
    for(let i = 1; i <= 3; ++i) {
        const string = "item" + (i - 1).toString();
        let name = "";
        let desc = "";
        let btn = "";

        if (items.length < i) {
            /* Item slot isn't available */
            name = "(Unavailable)";
            desc = "N/A";
            btn = "N/A";
        } else if (items[i-1] == null) {
            /* Item slot isn't used */
            name = "(Empty)";
            desc = "N/A";
            btn = "N/A";
        } else {
            name = items[i-1]!.name;
            desc = items[i-1]!.description;

            if (items[i-1]!.cooldown_remaining > 0) {
                btn = items[i-1]!.cooldown_remaining.toString();
            } else {
                btn = `Use (${items[i-1]!.energy_cost})`;
            }
        }

        setText(string + "-name", name);
        setText(string + "-description", desc);
        setText(string, btn);
    }
 }


/**
 * Defines a user interface for traditional desktop web browsers.
 */
export class DesktopInterface extends UserInterface {
    /**
     * ID of player considered friendly
     * @type {PlayerID}
     */
    private readonly friendly: PlayerID;
    /**
     * Canvas to render to (this implementation cheats by also using HTML)
     * @type {Canvas}
     */
    private canvas: Canvas;
    /**
     * Current mouse position
     * @type {Vec2}
     */
    private mouse: Vec2;
    /**
     * Current game state
     * @type {GameState}
     */
    private state: GameState;
    /**
     * Grid containing the state of each hex
     * @type {HexGrid<Hex>}
     */
    private uigrid: HexGrid<Hex>;
    /**
     * UI state
     * @type {UIState}
     */
    private uiState: UIState;
    /**
     * Currently selected ship
     */
    private ship_selected: Ship | null;
    /**
     * Currently selected ship info
     */
     private hanger_selected: number | null;


    constructor(state: GameState, friendly: PlayerID, action_cb: ActionCB) {
        super(action_cb);

        this.friendly = friendly;
        this.canvas = new Canvas(document.getElementById("canvas_wrapper")!, 1920, 1080);
        this.ship_selected = null;
        this.hanger_selected = null;

        /* Track cursor position */
        this.mouse = new Vec2(0, 0);

        window.onmousemove = (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        }

        /* Set initial state */
        this.state = state;

        /* Create UI grid */
        this.uigrid = new HexGrid<Hex>((pos) => {
            return new Hex(pos, friendly, this.state);
        });

        /* Install click handler */
        document.getElementsByTagName("canvas")[0].onclick = (e) => {
            const hex_coord = this.hexUnderMouse();

            if (hex_coord == null) return;

            this.uiState.hexClicked(hex_coord);
        }

        /* Populate hanger */
        let [p1hanger, p2hanger] = this.state.hangers;
        let hanger = p1hanger;

        if (friendly == PlayerID.PLAYER_2) hanger = p2hanger;

        this.renderHanger(hanger);

        const callbacks = {
             report_action: action_cb,
             set_ship_selected: this.set_ship_selected.bind(this),
             set_hanger_selected: this.set_hanger_selected.bind(this),
             transition: this.transition.bind(this),
             get_selected_ship: this.get_selected_ship.bind(this),
             get_selected_hanger_ship: this.get_selected_hanger_ship.bind(this)
        };

        this.uiState = new InfoState(this.friendly, this.state,
                                     this.uigrid, callbacks);
        this.uiState.enter();
     }
     /**
      * @see UserInterface
      */
     setState(state: GameState): void {
        this.state = state;
        this.uiState.setState(this.state);

         for (let [loc, hex] of this.uigrid.cells) {
             hex.setState(this.state)
         }

         let [hanger, other] = state.hangers;
         if (this.friendly == PlayerID.PLAYER_2) hanger = other;

         this.renderHanger(hanger);

     }
     /**
      * Render this player's hanger
      * @param {ShipInfo[]} hanger List of ships in the hanger
      */
     renderHanger(hanger: ShipInfo[]): void {
        const hangerul = document.getElementById("hanger")!;

        /* Empty hanger */
        while (hangerul.hasChildNodes()) {
            hangerul.removeChild(hangerul.lastChild!);
        }

        for (let i = 0; i < hanger.length; ++i) {
            let li = document.createElement("li");
            li.classList.add("hanger-ship");
            li.id = "ship" + i.toString();
            li.innerHTML = hanger[i].name;

            if (this.hanger_selected != null && this.hanger_selected == i) {
                li.classList.add("selected");
            }

            li.onclick = (e) => {
                this.uiState.hangerShipClicked(i);
            }

            hangerul.appendChild(li);
        }
     }
     /**
      * @see UserInterface
      */
     render(timestamp: number): void {
        /* Update UI */
        this.uiState.render(this.canvas);

         if (this.ship_selected) this.set_ship_selected(this.ship_selected);
         else if (this.hanger_selected) this.set_hanger_selected(this.hanger_selected);

        for (let [loc, hex] of this.uigrid.cells) {
            hex.render(timestamp, this.canvas);
        }

        const elapsed = Date.now() - this.state.turn_start;
        const remaining = Math.floor((TURN_TIMEOUT - elapsed) / 1000);
        document.getElementById("timer")!.innerHTML = remaining.toString();
     }
     /**
      * @see UserInterface
      */
     protected handleResize(width: number, height: number): void {
        this.canvas.handleResize();
     }

     /**
      * Get the hex under the mouse
      * @return {Vec2}  Coordinates of hex
      */
     private hexUnderMouse(): Vec2 | null {
        let canvas_coord = this.canvas.toCanvasCoords(this.mouse);

        /* Now compute the axial coordinates of the hex */
        const hex_x = canvas_coord.x * (2.0 / 3.0) / Hex.SIZE;
        const hex_y = ((-canvas_coord.x / 3.0) +
                      ((Math.sqrt(3) / 3.0) * canvas_coord.y)) / Hex.SIZE;
        const hex_coord = hex_round(new Vec2(hex_x, hex_y));

        if (this.state.grid.inBounds(hex_coord)) return hex_coord;

        return null;
     }

     private clear_selected(): void {
         if (this.hanger_selected != null) {
            const id = "ship" + this.hanger_selected.toString();
            let ship = document.getElementById(id);

            if (ship != null) {
                ship.classList.remove("selected");
            }
        }

        if (this.ship_selected != null) {
            this.uigrid.at(this.ship_selected.position)!.setRenderStyle("normal");
        }

        this.ship_selected = null;
        this.hanger_selected = null;
     }

    private set_ship_selected(ship: Ship): void {
        this.clear_selected();

        this.ship_selected = ship;
        this.uigrid.at(ship.position)!.setRenderStyle("selected");
        showInfo(ship);
     }

    private set_hanger_selected(index: number): void {
        this.clear_selected();

        this.hanger_selected = index;
        let ship = document.getElementById("ship" + index.toString())!;
        ship.classList.add("selected");
    }

     private transition(state: UIState): void {
         this.uiState.exit();
         this.uiState = state;
         this.uiState.enter();
     }

     private get_selected_ship(): Ship | null {
         return this.ship_selected;
     }

     private get_selected_hanger_ship(): number | null {
         return this.hanger_selected;
     }
 }
