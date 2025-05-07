# Custom Terminal Prompt Implementation

This guide provides instructions to create a custom terminal prompt with Git branch detection, colored output, and dynamic formatting for your terminal session.

## Requirements

- Bash shell (`bash`)
- Git installed on your system

## Key Features

1. **Git Branch Detection**: Displays the current Git branch (if inside a Git repository).
2. **Custom Colors**: Includes colors for different parts of the prompt.
3. **Dynamic Format**: Changes based on the context (e.g., different prompt style for production or non-production environments).

## Steps to Implement

1. **Open the `.bashrc` file**:
   Open your terminal and edit the `.bashrc` file using a text editor:

   ```bash
   sudo nano ~/.bashrc
Add the following code:

bash
Copy
Edit
# Function to get the current Git branch
get_git_branch() {
    if git rev-parse --is-inside-work-tree &>/dev/null; then
        branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
        echo -e " ☢ $branch"
    else
        echo " "
    fi
}

# Custom prompt format
PS1='\[\e[1;30m\]┌──(\W)$(get_git_branch)\n└\[\e[1;36m\]> \[\e[0m\]'
This configuration sets the prompt to display:

The current directory (using \W).

The Git branch (if you're inside a Git repo).

A custom layout with colors for readability.

Apply Changes:
After saving the changes, apply them by running the following command:

bash
Copy
Edit
source ~/.bashrc
Terminal Prompt Behavior:

The prompt will show the current directory followed by the Git branch (if in a Git repository).

Colors will be applied to the prompt for better readability.

A production environment (if specified) or Git context will change the prompt format.