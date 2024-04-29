import { TestingAppChain } from "@proto-kit/sdk";
import { Character, CircuitString, Field, Poseidon, PrivateKey} from "o1js";
import { log } from "@proto-kit/common";
import { Characters, Message, MessageValidationProof, MinaChallenge4, String12, String2 } from "../src/MinaChallenge4";
import { MessageValidator, MessageValidatorPublicInputs } from "../src/MessageValidation";
import { mock } from "node:test";

log.setLevel("ERROR");

describe("MinaChallenge4", () => {
    const appChain = TestingAppChain.fromRuntime({
        modules: {
            MinaChallenge4,
        },
    });
    const alicePrivateKey = PrivateKey.random();
    const alice = alicePrivateKey.toPublicKey();
    let minaChallenge4: MinaChallenge4;
    beforeAll(async () => {
        appChain.configurePartial({
            Runtime: {
                MinaChallenge4: {
                    maxMessageChars: Field(12),
                },
            },
        });

        await appChain.start();

        appChain.setSigner(alicePrivateKey);

        minaChallenge4 = appChain.runtime.resolve("MinaChallenge4");
    }, 1_000_000_000);
    it("should populate agents", async () => {
        const tx0 = await appChain.transaction(alice, () => {
            minaChallenge4.populateAgents();
        });
        
        await tx0.sign();
        await tx0.send();
        const block1 = await appChain.produceBlock();

        const agentState = await appChain.query.runtime.MinaChallenge4.agentStates.get(Field(1));
        expect(block1?.transactions[0].status.toBoolean()).toBe(true);
        console.log(agentState?.lastMessageNumber, agentState?.securityCode)
        expect(agentState?.lastMessageNumber.toBigInt()).toBe(BigInt(0));
        //expect(agentState?.securityCode.toString()).toBe("12");
    });
    it("should process message if valid", async () => {
        const mock_message: MessageValidatorPublicInputs = new MessageValidatorPublicInputs(
            Field(1),
            Poseidon.hash([String12.fromString("Hello, World").packed]),
            Field(1),
            new Characters([Character.fromString("1"), Character.fromString("2")]));
        const messageProof_1 = await MessageValidator.checkMessage(mock_message, String12.fromString("Hello, World"));
        const tx1 = await appChain.transaction(alice, () => {
            minaChallenge4.IsMessageValid(mock_message.agentID, mock_message.messageNumber, mock_message.securityCode);
        });
        await tx1.sign();
        await tx1.send();
        const block1 = await appChain.produceBlock();
        console.log(block1?.transactions[0]);
        expect(block1?.transactions[0].status.toBoolean()).toBe(true);
        
        
        const tx = await appChain.transaction(alice, () => {
            minaChallenge4.submitMessage(messageProof_1);
        });

        await tx.sign();
        await tx.send();

        const block2 = await appChain.produceBlock();

        const agentStateAfterSubmitMessage = await appChain.query.runtime.MinaChallenge4.agentStates.get(Field(1));

        expect(block2?.transactions[0].status.toBoolean()).toBe(true);
        expect(agentStateAfterSubmitMessage?.lastMessageNumber.toBigInt()).toBe(BigInt(1));
        //expect(agentStateAfterSubmitMessage?.securityCode.toString()).toBe("12");
    }, 1_000_000_000);
    it("should fail if message is invalid", async () => {
        const mock_message: Message = new Message(
            Field(2),
            Poseidon.hash([String12.fromString("Hello, Sorlo").packed]),
            Field(1),
            new Characters([Character.fromString("1"), Character.fromString("2")]));
        const tx1 = await appChain.transaction(alice, () => {
            minaChallenge4.IsMessageValid(mock_message.agentID, mock_message.messageNumber, mock_message.securityCode);
        });
        await tx1.sign();
        await tx1.send();
        const block1 = await appChain.produceBlock();
        console.log(block1?.transactions[0]);
        expect(block1?.transactions[0].status.toBoolean()).toBe(true);
        
        const mock_message2: Message = new Message(
            Field(4),
            Poseidon.hash([String12.fromString("Hello, World").packed]),
            Field(1),
            new Characters([Character.fromString("3"), Character.fromString("4")]));
        const tx2 = await appChain.transaction(alice, () => {
            minaChallenge4.IsMessageValid(mock_message2.agentID, mock_message2.messageNumber, mock_message2.securityCode);
        });
        await tx2.sign();
        await tx2.send();
        const block2 = await appChain.produceBlock();
        console.log(block2?.transactions[0]);
        expect(block2?.transactions[0].status.toBoolean()).toBe(false);
    }, 1_000_000_000);
    it("should succesfully submit multiple messages", async () => {
        const mock_message: MessageValidatorPublicInputs = new MessageValidatorPublicInputs(
            Field(5),
            Poseidon.hash([String12.fromString("Hello, World").packed]),
            Field(1),
            new Characters([Character.fromString("1"), Character.fromString("2")]));
        const messageProof_1 = await MessageValidator.checkMessage(mock_message, String12.fromString("Hello, World"));
        const tx1 = await appChain.transaction(alice, () => {
            minaChallenge4.submitMessage(messageProof_1);
        });
        await tx1.sign();
        await tx1.send();
        const block1 = await appChain.produceBlock();
        console.log(block1?.transactions[0]);
        expect(block1?.transactions[0].status.toBoolean()).toBe(true);
        
        const mock_message2: MessageValidatorPublicInputs = new MessageValidatorPublicInputs(
            Field(6),
            Poseidon.hash([String12.fromString("Hello, World").packed]),
            Field(1),
            new Characters([Character.fromString("1"), Character.fromString("2")]));
        const messageProof_2 = await MessageValidator.checkMessage(mock_message2, String12.fromString("Hello, World"));
        const tx2 = await appChain.transaction(alice, () => {
            minaChallenge4.submitMessage(messageProof_2);
        });
        await tx2.sign();
        await tx2.send();
        const block2 = await appChain.produceBlock();
        console.log(block2?.transactions[0]);
        expect(block2?.transactions[0].status.toBoolean()).toBe(true);
        
        const mock_message3: MessageValidatorPublicInputs = new MessageValidatorPublicInputs(
            Field(8),
            Poseidon.hash([String12.fromString("Hello, World").packed]),
            Field(1),
            new Characters([Character.fromString("1"), Character.fromString("2")]));
        const messageProof_3 = await MessageValidator.checkMessage(mock_message3, String12.fromString("Hello, World"));
        const tx3 = await appChain.transaction(alice, () => {
            minaChallenge4.submitMessage(messageProof_3);
        });
        await tx3.sign();
        await tx3.send();
        const block3 = await appChain.produceBlock();
        console.log(block3?.transactions[0]);
        expect(block3?.transactions[0].status.toBoolean()).toBe(true);
        
        const agentStateAfterSubmitMessage = await appChain.query.runtime.MinaChallenge4.agentStates.get(Field(1));
        expect(agentStateAfterSubmitMessage?.lastMessageNumber.toBigInt()).toBe(BigInt(8));
        //expect(agentStateAfterSubmitMessage?.securityCode.toString()).toBe("12");

        const mock_message4: MessageValidatorPublicInputs = new MessageValidatorPublicInputs(
            Field(9),
            Poseidon.hash([String12.fromString("Hello, World").packed]),
            Field(8),
            new Characters([Character.fromString("1"), Character.fromString("2")]));
        const messageProof_4 = await MessageValidator.checkMessage(mock_message4, String12.fromString("Hello, World"));
        const tx4 = await appChain.transaction(alice, () => {
            minaChallenge4.submitMessage(messageProof_4);
        });
        await tx4.sign();
        await tx4.send();
        const block4 = await appChain.produceBlock();
        console.log(block4?.transactions[0]);
        expect(block4?.transactions[0].status.toBoolean()).toBe(false);
    },1_000_000_000);
    it("should fail with wrong length of message", async () => {
        try {
            await MessageValidator.checkMessage(
                new MessageValidatorPublicInputs(
                Field(9),
                Poseidon.hash([String12.fromString("Hello, Worlddddd").packed]),
                Field(1),
                new Characters([Character.fromString("1"), Character.fromString("2")])), 
                String12.fromString("Hello, Worlddddd")
            );
        } catch (error: any) {
            console.log(error);
            expect(error.toString()).toBe("Error: Input of size 16 is larger than expected size of 12");
        }
    });

});
