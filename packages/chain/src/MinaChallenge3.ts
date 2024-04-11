import { NoConfig } from "@proto-kit/common";
import {
    RuntimeModule,
    runtimeModule,
    state,
    runtimeMethod,
} from "@proto-kit/module";
import { StateMap, assert } from "@proto-kit/protocol";
import { CircuitString, Field, Struct } from "o1js";
import { PackedStringFactory } from "o1js-pack";


interface MinaChallenge3Config {
    messageMaxChars: Field;
}

export class String12 extends PackedStringFactory(12) {}
export class String2 extends PackedStringFactory(2) {}
/*
The spymaster is worried that this design is not
private.
Is he correct ?
How could you change the system to ensure that
messages are private ?
e github repo
containing the solution.
An answer to the question regarding privacy
(you don't need to implement that yet)
*/

/* My answer to the question regarding privacy:
The messages could be encrypted using a public key
and only the agent with the corresponding private key
could decrypt the message. */

export class Message extends Struct({
    messageNumber: Field,
    messageText: String12,
    agentID: Field,
    securityCode: String2,
}) {
    constructor(messageNumber: Field, messageText: String12, agentID: Field, securityCode: String2) {
        super({
            messageNumber,
            messageText,
            agentID,
            securityCode
        });
        this.messageNumber = messageNumber;
        this.messageText = messageText;
        this.agentID = agentID;
        this.securityCode = securityCode;
    }
}

export class AgentState extends Struct({
    lastMessageNumber: Field,
    securityCode: String2
}) {
    constructor(lastMessageNumber: Field, securityCode: String2) {
        super({
            lastMessageNumber,
            securityCode
        });
        this.lastMessageNumber = lastMessageNumber;
        this.securityCode = securityCode;
    }
}

@runtimeModule()
export class MinaChallenge3 extends RuntimeModule<MinaChallenge3Config> {
    @state() public agentStates = StateMap.from<Field, AgentState>(
        Field,
        AgentState
    );

    @runtimeMethod()
    public IsMessageValid(message: Message): boolean {
        const agentState = this.agentStates.get(message.agentID);
        assert(agentState.isSome, "Agent does not exist");
        assert(message.messageNumber.greaterThan(agentState.value.lastMessageNumber), "Message number is not greater than the last message number");
        assert(Field(message.messageText.toString().length).equals(Field(12)), "Message is not 12 characters long");
        assert(agentState.value.securityCode.packed.equals(message.securityCode.packed), "Security code does not match");
        return true;
    }

    @runtimeMethod()
    public populateAgents(): void {
        const agentID1 = Field(1);
        const agentID2 = Field(2);
        const agent1 = new AgentState(Field(0), String2.fromString("12"));
        const agent2 = new AgentState(Field(0), String2.fromString("56"));
        this.agentStates.set(agentID1, agent1);
        this.agentStates.set(agentID2, agent2);
    }

    @runtimeMethod()
    public submitMessage(message: Message): void {
        this.IsMessageValid(message);
        this.agentStates.set(message.agentID, new AgentState(message.messageNumber, message.securityCode));
    }
}
