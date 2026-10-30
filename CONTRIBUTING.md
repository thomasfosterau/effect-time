# Contributing

Maintained by Thomas Foster, with a workflow meant to be approachable for both humans and coding agents. Conventions are in [AGENTS.md](AGENTS.md).

## Setup

You need Node.js 22 or later and pnpm 11 (the exact version is pinned by `packageManager` in `package.json`; `corepack enable` picks it up).

```sh
pnpm install
```

The install also runs `prepare`, which installs the Vite+ git hooks and patches the native `tsc` / `oxlint` with `@effect/tsgo` (Effect diagnostics in the type gate and the linter). `vp` is in `node_modules/.bin`; put that on your `PATH`, or install the Vite+ CLI globally.

## Branches

Branch off `trunk`, rebase rather than merge, squash-merge with a conventional prefix: see [AGENTS.md](AGENTS.md#branches-and-pull-requests).

## Git hooks

Hooks are managed by Vite+; the editable [.vite-hooks/pre-commit](.vite-hooks/pre-commit) is committed. **pre-commit** runs `vp staged` (format + lint on staged files). There is no pre-push hook.

## CI expectations

[ci.yml](.github/workflows/ci.yml) runs one required job, `ci`, whose steps are the gate list in [AGENTS.md](AGENTS.md#verification). [release.yml](.github/workflows/release.yml) runs changesets/action on `trunk`: it opens the version PR while unreleased changesets exist and publishes once it merges, via npm OIDC trusted publishing (see [PUBLISHING.md](PUBLISHING.md)).

The workflows are hardened for pull requests, Dependabot's included: `permissions: {}` at the top with per-job grants, every action pinned to a commit SHA (Dependabot's `github-actions` group keeps them current), `persist-credentials: false` on every checkout except the Release job's (it pushes), no `pull_request_target` / `workflow_run`, no secret or OIDC in a job a pull request can trigger, and a Release job that never runs for `dependabot[bot]`. `uvx zizmor .github` audits them; its exemptions are in [.github/zizmor.yml](.github/zizmor.yml).

## Pre-PR checklist

1. The gates in [AGENTS.md](AGENTS.md#verification), each with its final pass/fail.
2. A changeset (`pnpm changeset`) where [AGENTS.md](AGENTS.md#branches-and-pull-requests) requires one.
3. `git fetch origin trunk && git rebase origin/trunk`
4. Docs: `README.md` for any exported change; `AGENTS.md` for a new invariant.

## Running individual checks

```sh
vp lint                                  # oxlint
vp fmt                                   # oxfmt
vp check                                 # both
vp run check                             # the type gate
vp run test:unit                         # unit tests
vp test run tests/index.test.ts          # a single file
vp run build                             # emit dist/
vp run docgen                            # run the examples + API reference
vp run test:coverage                     # the Istanbul map for fallow
vp run fallow:audit                      # change-set review (not a CI gate)
```
