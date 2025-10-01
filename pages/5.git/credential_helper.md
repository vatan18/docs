# Credential Helper Setup

### Windows
```bash
git config --global credential.helper wincred
```

### macOS
```bash
git config --global credential.helper osxkeychain
```

### Linux
```bash
git config --global credential.helper cache
```

## .git-credentials
Add credentials in $HOME/.git-credentials:
```
https://<github_username>:<github_token>@github.com
```