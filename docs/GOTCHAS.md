# Gotchas

## `gh` commands: never pass `--repo`

`gh` infers the repo from the git remote of the current directory. Passing `--repo` explicitly overrides this and can silently point at the wrong org/project (e.g. `anomalyco/brandon-portfolio` vs `liuandrew/brandon-portfolio`).

```bash
# Correct — gh figures out the repo from the local clone
gh issue list
gh issue view 2

# Wrong — overrides the repo and may hit a different project
gh issue list --repo anomalyco/brandon-portfolio
```

If you need to confirm which repo `gh` resolves to, run:

```bash
gh repo view --json nameWithOwner
```

## `gh issue view` prints a Projects (classic) deprecation warning

This is a noisy-but-harmless GraphQL deprecation notice from GitHub's API. The issue content still renders underneath. To bypass it, use `--json` which queries a different API path:

```bash
# Noisy
gh issue view 2

# Clean
gh issue view 2 --json title,body
```
