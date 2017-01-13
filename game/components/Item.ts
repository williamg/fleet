/**
 * @file game/components/Items.ts
 */
import { Component } from "../Component"
import { Charge } from "./Charge"
import { Entity, EntityID } from "../Entity"
import { Filter } from "../Filter"

export type ItemID = number;
/**
 * Items can be equipped to a ship to provide special abilities ranging from
 * weapons to buffs to shields. Items have a (possibly 0) cooldown along with
 * a (possible 0) cost.
 */
export abstract class Item extends Component {
    private static _next_id = 0;

    readonly id: ItemID = Item._next_id++;
    readonly charge: Charge | null;
    cooldown: number;
    cooldown_remaining: number;
    cost: number;

    constructor(entity: Entity, cooldown: number, cost?: [number, Charge]) {
        super(entity);

        this.cooldown = cooldown;
        this.cooldown_remaining = 0;

        /* Allow items to have no cost, in which case they can be equipped to
         * entities without charge.
         */
        if (cost) {
            [this.cost, this.charge] = cost;
            this.charge.addDependent(this);
        } else {
            this.cost = 0;
            this.charge = null;
        }
    }
    /* Update the cooldown, if necessary */
    processTurnEnd() {
        super.processTurnEnd();
        if (this.cooldown_remaining > 0) this.cooldown_remaining--;
    }
    /**
     * Use this item
     * @return {boolean} Whether or not usage was successful
     */
    use(): boolean {
        if (this.cooldown_remaining > 0) return false;
        if (this.cost > 0 &&
            this.charge!.current_charge < this.cost) return false;

        return this._use();
    }
    /**
     * Return a filter for valid targets for this item
     * @return {Filter<EntityID>} Valid target filter
     */
    abstract targetFilter(): Filter<EntityID>;
    /**
     * Item-specific implementation
     * @return {boolean} Whether or not usage was successful
     */
    protected abstract _use(): boolean;
}
