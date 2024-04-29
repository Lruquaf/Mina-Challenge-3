import { Bool, Character, Experimental, Field, Poseidon, Provable, Struct } from "o1js";
import { PackedStringFactory } from "o1js-pack";

export class String12 extends PackedStringFactory(12) {}
export class String2 extends PackedStringFactory(2) {}
export class Characters extends Struct({
    array: Provable.Array(Character,2)
}) {
    constructor(array: Character[]) {
        super({ array });
        this.array = array;
    }
}
export class MessageValidatorPublicInputs extends Struct({
    messageNumber: Field,
    messageHash: Field,
    agentID: Field,
    securityCode: Characters
}) {
    constructor(messageNumber: Field,messageHash: Field, agentID: Field, securityCode: Characters) {
        super({
            messageNumber,
            messageHash,
            agentID,
            securityCode
        });
        this.messageHash = messageHash;
        this.agentID = agentID;
        this.messageNumber = messageNumber;
        this.securityCode = securityCode;
    }

}

function checkMessageLength(message: String12) {
    String12.check(message);
    let messageLength = Field(0);

    let messageAsArray = String12.unpack(message.packed);
    for(let i = 0; i < messageAsArray.length; i++) {
        Provable.if(messageAsArray.at(i)?.isNull().not() ?? Bool(false), messageLength = messageLength.add(Field(1)), messageLength = messageLength)
    }
    /* let messageAsArray = Provable.Array(Field, 12);
    let length = Field(0);
    messageAsArray.map( value => { return Provable.if(value.equals().not() && value.equals(Field(0)).not(), length = length.add(1), length = length);})
    return length.equals(Field(12)); */
    return messageLength.equals(Field(12));
}
export const MessageValidator = Experimental.ZkProgram({
    name: "MessageValidator",
    publicInput: MessageValidatorPublicInputs,
    publicOutput: Field,
    methods: {
        checkMessage: {
            privateInputs: [String12],
            method(inputs: MessageValidatorPublicInputs, message: String12) {
                inputs.messageHash.assertEquals(Poseidon.hash([message.packed]));
                return Provable.if(checkMessageLength(message), Field(1), Field(0));
            },
        },
    },
});
