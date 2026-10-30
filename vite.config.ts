/**
 * The one Vite+ configuration for this single-package repository: the
 * repo-wide format / lint / staged passes (read statically by `vp fmt` /
 * `vp lint` / `vp staged`), the task graph (`check`, `build`, `test:unit`,
 * `test:coverage`, `docgen`), the `vp pack` (tsdown) settings, the alias that
 * lets tests import the package by name and resolve to `src/`, and the
 * vitest / coverage settings.
 *
 * Shaped after the effect-web library's root `vite.config.ts` and its shared
 * `vite.package.ts`, folded into one file because the repository root is the
 * package: every comment that explains a load-bearing decision is part of the
 * standard and travels with the config.
 *
 * @copyright Thomas Foster
 */

import { defineConfig } from "vite-plus";
import { recommended } from "@effect/tsgo/oxlint-presets";
import effect from "@enfect/oxlint";

const NAME = "@thomasfosterau/effect-time";

/**
 * Input fingerprint for the cached tasks: auto tracking minus node_modules
 * bookkeeping churn (pnpm rewrites `.modules.yaml` on every install) and the
 * generated docs, with the lockfile back explicitly so a dependency upgrade
 * still invalidates a type-check or a test run.
 */
const cacheInputs = [{ auto: true }, "!node_modules/**", "!docs/**", "pnpm-lock.yaml"];

const maxWorkers = process.env["VITEST_MAX_WORKERS"];

export default defineConfig({
  // Staged-file checks run by `vp staged` (pre-commit).
  staged: {
    "*.{js,ts,css,json,md}": "vp check --fix",
  },
  fmt: {
    ignorePatterns: ["**/dist/**", "**/docs/**", "**/coverage/**"],
    overrides: [
      {
        files: ["**/*.md"],
        options: {
          proseWrap: "never",
        },
      },
    ],
  },
  lint: {
    ignorePatterns: ["**/dist/**", "**/docs/**", "**/coverage/**", "**/node_modules/**"],
    extends: [recommended, effect.configs.recommended],
    // oxlint's default plugins plus `import`, `vitest` and `jsdoc`. Not
    // `promise`: `src/` holds no Promise code (failures are Effects), and its
    // rules only fire on the tests' `Effect.runPromise(…).then(…)` bodies,
    // whose resolved value vitest discards by design.
    plugins: ["eslint", "typescript", "unicorn", "oxc", "import", "vitest", "jsdoc"],
    categories: {
      correctness: "error",
      suspicious: "error",
      perf: "error",
    },
    rules: {
      "jsdoc/check-tag-names": ["error", { definedTags: ["category"] }],
      // `_tag` is the discriminant of every Effect tagged value and error.
      "eslint/no-underscore-dangle": ["error", { allow: ["_tag"] }],
      "eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "eslint/prefer-const": "warn",
      // The `Buffer` global is typed `any` wherever a consumer loads
      // @cloudflare/workers-types next to @types/node (every application this
      // family serves), so every call on it is unchecked there. Use
      // Uint8Array / TextEncoder / DataView instead.
      "eslint/no-restricted-globals": [
        "error",
        {
          name: "Buffer",
          message:
            "The `Buffer` global is typed `any` wherever @cloudflare/workers-types is loaded. Use Uint8Array / TextEncoder / DataView.",
        },
      ],
      // `casting-awareness` is an awareness prompt, not a defect rule — it
      // fires on every `as`. Stays visible as a warning.
      "effect/casting-awareness": "warn",
      // Hard-codes abbreviations (`Arr`, `P`, `R`, …) with no options, so it is
      // unsatisfiable under the full-name convention (`import * as Option from
      // "effect/Option"`) this family shares with its consumers.
      "effect/prefer-namespace-imports": "off",
      // This package exists to be a barrel: its whole published surface is
      // `export * as Clock` / `export * as DateTime` in `src/index.ts`, so the
      // rule that discourages barrel re-exports cuts across the package's
      // purpose. Consumers that want per-module imports use `effect/*`.
      "effect/no-barrel-imports": "off",
      "typescript/no-explicit-any": "off",
      "typescript/no-empty-object-type": "off",
      "typescript/ban-ts-comment": "off",
      "unicorn/no-empty-file": "off",
      "vite-plus/prefer-vite-plus-imports": "error",
    },
    overrides: [
      // Build/test configs are evaluated by Vite and Vitest in bare Node,
      // before any Effect runtime exists — there is no `Config` provider to
      // read from and no `FileSystem` service to call, so `process.env` and
      // `node:*` are the only things that work there. The Effect preset's
      // service rules have no satisfiable fix in these files.
      {
        files: ["**/vite.config.ts"],
        rules: {
          "effect/avoid-node-imports": "off",
          "effect/avoid-sync-fs": "off",
          "effect/avoid-process-env": "off",
          "effect/use-console-service": "off",
          "effect/use-filesystem-service": "off",
          "effect/use-path-service": "off",
          // `...(process.env.X ? { x } : {})` is how a vitest option is left
          // unset under `exactOptionalPropertyTypes`.
          "effect/no-conditional-empty-object-spread": "off",
        },
      },
      // The test files ARE the run boundary the rule names ("keep runtime
      // execution at the boundary (entrypoint/test harness)"): a test has to
      // run the effect it asserts on.
      {
        files: ["tests/**/*.ts"],
        rules: {
          "effect/effect-run-in-body": "off",
        },
      },
    ],
    // Type-aware linting is intentionally disabled: type checking stays the
    // `check` task's job (native tsc, Effect-patched).
    options: {
      typeAware: false,
      typeCheck: false,
    },
    jsPlugins: [
      {
        name: "vite-plus",
        specifier: "vite-plus/oxlint-plugin",
      },
    ],
  },
  run: {
    tasks: {
      // The CI type gate: `src` under the native, Effect-patched `tsc`, then
      // the tests under tsconfig.test.json, which resolves the package name
      // to `src/` so the build is never needed first.
      check: {
        command: "tsc -p tsconfig.json && tsc -p tsconfig.test.json",
        cache: { input: cacheInputs, output: [] },
      },
      // The published artifact: one ESM bundle + declaration file per entry
      // point (`vp pack` → tsdown, `platform: neutral`). `sideEffects:
      // false` is a claim about this output: no top-level statements.
      build: {
        command: "vp pack",
        cache: { input: cacheInputs, output: ["dist/**"] },
      },
      "test:unit": {
        command: "vp test run tests",
        cache: { env: ["VITEST_MAX_WORKERS", "NODE_OPTIONS"], input: cacheInputs, output: [] },
      },
      // The unit suite under one Istanbul coverage map
      // (`coverage/coverage-final.json`), which `fallow audit` reads for exact
      // per-function CRAP scores (`health.coverage` in .fallowrc.json).
      // Without it fallow estimates every function as uncovered, and any
      // function with cyclomatic complexity ≥ 5 fails the gate on its own.
      // Run this before `fallow audit` (the Claude Code PreToolUse hook
      // `.claude/hooks/fallow-gate.sh` runs the audit on `git commit` /
      // `git push` but never refreshes this map).
      "test:coverage": {
        command: "vp test run tests --coverage",
        cache: false,
      },
      // Compiles AND RUNS every JSDoc `@example` (see docgen.json). Examples
      // import the package by name exactly as a consumer would, which
      // resolves through `exports` to `dist/` — hence the build edge.
      docgen: {
        command: "docgen",
        dependsOn: ["build"],
        cache: { input: cacheInputs, output: ["docs/**"] },
      },
    },
  },
  pack: {
    entry: { index: "src/index.ts" },
    format: "esm",
    platform: "neutral",
    dts: true,
    outDir: "dist",
    clean: true,
  },
  resolve: {
    // Tests import the package by name, exactly as a consumer would (and as
    // tsconfig.test.json's `paths` type-checks them), so the runner resolves
    // that name to `src/` rather than to the built `dist/` that `exports`
    // points at — a unit run never needs a build first.
    alias: [
      {
        find: new RegExp(`^${NAME.replaceAll("/", "\\/")}$`),
        replacement: new URL("./src/index.ts", import.meta.url).pathname,
      },
    ],
  },
  test: {
    include: ["tests/**/*.test.ts"],
    testTimeout: 30_000,
    ...(maxWorkers === undefined ? {} : { maxWorkers: Number(maxWorkers) }),
    coverage: {
      provider: "istanbul",
      // `json` writes coverage-final.json, the Istanbul map `fallow audit`
      // reads for exact per-function CRAP scores (`health.coverage` in
      // .fallowrc.json); without it every function scores as uncovered.
      reporter: ["text-summary", "json-summary", "json"],
      reportsDirectory: "./coverage",
      include: ["src/**/*.ts"],
      exclude: ["**/*.d.ts"],
      thresholds: { statements: 90, branches: 85, functions: 90, lines: 90 },
    },
  },
});
