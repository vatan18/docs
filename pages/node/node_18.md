# Installing Node.js 18 on Ubuntu for All Users

## 1. Update Your Package List

```bash
sudo apt update
```

## 2. Install the Required Dependencies

```bash
sudo apt install -y curl
```

## 3. Add NodeSource Repository

NodeSource maintains Node.js binary distributions. To add the NodeSource repository for Node.js 18:

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
```

## 4. Install Node.js 18

```bash
sudo apt install -y nodejs
```

## 5. Verify the Installation

```bash
node -v    # verify Node.js version
npm -v     # verify npm version
```

These commands will install Node.js 18 and the associated npm package manager, making them available to all users on the system.
