import { SDK_STATUS } from "@zhad0/sdk";
  import { encryptCommand } from "./commands/encrypt.js";
  import { simulateCommand } from "./commands/simulate.js";
  import { statusCommand } from "./commands/status.js";

  const HELP = `zhad0 ${SDK_STATUS.version} (${SDK_STATUS.phase})

  USAGE
    zhad0 <command> [options]

  COMMANDS
    encrypt <file>     Encrypt an intent JSON file with AES-256-GCM.
    simulate <file>    Encrypt + simulate ZK proof + return a receipt.
    status             Print SDK status and capability matrix.
    version            Print version.
    help               Show this message.

  OPTIONS
    --pretty           Pretty-print JSON output.
    --network <name>   base-mainnet | base-sepolia | devnet-local

  EXAMPLES
    zhad0 status
    zhad0 encrypt ./intent.json
    zhad0 simulate ./intent.json --pretty

  Docs: https://zhad0.io
  `;

  type Flags = Record<string, string | boolean>;

  function parseFlags(argv: string[]): { args: string[]; flags: Flags } {
    const args: string[] = [];
    const flags: Flags = {};
    for (let i = 0; i < argv.length; i++) {
      const a = argv[i];
      if (a !== undefined && a.startsWith("--")) {
        const name = a.slice(2);
        const next = argv[i + 1];
        if (next !== undefined && !next.startsWith("--")) {
          flags[name] = next;
          i++;
        } else {
          flags[name] = true;
        }
      } else if (a !== undefined) {
        args.push(a);
      }
    }
    return { args, flags };
  }

  export async function run(argv: string[]): Promise<void> {
    const { args, flags } = parseFlags(argv);
    const cmd = args[0];

    if (!cmd || cmd === "help" || cmd === "--help" || cmd === "-h") {
      process.stdout.write(HELP);
      return;
    }
    if (cmd === "version" || cmd === "--version" || cmd === "-v") {
      process.stdout.write(SDK_STATUS.version + "\n");
      return;
    }
    if (cmd === "status") return statusCommand(flags);
    if (cmd === "encrypt") return encryptCommand(args.slice(1), flags);
    if (cmd === "simulate") return simulateCommand(args.slice(1), flags);

    throw new Error(`Unknown command: ${cmd}. Run "zhad0 help".`);
  }
  