# AWS CLI commands


### -> aws cli command to get shell access of the ecs container
```
aws ecs execute-command \
--region us-east-1 \
--cluster dev-<product>-<service> \
--container dev-<product>-<service>-fargate-abc \
--task 3cf9384f99384f9e3ca63f14df \
--command "/bin/bash" \
--interactive
```


-> aws sts get-caller-identity --query Account --output text

-> aws ssm send-command --region us-east-2 --document-name "AWS-RunShellScript" --targets "Key=instanceids,Values=i-06aa76dbcab9c34f5" --parameters 'commands=["bash ~/script.sh"]'
"
-> aws ssm send-command --region us-east-2 --document-name "AWS-RunShellScript" --instance-ids '["i-06aa76dbcab9c34f5"]' --parameters 'commands=["bash ~/script.sh"]'

-> aws ssm describe-instance-information --query 'InstanceInformationList[?InstanceId==`i-02e1c1f4a86f2b6aa`]'

-> aws ec2 describe-instances --region us-east-2 --output table 

-> aws ssm send-command \
    --instance-ids "i-06aa76dbcab9c34f5" \
    --document-name "AWS-RunShellScript" \
    --comment "IP config" \
    --parameters commands="sudo apt install neofetch -y" \
    --region us-east-2 \
    --output text

-> aws ssm send-command \
    --instance-ids "i-02e1c1f4a86f2b6aa" \
    --document-name "dev-lth-ssm-ghsendcommand" \
    --region us-east-2 \
    --output text

-> aws ssm list-command-invocations \
    --region us-east-2 \
    --command-id 22f205e8-715b-427a-83fc-91d6ed671663  \
    --details

  bucket copy
  # Step 1: Download from source bucket
aws s3 sync s3://ioc-web-app ./ioc-web-app

# Step 2: Upload to backup bucket
aws s3 sync ./ioc-web-app s3://ioc-web-app-backup
 
