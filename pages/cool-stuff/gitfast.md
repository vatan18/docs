## ⚡ Quick Git Commit & Push Setup

This setup lets you quickly stage, commit, and push changes with a custom message using one simple command.

---

### 🔧 1. Add to `~/.bashrc`

Open your terminal and run:

```bash
nano ~/.bashrc
Then, add the following function at the bottom:

bash
Copy code
# Quick Git commit + push function
gitfast() {
  if [ -z "$1" ]; then
    echo "❗ Usage: gitfast \"Your commit message\""
  else
    git add .
    git commit -am "$1"
    git push
  fi
}
Save and exit the file (Ctrl + O, Enter, Ctrl + X).

🔁 2. Reload Your Shell
Apply the changes by running:

bash
Copy code
source ~/.bashrc
🚀 3. Usage
From any Git repo:

bash
Copy code
gitfast "Added feature XYZ"
This will:

Stage all changes (git add .)

Commit them with your message

Push to the current branch