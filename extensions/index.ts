/**
 * tokf — intercept bash tool calls and rewrite commands through
 * `tokf run --no-mask-exit-code`.
 *
 * Fires globally for main agent and all subagents.
 *
 * Design decision: errors are non-fatal. If tokf is broken or
 * missing, commands pass through unmodified — the agent session
 * is never blocked by a failing extension.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { isToolCallEventType } from "@earendil-works/pi-coding-agent";
import { spawn } from "node:child_process";

const TOKF_REWRITE_TIMEOUT_MS = 3_000;

// Once tokf proves unavailable, skip all further spawns for the session.
let tokfDead = false;

/**
 * `tokf rewrite` returns commands wrapped in `tokf run …`.
 * We must inject `--no-mask-exit-code` so tokf propagates the
 * inner command's exit code — without it, tokf always reports
 * success and pi would miss real failures.
 */
function injectNoMaskExitCode(command: string): string {
  if (command.includes("--no-mask-exit-code")) return command;
  return command.replace("tokf run ", "tokf run --no-mask-exit-code ");
}

/**
 * Call `tokf rewrite <command>` and return the rewritten string.
 * Falls back to the original command on any error — execution
 * is never blocked by a broken or missing tokf installation.
 */
function rewrite(cmd: string): Promise<string> {
  if (tokfDead) return Promise.resolve(cmd);
  return new Promise((resolve) => {
    const child = spawn("tokf", ["rewrite", cmd], {
      timeout: TOKF_REWRITE_TIMEOUT_MS,
      env: { ...process.env, NO_COLOR: "1" },
    });
    let stdout = "";
    child.stdout.on("data", (d: Buffer) => (stdout += d.toString()));
    child.stderr.on("data", () => {});
    child.on("close", (_code, signal) => {
      if (signal) console.error(`[pi-tokf] rewrite timed out after ${TOKF_REWRITE_TIMEOUT_MS}ms`);
      resolve(stdout.trim() || cmd);
    });
    child.on("error", (err) => {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") tokfDead = true;
      console.error("[pi-tokf] rewrite failed:", err.message);
      resolve(cmd);
    });
  });
}

export default function (pi: ExtensionAPI) {
  pi.on("tool_call", async (event) => {
    if (!isToolCallEventType("bash", event)) return;

    const original = event.input.command;
    const rewritten = await rewrite(original);

    if (rewritten !== original) {
      event.input.command = injectNoMaskExitCode(rewritten);
    }
  });
}
