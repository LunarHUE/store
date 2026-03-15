# Changesets

This repo uses Changesets to track user-facing package releases for
`@lunarhue/store`.

## Maintainer flow

1. Add a changeset for package changes that should ship to consumers.
2. Merge the PR to `main`.
3. Let the release workflow open or update the release PR.
4. Merge the release PR to publish to npm.

PRs that do not change the published package do not need a changeset.
