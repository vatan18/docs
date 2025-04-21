# AWS Terraform S3 and DynamoDB Backend

Terraform is a powerful tool for Infrastructure as Code (IaC), but managing state files locally posed a challenge for collaboration, especially with multiple team members working on the same infrastructure. In earlier versions, this could result in concurrency errors and inconsistencies. Starting from **Terraform v0.9.0**, this issue was resolved by using **AWS S3** to store state files and **AWS DynamoDB** for state locking and consistency.

## What is a Terraform State File?

The **terraform.tfstate** file is a crucial component of Terraform that stores the current state of your infrastructure in JSON format. Terraform uses this file to track the resources it manages and to compare the existing state with the desired state. If the state file is lost, corrupted, or not updated, Terraform will not be able to manage resources properly.

## The Problem with Local State Management

Storing the Terraform state file locally can cause problems, especially in team environments:
- **Inconsistencies**: Different team members may have outdated state files.
- **Concurrency Errors**: Multiple users applying changes at the same time could result in race conditions, breaking the infrastructure.
- **Lack of Visibility**: Team members won’t have access to the most up-to-date state, leading to potential conflicts and errors during deployment.

## The Solution: Terraform Backend with S3 and DynamoDB

To solve the above problems, Terraform provides the option to use a **remote backend**:
- **AWS S3**: Stores the state file in an S3 bucket, making it accessible to all team members.
- **AWS DynamoDB**: Locks the state during operations, preventing concurrent deployments and ensuring consistency.

### How It Works:
- **Terraform Plan**: When you run `terraform plan`, Terraform checks the S3 bucket for the state file and uses the DynamoDB table to lock it.
- **Locking**: DynamoDB ensures that only one user can modify the state file at any given time.
- **Deployment**: The `terraform apply` command stores the updated state in S3 and releases the lock in DynamoDB once the operation is complete.

## Setup Instructions

### 1. S3 Bucket Creation (s3.tf)

The first step is to create an S3 bucket to store the Terraform state file.

```hcl
resource "aws_s3_bucket" "bucket" {
  bucket = "your-terraform-state-backend"
  
  versioning {
    enabled = true
  }

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }

  object_lock_configuration {
    object_lock_enabled = "Enabled"
  }

  tags = {
    Name = "S3 Remote Terraform State Store"
  }
}
```

- **Bucket Name**: Replace `"your-terraform-state-backend"` with your desired bucket name.
- **Encryption**: Enables server-side encryption using AES256.
- **Versioning**: Ensures that previous versions of the state file can be recovered.

### 2. DynamoDB Table Creation (dynamo.tf)

Next, create a DynamoDB table to handle state locking.

```hcl
resource "aws_dynamodb_table" "terraform-lock" {
  name           = "terraform_state"
  read_capacity  = 5
  write_capacity = 5
  hash_key       = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  tags = {
    Name = "DynamoDB Terraform State Lock Table"
  }
}
```

- **Table Name**: `"terraform_state"` is the table where Terraform will manage state locking.
- **LockID**: The table uses `LockID` as the primary key for locking operations.

### 3. VPC Resource Example (vpc.tf)

Here’s an example of a VPC resource, assuming you’re using this in your Terraform configuration.

```hcl
provider "aws" {
  shared_credentials_file = "~/.aws/credentials"
  profile                 = "terraform"
  region                  = "eu-west-1"
}

resource "aws_vpc" "vpc" {
  cidr_block       = "10.0.0.0/16"
  instance_tenancy = "default"

  tags = {
    Name = "vpc"
  }
}
```

This example defines an AWS VPC with a CIDR block of `10.0.0.0/16` in the `eu-west-1` region.

### 4. Backend Configuration

Once the S3 bucket and DynamoDB table are created, you can configure Terraform to use them as the backend for storing the state.

```hcl
terraform {
  backend "s3" {
    bucket         = "your-terraform-state-backend"
    key            = "terraform.tfstate"
    region         = "eu-west-1"
    dynamodb_table = "terraform_state"
  }
}
```

- **S3 Bucket**: Set to the name of the bucket you created.
- **Key**: Defines the location of the state file within the bucket (e.g., `terraform.tfstate`).
- **DynamoDB Table**: Set to the name of the table used for state locking (`terraform_state`).

Uncomment this backend configuration after creating the S3 bucket and DynamoDB table.

## Process Flow

Once everything is set up, follow these steps to manage your Terraform infrastructure:

### 1. Initialize

Run `terraform init` to download necessary plugins and initialize the backend configuration.

```bash
terraform init
```

This command will:
- Initialize the S3 backend.
- Configure the DynamoDB lock.

### 2. Plan

Use `terraform plan` to see what changes Terraform will make to your infrastructure.

```bash
terraform plan
```

This command will:
- Compare the current state in S3 with your configuration.
- Show a list of resources that will be created, updated, or destroyed.

### 3. Apply

Run `terraform apply` to apply the changes and deploy the resources.

```bash
terraform apply
```

This command will:
- Lock the state using DynamoDB.
- Save the updated state to the S3 bucket.

### 4. Automatic Locking and Consistency

After initializing and applying the configuration, Terraform will automatically:
- Lock the state file in DynamoDB during `terraform plan` and `terraform apply` operations.
- Ensure that no other process can modify the state while it's being applied.
- Store and retrieve the state from the S3 bucket, ensuring that the state file is centrally managed.

## Benefits of Using S3 and DynamoDB for Terraform Backend

- **State Management**: S3 ensures centralized and reliable storage of the Terraform state file.
- **Concurrency Control**: DynamoDB prevents concurrent operations on the same state, avoiding conflicts and race conditions.
- **Team Collaboration**: By using a shared backend, team members can work with the same state file, improving collaboration and consistency.
- **State Recovery**: Versioning in S3 allows you to recover previous states if needed.

## Reference

For more detailed information on using AWS S3 and DynamoDB as a Terraform backend, refer to the original article on Medium:

- [AWS Terraform S3 and DynamoDB Backend](https://angelo-malatacca83.medium.com/aws-terraform-s3-and-dynamodb-backend-3b28431a76c1)
