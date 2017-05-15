/**
 * @file game/components/Position.ts
 */
import { Attribute } from "../Attribute"
import { Charge } from "./Charge"
import { Component } from "../Component"
import { Entity } from "../Entity"
import { Filter } from "../Filter"
import { GlobalState } from "../GlobalState"
import { Vec2, hexDist } from "../Math"
import { ASSERT, LOG } from "../util"
import { Reachable } from "../filters/Reachable"

export class Position extends Component {
    /**
     * Position represented by this component
     * @type {Vec2}
     */
    private _position: Vec2;

    get position(): Vec2 { return this._position; }

    constructor(entity: Entity, position: Vec2) {
        super(entity);

        this._position = position;

        const state = entity.global_state;
        state.grid.set(position, this.entity.id);
        state.messenger.publish(state);
    }

    setPosition(position: Vec2) {
        const state = this.entity.global_state;

        state.grid.set(this.position, null);
        this._position.x = position.x;
        this._position.y = position.y;
        state.grid.set(this.position, this.entity.id);
        state.messenger.publish(state);
    }
}

export class Movement extends Component {
    /**
     * Position component for the entity
     * @type {Position}
     */
    private _position_comp: Position;
    /**
     * Charge component for the entity
     * @type {Charge}
     */
    private _charge_comp: Charge;
    /**
     * Amount of charge per tile moved
     * @type {Attribute}
     */
    move_cost: Attribute;

    constructor(entity: Entity, position_comp: Position, charge_comp: Charge,
                move_cost: number) {
        super(entity);

        ASSERT(position_comp.entity === entity);
        ASSERT(charge_comp.entity === entity);

        /* Add dependencies */
        position_comp.addDependent(this);
        charge_comp.addDependent(this);

        this._position_comp = position_comp;
        this._charge_comp = charge_comp;
        this.move_cost = new Attribute(0, Infinity, move_cost);
    }
    moveable(): boolean {
        return this._charge_comp.current_charge >= this.move_cost.value();
    }
    /**
     * Filter for determining valid destinations. The filter checks:
     * - That the destination isn't occupied
     * - That this ship has enough charge
     * @return {Filter<Vec2>} Destination filter
     */
    destinationFilter(): Filter<Vec2> {
        const charge = this._charge_comp.current_charge;
        const max_dist = Math.floor(charge / this.move_cost.value());
        return new Reachable(this.entity.global_state,
                             this._position_comp.position, max_dist);
    }
    /**
     * Attempt to move this entity ot a new location
     * @param  {Vec2}    dest Desired destination
     * @return {boolean}      Whether or not the move occurred
     */
    moveTo(dest: Vec2): boolean {
        const start_pos = this._position_comp.position;
        const filter = this.destinationFilter();

        /* Filter verifies this is a valid move we can perform */
        if (!filter.matches(dest)) return false;

        const state = this.entity.global_state;
        const dist = hexDist(this._position_comp.position, dest);
        const cost = dist * this.move_cost.value();

        this._charge_comp.increment(-cost);
        this._position_comp.setPosition(dest);

        return true;
    }
}
