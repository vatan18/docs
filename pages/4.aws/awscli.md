# AWS CLI Installation Guide for Ubuntu

This guide provides instructions for installing the AWS Command Line Interface (AWS CLI) on Ubuntu machines.

## Installation Methods

There are two primary methods to install AWS CLI:

1. **Command Line Installer** (Recommended for version control)
   - Allows specific version installation
   - Manual updates required
   - Good for teams that need to pin versions

2. **Snap Package**
   - Automatically updates to the latest version
   - No version selection support
   - Good for users who want to stay current

## Installation Using Command Line Installer

### Prerequisites
- Ubuntu machine (x86 64-bit)
- `curl` installed
- `unzip` utility installed
- Sudo privileges

### Basic Installation Steps

1. Download the AWS CLI package:
```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
```

2. Unzip the installer:
```bash
unzip awscliv2.zip
```

3. Run the install program:
```bash
sudo ./aws/install
```

### Updating Existing Installation

To update your current AWS CLI installation:

```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install --bin-dir /usr/local/bin --install-dir /usr/local/aws-cli --update
```

### Custom Installation Location

You can specify custom installation directories using these parameters:
- `--install-dir` or `-i`: Directory for AWS CLI files
- `--bin-dir` or `-b`: Directory for symlinks to AWS CLI program

Example:
```bash
./aws/install -i /usr/local/aws-cli -b /usr/local/bin
```

**Note**: Ensure paths contain no spaces or special characters.

## Verification

Verify the installation by checking the AWS CLI version:
```bash
aws --version
```

Expected output format:
```
aws-cli/2.x.x Python/3.x.x Linux/x.x.x botocore/2.x.x
```

## Troubleshooting

If the `aws` command is not found after installation:
1. Restart your terminal
2. Verify the installation path is in your system's PATH variable
3. Check if the symlink was created correctly in `/usr/local/bin`

## Additional Notes

- The default installation location is `/usr/local/aws-cli`
- The default symlink location is `/usr/local/bin`
- When updating, use the `-u` flag with unzip to automatically overwrite existing files:
  ```bash
  unzip -u awscliv2.zip
  ```
