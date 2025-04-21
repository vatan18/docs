# `apt` Commands Documentation

`apt` is a package management tool used in Debian-based systems (such as Ubuntu) for installing, upgrading, and removing software packages. Below are key commands for managing packages efficiently.

### 1. Update Package Index
Updates the local package index to ensure you get the latest versions of the available packages.

```bash
sudo apt update
```

### 2. Upgrade Installed Packages
Upgrades all the currently installed packages to their latest available versions.

```bash
sudo apt upgrade
```

### 3. List Installed Packages
Lists all the packages that are currently installed on the system.

```bash
apt list --installed
```

### 4. List Specific Installed Package
Filters the list of installed packages to show only the specified package.

```bash
apt list --installed | grep <package_name>
```

### 5. Install a Package
Installs a specified package and its dependencies. The `-y` flag automatically answers 'yes' to any prompts.

```bash
sudo apt install <pkg> -y
```

### 6. Download a Package Only
Downloads a package without installing it.

```bash
sudo apt install <pkg> --download-only
```

### 7. Remove a Package
Removes the specified package from the system. The `-y` flag automatically confirms the action.

```bash
sudo apt remove <pkg> -y
```

### 8. Purge a Package
Removes the specified package along with its configuration files.

```bash
sudo apt purge <pkg> -y
```

### 9. Search for a Package
Searches the package repository for a specific package by keyword.

```bash
apt search <keyword>
```

### 10. Show Package Information
Displays detailed information about a specific package, including its version, description, and dependencies.

```bash
apt show <pkg>
```

### 11. Clean Up Unused Packages
Removes unnecessary packages that were automatically installed but are no longer required.

```bash
sudo apt autoremove
```

### 12. Upgrade Distribution
Upgrades the distribution, including new packages and potential system upgrades.

```bash
sudo apt dist-upgrade
```