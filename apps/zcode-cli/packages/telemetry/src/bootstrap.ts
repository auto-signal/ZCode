import { NoopAgentExecutionTelemetry } from "./agent-trace-runtime.js";
import type {
  AgentExecutionTelemetryPort,
  ModelExecutionTelemetryPort,
} from "@zcode/contracts/telemetry";
import type { ModelStatusSink } from "@zcode/contracts/model";

/**
 * planner 裁剪桩：app-server 的网络契约收窄为「仅自定义模型设置出网」（见
 * cli spec/cli-surface.md 的网络契约节）。OTel SDK 与 OTLP exporter（唯一的
 * telemetry 网络出口）已整链路移除——本文件保留原导出面，全部退化为进程内 no-op：
 * prepare 恒返回显式禁用的 env，Owner 永不创建，shutdown 无事可做。
 */

type EnvRecord = Record<string, string | undefined>;

const noopExecution = new NoopAgentExecutionTelemetry();

export interface CreateModelTelemetryOptions {
  owner?: unknown;
  sessionId?: string;
}

export interface ModelTelemetryBootstrap {
  agentExecution: AgentExecutionTelemetryPort;
  enabled: false;
  modelExecution: ModelExecutionTelemetryPort;
  statusSink?: ModelStatusSink;
  shutdown(): Promise<void>;
}

export interface PrepareModelTelemetryOptions {
  buildCommitId?: string;
  cliVersion?: string;
  onWarning?: (message: string, context: Record<string, unknown>) => void;
  productVersion?: string;
  runtimeDistribution?: string;
  runtimeSurface?: unknown;
}

/** 恒定显式禁用：即使宿主注入 OTEL_* env 也不会有任何导出通道。 */
export async function prepareModelTelemetryEnv(
  env: EnvRecord,
  _options: PrepareModelTelemetryOptions = {},
): Promise<EnvRecord> {
  return { ...env, ZCODE_MODEL_TELEMETRY_ENABLED: "0" };
}

export async function shutdownPreparedModelTelemetry(): Promise<void> {}

export function updatePreparedTelemetryIdentity(_snapshot: unknown): void {}

export function createModelTelemetry(
  _options: CreateModelTelemetryOptions = {},
): ModelTelemetryBootstrap {
  return {
    agentExecution: noopExecution,
    enabled: false,
    modelExecution: noopExecution,
    async shutdown() {},
  };
}
