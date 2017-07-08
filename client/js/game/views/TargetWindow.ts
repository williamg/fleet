
import { Style, FrameSprite, Label, Resource } from "../../UI"

import { GameInteractionEvent, CancelPos } from "../GameView"

import { Component, ComponentType } from "../../../../game/Component"
import { Entity } from "../../../../game/Entity"
import { GameState } from "../../../../game/GameState"
import { Observer, LOG } from "../../../../game/util"
import { Vec2 } from "../../../../game/Math"
import { SystemRegistry } from "../../../../game/System"

import { Deployable } from "../../../../game/components/Deployable"
import { EffectsInfo } from "../../../../game/components/EffectsInfo"
import { Moveable } from "../../../../game/components/Moveable"
import { PowerSource, PowerType } from "../../../../game/components/PowerSource"
import { TeamID } from "../../../../game/components/Team"
import { Name } from "../../../../game/components/Name"
import { ItemsData, Item, Items } from "../../../../game/components/Items"
import { Health } from "../../../../game/components/Health"
import { Pilot } from "../../../../game/components/Pilot"

import { ItemSystem } from "../../../../game/systems/ItemSystem"

import * as PIXI from "pixi.js"

/* Geometry/layout constants */
const GENERAL = new Vec2(20, 20);
const TARGET_NAME = new Vec2(0, 0);
const RESOURCE_WIDTH = 220;
const HEALTH = new Vec2(0, 25);
const BATTERY = new Vec2(0, 45);
const RECHARGE = new Vec2(0, 70);
const MOVE_COST = new Vec2(90, 70);

const PILOT = new Vec2(20, 120);
const PILOT_NAME = new Vec2(0, 0);
const ACCURACY = new Vec2(0, 25);
const PRECISION = new Vec2(90, 25);
const EVASION = new Vec2(180, 25);

const LOADOUT = new Vec2(20, 180);
const LOADOUT_LABEL = new Vec2(0, 0);
const ITEM_WRAPPERS = [ new Vec2(0, 19), new Vec2(0, 59), new Vec2(0, 99) ];

const ITEM_ICON = new Vec2(5, 10);
const ITEM_NAME = new Vec2(40, 5);
const ITEM_COST = new Vec2(40, 22);
const ITEM_COOLDOWN = new Vec2(100, 22);
const ITEM_CUR_COOLDOWN = new Vec2(225, 10);

const BUTTON_IN = new Vec2(252, 78);
const BUTTON_OUT = new Vec2(280, 78);
const MOVE_BUTTON = new Vec2(0, 0);
const ITEM_BUTTONS = [ new Vec2(0, 122), new Vec2(0, 162), new Vec2(0, 202) ];

class ItemInfo {
    name: Label;
    cost: Label;
    cooldown: Label;
    icon: PIXI.Sprite;
    cooldown_remaining: Label;
}

export class TargetWindow extends PIXI.Container {
    /* Target window state */
    private readonly _observer: Observer<GameInteractionEvent>;
    private readonly _systems: SystemRegistry;
    private readonly _friendly: TeamID;
    private _game_state: GameState;
    private _targeted: Entity | undefined;
    private buttons_visible: boolean;

    /* Containers for various sections */
    private display: FrameSprite;
    private button_tray: FrameSprite;
    private general: PIXI.Container;
    private pilot: PIXI.Container;
    private loadout: PIXI.Container;
    private item_wrappers: PIXI.Container[];

    /* Labels */
    private target: Label;
    private health: Resource;
    private power: Resource;
    private recharge: Label;
    private move_cost: Label;
    private pilot_name: Label;
    private accuracy: Label;
    private precision: Label;
    private evasion: Label;
    private items: ItemInfo[];

    /* Buttons */
    private move_button: FrameSprite;
    private cancel_button: FrameSprite;
    private item_buttons: FrameSprite[];

    constructor(observer: Observer<GameInteractionEvent>,
                systems: SystemRegistry, friendly: TeamID, state: GameState) {
        super()

        this._observer = observer;
        this._systems = systems;
        this._friendly = friendly;
        this._game_state = state;
        this._targeted = undefined;
        this.buttons_visible = false;

        /* Initialize container positions. These stay constant since they're
         * relative to this component */
        this.display = new FrameSprite("target_frame.png");
        this.display.x = 0;
        this.display.y = 0;

        this.button_tray = new FrameSprite("button_frame.png");
        this.button_tray.x = BUTTON_IN.x;
        this.button_tray.y = BUTTON_IN.y;

        this.general = new PIXI.Container();
        this.general.x = GENERAL.x;
        this.general.y = GENERAL.y;

        this.pilot = new PIXI.Container();
        this.pilot.x = PILOT.x;
        this.pilot.y = PILOT.y;

        this.loadout = new PIXI.Container();
        this.loadout.x = LOADOUT.x;
        this.loadout.y = LOADOUT.y;

        this.item_wrappers = [];
        this.items = [];

        for (let i = 0; i < ITEM_WRAPPERS.length; ++i)
        {
            const item_wrapper = new PIXI.Container();
            item_wrapper.x = ITEM_WRAPPERS[i].x;
            item_wrapper.y = ITEM_WRAPPERS[i].y;

            this.item_wrappers.push(item_wrapper);
            this.loadout.addChild(item_wrapper);
        }

        /* Important that the button_tray is added *first* so that it has the
         * lowest z-index (is behind everything else) */
        this.addChild(this.button_tray, this.display, this.general, this.pilot,
                      this.loadout);

        /* Initialize labels with placeholder values */
        this.target =
            new Label(undefined, "--", Style.text.header, TARGET_NAME);
        this.health =
            new Resource("health.png", RESOURCE_WIDTH, 0xFFFFFF, 0, 100);
        this.health.x = HEALTH.x;
        this.health.y = HEALTH.y;
        this.health.alpha = 0.2;
        this.power =
            new Resource("battery.png", RESOURCE_WIDTH, 0xFFFFFF, 0, 100);
        this.power.x = BATTERY.x;
        this.power.y = BATTERY.y;
        this.power.alpha = 0.2;
        this.recharge =
            new Label("recharge.png", "--", Style.text.normal, RECHARGE);
        this.move_cost =
            new Label("movement.png", "--", Style.text.normal, MOVE_COST);
        this.general.addChild(this.target, this.recharge,
                              this.move_cost, this.health,
                              this.power);

        this.pilot_name =
            new Label(undefined, "--", Style.text.header, PILOT_NAME);
        this.accuracy =
            new Label("accuracy.png", "--", Style.text.normal, ACCURACY);
        this.precision =
            new Label("precision.png", "--", Style.text.normal, PRECISION);
        this.evasion =
            new Label("evasion.png", "--", Style.text.normal, EVASION);
        this.pilot.addChild(this.pilot_name, this.accuracy,
                            this.precision, this.evasion);

        const loadout_label =
            new Label(undefined, "Loadout", Style.text.header, LOADOUT_LABEL);
        this.loadout.addChild(loadout_label);

        this.items = [];

        for (let i = 0; i < ITEM_WRAPPERS.length; ++i) {
            let item_info = new ItemInfo();
            item_info.name =
                new Label(undefined, "", Style.text.normal, ITEM_NAME);
            item_info.cost =
                new Label("recharge.png", "", Style.text.normal, ITEM_COST);
            item_info.cooldown =
                new Label("cooldown.png", "", Style.text.normal, ITEM_COOLDOWN);
            item_info.cooldown_remaining =
                new Label(undefined, "", Style.text.large, ITEM_CUR_COOLDOWN);
            this.item_wrappers[i].addChild(item_info.name,
                                           item_info.cost,
                                           item_info.cooldown,
                                           item_info.cooldown_remaining);
            this.item_wrappers[i].alpha = 0;
            this.items.push(item_info);
            this.loadout.addChild(this.item_wrappers[i]);
        }

        /* Setup buttons */
        this.move_button = new FrameSprite("inactive_move.png");
        this.move_button.x = MOVE_BUTTON.x;
        this.move_button.y = MOVE_BUTTON.y;
        this.button_tray.addChild(this.move_button);

        this.item_buttons = [];

        for (let i = 0; i < ITEM_BUTTONS.length; ++i) {
            let item_button = new FrameSprite("inactive_item.png");
            item_button.x = ITEM_BUTTONS[i].x;
            item_button.y = ITEM_BUTTONS[i].y;
            item_button.buttonMode = false;

            this.item_buttons.push(item_button);
            this.button_tray.addChild(item_button);
        }

        /* Cancel button ISN'T shown by default */
        this.cancel_button = new FrameSprite("cancel.png");
    }
    public setState(state: GameState): void {
        this._game_state = state;

        if (this._targeted) {
            this.setTarget(this._targeted);
        }
    }
    /**
     * Update the currently displayed target
     * 
     * @param entity Entity to display
     */
    public setTarget(entity: Entity): void {
        if (entity != this._targeted && this._targeted)
        {
            /* TODO: Uninstall event listeners, reinstall if this is a friendly
             * target
             */
        }

        this._targeted = entity;

        this.displayShipInfo(this._targeted);
        this.displayHealth(this._targeted);
        this.displayPower(this._targeted);
        this.displayMovement(this._targeted);
        this.displayPilot(this._targeted);
        this.displayEffects(this._targeted);

        let i = 0;
        const items = this._game_state.getComponent<Items>(
            entity, ComponentType.ITEMS);

        for (let i = 0; i < this.item_buttons.length; ++i) {
            if (items != undefined && i < items.data.items.length) {
                this.displayItem(this._targeted, items.data.items[i], i);
            } else {
                this.item_buttons[i].interactive = false;
                this.item_buttons[i].buttonMode = false;
                this.item_wrappers[i].alpha = 0;
            }
        }
    }
    public setButtonTrayVisible(visible: boolean): void
    {
        this.buttons_visible = visible;

        if (!this.buttons_visible) {
            this.move_button.removeAllListeners("click");

            this.button_tray.x = BUTTON_IN.x;
            this.button_tray.y = BUTTON_IN.y;

            this.move_button.interactive = false;
            this.cancel_button.interactive = false;
        } else {
            this.button_tray.x = BUTTON_OUT.x;
            this.button_tray.y = BUTTON_OUT.y;

            this.move_button.interactive = true;
            this.move_button.buttonMode = true;
            this.cancel_button.interactive = true;
            this.cancel_button.buttonMode = true;

            this.cancel_button.on("click", () => {
                this._observer.emit("cancel");
            });
        }

        for (const button of this.item_buttons) {
            button.interactive = this.buttons_visible;
            button.buttonMode = this.buttons_visible;
        }

        /* Update button displays */
        if (this._targeted) {
            this.displayMovement(this._targeted);
        }
    }
    public setCancelPos(pos: CancelPos): void {
        switch (pos) {
            case CancelPos.HIDDEN:
                this.button_tray.removeChild(this.cancel_button);
                return;
            case CancelPos.MOVE:
                this.cancel_button.x = MOVE_BUTTON.x;
                this.cancel_button.y = MOVE_BUTTON.y;
                break;
            case CancelPos.ITEM_1:
                this.cancel_button.x = ITEM_BUTTONS[0].x;
                this.cancel_button.y = ITEM_BUTTONS[0].y;
                break;
            case CancelPos.ITEM_2:
                this.cancel_button.x = ITEM_BUTTONS[1].x;
                this.cancel_button.y = ITEM_BUTTONS[1].y;
                break;
            case CancelPos.ITEM_3:
                this.cancel_button.x = ITEM_BUTTONS[2].x;
                this.cancel_button.y = ITEM_BUTTONS[2].y;
                break;
        }

        this.button_tray.addChild(this.cancel_button);
    }
    /**
     * Display ship info
     * TODO: Display class
     *
     * @param entity Entity to display
     */
    private displayShipInfo(entity: Entity): void {
        const ship_name =
            this._game_state.getComponent<Name>(entity, ComponentType.NAME);

        if (ship_name)
        {
            this.target.label.text = ship_name.data.name;
        }
    }
    /**
     * Display health of entity
     *
     * @param entity Entity to display
     */
    private displayHealth(entity: Entity): void {
        const health_comp = this._game_state.getComponent<Health>(
            entity, ComponentType.HEALTH);

        if (health_comp) {
            this.health.setColor(Style.colors.green.num);
            this.health.setValues(health_comp.data.current,
                                  health_comp.data.capacity);
            this.health.alpha = 1.0;
        } else {
            this.health.setColor(Style.colors.white.num);
            this.health.setValues(0, 100);
            this.health.alpha = 0.2;
        }
    }
    /**
     * Display power info of entity
     *
     * @param entity Entity to display
     */
    private displayPower(entity: Entity): void {
        /* If this entity has a charge component, draw the appropriate charge
         * bar
         */
        const power_comp = this._game_state.getComponent<PowerSource>(
            entity, ComponentType.POWER_SOURCE);

        if (power_comp) {
            switch (power_comp.data.type) {
                case PowerType.ANTI_MATTER:
                    this.power.setColor(Style.colors.red.num);
                    break;
                case PowerType.GENESIUM:
                    this.power.setColor(Style.colors.neon_blue.num);
                    break;
                case PowerType.SOLAR:
                    this.power.setColor(Style.colors.yellow.num);
                    break;
            }

            this.power.setValues(power_comp.data.current,
                                 power_comp.data.capacity);
            this.recharge.label.text = power_comp.data.recharge.toString();
            this.power.alpha = 1.0;
        } else {
            this.power.setColor(Style.colors.white.num);
            this.power.setValues(0, 100);
            this.recharge.label.text = "--";
            this.power.alpha = 0.2;
        }
    }
    /**
     * Display the movement/deploy cost for this entity
     *
     * @param entity Entity to display
     */
    private displayMovement(entity: Entity): void {
        /* I can't think of a situation where an entity would have a mocement
         * component AND a deployable component...we're assuming here that we
         * only have one or the other
         */
        const deployable = this._game_state.getComponent<Deployable>(
            entity, ComponentType.DEPLOYABLE);
        const moveable = this._game_state.getComponent<Moveable>(
            entity, ComponentType.MOVEABLE);

        if (deployable) {
            this.move_cost.label.text =
                deployable.data.deploy_cost.toString();
            this.move_cost.alpha = 1.0;

            /* Deploying depends on the charge of the entity supplying the
             * deploy zone. So we show the movement button as active always on
             * deployables even though there might not be anywhere valid for
             * the target to deploy to
             */
            this.move_button.texture =
                PIXI.Texture.fromFrame("active_move.png");

            if (this.buttons_visible) {
                this.move_button.removeAllListeners("click");
                this.move_button.on("click", () => {
                    this._observer.emit("deploy", entity);
                });
            }
        } else if (moveable) {
            this.move_cost.label.text =
                moveable.data.move_cost.toString();
            this.move_cost.alpha = 1.0;

            /* Just check if this entity has enough power to move one tile */
            const power = this._game_state.getComponent<PowerSource>(
                entity, ComponentType.POWER_SOURCE);

            if (power && power.data.current >= moveable.data.move_cost) {
                this.move_button.texture =
                    PIXI.Texture.fromFrame("active_move.png");

                if (this.buttons_visible) {
                    this.move_button.removeAllListeners("click");
                    this.move_button.on("click", () => {
                        this._observer.emit("move", entity);
                    });
                }

            } else {
                this.move_button.texture =
                 PIXI.Texture.fromFrame("inactive_move.png");
                this.move_button.removeAllListeners("click");
            }
        } else {
            this.move_cost.label.text = "";
            this.move_cost.alpha = 0.2;
            this.move_button.texture =
                PIXI.Texture.fromFrame("inactive_move.png");

            this.move_button.removeAllListeners("click");
        }
    }
    /**
     * Display pilot info for this entity
     *
     * @param entity Entity to display
     */
    private displayPilot(entity: Entity): void {
        const pilot_comp = this._game_state.getComponent<Pilot>(
            entity, ComponentType.PILOT);

        if (pilot_comp) {
            const pilot = pilot_comp.data;
            this.pilot_name.label.text = pilot.name;
            this.precision.label.text = pilot.precision.toString();
            this.accuracy.label.text = pilot.accuracy.toString();
            this.evasion.label.text = pilot.evasion.toString();
            this.pilot.alpha = 1.0;
        } else {
            this.pilot_name.label.text = "Unmanned";
            this.precision.label.text = "---";
            this.accuracy.label.text = "---";
            this.evasion.label.text = "---";
            this.pilot.alpha = 0.2;
        }
    }
    /**
     * Display status effect info for this entity
     *
     * @param {Entity} entity to display
     */
    private displayEffects(entity: Entity): void {
        const effect_info_comp = this._game_state.getComponent<EffectsInfo>(
            entity, ComponentType.EFFECTS_INFO);

        if (!effect_info_comp) {
            return;
        }

        for (const info of effect_info_comp.data.effects) {
            console.log(`${info.name}: ${info.status}`);
        }
    }

    private displayItem(entity: Entity, item: Item, index: number): void {
        const item_system = this._systems.lookup(ItemSystem);

        this.item_buttons[index].removeAllListeners("click");
        this.item_buttons[index].addListener("click", () => {
            this._observer.emit("item", {
                entity: entity,
                index: index
            });
        });

        if (item_system.itemUsable(entity, item)) {
            this.item_wrappers[index].alpha = 1;
            this.item_buttons[index].interactive = true;
            this.item_buttons[index].texture =
                PIXI.Texture.fromFrame("active_item.png");

        } else {
            this.item_wrappers[index].alpha = .7;
            this.item_buttons[index].interactive = false;
            this.item_buttons[index].texture =
                PIXI.Texture.fromFrame("inactive_item.png");
        }

        this.items[index].cooldown.label.text = item.cooldown.value.toString();
        this.items[index].cost.label.text = item.cost.toString();
        this.items[index].name.label.text = item.name;

        if (item.cooldown.active && item.cooldown.remaining > 0) {
            this.items[index].cooldown_remaining.label.text =
                item.cooldown.remaining.toString();
        } else {
            this.items[index].cooldown_remaining.label.text = "";
        }
    }
}
