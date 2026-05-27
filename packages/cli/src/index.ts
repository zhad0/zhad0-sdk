import { SDK_STATUS } from "@zhad0/sdk";
import { HELP_DASHBOARD } from "./banner.js";
import { encryptCommand } from "./commands/encrypt.js";
import { simulateCommand } from "./commands/simulate.js";
import { statusCommand } from "./commands/status.js";
import { doctorCommand } from "./commands/doctor.js";

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
    process.stdout.write(HELP_DASHBOARD);
    return;
  }
  if (cmd === "version" || cmd === "--version" || cmd === "-v") {
    process.stdout.write(`@zhad0/cli ${SDK_STATUS.version}\n`);
    return;
  }
  if (cmd === "status")   return statusCommand(flags);
  if (cmd === "doctor")   return doctorCommand();
  if (cmd === "encrypt")  return encryptCommand(args.slice(1), flags);
  if (cmd === "simulate") return simulateCommand(args.slice(1), flags);

  process.stderr.write(`\x1b[91m[zhad0]\x1b[0m Unknown command: "${cmd}"\nRun \x1b[97mzhad0 help\x1b[0m for usage.\n`);
  process.exitCode = 1;
}
