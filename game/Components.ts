/**
 * @file game/components/Components.ts
 *
 * Holds component definitions
 */
import { Component, Entity, EntityID } from "./Entity"
import { Vec2 } from "./Math"
import { PlayerID } from "./Player"
import { Damage } from "./systems/CombatSystem"
import { Attribute } from "./Attribute"
import { TimeoutFn } from "./systems/TimeoutWatcher"

export class HexPosition extends Component {
    position: Vec2;

    constructor(entity_id: EntityID, position: Vec2) {
        super(entity_id);

        this.position = new Vec2(position.x, position.y);
    }
}

export class Movement extends Component {
    charge_per_tile: Attribute;

    constructor(entity_id: EntityID, charge_per_tile: number) {
        super(entity_id);

        this.charge_per_tile = new Attribute(0, Infinity, charge_per_tile);
    }
}

export class Charge extends Component {
    max_charge: number;
    recharge: Attribute;
    current_charge: number;

    constructor(entity_id: EntityID, max_charge: number, recharge: number) {
        super(entity_id);

        this.max_charge = max_charge;
        this.current_charge = max_charge;
        this.recharge = new Attribute(0, max_charge, recharge);
    }
}

export class Health extends Component {
    max_health: number;
    current_health: number;

    constructor(entity_id: EntityID, max_health: number) {
        super(entity_id);

        this.max_health = max_health;
        this.current_health = max_health;
    }
}

export class Team extends Component {
    team: PlayerID;

    constructor(entity_id: EntityID, team: PlayerID) {
        super(entity_id);

        this.team = team;
    }
}

export class Size extends Component {
    size: number;

    constructor(entity_id: EntityID, size: number) {
        super(entity_id);

        this.size = size;
    }
}

export class Pilot extends Component {
    name: string;
    evasion: Attribute;
    accuracy: Attribute;
    precision: Attribute;

    constructor(entity_id: EntityID, name: string, evasion: number,
                accuracy: number, precision: number) {
        super(entity_id);

        this.name = name;
        this.evasion = new Attribute(0, Infinity, evasion);
        this.accuracy = new Attribute(0, Infinity, accuracy);
        this.precision = new Attribute(0, Infinity, precision);
    }
}

export class DeployZone extends Component {
    targets: Vec2[];
    cost_per_size: number;

    constructor(entity_id: EntityID, targets: Vec2[], cost_per_size: number) {
        super(entity_id);

        this.targets = targets;
        this.cost_per_size = cost_per_size;
    }
}

/** Items */
export class Items extends Component {
    num_slots: number;
    items: (EntityID | null)[];

    constructor(entity_id: EntityID, num_slots: number) {
        super(entity_id);

        this.num_slots = num_slots;
        this.items = new Array(num_slots);

        for (let i = 0; i < this.items.length; ++i) {
            this.items[i] = null;
        }
    }
}


export class ItemInfo extends Component {
    name: string;
    description: string;
    cost: number;
    cooldown: number;
    ship: EntityID;

    constructor(entity_id: EntityID, name: string, description: string,
                cost: number, cooldown: number, ship: EntityID) {
        super(entity_id);

        this.name = name;
        this.description = description;
        this.cost = cost;
        this.cooldown = cooldown;
        this.ship = ship;
    }
}

export type AttributeName =
    "move_cost" | "recharge" | "evasion" | "precision" | "accuracy";

export interface EntityFilter {
    one_of: EntityID[];
    in_range_of_entity: [EntityID, number];
    on_team: PlayerID;
    has_attributes: AttributeName[];
}

export type PartialFilter = { [P in keyof EntityFilter]?: EntityFilter[P] }

export class TargetFilter extends Component {
    filter: PartialFilter;

    constructor(entity_id: EntityID, filter: PartialFilter) {
        super(entity_id);

        this.filter = filter;
    }
}

export class ItemEffect extends Component {
    constructor(entity_id) {
        super(entity_id);
    }

    apply(target: Entity): void {}
}

export class DamageModifier extends Component {
    priority: number;

    constructor(entity_id) {
        super(entity_id);
    }

    apply(damage: Damage): void {}
}

export class Cooldown extends Component {
    duration: number;
    remaining: number;

    constructor(entity_id, duration: number) {
        super(entity_id);

        this.duration = duration;
        this.remaining = duration;
    }
}
