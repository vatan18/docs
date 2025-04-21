# Git Commands Cheat Sheet

## Configuration

### Setting up Git

```bash
# Set up your name
git config --global user.name "Your Name"

# Set up your email
git config --global user.email "your.email@example.com"

# Check your Git configuration
git config --list
```

---

## Repository

### Initialize a New Git Repository

```bash
git init
```

### Clone an Existing Repository

```bash
git clone <repository_url>
```

---

## Basic Snapshotting

### Check the Status of Your Repository

```bash
git status
```

### Add Changes to the Staging Area

```bash
# Add a specific file
git add <file_name>

# Add all files
git add .
```

### Commit Changes

```bash
# Commit with a message
git commit -m "Your commit message"
```

### View Commit History

```bash
git log

# View commit history in a single line format
git log --oneline
```

### View Changes

```bash
# View changes in the working directory
git diff

# View changes between commits
git diff <commit1> <commit2>
```

---

## Branching and Merging

### List Branches

```bash
git branch
```

### Create a New Branch

```bash
git branch <branch_name>
```

### Switch to a Branch

```bash
git checkout <branch_name>
```

### Create and Switch to a New Branch

```bash
git checkout -b <branch_name>
```

### Merge a Branch into the Current Branch

```bash
git merge <branch_name>
```

### Delete a Branch

```bash
git branch -d <branch_name>
```

---

## Remote Repositories

### List Remote Repositories

```bash
git remote -v
```

### Add a Remote Repository

```bash
git remote add <remote_name> <repository_url>
```

### Fetch Changes from a Remote Repository

```bash
git fetch <remote_name>
```

### Pull Changes from a Remote Repository

```bash
git pull <remote_name> <branch_name>
```

### Push Changes to a Remote Repository

```bash
git push <remote_name> <branch_name>
```

---

## Undoing Changes

### Unstage a File

```bash
git reset <file_name>
```

### Revert Changes in a File

```bash
# Discard changes in the working directory
git checkout -- <file_name>
```

### Reset to a Previous Commit

```bash
# Soft reset (keeps changes in the working directory)
git reset --soft <commit_hash>

# Hard reset (discards changes)
git reset --hard <commit_hash>
```

---

## Stashing

### Stash Changes

```bash
git stash
```

### List Stashes

```bash
git stash list
```

### Apply Stashed Changes

```bash
git stash apply
```

### Drop a Stash

```bash
git stash drop
```

---

## Additional Commands

### Show Commit Details

```bash
git show <commit_hash>
```

### Tagging

```bash
# Create a tag
git tag <tag_name>

# List tags
git tag
```

### Viewing a Specific File from a Commit

```bash
git show <commit_hash>:<file_path>
```
