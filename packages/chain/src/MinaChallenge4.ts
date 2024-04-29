import { NoConfig } from "@proto-kit/common";
import {
    RuntimeModule,
    runtimeModule,
    state,
    runtimeMethod,
} from "@proto-kit/module";
import { StateMap, assert } from "@proto-kit/protocol";
import { CircuitString, Field, Struct, Experimental, Provable, Character } from "o1js";
import { PackedStringFactory } from "o1js-pack";
import { MessageValidator } from "./MessageValidation";


interface MinaChallenge4Config {
    messageMaxChars: Field;
}

export class String12 extends PackedStringFactory(12) {}
export class String2 extends PackedStringFactory(2) {}

await MessageValidator.compile();
export class MessageValidationProof extends Experimental.ZkProgram.Proof(MessageValidator) {}
export class Characters extends Struct({
    array: Provable.Array(Character,2)
}) {
    constructor(array: Character[]) {
        super({ array });
        this.array = array;
    }
}
export class Message extends Struct({
    messageNumber: Field,
    messageHash: Field,
    agentID: Field,
    securityCode: Characters,
}) {
    constructor(messageNumber: Field, messageHash: Field, agentID: Field, securityCode: Characters) {
        super({
            messageNumber,
            messageHash,
            agentID,
            securityCode
        });
        this.messageNumber = messageNumber;
        this.messageHash = messageHash;
        this.agentID = agentID;
        this.securityCode = securityCode;
    }
}



export class AgentState extends Struct({
    lastMessageNumber: Field,
    securityCode: Characters
}) {
    constructor(lastMessageNumber: Field, securityCode: Characters) {
        super({
            lastMessageNumber,
            securityCode
        });
        this.lastMessageNumber = lastMessageNumber;
        this.securityCode = securityCode;
    }
}

@runtimeModule()
export class MinaChallenge4 extends RuntimeModule<MinaChallenge4Config> {
    @state() public agentStates = StateMap.from<Field, AgentState>(
        Field,
        AgentState
    );

    @runtimeMethod()
    public IsMessageValid(agentID: Field, messageNumber: Field, securityCode: Characters): boolean {
        Provable.log(securityCode, "Here sec code in ismesgavalid")
        const agentState = this.agentStates.get(agentID);
        assert(agentState.isSome, "Agent does not exist");
        assert(messageNumber.greaterThan(agentState.value.lastMessageNumber), "Message number is not greater than the last message number");
        assert(agentState.value.securityCode.array[0].equals(securityCode.array[0]), "Security code does not match");
        assert(agentState.value.securityCode.array[1].equals(securityCode.array[1]), "Security code does not match");

        return true;
    }

    @runtimeMethod()
    public populateAgents(): void {
        const agentID1 = Field(1);
        const agentID2 = Field(2);
        const agent1 = new AgentState(Field(0), new Characters([Character.fromString("1"), Character.fromString("2")]));
        const agent2 = new AgentState(Field(0),  new Characters([Character.fromString("5"), Character.fromString("6")]));
        this.agentStates.set(agentID1, agent1);
        this.agentStates.set(agentID2, agent2);
    }

    @runtimeMethod()
    public submitMessage(proof: MessageValidationProof): void {
        proof.verify();
        Provable.log(proof.publicInput.agentID, "Here in the proof public input")
        Provable.log(proof.publicInput.securityCode, "Here security in proof input")
       
        this.IsMessageValid(proof.publicInput.agentID, proof.publicInput.messageNumber, proof.publicInput.securityCode);
        assert(proof.publicOutput.equals(Field(1)), "Message is not valid");
        this.agentStates.set(proof.publicInput.agentID, new AgentState(proof.publicInput.messageNumber, proof.publicInput.securityCode));
    }
}
