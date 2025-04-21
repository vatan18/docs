# How to Install the SSM Agent on Ubuntu EC2 Instances

## Prerequisites
- Ensure you have access to the EC2 instance, preferably via SSH.
- Confirm whether your instance requires SSM Agent installation (some AWS AMIs come pre-installed with it).

## Step-by-Step Guide

### 1. Connect to Your EC2 Instance:
Use SSH to connect to your EC2 instance:

```bash
ssh -i /path/to/your-key.pem ubuntu@your-ec2-public-ip
```

### 2. Create a Temporary Directory:
On your EC2 instance, create a temporary directory to store the SSM Agent installation file:

```bash
mkdir /tmp/ssm
```

### 3. Change to the Temporary Directory:
Navigate to the directory:

```bash
cd /tmp/ssm
```

### 4. Download the SSM Agent:
Depending on your system architecture, download the appropriate SSM Agent package:

- For x86_64 Instances:

```bash
wget https://s3.amazonaws.com/ec2-downloads-windows/SSMAgent/latest/debian_amd64/amazon-ssm-agent.deb
```

- For ARM64 Instances:

```bash
wget https://s3.amazonaws.com/ec2-downloads-windows/SSMAgent/latest/debian_arm64/amazon-ssm-agent.deb
```

### 5. Install the SSM Agent:
Run the following command to install the SSM Agent:

```bash
sudo dpkg -i amazon-ssm-agent.deb
```

### 6. Verify SSM Agent Status:
Check if the agent is running:

```bash
sudo systemctl status amazon-ssm-agent
```

The agent should be active and running. If it’s inactive, you can enable and start it manually using:

```bash
sudo systemctl enable amazon-ssm-agent
sudo systemctl start amazon-ssm-agent
```

That's it! The SSM Agent should now be successfully installed and running on your EC2 instance.

## References:
- [Manually install the SSM Agent on Linux](https://docs.aws.amazon.com/systems-manager/latest/userguide/manually-install-ssm-agent-linux.html)
- [Hybrid and Multicloud SSM Agent Install (Linux)](https://docs.aws.amazon.com/systems-manager/latest/userguide/hybrid-multicloud-ssm-agent-install-linux.html)
- [Install the SSM Agent on Debian-based Linux](https://docs.aws.amazon.com/systems-manager/latest/userguide/agent-install-deb.html)
- [AWS CLI Installation Guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
