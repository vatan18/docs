# Git Documentation: Using Multiple Users

## Introduction

Managing multiple users in Git can be essential for various reasons, such as handling personal and work projects separately or collaborating on projects with different credentials. This documentation provides a step-by-step guide on how to configure Git to use multiple users efficiently.

## Configuring Multiple Users in Git

To manage multiple users in Git, you need to modify the `.gitconfig` file and set up a credential helper. Here are the steps to achieve this:

### Step 1: Modify the `.gitconfig` File

Add the following block to your `.gitconfig` file to configure your user details and credential helper:

```plaintext
[user]
    name = <username>
    email = <userGmail>
[credential]
    helper = store
    username = <username>
```

Replace `<username>` and `<userGmail>` with your actual Git username and email.

**For Example:**

```plaintext
[user]
    name = vatan18
    email = vatan18@gmail.com
[credential]
    helper = store
    username = vatan18
```

### Step 2: Install Git Credential Helper

Git credential helper is a tool that helps you store and manage your Git credentials securely. Follow these steps to install it:

- **On Windows**
  1. Open the Git Bash terminal.
  2. Run the following command to enable the credential helper:

     ```bash
     git config --global credential.helper wincred
     ```

- **On macOS**
  1. Open the Terminal.
  2. Run the following command to enable the credential helper:

     ```bash
     git config --global credential.helper osxkeychain
     ```

- **On Linux**
  1. Open the Terminal.
  2. Run the following command to enable the credential helper:

     ```bash
     git config --global credential.helper cache
     ```

### Step 3: Add Credentials to the `.git-credentials` File

After setting up the credential helper, add your Git credentials to the `.git-credentials` file. The credentials should be in the following format:

```plaintext
https://<github_username>:<github_token>@github.com
```

Replace `<github_username>` with your GitHub username and `<github_token>` with your GitHub personal access token.

**Example**

Here's an example of what your `.gitconfig` and `.git-credentials` files might look like:

#### `.gitconfig`

```plaintext
[user]
    name = johndoe
    email = johndoe@example.com
[credential]
    helper = store
    username = johndoe
```

#### `.git-credentials`

```plaintext
https://johndoe:ghp_exampletoken1234567890abcdefg@github.com
```
