import { Field, Mina, UInt64 } from "o1js";
import { Balances } from "./balances";
import { runtimeModule } from "@proto-kit/module";
import { MinaChallenge3 } from "./MinaChallenge3";

@runtimeModule()
export class CustomBalances extends Balances {}

export default {
  modules: {
    Balances,
    CustomBalances,
    MinaChallenge3
  },
  config: {
    Balances: {
      totalSupply: UInt64.from(10_000),
    },
    CustomBalances: {
      totalSupply: UInt64.from(10_000),
    },
    MinaChallenge3: {
      messageMaxChars: Field(12),
    },
  },
};
