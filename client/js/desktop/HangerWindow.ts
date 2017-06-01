
import { Style, FrameSprite, Label, Resource } from "./UI"
import { GameInputHandler } from "./GameInputHandler"
import { clamp, Vec2 } from "../../../game/Math"
import { LOG } from "../../../game/util"
import { Entity } from "../../../game/Entity"
import { GameState } from "../../../game/GameState"
import { ComponentType } from "../../../game/Component"
import { Team, TeamID } from "../../../game/components/Team"
import { Name } from "../../../game/components/Name"
import { HangerSystem } from "../../../game/systems/HangerSystem"

import { List } from "immutable"
import * as PIXI from "pixi.js"

/* Geometry/layout constants */
const GENERAL = new Vec2(15, 15);
const HANGER_LABEL = new Vec2(10, 10);

const NUM_SHIPS = 5;
const SHIP_HEIGHT = 40;
const SHIP_OFFSET = 40;
const SHIP_WIDTH = 260;

const SHIP_ICON = new Vec2(5, 10);
const SHIP_NAME = new Vec2(40, 10);

export class HangerWindow extends PIXI.Container {
    /* Hanger window state */
    private readonly _input_handler: GameInputHandler;
    private readonly _hanger_system: HangerSystem;
    private readonly _friendly: TeamID;
    private _state: GameState;
    private _top_index: number;
    private _highlighted_index: number;

    /* Containers for various sections */
    private _graphics: PIXI.Graphics = new PIXI.Graphics();
    private _display: FrameSprite;
    private _general: PIXI.Container;
    private _ship_wrappers: PIXI.Container[];

    /* Labels */

    /* Buttons */

    constructor(input_handler: GameInputHandler, hanger_system: HangerSystem,
                state: GameState, friendly: TeamID) {
        super()
        this._input_handler = input_handler;
        this._hanger_system = hanger_system;
        this._friendly = friendly;
        this._state = state;
        this._top_index = 0;
        this._highlighted_index = -1;

        /* Initialize container positions. These stay constant since they're
         * relative to this component */
        this._display = new FrameSprite("hanger_frame.png");
        this._display.interactive = true;

        this._general = new PIXI.Container();
        this._general.x = GENERAL.x;
        this._general.y = GENERAL.y;

        this._ship_wrappers = [];

        for (let i = 0; i < NUM_SHIPS; ++i)
        {
            const ship_wrapper = new PIXI.Container();
            ship_wrapper.x = 0;
            ship_wrapper.y = SHIP_OFFSET + (SHIP_HEIGHT * i);

            this._ship_wrappers.push(ship_wrapper);
            this._general.addChild(ship_wrapper);
        }

        /* Initialize labels with placeholder values */
        const hanger_label =
            new Label(undefined, "Hanger", Style.text.header, HANGER_LABEL);

        this._general.addChild(hanger_label);
        this._general.addChild(this._graphics);

        this.addChild(this._display, this._general);

        /* Publish events */
        this._display.on("click", (e: PIXI.interaction.InteractionEvent) => {
            const me = e.data.originalEvent as MouseEvent;
            const ent = this.entityFromMouseEvent(me);

            if (ent != undefined) {
                this._input_handler.hangerShipClicked(ent, e);
            }
        });
        this._display.on("mousemove", (e: PIXI.interaction.InteractionEvent) => {
            const me = e.data.originalEvent as MouseEvent;
            const ent = this.entityFromMouseEvent(me);

            if (ent != undefined) {
                this._input_handler.hangerShipHovered(ent, e);
            }
        });

        /* Handle events */
        this._input_handler.on("wheel", (e: WheelEvent) => {
            const point = this._input_handler.toCanvasCoords(e.pageX, e.pageY);
            const pixipoint = new PIXI.Point(point.x, point.y);
            if (!this._display.containsPoint(pixipoint)) return;

            if (e.deltaY < -1) {
                this.scrollHangerList(-1);
            } else if (e.deltaY > 1) {
                this.scrollHangerList(1);
            }
        });
        this._input_handler.on("hanger ship hover", (data: { entity: Entity,
            event: MouseEvent }) => {
            this.highlightShip(data.event);
        });
    }

    public setState(state: GameState) {
        this._state = state;
    }
    private entityFromMouseEvent(event: MouseEvent): Entity | undefined {
        const global =
            this._input_handler.toCanvasCoords(event.pageX, event.pageY);
        const slot_index = this.indexUnderPoint(global);

        if (slot_index < 0) return;

        const entities = this.entities();
        const index = slot_index + this._top_index;

        return entities.get(index);
    }
    private indexUnderPoint(global: Vec2): number {
        /* ICKY coordinate conversions, doesn't handle rotation */
        const point = global.sub(new Vec2(this.x, this.y))
                            .sub(new Vec2(this._display.x, this._display.y))
                            .sub(new Vec2(this._general.x, this._general.y));


        if (point.x < 0 || point.x > SHIP_WIDTH) return -1;

        const index = Math.floor((point.y - SHIP_OFFSET) / SHIP_HEIGHT);

        if (index < 0 || index >= NUM_SHIPS) return - 1;

        return index;
    }

    private scrollHangerList(delta: number): void {
        /* Get local coordinates */
        const num_entities = this.entities().size;
        const upper = Math.max(0, num_entities - NUM_SHIPS + 1);

        this._top_index = this._top_index + delta;
        this._top_index = clamp(this._top_index, 0, upper);
    }

    private entities(): List<Entity> {
        const entities = this._hanger_system.entities.filter((ent: Entity) => {
            const team =
                this._state.getComponent<Team>(ent, ComponentType.TEAM);
            const name =
                this._state.getComponent<Name>(ent, ComponentType.NAME);

            if (team == undefined || name == undefined) {
                return false;
            }

            return team.data.team == this._friendly;
        });

        return entities;
    }

    private highlightShip(e: MouseEvent): void {
        const global = this._input_handler.toCanvasCoords(e.pageX, e.pageY);
        const index = this.indexUnderPoint(global);

        if (index == this._highlighted_index) return;

        this._highlighted_index = index;

    }

    public render(): void {
        this._graphics.clear();

        if (this._highlighted_index >= 0) {
            const draw_y = SHIP_OFFSET + (this._highlighted_index * SHIP_HEIGHT);

            this._graphics.beginFill(0xFFFFFF, 0.15);
            this._graphics.drawRect(-1, draw_y, SHIP_WIDTH, SHIP_HEIGHT);
            this._graphics.endFill();
        }

        const entities = this.entities();

        for (let i = 0; i < NUM_SHIPS; ++i) {
            this._ship_wrappers[i].removeChildren();

            const index = this._top_index + i;

            if (index >= entities.size) {
                break;
            }

            const ent = entities.get(index)!;
            const name = this._state.getComponent<Name>(ent, ComponentType.NAME)!;

            const n = (this._top_index + i).toString();
            const ship_name = new Label(undefined, name.data.name,
                Style.text.normal, SHIP_NAME);
            this._ship_wrappers[i].addChild(ship_name);
        }
    }
}
