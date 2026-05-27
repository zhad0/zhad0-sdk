import { SDK_STATUS } from "@zhad0/sdk";

  type Flags = Record<string, string | boolean>;

  export async function statusCommand(flags: Flags): Promise<void> {
    const indent = flags.pretty ? 2 : 0;
    const out = {
      ...SDK_STATUS,
      capabilities: {
        clientSideAesGcm: "LIVE",
        wrapAgent: "LIVE",
        canonicalIntentHash: "LIVE",
        simulatedProof: "SIMULATED",
        simulatedRelay: "SIMULATED",
        mainnetRelay: "PLANNED",
        realZkProof: "PLANNED",
        gaslessMode: "PLANNED",
        multiChain: "PLANNED",
      },
    };
    process.stdout.write(JSON.stringify(out, null, indent) + "\n");
  }
  