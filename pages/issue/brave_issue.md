## 🛠️ Fixing Brave Browser Repository Warning on `sudo apt update`

When running:

```bash
sudo apt update

You might see this warning related to the Brave Browser repository:

N: Skipping acquire of configured file 'main/binary-i386/Packages' as repository 'https://brave-browser-apt-release.s3.brave.com stable InRelease' doesn't support architecture 'i386'

❓ Why does this happen?

Brave’s repository does not provide packages for 32-bit architecture (i386).
If your system is 64-bit (most are), this can be safely ignored.
However, to keep your terminal output clean and avoid confusion, you can explicitly restrict Brave’s repo to your system architecture (typically amd64).
✅ How to fix it

    Open the Brave repo source list:

sudo nano /etc/apt/sources.list.d/brave-browser-release.list

    Edit the line so it looks like this:

deb [arch=amd64 signed-by=/etc/apt/keyrings/brave-browser-archive-keyring.gpg] https://brave-browser-apt-release.s3.brave.com/ stable main

    Save and exit:

        Press Ctrl + O, then Enter to save

        Press Ctrl + X to exit

    Update apt:

sudo apt update

No more warnings! 🎉
🧼 Optional: Clean up your system

Free up unused packages and clear cache:

sudo apt autoremove
sudo apt clean

This keeps your system lean and fast.