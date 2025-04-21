# Using auto.tfvars in Terraform

## Overview
Terraform allows you to define variables in multiple ways, one of which is using `.auto.tfvars` files. These files automatically load variable values without explicitly specifying them in the Terraform command.

## Benefits of Using auto.tfvars
- **Automatic Loading**: No need to pass `-var-file` when applying Terraform configurations.
- **Consistent Naming**: Standardized approach to defining variable values.
- **Separation of Concerns**: Keeps variable definitions separate from code, making it more readable and maintainable.

## How auto.tfvars Works
Terraform automatically loads files ending with `.auto.tfvars` in the working directory when running `terraform plan` or `terraform apply`.

### Example
#### 1. Define Variables in `variables.tf`
```hcl
variable "instance_type" {
  description = "Type of EC2 instance"
  type        = string
}

variable "instance_count" {
  description = "Number of instances to launch"
  type        = number
}
```

#### 2. Create `terraform.auto.tfvars`
```hcl
instance_type  = "t2.micro"
instance_count = 2
```

#### 3. Apply Terraform Configuration
Run Terraform without specifying the variable file explicitly:
```sh
terraform init
terraform plan
terraform apply
```
Terraform automatically loads `terraform.auto.tfvars` and applies the values to the defined variables.

## Naming Convention
Terraform loads all `.auto.tfvars` files in lexicographical order. If multiple files exist, they are merged, with later files overriding earlier values if duplicate variables exist.

## Best Practices
- **Use for Default Values**: Ideal for defining default values that can be overridden if needed.
- **Avoid Sensitive Data**: Do not store secrets or credentials in `.auto.tfvars`. Use environment variables or `terraform.tfvars` instead.
- **Git Ignore for Security**: Consider adding `*.auto.tfvars` to `.gitignore` if it contains environment-specific configurations.

## Conclusion
Using `.auto.tfvars` simplifies variable management in Terraform projects by automatically loading configurations, improving efficiency and maintainability.

