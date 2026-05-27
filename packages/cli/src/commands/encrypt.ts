import { readFileSync } from "node:fs";
  import { resolve } from "node:path";
  import { Zhad0Client, type Intent } from "@zhad0/sdk";

  type Flags = Record<string, string | boolean>;

  function getNetwork(flags: Flags): "base-mainnet" | "base-sepolia" | "devnet-local" {
    const n = flags.network;
    if (n === "base-mainnet" || n === "base-sepolia" || n === "devnet-local") return n;
    return "devnet-local";
  }

  function loadIntent(file: string | undefined): Intent {
    if (!file) throw new Error("Missing intent file argument.");
    const raw = readFileSync(resolve(process.cwd(), file), "utf8");
    try {
      return JSON.parse(raw) as Intent;
    } catch (e) {
      throw new Error(`Invalid JSON in ${file}: ${(e as Error).message}`);
    }
  }
  
  export async function encryptCommand(args: string[], flags: Flags): Promise<void> {
    const intent = loadIntent(args[0]);
    const client = new Zhad0Client({ network: getNetwork(flags), relayerMode: "simulated" });
    const encrypted = await client.encryptIntent(intent);
    const indent = flags.pretty ? 2 : 0;
    process.stdout.write(JSON.stringify(encrypted, null, indent) + "\n");
  }
  