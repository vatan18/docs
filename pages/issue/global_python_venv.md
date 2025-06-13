

# 🐍 Setting Up a Global Python Virtual Environment on Ubuntu

If you want to use a dedicated Python environment globally on your system — one that persists across terminal sessions and reboots — this guide will help you set it up cleanly and efficiently.

---

## ✅ Step 1: Create a Global Virtual Environment

Create a folder to store virtual environments if it doesn't already exist:

```bash
mkdir -p ~/.venvs

Then create your global virtual environment:

python3.10 -m venv ~/.venvs/global

Using ~/.venvs is a common convention for personal virtual environments.
⚙️ Step 2: Automatically Activate the Global Environment on Terminal Start

Add the following line to your shell configuration file (e.g., ~/.bashrc or ~/.zshrc):

source ~/.venvs/global/bin/activate

Then, apply the changes immediately by sourcing the file:

source ~/.bashrc    # or use source ~/.zshrc if you're using zsh

Now, every time you open a new terminal, your global Python virtual environment will be activated automatically.
🧪 Step 3: Use Python and pip Within This Environment
Check Python version:

python --version

Install packages:

pip install <package_name>

Packages installed this way will remain isolated from your system-wide Python installation.
📝 Notes

    ✅ This won’t interfere with your system Python.

    🔁 You can still create project-specific environments inside project folders using:

python -m venv .venv

🚫 To deactivate the global environment temporarily:

deactivate
