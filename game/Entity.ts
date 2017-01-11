/**
 * Why build a game when we could build an entity-component system instead!?
 */
import { PlayerID } from "./Player"

export type EntityID = number;

export abstract class System {
    abstract processTurnEnd(player: PlayerID): void;
}

export abstract class Component {
    readonly entity_id: EntityID;

    constructor(entity_id: EntityID) {
        this.entity_id = entity_id;
    }
}

export class Entity {
    private static _next_id = 0;
    private static _entities: Map<EntityID, Entity> = new Map<EntityID, Entity>();

    static getEntity(id: EntityID): Entity | null {
        return Entity._entities.get(id) || null;
    }

    static all(): IterableIterator<Entity> {
        return Entity._entities.values();
    }

    readonly id: EntityID = Entity._next_id++;
    private readonly _components: Set<Component> = new Set<Component>();

    constructor() {}

    addComponent<T extends Component>(
        componentType: { new (...args: any[]): T;}, ...args): T {
        const instance = new componentType(args);
        this._components.add(instance);

        return instance;
    }

    getComponent<T extends Component>(
        componentType: { new (...args: any[]): T; }): T | null {
        for (let component of this._components) {
            if (component instanceof componentType) {
                return component;
            }
        }

        return null;
    }

    getComponents<T extends Component>(
        componentType: { new (...args: any[]): T; }): T[] {
        let components: T[] = [];

        for (let component of this._components) {
            if (component instanceof componentType) {
                components.push(component);
            }
        }

        return components;
    }

    removeComponent(component: Component): void {
        this._components.delete(component);
    }
}
