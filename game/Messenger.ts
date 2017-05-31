/**
 * @file game/Messeger.ts
 */
import { GameStateChanger } from "./GameState"

export type Handler<M> = (msg: M, state: GameStateChanger) => boolean;
export type Priority = number;
/**
 * TODO: Ideally, would want a different type for each messenger instance
 */
export type SubscriberID = number;

export class Messenger<T> {
    private _next_id: SubscriberID;
    private _subscribers: Map<SubscriberID, [Priority, Handler<T>]>;

    constructor() {
        this._next_id = 0;
        this._subscribers = new Map<SubscriberID, [Priority, Handler<T>]>();
    }

    /**
     * Subscribe to all messages published on this messenger.
     *
     * @param  handler     {Handler<M>}     Function to call when a message is
     *                                      received. The handler returns a
     *                                      boolean value indicating whether or
     *                                      not the message should be propagated.
     *                                      This allows high-priority handlers
     *                                      to *cancel* events before they reach
     *                                      lower priority handlers.
     * @param  priority    {number}         Handlers are executed in order, from
     *                                      highest priority to lowest
     * @return             {SubscriberID}   ID that can be used to unregister
     *                                      this subscriber.
     */
    subscribe(handler: Handler<T>, priority: number): SubscriberID {
        const id = this._next_id++;

        this._subscribers.set(id, [priority, handler]);

        return id;
    }
    /**
     * Unsubscribe from this messenger
     * @param {SubscriberID} id ID of subscriber to remove
     */
    unsubscribe(id: SubscriberID): void {
        this._subscribers.delete(id);
    }
    /**
     * Publish a message on this messenger.
     *
     * Note that the value passed in is an OBJECT. So a MUTABLE reference is
     * passed to each handler. This allows handler to MODIFY the message passed to
     * to lower priority handlers. This is by design, but something to be
     * aware of.
     *
     * @param   {M}                 message Message object
     * @param   {GameStateChanger}  state   Game state
     * @returns {boolean}                   Whether or not the event was
     *                                      propagated
     */
    publish(message: T, state: GameStateChanger): boolean {
        const handler_pairs = [...this._subscribers.values()];

        /* Sort array such that higher-priority handlers execute first */
        handler_pairs.sort(function([a, ah], [b, bh]) {
            return b - a;
        });

        for (const [_, handler] of handler_pairs) {
            if (!handler(message, state)) return false;
        }

        return true;
    }
}

/**
 * Class containing named references to all event messengers. Provides
 * inter-system communication
 */
import { Entity } from "./Entity"
import { Vec2 } from "./Math"

export type BeforeMove = {
    entity: Entity,
    to: Vec2
};

export type AfterMove = {
    entity: Entity
    from: Vec2
};

export type BeforeDeploy = {
    deploying: Entity,
    dest: Entity,
    index: number
};

export type AfterDeploy = {
    deploying: Entity,
    dest: Entity,
    index: number
};

export class Messengers {
    public readonly beforeMove: Messenger<BeforeMove> =
        new Messenger<BeforeMove>();
    public readonly afterMove: Messenger<AfterMove> =
        new Messenger<AfterMove>();
    public readonly beforeDeploy: Messenger<BeforeDeploy> =
        new Messenger<BeforeDeploy>();
    public readonly afterDeploy: Messenger<AfterDeploy> =
        new Messenger<AfterDeploy>();

    constructor() {
    }
}
