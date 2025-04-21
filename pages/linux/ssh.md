# SSH Key Pair Integration with AWS EC2 and Terraform

SSH (Secure Shell) is a widely used protocol for securely connecting to remote servers, including AWS EC2 instances. AWS uses key pairs (public and private) to log in without passwords. Here's an overview of how SSH key pairs work with EC2 instances and how to integrate them using Terraform.

## SSH Key Pair Components:
- **Private Key**: Stored locally on your machine and must remain confidential.
- **Public Key**: Uploaded to the EC2 instance during creation and automatically added to the `~/.ssh/authorized_keys` file on the instance.

## How SSH Key Pair Works:

### 1. Key Pair Generation:
- You generate a key pair either manually using `ssh-keygen` or via the AWS console/CLI.
- The key pair includes a private key (kept secret) and a public key (used by the server).

### 2. EC2 Instance Setup:
- During instance creation, the public key is uploaded, and it's stored in the instance's `authorized_keys` file (usually under `ec2-user` or `ubuntu`).

### 3. SSH Connection:
To SSH into your EC2 instance, you use the private key from your local machine to match the public key on the instance.

```bash
ssh -i /path/to/your-key.pem ec2-user@<EC2_PUBLIC_IP>
```

### 4. Generate a New SSH Key Pair:
You can generate a new key pair for future instances by running:

```bash
ssh-keygen -t rsa -b 2048 -f ~/.ssh/my-key.pem
```

This creates two files:
- `my-key.pem`: Your private key.
- `my-key.pem.pub`: Your public key.

## Connecting via Terraform:
You can specify the SSH key in Terraform in two ways: using the `aws_key_pair` resource or `user_data`.

### Method 1: Using `aws_key_pair` Resource
This method manages the key pair through AWS.

#### Generate a Key Pair Locally (if not available):

```bash
ssh-keygen -t rsa -b 2048 -f ~/.ssh/my-key
```

#### Terraform Configuration:
Add the `aws_key_pair` resource to your Terraform script and reference the public key:

```hcl
resource "aws_key_pair" "my_key" {
  key_name   = "my-key"
  public_key = file("~/.ssh/my-key.pub")
}

resource "aws_instance" "my_ec2_instance" {
  ami           = "ami-xxxxxxxx"
  instance_type = "t2.micro"
  key_name      = aws_key_pair.my_key.key_name

  tags = {
    Name = "MyEC2Instance"
  }
}
```

#### Apply the Terraform Plan:

```bash
terraform init
terraform plan
terraform apply
```

This uploads the public key to AWS and attaches it to the instance, allowing you to SSH with:

```bash
ssh -i ~/.ssh/my-key ec2-user@<EC2_PUBLIC_IP>
```

### Method 2: Using `user_data` to Add Key Manually
This method bypasses AWS-managed key pairs by using the `user_data` field to add the public key directly to the instance.

#### Terraform Configuration:
Add a script in `user_data` to append the public key to the `authorized_keys` file on the instance:

```hcl
resource "aws_instance" "my_ec2_instance" {
  ami           = "ami-xxxxxxxx"
  instance_type = "t2.micro"

  user_data = <<-EOF
    #!/bin/bash
    echo "your-public-key-here" >> /home/ec2-user/.ssh/authorized_keys
  EOF

  tags = {
    Name = "MyEC2Instance"
  }
}
```

#### Apply the Terraform Plan:

```bash
terraform init
terraform plan
terraform apply
```

In this method, the `user_data` script runs at launch and adds the public key to the instance, allowing SSH access.

## Conclusion:
- **Method 1**: Using the `aws_key_pair` resource is the recommended and more common approach. It stores the key pair in AWS and attaches it to instances securely.
- **Method 2**: Using `user_data` is useful when you prefer not to manage key pairs in AWS, but it requires manual insertion of the public key into the instance.
