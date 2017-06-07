/**
 * @file game/Component.ts
 */
import { LOG, ASSERT } from "./util"
import { Entity } from "./Entity"
import { GameState } from  "./GameState"
import { Map } from "immutable"
/**
 * All possible component types. Used for serialization
 */
export enum ComponentType {
    HEX_POSITION,
    TEAM,
    NAME,
    DEPLOYABLE,
    DEPLOY_ZONE,
    POWER_SOURCE,
    MOVEABLE,
    ITEMS,
    HEALTH,
        PILOT
};

/* Component IDs should be treated as an opaque, unmodifiable type for 90% of
 * use cases. */
export type ComponentID = number;
/**
 * Components are used to make entities interesting. Components provide almost
 * all of the core game functionality from basic movement to unique items.
 * Components are completely independent and should primarily contain data,
 * NOT behavior.
 */
export abstract class Component {
    /**
     * The id of this component
     * @type {ComponentID}
     */
    public readonly id: ComponentID;
    /**
     * The type of this component
     * @type {ComponentType}
     */
    public readonly type: ComponentType;

    constructor(type: ComponentType, id: ComponentID) {
        this.id = id;
        this.type = type;
    }
}
/**
 * Component implementation. The goal was to make the creation of components
 * as boilerplate free as possible--components are just data, after all.
 * However we also want components to be immutable. To create a new component,
 * simply define a type that contains all the necessary properties of your
 * component and then instantiate an instance of this class, passing your type
 * as the template parameter. You may also want to provide a helper function to
 * automatically set the ComponentType and provide default values.
 */
export class ComponentImpl<Data> extends Component {
    /**
     * The data of the component
     * @type {Readonly<Data>}
     */
    public readonly data: Readonly<Data>
    /**
     * Construct a new component
     * 
     * @param {ComponentType} type The type of component
     * @param {ComponentID}   id   The component's id
     * @param {Data}          data The initial data
     */
    constructor(type: ComponentType, id: ComponentID, data: Data) {
        super(type, id);

        this.data = data;
    }
    /**
     * Create a new component that is the same as this one, but with some
     * (potentially partial) updates
     *
     * @param  {Partial<Data>}       updates Updates to make to this component
     * @return {ComponentImpl<Data>}         A new, updated instance
     */
    public with(updates: Partial<Data>): ComponentImpl<Data> {
        let data: Data = this.data;

        for (let p in data) {
            if (updates[p] != undefined) {
                data[p] = updates[p]!;
            }
        }

        return new ComponentImpl<Data>(this.type, this.id, data);
    }
}
