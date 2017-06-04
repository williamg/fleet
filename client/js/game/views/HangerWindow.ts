/**
 * @file client/js/game/views/HangerWindow
 * Shows the list of ships in the hanger. Also includes the "end tur" button
 * and timer countdown
 */
import { GameInteractionEvent } from "../GameView"
import { ClientGameSystems } from "../GameScene"

import { Style, FrameSprite, Label, Resource } from "../../UI"
import { UserInterface } from "../../UserInterface"

import { ComponentType } from "../../../../game/Component"
import { Entity } from "../../../../game/Entity"
import { GameState } from "../../../../game/GameState"
import { clamp, Vec2 } from "../../../../game/Math"
import { Observer, LOG } from "../../../../game/util"

import { Team, TeamID } from "../../../../game/components/Team"
import { Name } from "../../../../game/components/Name"

import { List } from "immutable"
import * as PIXI from "pixi.js"

/* Geometry/layout constants */
const SHIP_LIST = new Vec2(15, 15);
const HANGER_LABEL = new Vec2(10, 10);

const NUM_SHIPS = 5;
const SHIP_HEIGHT = 40;
const SHIP_OFFSET = 40;
const SHIP_WIDTH = 260;

const SHIP_ICON = new Vec2(5, 10);
const SHIP_NAME = new Vec2(40, 10);

type ShipInfo = {
    label: Label;
    hovered: boolean;
    active: boolean;
};

export class HangerWindow extends FrameSprite {
    /* Hanger window state */
    /**
     * User interface object
     * @type {UserInterface}
     */
    private readonly _ui: UserInterface;
    /**
     * Observer
     * @type {Observer<GameInteractionEvent>}
     */
    private readonly _observer: Observer<GameInteractionEvent>;
    /**
     * Systems
     * @type {ClientGameSystems}
     */
    private readonly _systems: ClientGameSystems;
    /**
     * ID of team that is considered friendly
     * @type {TeamID}
     */
    private readonly _friendly: TeamID;
    /**
     * Most recent game state
     * @type {GameState}
     */
    private _state: GameState;
    /**
     * Index in the entity list that is currently in the top most position on
     * the ship list
     * @type {number}
     */
    private _top_index: number;
    /**
     * Data currently displayed for the NUM_SHIPS visible
     * @type {ShipInfo[]}
     */
    private _ship_infos: ShipInfo[];
    /**
     * Cached list of entities in our hanger. Updated on every call to setState
     * @type {List<Entity>}
     */
    private _entities: List<Entity>;

    /* Containers for various sections */
    /**
     * Container for the list of ships
     * @type {PIXI.Container}
     */
    private _ship_list: PIXI.Container;
    /**
     * Containers for each individual ship. Graphics to facilitate interactivity
     * and highlighting
     * @type {PIXI.Graphics}
     */
    private _ship_wrappers: PIXI.Graphics[];
    /**
     * Construct a new hanger window
     */
    constructor(ui: UserInterface, observer: Observer<GameInteractionEvent>,
                systems: ClientGameSystems, friendly: TeamID, state: GameState) {
        super("hanger_frame.png");
        this._ui = ui;
        this._observer = observer;
        this._systems = systems;
        this._friendly = friendly;
        this._top_index = 0;

        [this._ship_wrappers, this._ship_infos] = this.initShipSlots();

        this._ship_list = new PIXI.Container();
        this._ship_list.x = SHIP_LIST.x;
        this._ship_list.y = SHIP_LIST.y;

        for (const wrapper of this._ship_wrappers) {
            this._ship_list.addChild(wrapper);
        }

        this.setState(state);

        /* Hanger label */
        const hanger_label =
            new Label(undefined, "Hanger", Style.text.header, HANGER_LABEL);
        this._ship_list.addChild(hanger_label);

        this.addChild(this._ship_list);

        /* Handle events */
        this._ui.app.view.addEventListener("wheel", (e: WheelEvent) => {
            const point = this._ui.toCanvasCoords(e.pageX, e.pageY);
            const pixipoint = new PIXI.Point(point.x, point.y);

            if (!this.containsPoint(pixipoint)) return;

            if (e.deltaY < -1) {
                this.scrollHangerList(-1);
            } else if (e.deltaY > 1) {
                this.scrollHangerList(1);
            }
        });
    }
    /**
     * Update the state of the HangerWindow
     *
     * @param {GameState} state
     */
    public setState(state: GameState) {
        this._state = state;

        /* Recompute entities */
        this._entities = this._systems.hanger.entities.filter((ent: Entity) => {
            const team =
                this._state.getComponent<Team>(ent, ComponentType.TEAM);
            const name =
                this._state.getComponent<Name>(ent, ComponentType.NAME);

            if (team == undefined || name == undefined) {
                return false;
            }

            return team.data.team == this._friendly;
        });

        this.updateLabels();
    }
    /**
     * Scroll the hanger list by a given amount
     *
     * @param {number} Number of entries to scroll by
     */
    private scrollHangerList(delta: number): void {
        /* Get local coordinates */
        const num_entities = this._entities.size;
        const upper = Math.max(0, num_entities - NUM_SHIPS);

        this._top_index = this._top_index + delta;
        this._top_index = clamp(this._top_index, 0, upper);

        this.updateLabels();
    }
    /**
     * Update labels for the current top_index
     */
    private updateLabels(): void {
        for (let i = 0; i < NUM_SHIPS; ++i) {
            const index = this._top_index + i;

            if (index < this._entities.size) {
                const ent = this._entities.get(index)!;
                const name =
                    this._state.getComponent<Name>(ent, ComponentType.NAME)!;

                this._ship_infos[i].active = true;
                this._ship_infos[i].label.label.text = name.data.name;
                this._ship_wrappers[i].buttonMode = true;
            } else {
                this._ship_infos[i].active = false;
                this._ship_infos[i].label.label.text = "";
                this._ship_wrappers[i].buttonMode = false;
            }
        }
    }
    /**
     * Initialize the structures that make up the ship list. Also installs
     * event handlers for hover & click
     * @return {[PIXI.Graphics[], ShipInfo[]]} Containers and info objects
     */
    private initShipSlots(): [PIXI.Graphics[], ShipInfo[]] {
        const wrappers: PIXI.Graphics[] = [];
        const infos: ShipInfo[] = [];

        for (let i = 0; i < NUM_SHIPS; ++i)
        {
            /* Setup geometry */
            const ship_wrapper = new PIXI.Graphics();
            ship_wrapper.x = 0;
            ship_wrapper.y = SHIP_OFFSET + (SHIP_HEIGHT * i);
            ship_wrapper.interactive = true;
            ship_wrapper.hitArea =
                new PIXI.Rectangle(0, 0, SHIP_WIDTH, SHIP_HEIGHT);

            const info: ShipInfo = {
                label: new Label(undefined, "", Style.text.normal, SHIP_NAME),
                hovered: false,
                active: false
            };
            ship_wrapper.addChild(info.label);

            /* Highlight on hover */
            ship_wrapper.on("mouseover", () => {
                if (info.hovered) return;
                if (!info.active) return;

                info.hovered = true;
                ship_wrapper.clear();
                ship_wrapper.beginFill(0xFFFFFF, 0.15);
                ship_wrapper.drawRect(0, 0, SHIP_WIDTH, SHIP_HEIGHT);
                ship_wrapper.endFill();
            });

            /* Clear on unhover */
            ship_wrapper.on("mouseout", () => {
                if (!info.hovered) return;
                if (!info.active) return;

                info.hovered = false;
                ship_wrapper.clear();
            });

            /* Emit on click */
            ship_wrapper.on("click", () => {
                if (!info.active) return;

                const ent = this._entities.get(this._top_index + i)!;
                this._observer.emit("hanger ship click", ent!);
            });


            wrappers.push(ship_wrapper);
            infos.push(info);
        }

        return [wrappers, infos];
    }
}