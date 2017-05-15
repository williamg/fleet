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
export class Item extends Component {
    private static _next_id = 0;

    readonly id: ItemID = Item._next_id++;
    readonly name: string;
    readonly description: string;
    readonly charge: Charge | null;
    cooldown: number;
    cooldown_remaining: number;
    cost: number;

    constructor(entity: Entity, name: string, desc: string, cooldown: number,
                cost?: [number, Charge]) {
        super(entity);

        this.name = name;
        this.description = desc;
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
    /* Determine whether or not this item is able to be used */
    usable() {
        if (this.cooldown_remaining > 0) return false;
        if (this.cost > 0 &&
            this.charge!.current_charge < this.cost) return false;

        return true;
    }
    /**
     * Use this item
     * @return {boolean} Whether or not usage was successful
     */
    use(target: EntityID | null): boolean {
        if (!this.usable()) return false;

        const filter = this.targetFilter();

        if (target == null && filter != null) return false;
        if (target != null && filter == null) return false;

        if (filter != null && target != null) {
            const entity = Entity.getEntity(target);

            if (entity == null) return false;
            if (!filter.matches(entity)) return false;
        }

        if (this._use(target)) {
            if (this.cost > 0) {
                this.charge!.increment(-this.cost);
            }

            this.cooldown_remaining = this.cooldown;
            return true;
        }

        return false;
    }
    /**
     * Return a filter for valid targets for this item, if targets are required
     * @return {Filter<EntityID>| null} Valid target filter or null if no target
     *                                  required
     */
    targetFilter(): Filter<Entity> | null { return null; }
    /**
     * Item-specific implementation. Can assume that:
     * - Item is off cooldown
     * - There is sufficient charge
     * - If provided, the target matches the filter's requirements
     * @return {boolean} Whether or not usage was successful
     */
    protected _use(target: EntityID | null): boolean { return false; };
}
