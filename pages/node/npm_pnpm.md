# `npm` and `pnpm` Commands Documentation

This document provides key commands for managing packages using `npm` (Node Package Manager) and `pnpm` (a fast, disk space-efficient package manager for Node.js). Both are used for managing dependencies in JavaScript projects, but `pnpm` is known for its performance and disk space optimizations.

### **Installing npm and pnpm**

#### **Install npm**
`npm` is typically installed automatically with Node.js. To install Node.js and npm:

1. Install Node.js from [nodejs.org](https://nodejs.org/).
2. npm will be installed alongside Node.js.

Verify installation:
```bash
node -v
npm -v
```

#### **Install pnpm**
To install `pnpm` globally, use the following command:
```bash
npm install -g pnpm
```

Verify installation:
```bash
pnpm -v
```

---

## **npm Commands**

`npm` is the default package manager for Node.js. It allows you to install, update, and manage project dependencies.

### 1. List Globally Installed Packages

Displays all globally installed npm packages.

```bash
npm -g list
```

### 2. Install a Package Locally

Installs a package in the current project’s `node_modules` directory.

```bash
npm install <pkg>
```

### 3. Install a Package Globally

Installs a package globally, making it accessible from anywhere on the system.

```bash
npm install -g <pkg>
```

### 4. Uninstall a Package Locally

Removes a locally installed package from the `node_modules` directory.

```bash
npm uninstall <pkg>
```

### 5. Uninstall a Package Globally

Removes a globally installed package.

```bash
npm uninstall -g <pkg>
```

### 6. Install a Specific Version of a Package

Installs a specific version of a package.

```bash
npm install <pkg>@<version>
```

### 7. View Package Information

Shows detailed information about a package, including its dependencies and version.

```bash
npm show <pkg>
```

### 8. Update All Dependencies

Updates all the dependencies in the `package.json` file to their latest versions.

```bash
npm update
```

### 9. Initialize a New Node Project

Creates a new `package.json` file in the current directory. Useful for starting a new Node.js project.

```bash
npm init
```

---

## **pnpm Commands**

`pnpm` is a fast, disk-efficient alternative to npm. It uses a unique approach to store packages that reduces the amount of disk space used.

### 1. Install a Package Locally

Installs a package in the current project’s `node_modules` directory.

```bash
pnpm add <pkg>
```

### 2. Install a Package Globally

Installs a package globally, making it accessible from anywhere on the system.

```bash
pnpm add -g <pkg>
```

### 3. Uninstall a Package Locally

Removes a locally installed package from the `node_modules` directory.

```bash
pnpm remove <pkg>
```

### 4. Uninstall a Package Globally

Removes a globally installed package.

```bash
pnpm remove -g <pkg>
```

### 5. List Installed Packages Locally

Lists all the packages installed in the current project.

```bash
pnpm list
```

### 6. List Installed Packages Globally

Lists all globally installed packages with `pnpm`.

```bash
pnpm list -g
```

### 7. Install Dependencies

Installs all dependencies listed in the `package.json` file.

```bash
pnpm install
```

### 8. Initialize a New Node Project

Creates a new `package.json` file in the current directory. Useful for starting a new Node.js project.

```bash
pnpm init
```

### 9. Update Dependencies

Updates all dependencies to their latest versions according to the version rules in the `package.json` file.

```bash
pnpm update
```

### 10. Install a Specific Version of a Package

Installs a specific version of a package.

```bash
pnpm add <pkg>@<version>
```
