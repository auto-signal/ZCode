import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isProtocolServerInvocation, parseGlobalArgs } from "./arguments.js";

describe("parseGlobalArgs", () => {
  it("接受 desktop host 拉起 app-server 的完整参数", () => {
    const parsed = parseGlobalArgs([
      "app-server",
      "--stdio",
      "--prepare-storage",
      "--cwd",
      "/tmp/ws",
      "--surface",
      "desktop",
    ]);
    assert.equal(parsed.positionals[0], "app-server");
    assert.equal(parsed.values.stdio, true);
    assert.equal(parsed.values["prepare-storage"], true);
    assert.equal(parsed.values.cwd, "/tmp/ws");
    assert.equal(parsed.values.surface, "desktop");
  });

  it("支持 -h/-v 短选项", () => {
    assert.equal(parseGlobalArgs(["-h"]).values.help, true);
    assert.equal(parseGlobalArgs(["-v"]).values.version, true);
  });

  it("strict 拒绝已裁剪的选项", () => {
    assert.throws(() => parseGlobalArgs(["-p", "hi"]));
    assert.throws(() => parseGlobalArgs(["--target", "obj"]));
    assert.throws(() => parseGlobalArgs(["--mode", "yolo"]));
    assert.throws(() => parseGlobalArgs(["--json"]));
    assert.throws(() => parseGlobalArgs(["--disallowed-tools", "Bash"]));
  });
});

describe("isProtocolServerInvocation", () => {
  it("app-server 调用视为协议命令", () => {
    assert.equal(isProtocolServerInvocation(["app-server", "--stdio"]), true);
    assert.equal(isProtocolServerInvocation(["app-server", "--prepare-storage"]), true);
  });

  it("help/version 与其他命令不视为协议命令", () => {
    assert.equal(isProtocolServerInvocation(["--help"]), false);
    assert.equal(isProtocolServerInvocation(["-v"]), false);
    assert.equal(isProtocolServerInvocation(["app-server", "--help"]), false);
    assert.equal(isProtocolServerInvocation(["tui"]), false);
    assert.equal(isProtocolServerInvocation([]), false);
  });

  it("解析失败时按首 positional 兜底保护 stdout", () => {
    assert.equal(isProtocolServerInvocation(["app-server", "--unknown-flag"]), true);
    assert.equal(isProtocolServerInvocation(["tui", "--unknown-flag"]), false);
  });
});
