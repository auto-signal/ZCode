import type { Logger } from "@zcode/contracts";
import type { RunZCodeProtocolAgentOptions } from "@zcode/bootstrap";
import type { CliEnv, DotenvLoadResult, LoadCliDotenvOptions } from "./env.js";

export type BootstrapModule = typeof import("@zcode/bootstrap");

export interface RunDependencies {
  protocolLifecycle?: RunZCodeProtocolAgentOptions["lifecycle"];
  protocolInput?: NodeJS.ReadableStream;
  cwd?: () => string;
  env?: CliEnv;
  loadDotenv?: (options?: LoadCliDotenvOptions) => DotenvLoadResult;
  logger?: Logger;
  runZCodeProtocolAgent?: (options?: RunZCodeProtocolAgentOptions) => Promise<void>;
}
