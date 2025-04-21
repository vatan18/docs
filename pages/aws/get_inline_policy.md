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
    "UserId": "AROAUSCJHL5XQYQVFZKUW:manish.kumar201",
    "Account": "313686187887",
    "Arn": "arn:aws:sts::313686187887:assumed-role/AWSReservedSSO_impressico_devops_trainees_dcc3ac98552ae429/manish.kumar201"
}
```
## 2. List all the permission set available
```sh
aws iam list-roles --query "Roles[*].RoleName"
```

### Example Output:
```json
[
    "AWSReservedSSO_deepak.kumar201_977d802d5696b25a",
    "AWSReservedSSO_devops_admin_6d6ecfcc2abe2c1b",
    "AWSReservedSSO_devops_Trainees_new_3bea47d347376d12",
    "AWSReservedSSO_impressico_devops_trainees_dcc3ac98552ae429",
    "AWSReservedSSO_manishkumar201_33e09fa248aadf50",
    "AWSReservedSSO_Siddhant_Sharma_Traniee_25e9e567c44b2410",
    "AWSReservedSSO_Vansh_Devops_Trainee_f48024ecb434468c",
]
```

## 3. List Inline Policies for the Role
To check all inline policies attached to your assumed role, use:

```sh
aws iam list-role-policies --role-name AWSReservedSSO_manishkumar201_33e09fa248aadf50
# or
aws iam list-role-policies --role-name AWSReservedSSO_impressico_devops_trainees_dcc3ac98552ae429
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
aws iam get-role-policy --role-name AWSReservedSSO_manishkumar201_33e09fa248aadf50 --policy-name AwsSSOInlinePolicy
# or
aws iam get-role-policy --role-name AWSReservedSSO_impressico_devops_trainees_dcc3ac98552ae429 --policy-name AwsSSOInlinePolicy
```

### Example Output:
```json
{
    "RoleName": "AWSReservedSSO_impressico_devops_trainees_dcc3ac98552ae429",
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
