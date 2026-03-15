# Release Flow

This repo publishes `@lunarhue/store` to the public npm registry with
Changesets and GitHub Actions.

## Release model

- Stable releases only
- One publishable package: `packages/store`
- Release PR flow on `main`
- npm trusted publishing via GitHub Actions OIDC

## One-time setup

### npm trusted publisher

Register this repo as a trusted publisher for `@lunarhue/store` in npm before
the first publish.

Use these settings:

- Owner: `LunarHUE`
- Repository: `store`
- Workflow file: `.github/workflows/release.yml`
- Environment: leave unset unless you later add one to the workflow

Trusted publishing is the only supported publish auth path in this repo. Do
not add a long-lived `NPM_TOKEN` secret.

### GitHub branch protection

Protect `main` and require the `Package CI` workflow before merges. That
ensures the release PR is gated on the same package checks as feature PRs.

## Maintainer commands

- `bun run changeset`: create a new changeset
- `bun run release:check`: build, typecheck, test, and dry-run pack the package
- `bun run release:version`: apply pending changesets and refresh the lockfile
- `bun run release:publish`: rerun release checks and publish with Changesets

## Day-to-day release flow

1. For any user-facing package change, add a changeset in the same PR.
2. Merge the PR to `main`.
3. Let the `Release` workflow open or update the release PR.
4. Review the version bump and generated changelog in that release PR.
5. Merge the release PR to trigger npm publish and GitHub release creation.
6. Verify the published package on npm and the generated GitHub release notes.

PRs that do not affect the published package do not need a changeset. This repo
does not fail CI for missing changesets in v1 because not every PR should
produce a release entry.

## Validation checklist

Before merging a release PR, make sure:

- `bun run release:check` passes locally or in CI
- the pending version is correct
- the changelog entry matches the shipped package changes
- `packages/store/README.md` and `packages/store/LICENSE` are present for npm

## Failure handling

### Trusted publisher not configured

If npm trusted publishing has not been configured, the publish step in
`.github/workflows/release.yml` will fail. Fix the npm trusted publisher
settings and rerun the workflow.

### No pending changesets

If `main` has no pending changesets, the release workflow exits without opening
a release PR or publishing.

### Publish failure after merge

If publish fails after the release PR is merged, fix the issue and rerun the
`Release` workflow. If a bad version was already published, deprecate it on npm
instead of unpublishing it.
