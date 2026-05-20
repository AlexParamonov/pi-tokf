# @alexparamonov/pi-tokf

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[pi](https://pi.dev) extension that wraps commands through [tokf](https://github.com/mpecan/tokf) for compressed output.

Intercepts bash tool calls before execution — main agent and all subagents, zero config.

## How It Works

The extension hooks into pi's `tool_call` event pipeline. Every time the agent (or any subagent) runs a bash command:

1. The extension calls `tokf rewrite "<command>"` as a subprocess
2. If tokf returns a rewritten command, it replaces the original in the event payload with `tokf run --no-mask-exit-code <rewritten>`
3. If tokf is missing, times out, or returns nothing, the command passes through unmodified

This mirrors the approach used in tokf's Claude Code hook, adapted for pi's event system.

**Example — running 207 tests:**

```
# Without tokf
> bash("cd gateway && mix test")
warning: undefined module attribute @kill_timeout...
...
Running ExUnit with seed: 188487, max_cases: 32
..........................................................................
Finished in 0.4 seconds
207 tests, 0 failures

# With tokf (rewrites to: tokf run --no-mask-exit-code cd gateway && mix test)
✓ All tests passed
```

## Install

```bash
# Global (user settings)
pi install npm:@alexparamonov/pi-tokf

# Project-local (shared via .pi/settings.json)
pi install -l npm:@alexparamonov/pi-tokf

# Try without installing (current run only)
pi -e npm:@alexparamonov/pi-tokf

# From git
pi install git:github.com/AlexParamonov/pi-tokf
```

## Requirements

- [tokf](https://github.com/mpecan/tokf) installed and on PATH
- Node.js >= 14

## Notes

- Exit codes are preserved (`--no-mask-exit-code`) so failures are never masked
- tokf is resolved from PATH — no hardcoded paths
- Falls back to original command on any error (never blocks execution)

## Debugging

When tokf fails (missing, timeout, error), the extension logs to stderr via `console.error()`. To see these logs, run pi with:

```bash
PI_VERBOSE=1 pi
```

This surfaces messages like:
- `[pi-tokf] rewrite failed: spawn tokf ENOENT` — tokf is not installed
- `[pi-tokf] rewrite timed out after 3000ms` — slow tokf rewrite

## Development

```bash
git clone https://github.com/AlexParamonov/pi-tokf.git
cd pi-tokf
npm install
npm run typecheck       # TypeScript validation
```

To test the extension locally without publishing:

```bash
pi -e ./extensions/index.ts
```

Or register it in a project's `.pi/settings.json`:

```json
{
  "extensions": ["./extensions/index.ts"]
}
```
