/**
 * @file client/js/DesktopInterface.js
 */

import { Canvas } from "../Canvas"
import { UserInterface } from "../UserInterface"
import { TURN_TIMEOUT, GameState } from "../../../game/Game"
import { Action, ActionType } from "../../../game/Action"
import { Vec2 } from "../../../game/Math"
import { HexGrid, hexRound } from "../../../game/HexGrid"
import { Hex } from "./Hex"
import { PlayerID, ActionCB } from "../../../game/Player"
import { UIState, InfoState } from "./UIState"
import { Entity, EntityID } from "../../../game/Entity"
import { HexPosition, Health, Charge, Movement, Pilot, ItemInfo, Cooldown, Items } from "../../../game/Components"

function setText(id: string, text: string) {
    document.getElementById(id)!.innerHTML = text;
}

function showInfo(entity: Entity) {
    const health = entity.getComponent(Health);
    const charge = entity.getComponent(Charge);
    const movement = entity.getComponent(Movement);
    const items = entity.getComponent(Items);
    const pilot = entity.getComponent(Pilot);

    if (health != null) {
        setText("health", health.current_health.toString() + "/" + health.max_health.toString());
    } else {
        setText("health", "N/A");
    }

    if (charge != null) {
        setText("charge", charge.current_charge.toString() + "/" + charge.max_charge.toString());
        setText("recharge", charge.recharge.toString());
    } else {
        setText("charge", "N/A");
        setText("recharge", "N/A");
    }

    if (movement != null) {
        setText("move_cost", movement.charge_per_tile.toString());
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

function displayItems(items: Items | null) {
    let item_ids: (EntityID | null)[];

    if (items == null) {
        item_ids = [];
    } else {
        item_ids = items.items;
    }

    /* Display items */
    for(let i = 1; i <= 3; ++i) {
        const string = "item" + (i - 1).toString();
        let name = "";
        let desc = "";
        let btn = "";

        if (item_ids.length < i) {
            /* Item slot isn't available */
            name = "(Unavailable)";
            desc = "N/A";
            btn = "N/A";
        } else if (item_ids[i-1] == null) {
            /* Item slot isn't used */
            name = "(Empty)";
            desc = "N/A";
            btn = "N/A";
        } else {
            const item = Entity.getEntity(item_ids[i-1]!);
            console.assert(item != null);

            const info = item!.getComponent(ItemInfo);
            console.assert(info != null);

            name = info!.name;
            desc = info!.description;

            const cd = item!.getComponent(Cooldown);

            if (cd != null) {
                btn = cd.remaining.toString();
            } else {
                btn = `Use (${info!.cost})`;
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
     * Currently selected entity
     */
    private selected: Entity | null;

    constructor(state: GameState, friendly: PlayerID, action_cb: ActionCB) {
        super(action_cb);

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
        const callbacks = {
             reportAction: action_cb,
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
     setState(state: GameState): void {
        this.state = state;
        this.uiState.setState(this.state);
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

        /* Render entities */
        for (let entity of Entity.all()) {
            const position = entity.getComponent(HexPosition);

            /* Skip hanger ships for now */
            if (position == null) continue;

            this.uigrid.at(position.position)!.renderEntity(entity, this.canvas);
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

         const position = this.selected.getComponent(HexPosition);

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

        const position = this.selected.getComponent(HexPosition);

        if (position == null) {
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
