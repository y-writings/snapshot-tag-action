# snapshot-tag-action

Reusable GitHub Action for deriving immutable weekly snapshot tags in the form `vYYYY.MM.DD`, checking whether the remote tag already exists, and optionally creating the tag through the GitHub API.

## Requirements

- For read-only lookup, the workflow token needs permission to read repository contents.
- For `create_if_missing: true`, the workflow token needs `contents: write`.
- External consumers do **not** need `actions/checkout` when using a published ref of this action.
- Local development workflows that use `uses: ./` still need `actions/checkout`, because the runner needs the local action files in the workspace.

## Inputs

| Name | Required | Description |
| --- | --- | --- |
| `snapshot_date` | No | Optional override in `YYYY.MM.DD` format. When omitted, the action uses the current UTC date. |
| `github_token` | No | GitHub token used for remote tag lookup and optional creation. Defaults to `${{ github.token }}`. |
| `create_if_missing` | No | When `true`, create the remote lightweight tag if it is missing. Defaults to `false`. |
| `target_ref` | No | Branch to resolve when `create_if_missing` is `true`, for example `main` or `refs/heads/main`. Mutually exclusive with `target_sha`. |
| `target_sha` | No | Explicit commit SHA to tag when `create_if_missing` is `true`. Mutually exclusive with `target_ref`. Either `target_ref` or `target_sha` is required when `create_if_missing` is `true`. |

## Outputs

| Name | Description |
| --- | --- |
| `tag` | Resolved snapshot tag, for example `v2026.04.19`. |
| `tag_exists` | `true` when the tag already existed in the remote repository before the action ran, otherwise `false`. |
| `created` | `true` when this action created the remote tag during the current run, otherwise `false`. |
| `target_sha` | Commit SHA referenced by the existing or newly created tag when available. |

## Usage

```yaml
name: weekly-snapshot

on:
  schedule:
    - cron: '0 0 * * 1'
  workflow_dispatch:
    inputs:
      snapshot_date:
        description: Optional override in YYYY.MM.DD format for manual recovery.
        required: false
        type: string

permissions:
  contents: write

jobs:
  create-snapshot-tag:
    runs-on: ubuntu-latest
    steps:
      - id: snapshot-tag
        uses: y-writings/snapshot-tag-action@v1
        with:
          snapshot_date: ${{ inputs.snapshot_date }}
          create_if_missing: 'true'
          target_ref: main
          github_token: ${{ github.token }}
```

## Local development workflow usage

When this repository tests the action with `uses: ./`, it still needs checkout because the runner must load the local action files:

```yaml
- uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd # v6.0.2
- id: snapshot-tag
  uses: ./
  with:
    snapshot_date: 2099.12.31
    github_token: ${{ github.token }}
```

## Development

```bash
mise exec -- pnpm install
mise exec -- pnpm test
mise exec -- pnpm typecheck
mise exec -- pnpm build
```

## Publishing for external reuse

Once you create a public version tag such as `v1`, downstream repositories can use:

```yaml
- uses: y-writings/snapshot-tag-action@v1
```
