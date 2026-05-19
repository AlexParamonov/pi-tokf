# @alexparamonov/pi-tokf

pi extension that wraps commands through [tokf](https://github.com/mpecan/tokf) for compressed output.

Intercepts bash tool calls and rewrites commands via `tokf rewrite` before execution — works for main agent and all subagents.

## Install

```bash
# npm
pi install npm:@alexparamonov/pi-tokf

# git
pi install git:github.com/AlexParamonov/pi-tokf
```

## Requirements

- [tokf](https://github.com/mpecan/tokf) installed and on PATH

## How It Works

Listens to the `tool_call` event, calls `tokf rewrite <command>` to detect commands with matching filters, and wraps them with `tokf run --no-mask-exit-code`. Fires globally across all agent sessions.
