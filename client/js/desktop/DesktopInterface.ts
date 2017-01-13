/**
 * @file client/js/DesktopInterface.js
 */

import { Hex } from "./Hex"
import { UIState, InfoState } from "./UIState"
import { Canvas } from "../Canvas"
import { UserInterface } from "../UserInterface"
import { TURN_TIMEOUT } from "../../../game/Game"
import { GlobalState } from "../../../game/GlobalState"
import { Action, ActionType } from "../../../game/Action"
import { Vec2 } from "../../../game/Math"
import { HexGrid, hexRound } from "../../../game/HexGrid"
import { PlayerID, ActionCB, EndTurnCB } from "../../../game/Player"
import { Entity, EntityID } from "../../../game/Entity"
import { ASSERT } from "../../../game/util"

/* Components for displaying stats */
import { Health } from "../../../game/components/Health"
import { Charge } from "../../../game/components/Charge"
import { Pilot } from "../../../game/components/Pilot"
import { Item } from "../../../game/components/Item"
import { Deployable } from "../../../game/components/Deployable"
import { Movement, Position } from "../../../game/components/Positioning"
import { ShipInfo } from "../../../game/components/ShipInfo"


let last_hanger_render = 0;

function setText(id: string, text: string) {
    document.getElementById(id)!.innerHTML = text;
}

function showInfo(entity: Entity) {
    const health = entity.getComponent(Health);
    const charge = entity.getComponent(Charge);
    const movement = entity.getComponent(Movement);
    const deployable = entity.getComponent(Deployable)
    const items = entity.getComponents(Item);
    const pilot = entity.getComponent(Pilot);

    if (health != null) {
        setText("health", health.current_health.toString() + "/" + health.max_health.toString());
    } else {
        setText("health", "N/A");
    }

    if (charge != null) {
        setText("charge", charge.current_charge.toString() + "/" + charge.max_charge.toString());
        setText("recharge", charge.recharge.value().toString());
    } else {
        setText("charge", "N/A");
        setText("recharge", "N/A");
    }

    if (movement != null) {
        setText("move_cost", movement.move_cost.value().toString());
    } else if (deployable != null){
        setText("move_cost", deployable.deploy_cost.value().toString());
    } else {
        setText("move_cost", "N/A");
    }

    if (pilot != null) {
        setText("pilot-name", pilot.name);
        setText("accuracy", pilot.accuracy.value().toString());
        setText("precision", pilot.precision.value().toString());
        setText("evasion", pilot.evasion.value().toString());
    } else {
        setText("pilot-name", "N/A");
        setText("accuracy", "N/A");
        setText("precision", "N/A");
        setText("evasion", "N/A");
    }

    displayItems(items);
}

function displayItems(items: Item[]) {
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
        } else {
            name = items[i].name;
            desc = items[i].description;

            if (items[i].cooldown_remaining > 0) {
                btn = items[i].cooldown_remaining.toString();
            } else {
                btn = `Use (${items[i].cost})`;
            }

            const elem = document.getElementById(string)!;
            elem.setAttribute("item-id", items[i].id.toString());
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
     * @type {GlobalState}
     */
    private state: GlobalState;
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
     * Currently selected entity
     */
    private selected: Entity | null;

    constructor(friendly: PlayerID, globalState: GlobalState,
                actionFn: ActionCB, endTurnFn: EndTurnCB) {
        super();

        this.friendly = friendly;
        this.canvas = new Canvas(document.getElementById("canvas_wrapper")!, 1920, 1080);
        this.selected = null;

        /* Track cursor position */
        this.mouse = new Vec2(0, 0);

        window.onmousemove = (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        }

        /* Set initial state */
        this.state = globalState;

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
        const callbacks = {
             reportAction: actionFn,
             endTurn: endTurnFn,
             setSelected: this.setSelected.bind(this),
             transition: this.transition.bind(this),
             getSelected: this.getSelected.bind(this),
        };

        this.uiState = new InfoState(this.friendly, this.state,
                                     this.uigrid, callbacks);
        this.uiState.enter();
     }
     /**
      * @see UserInterface
      */
     update(state: GlobalState): void {
        this.state = state;
        this.uiState.update(this.state);
     }
     /**
      * @see UserInterface
      */
     render(timestamp: number): void {
        /* Update UI */
        this.uiState.render(this.canvas);
        this.setSelected(this.selected);

        for (let [loc, hex] of this.uigrid.cells) {
            hex.render(timestamp, this.canvas);
        }

        /* Clear hanger */
        let rendering_hanger = false;
        let hanger;
        if (last_hanger_render == 0 || timestamp - last_hanger_render > 1000) {
            hanger = document.getElementById("hanger")!;
            rendering_hanger = true;
            last_hanger_render = timestamp;

            while (hanger.hasChildNodes()) hanger.removeChild(hanger.lastChild!);
        }

        /* Render entities */
        for (let entity of Entity.all()) {
            const position = entity.getComponent(Position);
            const info = entity.getComponent(ShipInfo)!;

            if (position == null && rendering_hanger) {
                const li = document.createElement("li");
                li.innerHTML = info.name;
                li.onclick = (e) => {
                    this.uiState.hangerShipClicked(entity.id);
                }
                li.id = entity.id.toString();
                hanger!.appendChild(li);
            } else {
            }
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
        const hex_coord = hexRound(new Vec2(hex_x, hex_y));

        if (this.uigrid.inBounds(hex_coord)) return hex_coord;

        return null;
     }

     private clearSelected(): void {
         if (this.selected == null) return;

         const position = this.selected.getComponent(Position);

         if (position == null) {
            const id = "ship" + this.selected.id.toString();
            let ship = document.getElementById(id);

            if (ship != null) {
                ship.classList.remove("selected");
            }
        } else {
            this.uigrid.at(position.position)!.setRenderStyle("normal");
        }

        this.selected = null;
     }

    private setSelected(entity: Entity | null): void {
        this.clearSelected();

        this.selected = entity;

        if (this.selected == null) return;

        const position = this.selected.getComponent(Position);

        if (position == null) {
            document.getElementById(this.selected.id.toString())!
                    .classList.add("selected");
        } else {
            this.uigrid.at(position.position)!.setRenderStyle("selected");
        }

        showInfo(this.selected);
    }

     private transition(state: UIState): void {
         this.uiState.exit();
         this.uiState = state;
         this.uiState.enter();
     }

     private getSelected(): Entity | null {
         return this.selected;
     }
 }
