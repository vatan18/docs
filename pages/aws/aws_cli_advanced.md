# AWS CLI Command Reference Guide

[Previous installation and basic sections remain the same...]

## ECS Commands

```bash
# List clusters
aws ecs list-clusters

# List services in a cluster
aws ecs list-services --cluster cluster-name

# List tasks
aws ecs list-tasks --cluster cluster-name --service-name service-name

# Describe task definition
aws ecs describe-task-definition --task-definition task-name

# Execute Command into ECS Container (Single Line)
aws ecs execute-command \
    --cluster cluster-name \
    --task task-id \
    --container container-name \
    --command "/bin/bash" \
    --interactive

# Execute Command with custom SSM configuration
aws ecs execute-command \
    --cluster cluster-name \
    --task task-id \
    --container container-name \
    --command "/bin/bash" \
    --interactive \
    --region us-east-1 \
    --command-config \
    '{"SSM":{"TimeoutSeconds":60,"MaxSessionDuration":60}}'

# Execute specific command without interactive shell
aws ecs execute-command \
    --cluster cluster-name \
    --task task-id \
    --container container-name \
    --command "ls -la" \
    --interactive

# Enable Execute Command for a Service
aws ecs update-service \
    --cluster cluster-name \
    --service service-name \
    --enable-execute-command \
    --force-new-deployment

# Enable Execute Command in Task Definition
aws ecs register-task-definition \
    --cli-input-json file://task-definition.json \
    --enable-execute-command

# List tasks with execute command enabled
aws ecs list-tasks \
    --cluster cluster-name \
    --enable-execute-command
```

## SSM Commands

```bash
# Start a Session with Region
aws ssm start-session \
    --target i-1234567890abcdef0 \
    --region us-east-2

# Start Session with Custom Parameters and Region
aws ssm start-session \
    --target i-1234567890abcdef0 \
    --document-name AWS-StartPortForwardingSession \
    --parameters '{"portNumber":["80"],"localPortNumber":["8080"]}' \
    --region us-east-2

# Send Command to Single Instance with Region
aws ssm send-command \
    --instance-ids "i-1234567890abcdef0" \
    --document-name "AWS-RunShellScript" \
    --parameters 'commands=["ls -la"]' \
    --region us-east-2 \
    --output text

# Execute Shell Script with Region
aws ssm send-command \
    --instance-ids "i-06aa76dbcab9c34f5" \
    --document-name "AWS-RunShellScript" \
    --comment "IP config" \
    --parameters commands="bash /home/ubuntu/script.sh" \
    --region us-east-2 \
    --output text

# Send Command with Custom Document and Version
aws ssm send-command \
    --document-name "GHSendCommand" \
    --instance-ids "i-02e1c1f4a86f2b6aa" \
    --document-version "2" \
    --timeout-seconds 600 \
    --region us-east-2

# List Command Invocations with Details
aws ssm list-command-invocations \
    --region us-east-2 \
    --command-id 4860ed27-3368-44ca-a05a-d13678529b59 \
    --details

# Send Command to Multiple Instances with Region
aws ssm send-command \
    --instance-ids "i-1234567890abcdef0" "i-0987654321fedcba0" \
    --document-name "AWS-RunShellScript" \
    --parameters 'commands=["uptime"]' \
    --region us-east-2 \
    --output text

# Send Command using Tags with Region
aws ssm send-command \
    --targets "Key=tag:Environment,Values=Production" \
    --document-name "AWS-RunShellScript" \
    --parameters 'commands=["df -h"]' \
    --region us-east-2 \
    --output text

# Send Command with Working Directory, Execution Timeout, and Region
aws ssm send-command \
    --instance-ids "i-1234567890abcdef0" \
    --document-name "AWS-RunShellScript" \
    --parameters \
    '{"commands":["./myscript.sh"],"workingDirectory":["/opt/scripts"],"executionTimeout":["3600"]}' \
    --timeout-seconds 600 \
    --region us-east-2

# Get Command Invocation Details with Region
aws ssm get-command-invocation \
    --command-id "command-id" \
    --instance-id "i-1234567890abcdef0" \
    --region us-east-2

# List Command History with Region
aws ssm list-commands \
    --filters "Key=Status,Values=Success,Failed" \
    --region us-east-2

# Send Command with S3 Output and Region
aws ssm send-command \
    --instance-ids "i-1234567890abcdef0" \
    --document-name "AWS-RunShellScript" \
    --parameters 'commands=["echo Hello"]' \
    --output-s3-bucket-name "my-bucket" \
    --output-s3-key-prefix "logs/" \
    --region us-east-2

# Cancel Command with Region
aws ssm cancel-command \
    --command-id "command-id" \
    --region us-east-2
```

## SSM Session Manager Configuration

```bash
# Enable Session Manager Logging
aws ssm update-document-default-version \
    --name "SSM-SessionManagerRunShell" \
    --document-version "\$DEFAULT"

# Configure Session Preferences
aws ssm update-document \
    --name "SSM-SessionManagerRunShell" \
    --content file://session-manager-preferences.json \
    --document-version "\$DEFAULT"

# Get Session Log
aws ssm get-session-log \
    --session-id "session-id"
```

[Previous sections about IAM, Best Practices, and Troubleshooting remain the same...]

## ECS and SSM Prerequisites

1. **For ECS Execute Command:**
   - Task Role must have `AmazonSSMManagedInstanceCore` policy
   - Task Definition must have `enableExecuteCommand: true`
   - ECS Service must have `enableExecuteCommand: true`
   - AWS Systems Manager Session Manager plugin installed

2. **For SSM Send Command:**
   - EC2 instances must have SSM Agent installed
   - Instance Role must have `AmazonSSMManagedInstanceCore` policy
   - Proper VPC endpoints or internet access for SSM communication

## Common Issues and Solutions

1. **ECS Execute Command Issues:**
   - Check if SSM plugin is installed and updated
   - Verify IAM roles and policies
   - Ensure container has required shell (/bin/bash, /bin/sh)
   - Check VPC endpoints for SSM, EC2 Messages, and SSM Messages

2. **SSM Send Command Issues:**
   - Verify SSM Agent status on instances
   - Check instance connectivity to SSM service
   - Validate IAM permissions
   - Review command output in AWS Console for detailed errors