/**
 * @file game/components/Health.ts
 */
 import { Component } from "../Component"
 import { Damage } from "../Damage"
 import { Entity } from "../Entity"
 import { clamp } from "../Math"
 import { SubscriberID } from "../Messenger"
 import { ASSERT, LOG } from "../util"

/**
 * An entity is destroyed when its health reaches 0. Any unit with health is
 * automaticaly destructible/able to receive damage. With the exception of
 * certain items, health does not regenerate.
 */
export class Health extends Component {
    /**
     * Maximum amount of health
     * @type {number}
     */
    max_health: number;
    /**
     * Current health
     * @type {number}
     */
    current_health: number;
    /**
     * ID of damage subscriber
     * @type {SubscriberID}
     */
    private readonly _damage_sub_id: SubscriberID;

    constructor(entity: Entity, max_health: number) {
        super(entity);

        this.max_health = max_health;
        this.current_health = max_health;

        /* Install damage handler at low priority; we want all modifiers to
         * take effect before we apply the damage.
         */
        this._damage_sub_id =
            entity.damageMessenger.subscribe(this._handleDamage.bind(this), 0);
    }

    onRemove() {
        this.entity.damageMessenger.unsubscribe(this._damage_sub_id);
    }

    /**
     * Decrement this enitty's damage by the appropriate amount. If this damage
     * causes the entity's health to be 0, signal the entity destroyed event.
     * @param  {Damage}  damage Damage taken
     * @return {boolean}        Propagate?
     */
    private _handleDamage(damage: Damage): boolean {
        ASSERT(damage.target == this.entity.id);
        LOG.DEBUG("Received %d damage from %d", damage.amount, damage.result);

        this.current_health -= damage.amount;
        this.current_health = clamp(this.current_health, 0, this.max_health);

        if (this.current_health == 0) {
            this.entity.destroyMessenger.publish(damage);
        }

        /* Always propagate */
        return true;
    }

}
