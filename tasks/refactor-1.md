## Refactoring Summary

**Over-engineering removed:**
- Removed fragile regex `/tokf run (?!--)/g` — replaced with a robust `.includes()` guard + `replaceAll()` approach. The original regex used negative lookahead that would miss `tokf run` instances preceded by other flags (e.g., `tokf run --other-flag`).
- Removed outdated comment "Mirrors tokf's Claude Code hook" — irrelevant to pi context, replaced with design decision rationale.

**Simplifications:**
- `extensions/index.ts` — extracted `injectNoMaskExitCode()` function from inline regex replacement. Now checks for `--no-mask-exit-code` presence before injecting, covering edge cases the regex missed (already-present flag, other flags before it).
- `extensions/index.ts` — extracted named constants `TOKF_TIMEOUT_MS` (3_000) and `NO_MASK_EXIT_CODE` ("--no-mask-exit-code") instead of magic values.
- `extensions/index.ts` — added `console.error()` on spawn failure so broken tokf installations are debuggable, while preserving the "never block execution" fallback.

**Comments improved (why, not what):**
- Module header now explains *why* errors are non-fatal: "the agent session is never blocked by a failing extension."
- `injectNoMaskExitCode` explains *why* the flag is needed: "without it, tokf always reports success and pi would miss real failures."
- `rewrite` explains *why* fallback matters: "execution is never blocked by a broken or missing tokf installation."

**Commits:**
- `refactor: extract constants, robust --no-mask-exit-code injection, error logging` (12b9ad2)

**Tests:** TypeScript compilation passes cleanly (`npx tsc --noEmit` with strict mode). No test suite exists in this package.
