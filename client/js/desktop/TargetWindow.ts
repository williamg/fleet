
import { Style, FrameSprite, Label, Resource } from "./UI"
import { GameInputHandler } from "./GameInputHandler"
import { Vec2 } from "../../../game/Math"
import { LOG } from "../../../game/util"
import { Entity, EntityID } from "../../../game/Entity"
import { Item } from "../../../game/components/Item"
import { Health } from "../../../game/components/Health"
import { Charge } from "../../../game/components/Charge"
import { ShipInfo } from "../../../game/components/ShipInfo"
import { Pilot } from "../../../game/components/Pilot"
import { Movement } from "../../../game/components/Positioning"
import { Deployable } from "../../../game/components/Deployable"

import * as PIXI from "pixi.js"

/* Geometry/layout constants */
const GENERAL = new Vec2(20, 20);
const TARGET_NAME = new Vec2(0, 0);
const RESOURCE_WIDTH = 220;
const HEALTH = new Vec2(0, 25);
const BATTERY = new Vec2(0, 45);
const RECHARGE = new Vec2(0, 70);
const MOVE_COST = new Vec2(80, 70);

const PILOT = new Vec2(20, 120);
const PILOT_NAME = new Vec2(0, 0);
const ACCURACY = new Vec2(0, 25);
const PRECISION = new Vec2(100, 25);
const EVASION = new Vec2(200, 25);

const LOADOUT = new Vec2(20, 180);
const LOADOUT_LABEL = new Vec2(0, 0);
const ITEM_WRAPPERS = [ new Vec2(0, 19), new Vec2(0, 59), new Vec2(0, 99) ];

const ITEM_ICON = new Vec2(5, 10);
const ITEM_NAME = new Vec2(40, 5);
const ITEM_COST = new Vec2(40, 20);
const ITEM_COOLDOWN = new Vec2(80, 20);

const BUTTON_IN = new Vec2(252, 78);
const BUTTON_OUT = new Vec2(280, 78);
const MOVE_BUTTON = new Vec2(0, 0);
const ITEM_BUTTONS = [ new Vec2(0, 122), new Vec2(0, 162), new Vec2(0, 202) ];

class ItemInfo {
    name: Label;
    cost: Label;
    cooldown: Label;
    icon: PIXI.Sprite;
}

export class TargetWindow extends PIXI.Container {
    /* Target window state */
    private readonly input_handler: GameInputHandler;
    private targeted: Entity;
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
    private battery: Resource;
    private recharge: Label;
    private move_cost: Label;
    private pilot_name: Label;
    private accuracy: Label;
    private precision: Label;
    private evasion: Label;
    private items: ItemInfo[];

    /* Buttons */
    private move_button: FrameSprite;
    private item_buttons: FrameSprite[];

    constructor(input_handler: GameInputHandler, target: Entity) {
        super()

        this.input_handler = input_handler;
        this.targeted = target;
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
        this.health = new Resource("health.png", RESOURCE_WIDTH, 0xFFFFFF, 0.0);
        this.health.x = HEALTH.x;
        this.health.y = HEALTH.y;
        this.health.alpha = 0.2;
        this.battery =
            new Resource("battery.png", RESOURCE_WIDTH, 0xFFFFFF, 0.0);
        this.battery.x = BATTERY.x;
        this.battery.y = BATTERY.y;
        this.battery.alpha = 0.2;
        this.recharge =
            new Label("recharge.png", "--", Style.text.normal, RECHARGE);
        this.move_cost =
            new Label("movement.png", "--", Style.text.normal, MOVE_COST);
        this.general.addChild(this.target, this.recharge,
                              this.move_cost, this.health,
                              this.battery);

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

        for (let i = 0; i < ITEM_WRAPPERS.length; ++i) {
            let item_info = new ItemInfo();
            item_info.name =
                new Label(undefined, "", Style.text.normal, ITEM_NAME);
            item_info.cost =
                new Label("recharge.png", "", Style.text.normal, ITEM_COST);
            item_info.cooldown =
                new Label("cooldown.png", "", Style.text.normal, ITEM_COOLDOWN);
            this.item_wrappers[i].addChild(item_info.name,
                                           item_info.cost,
                                           item_info.cooldown);
            this.item_wrappers[i].alpha = 0;
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

            this.item_buttons.push(item_button);
            this.button_tray.addChild(item_button);
        }
    }
    public setButtonTrayVisible(visible: boolean): void
    {
        this.buttons_visible = visible;

        if (!this.buttons_visible) {
            this.move_button.removeAllListeners("click");

            for(const button of this.item_buttons) {
                button.removeAllListeners("click");
            }

            this.button_tray.x = BUTTON_IN.x;
            this.button_tray.y = BUTTON_IN.y;

            this.move_button.interactive = false;
        } else {
            this.button_tray.x = BUTTON_OUT.x;
            this.button_tray.y = BUTTON_OUT.y;

            this.move_button.interactive = true;
            this.move_button.buttonMode = true;
        }
    }
    /**
     * Update the currently displayed target
     * 
     * @param target Target entity to display
     */
    public setTarget(target: EntityID): void {
        /* Grab the  entity. If the entity exists, display whatever we can,
         * otherwise don't do anything
         */
        const entity = Entity.getEntity(target);

        if (entity == null) {
            LOG.WARN("Attempting to target entity that doesn't exist");
            return;
        }

        if (target != this.targeted.id)
        {
            /* TODO: Uninstall event listeners, reinstall if this is a friendly
             * target
             */
        }

        this.targeted = entity;

        this.displayShipInfo(this.targeted);
        this.displayHealth(this.targeted);
        this.displayBattery(this.targeted);
        this.displayMovement(this.targeted);
        this.displayPilot(this.targeted);

        let i = 0;
        for (const item of this.targeted.getComponents(Item)) {
            this.displayItem(item, i++);
        }
    }
    /**
     * Display ship info
     * TODO: Display class
     *
     * @param entity Entity to display
     */
    private displayShipInfo(entity: Entity): void {
        const ship_info = entity.getComponent(ShipInfo);

        if (ship_info)
        {
            this.target.label.text = ship_info.name;
        }
    }
    /**
     * Display health of entity
     *
     * @param entity Entity to display
     */
    private displayHealth(entity: Entity): void {
        const health = entity.getComponent(Health);

        /* If this entity has a health component, draw the appropriate health
         * bar
         */
        if (health)
        {
            this.health.setColor(Style.colors.green.num);
            this.health.setPercent(health.current_health / health.max_health);
            this.health.alpha = 1.0;
        }
        /* Otherwise, draw a faded out health bar at 0% */
        else
        {
            this.health.setColor(Style.colors.white.num);
            this.health.setPercent(0);
            this.health.alpha = 0.2;
        }
    }
    /**
     * Display battery & charge info of entity
     *
     * @param entity Entity to display
     */
    private displayBattery(entity: Entity): void {
        const charge = entity.getComponent(Charge);

        /* If this entity has a charge component, draw the appropriate charge
         * bar
         */
        if (charge)
        {
            this.battery.setColor(Style.colors.yellow.num);
            this.battery.setPercent(charge.current_charge / charge.max_charge);
            this.recharge.label.text = charge.recharge.value().toString();
            this.battery.alpha = 1.0;
        }
        /* Otherwise, draw a faded out charge bar at 0% */
        else
        {
            this.battery.setColor(Style.colors.white.num);
            this.battery.setPercent(0);
            this.recharge.label.text = "--";
            this.battery.alpha = 0.2;
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
        const movement = entity.getComponent(Movement);
        const deployable = entity.getComponent(Deployable);

        if (movement)
        {
            this.move_cost.label.text = movement.move_cost.value().toString();
            this.move_cost.alpha = 1.0;

            /* If this entity has enough charge to move, display the move button
             * as active
             */
            if (movement.moveable())
            {
                this.move_button.texture =
                    PIXI.Texture.fromFrame("active_move.png");

                if (this.buttons_visible) {
                    this.move_button.on("click", () => {
                        this.input_handler.moveButtonClick(entity)
                    });
                }
            }
        }
        else if (deployable)
        {
            this.move_cost.label.text =
                deployable.deploy_cost.value().toString();
            this.move_cost.alpha = 1.0;

            /* Deploying depends on the charge of the entity supplying the
             * deploy zone. So we show the movement button as active always on
             * deployables even though there might not be anywhere valid for
             * the target to deploy to
             */
            this.move_button.texture =
                PIXI.Texture.fromFrame("active_move.png");

            if (this.buttons_visible) {
                this.move_button.on("click", () => {
                    this.input_handler.moveButtonClick(entity)
                });
            }
        }
        else
        {
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
        const pilot = entity.getComponent(Pilot);

        if (pilot)
        {
            this.pilot_name.label.text = pilot.name;
            this.precision.label.text = pilot.precision.value().toString();
            this.accuracy.label.text = pilot.accuracy.value().toString();
            this.evasion.label.text = pilot.evasion.value().toString();
            this.pilot.alpha = 1.0;
        }
        else
        {
            this.pilot_name.label.text = "Unmanned";
            this.precision.label.text = "--";
            this.accuracy.label.text = "--";
            this.evasion.label.text = "--";
            this.pilot.alpha = 0.2;
        }
    }

    private displayItem(item: Item, index: number): void {
        if (item.usable()) {
            this.item_buttons[index].texture =
                PIXI.Texture.fromFrame("active_item.png");
        } else {
            this.item_buttons[index].texture =
                PIXI.Texture.fromFrame("inactive_item.png");
        }
    }

    /**
     * Display buttons for this entity
     *
     * @param entity Entity to display
     */
    private displayButtons(entity: Entity): void {
        
    }
}