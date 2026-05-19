# @alexparamonov/pi-tokf

[pi](https://pi.dev) extension that wraps commands through [tokf](https://github.com/mpecan/tokf) for compressed output.

Intercepts bash tool calls before execution — main agent and all subagents, zero config.

## Install

```bash
pi install npm:@alexparamonov/pi-tokf
```

## Requirements

[tokf](https://github.com/mpecan/tokf) installed and on PATH.

## How It Works

Mirrors tokf's [Claude Code hook](https://github.com/mpecan/tokf/blob/main/CLAUDE.md): listens to pi's `tool_call` event, calls `tokf rewrite` to detect commands with matching filters, and wraps them with `tokf run --no-mask-exit-code`.

**Before:**
```
Compiling my_app (elixir)
Generated my_app app
✓ 42 tests passed
...
```

**After:**
```
🗜️ ✓ 42 tests passed
```

## Notes

- Exit codes are preserved (`--no-mask-exit-code`) so failures are never masked
- tokf is resolved from PATH — no hardcoded paths
- Falls back to original command on any error (never blocks execution)
