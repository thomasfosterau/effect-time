# Publishing & releases

Releases are automated with [Changesets](https://github.com/changesets/changesets) and published to npm via [OIDC trusted publishing](https://docs.npmjs.com/trusted-publishers) — there is no `NPM_TOKEN`. See [SECURITY.md](./SECURITY.md) for the security rationale behind the pipeline. (Copied from the effect-web library and adapted to a single package at the repository root.)

## The release flow

1. **Add a changeset with your change.** Run `pnpm changeset`, pick the bump (`patch` / `minor` / `major`) and write a user-facing summary, then commit the generated file alongside your change. Which changes need one is set out in [AGENTS.md](AGENTS.md#branches-and-pull-requests); a doc-comment change that reaches the emitted `.d.ts` takes a `patch`.
2. **Merge to `trunk`.** The [`Release`](./.github/workflows/release.yml) workflow runs and, while changesets are pending, opens or updates a **"chore: version packages"** PR that applies the version bump and rolls the changesets into `CHANGELOG.md`. The version step is `changeset version && vp fmt && pnpm install --lockfile-only`, with `"format": false` in `.changeset/config.json`: Changesets 3 otherwise auto-detects the `oxfmt` binary Vite+ installs and runs `oxfmt --write` on the new changelog, but that binary is Vite+'s IDE-only shim and exits 1 outside LSP mode, which fails the release before the PR is opened. `vp fmt` formats the changelog instead, so the version PR passes `vp check`.
3. **Merge the version PR.** With no changesets left, the workflow runs `pnpm run release`: it builds `dist/` (`vp run build`), publishes with `pnpm publish --ignore-scripts` (with provenance once the repository is public — see below), and runs `changeset tag`, whose `New tag:` output the Changesets action uses to push the tag and create the GitHub release.

`pnpm publish` rewrites the `catalog:` / `catalog:peers` specifiers to concrete versions and ranges and publishes natively: since pnpm 11 it no longer delegates to the npm CLI, and pnpm itself fetches the GitHub Actions OIDC token (audience `npm:registry.npmjs.org`) and exchanges it for a short-lived npm token. `--ignore-scripts` keeps any publish lifecycle script (`prepublishOnly`, `prepack`, …) out of the job holding `id-token: write`; the package defines none. Provenance is pnpm's call too: pnpm 11 takes settings like `provenance` only from `pnpm_config_*` (so an `NPM_CONFIG_PROVENANCE` would be ignored), and with none set it attaches provenance only when the OIDC token reports a public repository **and** the registry reports the package as public, skipping it with an `ERR_PNPM_PROVENANCE_INSUFFICIENT_INFORMATION` warning otherwise.

## Maintainer setup (one-time)

1. **Allow Actions to open the version PR.** In the repo: **Settings → Actions → General → Workflow permissions** → enable **"Allow GitHub Actions to create and approve pull requests"**. Without this the built-in `GITHUB_TOKEN` is forbidden from opening pull requests and the workflow fails at the PR-creation step, even though the job grants `pull-requests: write`.
2. **Bootstrap the package on npm.** `@thomasfosterau/effect-time` has never been published, and a trusted publisher can only be configured on a package that already exists. Publish the first version by hand from a clean checkout of the merged version PR (`pnpm install && vp run build && pnpm publish --access public`, with an npm login that has publish rights on the `@thomasfosterau` scope; no `--provenance`, which can only be generated on CI), or give the first `Release` run a short-lived granular token via a `NODE_AUTH_TOKEN` step that is removed afterwards.
3. **Configure the trusted publisher** on npmjs.com for the package → **Settings → Trusted Publisher**:
   - Provider: **GitHub Actions**
   - Repository: `thomasfosterau/effect-time`
   - Workflow: `release.yml`
   - Environment: `release`

   Then remove any classic automation tokens for the package.

4. **Protect the `release` environment.** **Settings → Environments → `release`** → enable **Required reviewers** (yourself) and restrict deployment to the `trunk` branch, so publishing pauses for manual approval.
5. **Protect `trunk`.** Require pull requests and the `ci` check before merge, and disallow direct pushes, so a release can only be triggered by merging the reviewed version PR.
