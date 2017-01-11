/**
 * @file game/components/Components.ts
 *
 * Holds component definitions
 */
import { Component, Entity, EntityID } from "./Entity"
import { Vec2 } from "./Math"
import { PlayerID } from "./Player"
import { Damage } from "./Damage"
import { TimeoutFn } from "./systems/TimeoutWatcher"

export class HexPosition extends Component {
    position: Vec2;

    constructor(entity_id: EntityID, position: Vec2) {
        super(entity_id);

        this.position = new Vec2(position.x, position.y);
    }
}

export class Movement extends Component {
    charge_per_tile: number;

    constructor(entity_id: EntityID, charge_per_tile: number) {
        super(entity_id);

        this.charge_per_tile = charge_per_tile;
    }
}

export class Charge extends Component {
    max_charge: number;
    recharge: number;
    current_charge: number;

    constructor(entity_id: EntityID, max_charge: number, recharge: number) {
        super(entity_id);

        this.max_charge = max_charge;
        this.recharge = recharge;
        this.current_charge = max_charge;
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
    evasion: number;
    accuracy: number;
    precision: number;

    constructor(entity_id: EntityID, name: string, evasion: number,
                accuracy: number, precision: number) {
        super(entity_id);

        this.name = name;
        this.evasion = evasion;
        this.accuracy = accuracy;
        this.precision = precision;
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

export type Attribute =
    "move_cost" | "recharge" | "evasion" | "precision" | "accuracy";

export interface EntityFilter {
    one_of: EntityID[];
    in_range_of_entity: [EntityID, number];
    on_team: PlayerID;
    has_attributes: Attribute[];
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
    duration: number;
    apply: (target: Entity) => void;

    constructor(entity_id) {
        super(entity_id);
    }
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
