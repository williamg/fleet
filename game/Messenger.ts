/**
 * @file game/Messeger.ts
 */
import { GameStateChanger } from "./GameState"
import { Entity } from "./Entity"
import { LOG } from "./util"

import { Map, Set } from "immutable"

export type Handler<Const, Arg> =
    (msg: Readonly<Const>, arg: Readonly<Arg>, state: GameStateChanger) =>
    [Readonly<Arg>, boolean];
export type Priority = number;
/**
 * TODO: Ideally, would want a different type for each messenger instance
 */
export type SubscriberID = number;
type HandlerInfo<Const, Arg> = [Priority, Handler<Const, Arg>];

export class Messenger<Const, Arg> {
    private _next_id: SubscriberID;
    private _subscribers: Map<SubscriberID, HandlerInfo<Const, Arg>>;
    private _executing: Set<Entity>;

    constructor() {
        this._next_id = 0;
        this._subscribers = Map<SubscriberID, HandlerInfo<Const, Arg>>();
        this._executing = Set<Entity>();
    }
    /**
     * Subscribe to all messages published on this messenger.
     *
     * @param  {Handler<Const, Arg>}   handler  Handler
     * @param  {number}                priority Priority
     * @return {SubscriberID}                   Subscriber ID
     */
    subscribe(handler: Handler<Const, Arg>, priority: number): SubscriberID {
        const id = this._next_id++;

        this._subscribers = this._subscribers.set(id, [priority, handler]);

        return id;
    }
    /**
     * Unsubscribe from this messenger
     * @param {SubscriberID} id ID of subscriber to remove
     */
    unsubscribe(id: SubscriberID): void {
        this._subscribers = this._subscribers.delete(id);
    }
    /**
     * Publish a message on this messenger.
     *
     * @param  {Readonly<Const>}  message Message object
     * @param  {Readonly<Arg>}    arg     Argument
     * @param  {Entity}           entity  Generating entity, used to prevent
     *                                    infinite circular publish chains
     * @param  {GameStateChanger} changer Game state changer
     * @return {Readonly<Arg>}            Resulting argument
     */
    publish(message: Readonly<Const>, arg: Readonly<Arg>, entity: Entity,
            state: GameStateChanger): Readonly<Arg> {
        /* We can't publish on this messenger if we're already publishing on
         * this messenger with the same entity
         */
        if (this._executing.contains(entity)) {
            LOG.INFO("Circular publish chain!");
            return arg;
        }

        this._executing = this._executing.add(entity);

        const handler_pairs = [...this._subscribers.values()];

        /* Sort array such that higher-priority handlers execute first */
        handler_pairs.sort(function([a, ah], [b, bh]) {
            return b - a;
        });

        for (const [_, handler] of handler_pairs) {
            let [new_arg, propagate] = handler(message, arg, state);
            arg = new_arg;

            if (!propagate) break;
        }

        this._executing = this._executing.remove(entity);
        return arg;
    }
}
