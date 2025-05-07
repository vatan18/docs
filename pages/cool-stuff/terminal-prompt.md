## 🎨 Custom Terminal Prompt with Git Branch & Colors

Customize your terminal prompt to show the current folder, Git branch (if available), and use clean formatting with color.

---

### 🛠️ Requirements

- **Bash shell**
- **Git installed**

---

### 🚀 Features

- 🟢 Shows **current Git branch**
- 🎨 Adds **color and format** to your prompt
- 📁 Displays **current folder name**
- 🧠 Helps differentiate environments visually

---

### 📝 Steps to Implement

#### 1. Edit `~/.bashrc`

Open `.bashrc` file:

```bash
nano ~/.bashrc
Add the following code at the bottom:

bash
Copy code
# Function to get current Git branch
get_git_branch() {
    if git rev-parse --is-inside-work-tree &>/dev/null; then
        branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
        echo -e " ☢ $branch"
    else
        echo ""
    fi
}

# Custom colored prompt with Git branch and current folder
PS1='\[\e[1;30m\]┌──(\W)$(get_git_branch)\n└\[\e[1;36m\]> \[\e[0m\]'
2. Apply the changes
Run this to reload your shell settings:

bash
Copy code
source ~/.bashrc
✅ Result
Your terminal prompt will now look like this:

scss
Copy code
┌──(tracker-cms-server) ☢ development
└>
tracker-cms-server → current folder

☢ development → current Git branch (if in a repo)

Colored formatting for clean readability