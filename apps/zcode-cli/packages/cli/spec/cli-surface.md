# CLI Surface Spec(app-server 专用 CLI)

## 产品规则

- 本 CLI 是 ZCode Protocol 的 **app-server 专用入口**:面向 desktop host、web server-cli 等以子进程方式拉起 Agent 的调用方,以及直接使用协议的 SDK 用户。
- 面向用户的入口只有三个:`app-server` 子命令、`-h/--help`、`-v/--version`。交互式 TUI、headless prompt(`-p/--prompt`、`--target`)、`agent-server`、`login/logout`、`doctor`、`plugins/skills/commands` 管理命令均已移除,不得回加。
- 隐藏子命令不是用户界面,是本二进制被运行时再次拉起的内部入口,属于 app-server 功能的一部分,必须保留:
  - `__internal-search`(bootstrap 内嵌搜索后端拉起,见 `bootstrap/src/app/embedded-search-backend.ts`)
  - `__zcode-plugin-host`(内置插件的 MCP server 入口,见 `bootstrap/src/mcp-config.ts`)
  - `__zcode-dwf-child`(dynamic workflow 沙箱子进程,见 `contracts/src/plugins/index.ts`)
- `app-server` 的 stdout 是严格的 ZCode Protocol 帧通道:任何普通日志/三方输出都不得写入 stdout,入口必须在加载 run/bootstrap 前安装 stderr console 边界(`main.ts`)。

## 接口(argv surface)

```
zcode app-server [--stdio] [--surface terminal|desktop] [--cwd <path>]
                 [--prepare-storage] [--verbose]
zcode --help | -h
zcode --version | -v
zcode <隐藏子命令 ...>            # __internal-search / __zcode-plugin-host / __zcode-dwf-child
```

- `--stdio`:desktop host / zcode-server-cli 以 `["app-server", "--stdio"]` 拉起,仅做兼容性接受。
- `--cwd`:desktop host 存储准备进程以 `["app-server", "--stdio", "--prepare-storage", "--cwd", <path>]` 调用(`packages/desktop/src/host/storagePreparationProcesses.ts`)。
- `--prepare-storage`:存储准备模式,完成即退出,由 Host Worker 复用。
- strict 解析:任何未列出的选项/子命令一律报错并打印帮助,退出码 1。

## 状态所有者

- CLI 层不持有业务状态；会话/存储/运行时状态全部归 bootstrap(`runZCodeProtocolAgent`)及其下层 runtime 所有。
- CLI 只负责:env 清洗与 dotenv 加载、cwd 解析、进程边界(stderr/console/watchdog/lifecycle)、参数校验与路由。

## 网络契约(2026-10 裁剪后)

app-server 的全部出网行为收窄为以下三类,除此之外**不得存在任何基础设施网络调用**:

1. **自定义模型 API**:用户在自身配置里声明的模型 endpoint(base_url/api_key),含显式的
   `provider/testModelConnectivity`。官方内置 provider(zcode-builtin 的 template/provider 规则)已清空,
   官方 endpoint 不再提供任何模型;`config/provider/zcode-builtin.json` 仅保留 `modelConfigRules`
   作为模型默认事实源,revision 1000 防止旧 Release 反超。
2. **用户显式配置的 MCP server**:stdio 由本机拉起;HTTP/SSE 由用户配置的 URL 决定。未配置即零连接。
3. **agent 工具的网络副作用**:WebFetch/WebSearch/Bash 等在模型调用并经权限门后发生,属工具行为而非
   基础设施行为。

已移除/封死的基础设施网络点(验收基线):

- telemetry:OTel SDK 与 OTLP exporter 整链路删除,`@zcode/telemetry` bootstrap 为 no-op 桩,
  `prepareModelTelemetryEnv` 恒写 `ZCODE_MODEL_TELEMETRY_ENABLED=0`(宿主注入 OTEL_* 亦无效)。
- marketplace:`adapters/src/plugins/marketplace.ts` 的 `loadMarketplaceFromSource` 与
  `resolvePluginSourceRoot` 对 url/github/git/git-subdir 源单点抛错;仅剩本地源
  (settings/file/directory/内置 seed 分片)。官方 CDN 源串仅作为 listing 元数据存在,不会被请求。
- computer-use:官方插件定义删除,`isZCodeCuaInternalFeatureEnabled` 恒 false。
- builtin provider CDN 刷新:`ZCodeBuiltinRemoteSynchronizer` 仅在 standalone/Host 装配传入
  `fetchRelease` 时创建;CLI app-server 协议路径(`zcode-protocol-entrypoint.ts`)从不传入,
  协议路径对 `zcode.z.ai` 零请求。

## 验收场景

1. `zcode --help` / `-h`:stdout 打印仅含 app-server、-h、-v 及 app-server 所需 flag 的帮助,退出码 0。
2. `zcode --version` / `-v`:stdout 打印版本号,退出码 0。
3. `zcode app-server --stdio`:stdout 出现 ZCode Protocol 帧(如 `startup/storageState` 通知),stderr 无协议污染。
4. `zcode app-server --stdio --prepare-storage --cwd <dir>`:完成存储准备后进程退出,退出码 0(desktop 契约)。
5. `zcode tui` / `zcode -p "..."` / `zcode login` 等已移除命令:stderr 报 Unknown command 并打印帮助,退出码 1。
6. `zcode`(无参数):stderr 打印帮助,退出码 1。
7. `zcode __internal-search` / `__zcode-plugin-host` / `__zcode-dwf-child`:仍由对应内部入口路由,不落入 Unknown command。
