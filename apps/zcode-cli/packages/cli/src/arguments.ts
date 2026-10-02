import { parseArgs } from "node:util";

// 本 CLI 只承载 app-server(见 spec/cli-surface.md):--stdio/--cwd/--prepare-storage
// 是 desktop host 与 zcode-server-cli 拉起协议子进程的既有契约,必须继续接受。
export const parseGlobalArgs = (argv: string[]) =>
  parseArgs({
    allowPositionals: true,
    args: argv,
    options: {
      help: {
        short: "h",
        type: "boolean",
      },
      cwd: {
        type: "string",
      },
      verbose: {
        type: "boolean",
      },
      version: {
        short: "v",
        type: "boolean",
      },
      "prepare-storage": { type: "boolean" },
      stdio: {
        type: "boolean",
      },
      surface: {
        type: "string",
      },
    },
    strict: true,
  });

/** 入口与命令路由复用同一参数定义，不能把 cwd 的值误当成协议命令。 */
export function isProtocolServerInvocation(argv: string[]): boolean {
  try {
    const parsed = parseGlobalArgs(argv);
    return !parsed.values.help && !parsed.values.version && parsed.positionals[0] === "app-server";
  } catch {
    // 无效参数由 run 格式化；明确的协议命令仍保护 stdout。
    return argv[0] === "app-server";
  }
}
