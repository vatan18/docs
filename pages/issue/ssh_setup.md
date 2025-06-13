✅ SSH Setup Script 

'''
# SSH Setup Script: Universal for GitHub, GitLab, Bitbucket, etc.

# 1. Generate SSH key (use ed25519 if supported)
ssh-keygen -t ed25519 -C "$USER@$(hostname)"

# OR fallback to RSA if needed (e.g., for older services)
# ssh-keygen -t rsa -b 4096 -C "$USER@$(hostname)"

# 2. Start the ssh-agent in the background
eval "$(ssh-agent -s)"

# 3. Add your new SSH private key to the ssh-agent
ssh-add ~/.ssh/id_ed25519

# 4. Display your public key (copy this to GitHub/GitLab/Bitbucket, etc.)
cat ~/.ssh/id_ed25519.pub

echo "✅ SSH key generated. Now add the public key above to your Git provider."

    💡 You only need to generate and add the SSH key once per machine.
''' bash    

📝 SSH Setup Guide


Here’s the Markdown content for your README.md:

# 🔐 Setting up SSH for Git Repositories (GitHub, GitLab, Bitbucket, etc.)

This guide helps you set up a secure SSH connection for pushing code without typing your credentials every time. Works universally across GitHub, GitLab, Bitbucket, etc.

---

## ✅ 1. Generate SSH Key

Run this in your terminal:

```bash
ssh-keygen -t ed25519 -C "your_email@example.com"

    💡 Replace the email with your Git account email.

Press Enter through prompts to use default location (~/.ssh/id_ed25519).
🔄 2. Start SSH Agent & Add Key

eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519

📋 3. Copy Public Key

Print and copy the contents of your SSH public key:

cat ~/.ssh/id_ed25519.pub

Paste this key into your Git provider’s SSH key settings:

    GitHub: https://github.com/settings/keys

    GitLab: https://gitlab.com/-/profile/keys

    Bitbucket: https://bitbucket.org/account/settings/ssh-keys/

🚀 4. Test SSH Connection

For GitHub:

ssh -T git@github.com

For GitLab:

ssh -T git@gitlab.com

You should see a success message confirming authentication.
🔁 5. Use SSH When Cloning

Use the SSH URL instead of HTTPS:

git clone git@github.com:your-username/your-repo.git

✅ Done! You can now push/pull without entering your password each time.