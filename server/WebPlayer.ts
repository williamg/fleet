/**
 * @file server/WebPlayer.ts
 * Performs action on behalf of a player
 */
import { Player } from "./Player"
import { Client } from "./Client"
import { END_TURN_EVENT, ACTION_EVENT, READY_EVENT } from "./Game"
import { Message, MessageType } from "../game/Message"
import { serializeMessage } from "../game/serialization/MessageSerialization"
import { serializeMatchInfo } from "../game/serialization/MatchSerialization"
import { deserializeAction } from "../game/serialization/ActionSerialization"
import { serializeChangeset } from "../game/serialization/ChangeSerialization"
import { MatchInfo } from "../game/MatchInfo"
import { Action } from "../game/Action"
import { GameStateChanger } from "../game/GameState"
import { LOG } from "../game/util"
import { IDPool } from "../game/IDPool"

import { Change, CreateEntity, AttachComponent } from "../game/Changes"

import { Deployable, newDeployable } from "../game/components/Deployable"
import { Name, newName } from "../game/components/Name"
import { Team, TeamID, newTeam, otherTeam } from "../game/components/Team"
import { PowerSource, PowerType, newPowerSource }
    from "../game/components/PowerSource"
import { newItems, Items } from "../game/components/Items"
import { newHealth, Health } from "../game/components/Health"

import { List } from "immutable"

export class WebPlayer extends Player {
    private readonly client: Client;

    constructor(team: TeamID, client: Client) {
        super(client.username, team);

        this.client = client;
    }
    /**
     * TODO: Lookup this client's fleet and init the entities
     *
     * @param {GameStateChanger} state State to modify
     * @param {IDPool}           pool  IDPool
     */
    public initEntities(state: GameStateChanger, pool: IDPool): void {
        /* Create some hanger entities */
        for (let i = 0; i < 13; ++i) {
            const ent = pool.entity();
            state.makeChange(new CreateEntity(ent));

            const name = newName(pool.component(), {
                name: "Friendly " + i.toString()
            });
            const deployable = newDeployable(pool.component(), {
                deploy_cost: 10*i
            });
            const team = newTeam(pool.component(), {
                team: this.team
            });
            const max = 50 + Math.floor(50 * Math.random());
            const power = newPowerSource(pool.component(), {
                type: Math.floor(3 * Math.random()),
                capacity: max,
                current: max,
                recharge: 10 + Math.floor(15 * Math.random()),
            });
            const items = newItems(pool.component(), {
                items: [{
                    name: "Shockwave",
                    description: "Deals light damage to all adjacent enemies",
                    cooldown: {
                        value: 2,
                        active: false,
                        remaining: 0,
                        wait_for: undefined
                    },
                    cost: 15,
                    event: "shockwave",
                    targets: []
                }]
            });
            const max_health = 50 + Math.floor(50 * Math.random());
            const health = newHealth(pool.component(), {
                capacity: max_health,
                current: max_health
            });

            state.makeChange(new AttachComponent(ent, name));
            state.makeChange(new AttachComponent(ent, deployable));
            state.makeChange(new AttachComponent(ent, team));
            state.makeChange(new AttachComponent(ent, power));
            state.makeChange(new AttachComponent(ent, items));
            state.makeChange(new AttachComponent(ent, health));
        }
    }
    /**
     * Notify the client that a match has been found
     *
     * @param {MatchInfo} info Match info
     */
    public matchFound(info: MatchInfo): void {
        const match_msg =
            new Message(MessageType.MATCH_FOUND, serializeMatchInfo(info));
        this.client.ws.send(serializeMessage(match_msg));
    }
    /**
     * Handle a set of changes to the state
     *
     * @param {List<Change>} changeset Set of changes
     */
    public handleChanges(changeset: List<Change>): void {
        const changeset_str = serializeChangeset(changeset);
        const changeset_msg = new Message(MessageType.CHANGESET, changeset_str);

        this.client.ws.send(serializeMessage(changeset_msg));
    }
    /**
     * Handle a message from the client
     *
     * @param {Message} message Message received from the client
     */
    public handleMessage(message: Message): void {
        if (message.type == MessageType.ACTION) {
            const action = deserializeAction(message.data);
            this.emit(ACTION_EVENT, action);
        } else if (message.type == MessageType.END_TURN) {
            this.emit(END_TURN_EVENT);
        } else if (message.type == MessageType.READY) {
            this.emit(READY_EVENT);
        } else {
            LOG.WARN("Unexpected message type: " + message.type);
        }
    }
}
