# Terraform

1. **Install Terraform**: [Terraform Installation Guide](https://learn.hashicorp.com/tutorials/terraform/install-cli)
2. **Configure AWS CLI**: [AWS CLI Installation Guide](https://aws.amazon.com/cli/)
3. **Clone the Repository**: 
   ```bash
   git clone https://github.com/yourusername/your-repo.git
   ```

4. **Environment Variables with `TF_VAR_`**
If you set environment variables that start with `TF_VAR_`, you don't need to pass them in via the `-var-file` option or define them in the `aws.tfvars` file. Terraform will automatically pick up those variables.

For example:
```bash
export TF_VAR_region=us-west-1
export TF_VAR_instance_type=t2.micro
```

This allows you to manage configuration via environment variables, offering flexibility in how you handle variable values across different environments or workflows.

5. **Terraform Commands**:
   ```bash
   terraform init                                           # Initializes Terraform
   terraform workspace select <workspace-name>              # Switch to an Existing Workspace
   terraform fmt --recursive ./                             # corrects the formatting of the script
   terraform plan -out=plan.tfplan                          # Creates a Plan
   terraform apply plan.tfplan                              # Applies the Plan
   terraform destroy                                        # Destroyes the Infrastructure

   # Extra Commands
   terraform validate                                       # validates the terraform script
   terraform fmt -check --recursive ./                      # checks the formatting of the terraform script
   terraform plan -out=plan.tfplan -var-file="aws.tfvars"   # Creates a Plan using .tfvars file
   terraform destroy -var-file="aws.tfvars"                 # Destroyes the Infrastructure using .tfvars file
   ```
6. **Terraform Workspace Commands**:
   ```bash
   terraform workspace list                     # List Workspaces
   terraform workspace show                     # Show Current Workspace:
   terraform workspace new <workspace-name>     # Create a New Workspace:
   terraform workspace select <workspace-name>  # Switch to an Existing Workspace
   ```

### In Terraform, a **workspace** is an environment within a single Terraform configuration that allows you to manage multiple sets of infrastructure. Each workspace has its own state, meaning you can use the same configuration code to manage different resources or environments (like development, staging, and production) without having them interfere with each other.

### Key Features:
- **Isolated State:** Each workspace has its own state file, which means changes made in one workspace won't affect another.
- **Same Code, Different Resources:** You can use the same Terraform configuration but deploy different sets of resources based on the active workspace.
- **Default Workspace:** When you initialize a new Terraform project, you start in the `default` workspace.
- **Common Use Cases:** Managing different environments (e.g., dev, stage, prod), handling multiple regions, or separating infrastructure by teams or departments.

This feature is useful for avoiding the need to duplicate configuration files for different environments, streamlining infrastructure management.

### Notes
1. ```echo "workspaceName=${WORKSPACE_NAME,,}" >> $GITHUB_OUTPUT ```   is used in a GitHub Actions workflow to create a lowercase version of the WORKSPACE_NAME environment variable and store it in the special GITHUB_OUTPUT file

2. ``` terraform fmt -check --recursive ./``` checks all the files related to terraform in the present repository