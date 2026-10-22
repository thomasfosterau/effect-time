# AGENTS.md

`CLAUDE.md` is a symlink to this file. Project conventions live here; personal style preferences live in user memory.

This repo publishes one package from its root: `@thomasfosterau/effect-time`, Effect's `Clock` and `DateTime` modules under one import, plus parsers for time's string formats (`Rfc3339`, `IsoDuration`) built on `@thomasfosterau/effect-parse`. It is a thin, curated surface over `effect`, not a reimplementation: `Clock` and `DateTime` are Effect's modules re-exported unchanged, the modules of its own produce and consume Effect's `DateTime` values, and the package's value is the choice of what belongs together and the documentation around it.

| Package                       | Directory             | Entries |
| ----------------------------- | --------------------- | ------- |
| `@thomasfosterau/effect-time` | `.` (repository root) | `.`     |

## Boundary and invariants

- **Peers: `effect` and `@thomasfosterau/effect-parse`.** No runtime dependency. `src/` imports only `effect/*` and `@thomasfosterau/effect-parse/*` paths that exist on every release from the peer floors (`catalogs.peers` in `pnpm-workspace.yaml`).
- **Re-exports are identity.** `Clock` is `effect/Clock` and `DateTime` is `effect/DateTime`, the same module objects (`tests/index.test.ts` asserts `toBe`). A consumer's `Clock` must read the service `TestClock` replaces, and a `DateTime` from here must be accepted by `effect/DateTime`; a wrapper or a copy breaks both.
- **A new export is a new module, not a helper on an existing one.** Anything this package adds of its own goes in `src/<Module>.ts`, re-exported from `src/index.ts` as `export * as <Module>`, with its own tests.

## Common pitfalls

- **Never edit a version in `package.json`.** Versions live in the `pnpm-workspace.yaml` catalog (`catalogMode: strict` rejects anything else). After editing it, run `pnpm install` and commit `pnpm-lock.yaml`, or CI fails with `ERR_PNPM_LOCKFILE_CONFIG_MISMATCH`. `@effect/tsgo`, `@typescript/native` and `vite-plus` move together (the tsgo patch hard-errors at install on an unsupported `tsc` or `oxlint`); read their catalog comments first.
- **`effect` and `@thomasfosterau/effect-parse` are peers, never dependencies.** Two copies of `effect` break `Context` / `Layer` / `Schema` identity, and effect-parse peers on `effect` itself; the consuming app owns both singletons.
- **`dist/` is the product.** `vp pack` (tsdown) emits one ESM bundle and declaration file; `exports` points at `dist/`. `"sideEffects": false` is a claim about it: no top-level statements.
- **`vp run docgen` executes your examples.** `@effect/docgen` compiles every JSDoc `@example` and runs it (`"runExamples": true` in `docgen.json`), importing the package by name through `dist/`. An example must import everything it uses, must not use `declare const`, and must not throw.
- **`effect/Date` does not exist.** Effect 4 has `effect/DateTime` and `effect/Clock`; JavaScript `Date` interop is `DateTime.toDateUtc` / `DateTime.make(date)`.
- **Coverage thresholds apply to the modules of our own.** `src/index.ts` is all re-exports, so Istanbul counts only `src/Rfc3339.ts`, `src/IsoDuration.ts` and their successors against the 90 / 85 / 90 / 90 thresholds in `vite.config.ts`.

## Conventions

- **Effect-first.** Domain failures are tagged errors (see [Effect](#effect)); work that can fail returns `Effect`; optional values are `Option`. Pure total functions stay plain functions. Time is read through `Clock`, never `Date.now()`.
- **Optional props and fields are declared `T | undefined`, never bare `x?: T`.** The package compiles with `exactOptionalPropertyTypes`.
- **Relative imports carry their `.ts` extension** (`rewriteRelativeImportExtensions`).
- **Tests import from `vite-plus/test`**, never `vitest`, and import the package by name (`@thomasfosterau/effect-time`), which `vite.config.ts` and `tsconfig.test.json` resolve to `src/`. `tests/<module>.test.ts` mirrors the module it covers.
- **Every export has a doc comment** whose first sentence says what it is for and stands alone in a hover. It documents defaults, units and the error channel. Every export carries a runnable `@example` (docgen executes it), `@since` and `@category`.

## Commands

- `pnpm install` — dependencies plus the Vite+ git hooks (pre-commit runs `vp staged`: format + lint on staged files) and the `prepare` step that patches the native `tsc` / `oxlint` with `@effect/tsgo`. No pre-push hook: run the gates yourself.
- `vp check` — format + lint (Oxfmt + Oxlint with the Effect plugin). `vp run check` — the type gate: `src` under `tsconfig.json`, then tests and `vite.config.ts` under `tsconfig.test.json`. They are different commands.
- `vp run test:unit` — unit tests.
- `vp run build` — `vp pack` → `dist/`.
- `vp run docgen` — compiles and runs each `@example` against `dist/` and writes the (git-ignored) API reference under `docs/`.
- `vp run test:coverage` — the unit suite under an Istanbul map at `coverage/coverage-final.json`, which `fallow audit` reads for per-function CRAP scores.
- `pnpm changeset` — add a changeset.

Node and pnpm only: no bun, deno, npm or yarn commands or lockfiles. Invoke everything through `vp` (`vp exec <bin>` for a dev binary; `vp run <task>` instead of bare `pnpm`). The sanctioned non-`vp` invocations: `pnpm install` (and `pnpm install --frozen-lockfile` in CI), `pnpm changeset` / `pnpm publish` on the release path, `pnpm audit`. Single-check variants are in [CONTRIBUTING.md](CONTRIBUTING.md#running-individual-checks).

## Verification

Before you report work as done, run the gates below in order and quote each command with its final pass/fail. If a gate can't run here, say which and why in the PR body; never imply it ran.

1. From a clean install, which is what CI sees: `rm -rf node_modules dist && pnpm install --frozen-lockfile`.
2. `vp check`
3. `vp run check`
4. `vp run test:unit`
5. `vp run build`
6. `vp run docgen`
7. `pnpm audit --audit-level high` (network)
8. `vp run test:coverage`, then `fallow audit --format json --quiet --explain --gate-marker agent --base origin/trunk` (the fallow gate below; not a CI step). The PreToolUse fallow gate audits against `coverage/coverage-final.json` and never refreshes it, so run `test:coverage` first.

Steps 2–7 are CI's required `ci` job, in its order ([ci.yml](.github/workflows/ci.yml)). `CONTRIBUTING.md` and the PR template link here rather than restating the list.

## Branches and pull requests

- The default branch is `trunk`. Branch off `trunk`; PR against `trunk`; squash-merge with a conventional prefix (`feat:`, `fix:`, `docs:`, `chore:`, `ci:`). Rebase onto `origin/trunk` before opening or updating a PR; never merge `trunk` into your branch (GitHub's Update-branch button merges).
- Every change to the published package's behaviour carries a changeset (`pnpm changeset`). Changes to doc comments that reach the emitted `.d.ts` take a `patch` changeset; other docs-only changes (README, guidance), CI and tooling need none. Never publish or version by hand: the Release workflow opens the version PR (`chore: version packages`) and the owner merges it. Publishing is npm trusted publishing (OIDC) from the protected `release` environment; there is no `NPM_TOKEN` ([PUBLISHING.md](PUBLISHING.md)).
- There is no standing approval to open pull requests here: push the branch and open a PR only when the owner asks.
- GitHub writes go to `thomasfosterau/effect-time` only — never to the consuming applications, upstream projects or the owner's other libraries without the owner's explicit approval for that action in the current session. Pass `-R thomasfosterau/effect-time` whenever the cwd might be another checkout.

## Work tracker

- Issues in `thomasfosterau/effect-time` are the backlog: when you find work you can't do now, file an issue rather than leaving a TODO.
- The issue is the spec — read its comments; later comments override the body. Re-verify its code claims against current `trunk` before editing.
- Record decisions and findings as comments on the issue they were found working. Stop-and-report is a valid outcome: on a blocker outside the issue's scope, comment the evidence on the issue and stop.

## Effect

Read the installed package before writing Effect code: `node_modules/effect/AGENTS.md` and `node_modules/effect/ai-docs/`, the declarations in `node_modules/effect/dist/*.d.ts` (`Clock.d.ts`, `DateTime.d.ts`, `testing/TestClock.d.ts`) and the source in `node_modules/effect/src`. Never guess at an Effect API.

- The pinned version is the `effect` entry in `pnpm-workspace.yaml`'s catalog; the published peer floor is under `catalogs.peers`. Raising the floor is a breaking change.
- Tagged errors are `Schema.TaggedError<Self>()(tag, fields)` classes.
- Since rc.118 there are no `effect/unstable/*` paths (HTTP is `effect/http/*`, HttpApi `effect/http-api/*`).
- Tests that need a fixed time use `TestClock` (`effect/testing/TestClock`): `TestClock.setTime` / `TestClock.adjust` under `Effect.provide(TestClock.layer())`.

## Agent sessions

- The SessionStart hook (`.claude/hooks/session-start.sh`) installs dependencies against the lockfile and puts `vp` (a re-exec shim that prefers the nearest worktree's `node_modules`), `fallow` and `tsx` on PATH for non-interactive shells. It hydrates no secrets; none are needed, and nothing here can publish.
- A PreToolUse hook (`.claude/hooks/fallow-gate.sh`) blocks `git commit` / `git push` when `fallow audit --base origin/trunk` fails; it reads the coverage map on disk, so run `vp run test:coverage` first. A PostToolUse hook runs `vp fmt` on every source, JSON, CSS or Markdown file you write or edit.
- Every gate in [Verification](#verification) runs in an agent session; `pnpm audit` needs the network.

## Documentation surfaces

`README.md` is both the landing page and the API reference consumers read on npm; `CONTRIBUTING.md` carries human setup, CI expectations and single-check commands; `PUBLISHING.md` the release pipeline and its one-time owner setup; `SECURITY.md` the reporting channel and supply-chain posture. No `docs/` tree is committed (`docs/` is docgen output); decisions go in issue comments.

---

## Fallow local gate

Before any `git commit` or `git push`, run `fallow audit --format json --quiet --explain --gate-marker agent --base origin/trunk`. If the verdict is `fail`, fix the reported findings before retrying. Treat JSON runtime errors like `{ "error": true, ... }` as non-blocking. Audit defaults to `gate=new-only`: only findings introduced by the current changeset affect the verdict.

## Fallow task map

| When the agent is about to... | Run |
| --- | --- |
| delete an "unused" export or file | `fallow dead-code --trace <file>:<export>` |
| delete an "unused" dependency | `fallow dead-code --trace-dependency <name>` |
| commit or open a PR | `fallow audit --base <ref>` |
| check which architecture rules apply to a file before changing it | `fallow guard <files>` |
| understand a finding | `fallow explain <issue-type>` |
