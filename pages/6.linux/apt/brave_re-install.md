# Uninstall and Reinstall Brave Browser on Ubuntu

This guide explains how to **completely uninstall** and then **reinstall** the Brave browser on Ubuntu using the command line.

---

## 🧹 Step 1: Uninstall Brave

Open the **Terminal** by pressing `Ctrl + Alt + T` or searching for “Terminal” in your applications.

### If installed with `apt`

Run the following commands:

#### 1. Remove the Brave browser package:
```bash
sudo apt remove brave-browser brave-keyring
````

#### 2. Delete any leftover configuration files:

```bash
sudo apt purge brave-browser
```

#### 3. Remove the Brave repository file:

```bash
sudo rm /etc/apt/sources.list.d/brave-browser-release.list
```

#### 4. Update your package list:

```bash
sudo apt update
```

#### 5. (Optional) Remove local configuration and cache files:

```bash
rm -rf ~/.config/BraveSoftware
rm -rf ~/.cache/BraveSoftware
```

---

### If installed as a Snap package

Run this command:

```bash
sudo snap remove brave
```

---

## 🔁 Step 2: Reinstall Brave

After uninstalling, you can reinstall Brave using one of the following methods.

---

### ✅ Recommended: Install via Brave Repository

Installing via the **official Brave repository** is recommended for the best performance and stability.

#### 1. Install dependencies:

```bash
sudo apt install curl
```

#### 2. Import Brave’s GPG key:

```bash
sudo curl -fsSLo /usr/share/keyrings/brave-browser-archive-keyring.gpg \
https://brave-browser-apt-release.s3.brave.com/brave-browser-archive-keyring.gpg
```

#### 3. Add the Brave repository:

```bash
echo "deb [signed-by=/usr/share/keyrings/brave-browser-archive-keyring.gpg] \
https://brave-browser-apt-release.s3.brave.com/ stable main" | \
sudo tee /etc/apt/sources.list.d/brave-browser-release.list
```

#### 4. Update package list:

```bash
sudo apt update
```

#### 5. Install Brave Browser:

```bash
sudo apt install brave-browser
```

---

### 🧩 Alternative: Install via Snap Store

If you prefer Snap (simpler but less flexible), run:

```bash
sudo snap install brave
```

---

## ℹ️ Notes

* Using the **APT repository** ensures you receive the latest updates directly from Brave.
* If you face issues, check official docs:
  🔗 [Brave Help Center](https://support.brave.com)
  🔗 [Ask Ubuntu Brave Removal Guide](https://askubuntu.com)

---

## 💬 References

* [Brave Help Center: How do I uninstall Brave? (Jul 25, 2023)](https://support.brave.com)
* [Ask Ubuntu: How do I remove Brave completely? (Mar 14, 2020)](https://askubuntu.com)
* [Reddit: Need to uninstall Brave Web browser (Sept 2024)](https://reddit.com)
* [Brave Official Linux Installation Guide](https://brave.com/linux/)
* [YouTube: Installing Brave on Ubuntu (Jul 29, 2023)](https://youtube.com)

---

**Author:** *vatu S*
**Platform:** Ubuntu Linux
**Last Updated:** October 2025

```
