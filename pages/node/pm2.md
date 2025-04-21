# PM2 Usage Guide

## PM2 Commands Overview

PM2 is a production process manager for Node.js applications, which ensures that your apps stay online 24/7. Below are some common commands and setups for working with PM2.

### 1. Fetch Latest Code and Set Up the Project

Before deploying or running the application, it's important to ensure you have the latest code and dependencies set up:

```bash
# Fetch the latest changes from the repository and reset to a specific branch (e.g., release/manish)
git fetch origin && git reset origin/release/manish --hard

# Remove existing node modules and the yarn lock file
rm -rf node_modules
rm yarn.lock

# Install dependencies
yarn install

# Build the project
yarn build

# Reload all PM2 processes with the updated environment variables
pm2 reload all --update-env
```

### 2. Starting and Managing PM2 Processes

PM2 allows you to manage your Node.js application processes. Below are the commands to start and manage your app:

```bash
# Install PM2 globally (if not installed)
npm install -g pm2

# Start the app using PM2 (this starts the app from the package.json "start" script)
pm2 start npm -- start

# Reload all PM2 processes with updated environment variables
pm2 reload all --update-env

# Start the app directly with PM2 (this starts the app from the package.json "start" script)
pm2 start

# Reload all PM2 processes with updated environment variables (again)
pm2 reload all --update-env
```

### 3. Managing PM2 Processes

Once PM2 is running your application, you can manage the processes in various ways.

```bash
# List all running PM2 processes
pm2 list

# Show detailed information about a specific PM2 process (e.g., process ID 0)
pm2 show 0

# Stop a PM2 process (e.g., process ID 0)
pm2 stop 0

# Restart a PM2 process (e.g., process ID 0)
pm2 restart 0

# Stop all PM2 processes
pm2 stop all

# Restart all PM2 processes
pm2 restart all

# Delete a PM2 process (e.g., process ID 0)
pm2 delete 0

# Delete all PM2 processes
pm2 delete all
```

### 4. Monitoring PM2 Processes

PM2 allows you to monitor the status of running processes, including logs and performance metrics.

```bash
# View logs for a specific PM2 process (e.g., process ID 0)
pm2 logs 0

# View logs for all PM2 processes
pm2 logs

# Monitor CPU and memory usage of all PM2 processes
pm2 monit

# View real-time CPU and memory usage of a specific PM2 process (e.g., process ID 0)
pm2 show 0 --json
```

### 5. Managing Environments and Configurations

PM2 also allows you to manage environment-specific configurations for different stages of deployment (development, production, etc.).

```bash
# Start an app with a specific environment (e.g., production)
pm2 start app.js --env production

# Start an app with environment variables (e.g., API_KEY)
pm2 start app.js --env production --env API_KEY=your-api-key

# Save the PM2 process list and environment settings for reboot persistence
pm2 save

# Generate the PM2 startup script to keep your app running after a server restart
pm2 startup

# To restart the app on system reboot, use the saved process list
pm2 resurrect
```

### 6. Automating PM2 Process Management with Ecosystem File

You can use a **PM2 ecosystem file** to define the configuration for your app, making it easier to manage multiple environments.

```bash
# Start the app using the ecosystem file (ecosystem.config.js)
pm2 start ecosystem.config.js

# Reload all processes defined in the ecosystem file
pm2 reload ecosystem.config.js

# Delete processes defined in the ecosystem file
pm2 delete ecosystem.config.js
```

---

## Development Setup

Follow these steps to set up the development environment for your project.

1. **Git Pull**: Fetch the latest changes from the repository.

   ```bash
   git pull origin main
   ```

2. **Set Up `.env`**: Configure the environment variables for the project by creating or updating the `.env` file.

3. **Install Node 18**: Ensure Node.js version 18 is installed. You can use tools like `nvm` to manage the Node.js versions.

   ```bash
   nvm install 18
   nvm use 18
   ```

4. **Install Yarn Globally**: Install Yarn package manager globally.

   ```bash
   npm install --global yarn
   ```

5. **Install Dependencies**: Install the project dependencies using Yarn.

   ```bash
   yarn install
   ```

6. **Build the Project**: Compile or build the project files.

   ```bash
   yarn build
   ```

7. **Start the Development Server**: Run the development server.

   ```bash
   yarn start
   ```

---

## ILTA Setup (for specific environment)

If you are setting up the ILTA (International Legal Technology Association) environment, follow these specific instructions:

1. **Git Pull**: Fetch the latest changes from the repository.

   ```bash
   git pull origin ilta
   ```

2. **Set Up `.env`**: Set up the `.env` file for the ILTA environment, which may differ from the normal build setup.

3. **Install Node 18**: Ensure Node.js version 18 is installed.

   ```bash
   nvm install 18
   nvm use 18
   ```

4. **Install Yarn Globally**:

   ```bash
   npm install -g yarn
   ```

5. **Install Dependencies**: Install the project dependencies using Yarn.

   ```bash
   yarn install
   ```

6. **Build the ILTA Version**: Build the project for the ILTA environment.

   ```bash
   yarn build:ilta
   ```

7. **Start the ILTA Server**: Run the server for the ILTA environment.

   ```bash
   yarn start
   ```

---

## Summary of PM2 Commands

Here’s a quick reference to the important PM2 commands used in this guide:

- **Process Management**: `pm2 start`, `pm2 stop`, `pm2 restart`, `pm2 delete`, `pm2 reload`
- **Monitoring**: `pm2 monit`, `pm2 logs`, `pm2 show`, `pm2 list`
- **Startup and Persistence**: `pm2 save`, `pm2 startup`, `pm2 resurrect`
- **Environment Configuration**: `pm2 start app.js --env production`
- **Ecosystem File Management**: `pm2 start ecosystem.config.js`, `pm2 reload ecosystem.config.js`

---

### Key Updates:
1. **All PM2 commands included**: From starting processes to managing environments and monitoring logs.
2. **Clear explanations**: Each command is paired with a clear description of its function.
3. **Complete guide**: Covers both development and production setups, as well as specific instructions for different environments like ILTA.

Let me know if you need any additional modifications!