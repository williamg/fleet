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
import { Ship } from "../../../game/Ship"
import { PlayerID, ActionCB } from "../../../game/Player"
import { UIState, InfoState } from "./UIState"

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

    constructor(state: GameState, friendly: PlayerID, action_cb: ActionCB) {
        super(action_cb);

        this.friendly = friendly;
        this.canvas = new Canvas(document.getElementById("canvas_wrapper")!, 1920, 1080);

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
        const hangerul = document.getElementById("hanger")!;
        let [p1hanger, p2hanger] = this.state.hangers;
        let hanger = p1hanger;

        if (friendly == PlayerID.PLAYER_2) hanger = p2hanger;

        for (let ship of hanger) {
            let li = document.createElement("li");
            li.classList.add("hanger-ship");
            li.id = "ship" + ship.id.toString();
            li.innerHTML = ship.name;

            hangerul.appendChild(li);
        }

        this.uiState = new InfoState(this.friendly, this.state, action_cb,
                                     this.uigrid, this.transition.bind(this), null);
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

        /* Populate hanger */
        const hangerul = document.getElementById("hanger")!;

        /* Empty hanger */
        while (hangerul.hasChildNodes()) hangerul.removeChild(hangerul.lastChild!);

        let [p1hanger, p2hanger] = this.state.hangers;
        let hanger = p1hanger;

        if (this.friendly == PlayerID.PLAYER_2) hanger = p2hanger;

        for (let ship of hanger) {
            let li = document.createElement("li");
            li.classList.add("hanger-ship");
            li.id = "ship" + ship.id.toString();
            li.innerHTML = ship.name;
            li.onclick = (e) => {
                this.uiState.hangerShipClicked(ship);
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

        /* First, render the grid */
        const hovered = this.hexUnderMouse();

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

     private transition(state: UIState): void {
         this.uiState.exit();
         this.uiState = state;
         this.uiState.enter();
     }
 }
