/**
 * tokf — intercept bash tool calls and rewrite commands through
 * `tokf run --no-mask-exit-code`.
 *
 * Mirrors tokf's Claude Code hook: pre-execution command rewrite via
 * `tokf rewrite`. Fires globally for main agent and all subagents.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { isToolCallEventType } from "@earendil-works/pi-coding-agent";
import { spawn } from "node:child_process";

/**
 * Call `tokf rewrite <command>` and return the rewritten string.
 * Falls back to original command on any error (never block execution).
 */
function rewrite(cmd: string): Promise<string> {
  return new Promise((resolve) => {
    const child = spawn("tokf", ["rewrite", cmd], {
      timeout: 3_000,
      env: { ...process.env, NO_COLOR: "1" },
    });
    let stdout = "";
    child.stdout.on("data", (d: Buffer) => (stdout += d.toString()));
    child.stderr.on("data", () => {});
    child.on("close", () => resolve(stdout.trim() || cmd));
    child.on("error", () => resolve(cmd));
  });
}

export default function (pi: ExtensionAPI) {
  pi.on("tool_call", async (event) => {
    if (!isToolCallEventType("bash", event)) return;

    const original = event.input.command;
    const rewritten = await rewrite(original);

    if (rewritten !== original) {
      // tokf rewrite doesn't honour --no-mask-exit-code, inject manually.
      const final = rewritten.replace(
        /tokf run (?!--)/g,
        "tokf run --no-mask-exit-code ",
      );
      event.input.command = final;
    }
  });
}
