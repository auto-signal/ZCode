import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Writable } from "node:stream";
import type { RunContext } from "@zcode/shared-types";
import { run } from "./run.js";

const createStreamCollector = () => {
  const chunks: string[] = [];
  const stream = new Writable({
    write(chunk, _encoding, callback) {
      chunks.push(String(chunk));
      callback();
    },
  }) as unknown as NodeJS.WriteStream;
  return { chunks, stream, text: () => chunks.join("") };
};

const createContext = (argv: string[]): { ctx: RunContext; stderr: ReturnType<typeof createStreamCollector>; stdout: ReturnType<typeof createStreamCollector> } => {
  const stdout = createStreamCollector();
  const stderr = createStreamCollector();
  return {
    ctx: {
      argv,
      stdin: process.stdin,
      stdout: stdout.stream,
      stderr: stderr.stream,
    },
    stderr,
    stdout,
  };
};

describe("run 路由", () => {
  it("--help 打印仅含 app-server 的帮助并返回 0", async () => {
    const { ctx, stdout } = createContext(["--help"]);
    const code = await run(ctx);
    assert.equal(code, 0);
    const text = stdout.text();
    assert.match(text, /zcode \d+\.\d+\.\d+/);
    assert.match(text, /app-server/);
    assert.doesNotMatch(text, /tui|plugins|login|doctor|Slash Commands/);
  });

  it("-v 打印版本并返回 0", async () => {
    const { ctx, stdout } = createContext(["-v"]);
    const code = await run(ctx);
    assert.equal(code, 0);
    assert.match(stdout.text(), /^\d+\.\d+\.\d+\n$/);
  });

  it("已移除的命令返回 Unknown command 与退出码 1", async () => {
    for (const argv of [["tui"], ["login"], ["plugins"], ["doctor"]]) {
      const { ctx, stderr } = createContext(argv);
      const code = await run(ctx);
      assert.equal(code, 1, argv.join(" "));
      assert.match(stderr.text(), /Unknown command/);
    }
  });

  it("无参数调用打印帮助并返回 1", async () => {
    const { ctx, stderr } = createContext([]);
    const code = await run(ctx);
    assert.equal(code, 1);
    assert.match(stderr.text(), /app-server/);
  });

  it("非法 --surface 值被拒绝", async () => {
    const { ctx, stderr } = createContext(["app-server", "--surface", "http"]);
    const code = await run(ctx);
    assert.equal(code, 1);
    assert.match(stderr.text(), /Unsupported --surface value/);
  });
});
