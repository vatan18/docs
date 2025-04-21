# Git History Cleanup Guide

This guide explains how to remove specific commits from Git history while preserving later commits.

## Current Situation

Initial repository state has 4 commits:
```
4. abcd (latest)
3. abcc
2. abcb
1. abca (oldest)
```

## Objective
Remove commits `abca` and `abcb` while preserving `abcc` and `abcd`.

## Instructions

### 1. Start Interactive Rebase
```bash
git rebase -i HEAD~4
```

### 2. Edit Rebase File
When your editor opens, you'll see something like this:
```
pick abca first commit
pick abcb second commit
pick abcc third commit
pick abcd fourth commit
```

Change it to:
```
drop abca first commit
drop abcb second commit
pick abcc third commit
pick abcd fourth commit
```

### 3. Save and Complete
1. Save the file and close your editor
2. Git will automatically process the rebase

### 4. Push Changes
If this is a local-only repository:
```bash
git push
```

If you've already pushed these commits to a remote repository:
```bash
git push --force
```

## ⚠️ Important Warnings

1. This operation rewrites Git history
2. Using `--force` push can be dangerous in shared repositories
3. Always backup your repository before performing history-altering operations
4. Coordinate with your team before modifying shared history

## Best Practices

1. Make sure you have no uncommitted changes before starting
2. Create a backup branch before proceeding:
   ```bash
   git branch backup-before-rebase
   ```
3. Inform team members before force pushing to shared repositories
4. Consider using `git push --force-with-lease` instead of `--force` for added safety

## Troubleshooting

If something goes wrong during the rebase:
1. To abort the rebase:
   ```bash
   git rebase --abort
   ```
2. To restore from backup:
   ```bash
   git checkout backup-before-rebase
   ```