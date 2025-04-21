# AWS SSO Permissions Check

This document provides a step-by-step guide to checking your AWS SSO permissions using the AWS CLI.

## 1. Get Caller Identity
To verify your AWS identity and the assumed role, run the following command:

```sh
aws sts get-caller-identity
```

### Example Output:
```json
{
    "UserId": "AROAUSCJHL5XQYQUW:Vatan",
    "Account": "123456789",
    "Arn": "arn:aws:sts::123456789:assumed-role/AWSReservedSSO_any-user
}
```
## 2. List all the permission set available
```sh
aws iam list-roles --query "Roles[*].RoleName"
```

### Example Output:
```json
[

    "AWSReservedSSO_anyuser",

    "AWSReservedSSO_devops__6d62abe2c1b",
]
```

## 3. List Inline Policies for the Role
To check all inline policies attached to your assumed role, use:

```sh
aws iam list-role-policies --role-name AWSReservedSSO_anyuser
# or
aws iam list-role-policies --role-name AWSReservedSSO_devops__6d62abe2c1b    
```

### Example Output:
```json
{
    "PolicyNames": [
        "AwsSSOInlinePolicy"
    ]
}
```

## 4. Get Inline Policy Details
Once you have identified the inline policy name, retrieve its details:

```sh
aws iam get-role-policy --role-name AWSReservedSSO_anyuser --policy-name AwsSSOInlinePolicy
# or
aws iam get-role-policy --role-name AWSReservedSSO_anyuser --policy-name AwsSSOInlinePolicy
```

### Example Output:
```json
{
    "RoleName": "AWSReservedSSO_devops__6d62abe2c1b",
    "PolicyName": "AwsSSOInlinePolicy",
    "PolicyDocument": {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "s3:ListBucket",
                    "ec2:DescribeInstances"
                ],
                "Resource": "*"
            }
        ]
    }
}
```

This reveals all the permissions granted to your role via the inline policy.
