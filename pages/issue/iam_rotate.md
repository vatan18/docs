Nice — I’ve prepared a modular, production-ready set of templates and instructions you can use to deploy the rotation Lambda (via AWS SAM) and the supporting resources (Secrets Manager, SNS, IAM role/policy, and EventBridge rule) as **separate CloudFormation stacks** so you can create/update them independently later.

I’ll give:

1. deployment order & notes (SAML/AWS CLI note included)
2. `secrets-stack.yaml` — Secrets Manager secret (exports ARN)
3. `sns-stack.yaml` — SNS topic (exports ARN)
4. `iam-stack.yaml` — IAM Role & inline policy for the Lambda (imports secret & SNS ARNs)
5. `sam-lambda-template.yaml` — SAM template that defines the Lambda (InlineCode) and exports the Lambda ARN for other stacks
6. `eventbridge-stack.yaml` — EventBridge (schedule) rule that targets the Lambda and adds permission

Follow the deployment steps in the order shown. If you want, I can also turn these into Terraform later — but here’s CloudFormation + SAM as requested.

---

# Important notes before deploying

* If you authenticate to AWS via **SAML/SAML-based SSO**, configure credentials for AWS CLI/SAM first (e.g., `aws sso login` or your SAML flow) so `sam` and `aws cloudformation` can deploy. SAM uses your AWS CLI credentials.
* Deploy order matters because stacks export values that downstream stacks `ImportValue`. Recommended order below.
* All exports use a `Prefix` parameter so you can deploy multiple independent instances (set `Prefix` to e.g. `prod`, `staging`, `dev`).
* Adjust `ROTATE_AFTER_DAYS` and `SCHEDULE_EXPRESSION` to your desired cadence (defaults show quarterly cron example).

---

# Deployment order (recommended)

1. `secrets-stack.yaml` — create the secret (exports SecretArn)
2. `sns-stack.yaml` — create the SNS topic (exports TopicArn)
3. `iam-stack.yaml` — create Lambda IAM role & policy (imports SecretArn & TopicArn)
4. `sam-lambda-template.yaml` — deploy SAM application (Lambda) (imports Role ARN, Secret ARN, Topic ARN)
5. `eventbridge-stack.yaml` — create scheduled rule and target (imports Lambda ARN)

You can update each stack independently later. The SAM stack exports the Lambda ARN so EventBridge can target it later.

---

# 1) secrets-stack.yaml

Creates Secrets Manager secret which will store the IAM username and the rotated key pair.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: Secrets Manager secret for IAM access-key rotation.

Parameters:
  Prefix:
    Type: String
    Description: Prefix for resource names (e.g. prod, staging)
  IAMUserName:
    Type: String
    Description: The IAM username whose keys will be rotated (string only)

Resources:
  AccessKeySecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub "${Prefix}-AccessKeySecret"
      Description: "Stores access key/secret for IAM user rotated by Lambda"
      SecretString: !Sub |
        {
          "username": "${IAMUserName}",
          "accessKeyId": "",
          "secretAccessKey": "",
          "lastRotated": "",
          "version": 0
        }

Outputs:
  SecretArn:
    Description: ARN of the SecretsManager secret
    Value: !Ref AccessKeySecret
    Export:
      Name: !Sub "${Prefix}-SecretArn"

  SecretName:
    Description: Secret name
    Value: !Ref AccessKeySecret
    Export:
      Name: !Sub "${Prefix}-SecretName"
```

---

# 2) sns-stack.yaml

Creates SNS topic and exports the ARN.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: SNS topic for Access Key Rotation notifications.

Parameters:
  Prefix:
    Type: String
    Description: Prefix for resource names (e.g. prod, staging)

Resources:
  AccessKeyRotationTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub "${Prefix}-AccessKeyRotationNotifications"
      DisplayName: !Sub "${Prefix} AccessKeyRotationNotifications"

Outputs:
  TopicArn:
    Description: ARN of SNS topic
    Value: !Ref AccessKeyRotationTopic
    Export:
      Name: !Sub "${Prefix}-SNSTopicArn"
```

After deploying this stack, subscribe email/webhook endpoints as needed (or you can create subscriptions through CloudFormation too).

---

# 3) iam-stack.yaml

Creates the IAM Role for Lambda and an inline policy with the least-practical-privileges usable with imports of the secret & sns ARNs.

> Note: AWS does not support scoping IAM access-key management calls to a particular access-key resource; they often require `Resource: "*"`. However SecretsManager and SNS permissions *are* limited to the exported secret and topic ARNs.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: IAM Role and policy for AccessKey rotation Lambda.

Parameters:
  Prefix:
    Type: String
    Description: Prefix for resource names
  SecretArnExportName:
    Type: String
    Default: ""
    Description: Export name for the Secret ARN (use exported name from secrets-stack). Example: prod-SecretArn
  SnsTopicArnExportName:
    Type: String
    Default: ""
    Description: Export name for the SNS Topic ARN (use exported name from sns-stack). Example: prod-SNSTopicArn

Resources:
  AccessKeyRotationRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub "${Prefix}-AccessKeyRotationRole"
      AssumeRolePolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Effect: Allow
            Principal:
              Service:
                - lambda.amazonaws.com
            Action:
              - sts:AssumeRole
      Path: /
      Policies:
        - PolicyName: !Sub "${Prefix}-AccessKeyRotationInlinePolicy"
          PolicyDocument:
            Version: "2012-10-17"
            Statement:
              # IAM key management (cannot easily scope further)
              - Effect: Allow
                Action:
                  - iam:ListAccessKeys
                  - iam:CreateAccessKey
                  - iam:DeleteAccessKey
                  - iam:UpdateAccessKey
                  - iam:GetUser
                Resource: "*"

              # Secrets Manager minimal needed
              - Effect: Allow
                Action:
                  - secretsmanager:GetSecretValue
                  - secretsmanager:PutSecretValue
                  - secretsmanager:DescribeSecret
                Resource: !If
                  - HasSecretExport
                  - !ImportValue { 'Fn::Sub': "${SecretArnExportName}" }
                  - !Sub arn:aws:secretsmanager:${AWS::Region}:${AWS::AccountId}:secret:dummy

              # SNS publish only to provided topic
              - Effect: Allow
                Action:
                  - sns:Publish
                Resource: !If
                  - HasSnsExport
                  - !ImportValue { 'Fn::Sub': "${SnsTopicArnExportName}" }
                  - !Sub arn:aws:sns:${AWS::Region}:${AWS::AccountId}:dummy

              # CloudWatch Logs for Lambda
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: "arn:aws:logs:*:*:*"

Conditions:
  HasSecretExport: !Not [!Equals [!Ref SecretArnExportName, ""]]
  HasSnsExport: !Not [!Equals [!Ref SnsTopicArnExportName, ""]]

Outputs:
  RoleArn:
    Description: ARN of the Lambda execution role
    Value: !GetAtt AccessKeyRotationRole.Arn
    Export:
      Name: !Sub "${Prefix}-LambdaRoleArn"

  RoleName:
    Description: Role name
    Value: !Ref AccessKeyRotationRole
    Export:
      Name: !Sub "${Prefix}-LambdaRoleName"
```

**Deployment notes**
When deploying this stack, supply `SecretArnExportName` (e.g. `prod-SecretArn`) and `SnsTopicArnExportName` (e.g. `prod-SNSTopicArn`) so the role policy can import them. If you choose not to import, you can leave parameters blank and adjust later.

---

# 4) sam-lambda-template.yaml (AWS SAM)

This is the SAM template to deploy the Lambda code itself. It imports the role ARN from the IAM stack, and imports the Secret and SNS ARNs for environment variables. The Lambda code is provided inline (`InlineCode`) — adjust if you prefer to deploy from code in a repo (CodeUri).

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: SAM template that deploys Access Key Rotation Lambda.

Parameters:
  Prefix:
    Type: String
    Default: prod
  LambdaRoleArnExportName:
    Type: String
    Description: Export name of the IAM role ARN created in iam-stack (e.g. prod-LambdaRoleArn)
  SecretArnExportName:
    Type: String
    Description: Export name of the SecretArn (e.g. prod-SecretArn)
  SnsTopicArnExportName:
    Type: String
    Description: Export name of the SNS TopicArn (e.g. prod-SNSTopicArn)
  RotateAfterDays:
    Type: Number
    Default: 90
    Description: Days after which rotation should occur
  ValidationSleep:
    Type: Number
    Default: 3
    Description: Seconds to wait before validating new key

Resources:
  AccessKeyRotationFunction:
    Type: AWS::Serverless::Function
    Properties:
      FunctionName: !Sub "${Prefix}-AccessKeyRotate"
      Handler: lambda_function.lambda_handler
      Runtime: python3.10
      Role: !ImportValue { 'Fn::Sub': "${LambdaRoleArnExportName}" }
      Timeout: 300
      MemorySize: 256
      Environment:
        Variables:
          SECRET_ARN: !ImportValue { 'Fn::Sub': "${SecretArnExportName}" }
          SNS_TOPIC_ARN: !ImportValue { 'Fn::Sub': "${SnsTopicArnExportName}" }
          ROTATE_AFTER_DAYS: !Ref RotateAfterDays
          VALIDATION_SLEEP: !Ref ValidationSleep
      InlineCode: |
        import os
        import json
        import time
        import logging
        from datetime import datetime, timezone

        import boto3
        from botocore.exceptions import ClientError

        logger = logging.getLogger()
        logger.setLevel(logging.INFO)

        secrets_client = boto3.client('secretsmanager')
        iam_client = boto3.client('iam')
        sns_client = boto3.client('sns')
        sts_client = boto3.client('sts')

        SECRET_ARN = os.environ['SECRET_ARN']
        SNS_TOPIC_ARN = os.environ['SNS_TOPIC_ARN']
        ROTATE_AFTER_DAYS = int(os.environ.get('ROTATE_AFTER_DAYS', '90'))
        VALIDATION_SLEEP = int(os.environ.get('VALIDATION_SLEEP', '3'))

        def publish_sns(subject, message):
            try:
                sns_client.publish(TopicArn=SNS_TOPIC_ARN, Subject=subject, Message=message)
                logger.info("SNS published: %s", subject)
            except Exception:
                logger.exception("Failed to publish SNS")

        def get_secret():
            resp = secrets_client.get_secret_value(SecretId=SECRET_ARN)
            secret = json.loads(resp['SecretString'])
            return secret

        def put_secret(secret):
            secrets_client.put_secret_value(SecretId=SECRET_ARN, SecretString=json.dumps(secret))

        def validate_credentials(access_key_id, secret_access_key):
            try:
                session = boto3.Session(aws_access_key_id=access_key_id, aws_secret_access_key=secret_access_key)
                sts = session.client('sts')
                sts.get_caller_identity()
                return True
            except Exception:
                logger.exception("Validation failed for new key")
                return False

        def lambda_handler(event, context):
            logger.info("Starting rotation at %s", datetime.now(timezone.utc).isoformat())
            secret = get_secret()
            username = secret.get('username')
            if not username:
                raise Exception("Secret must include 'username'")

            last_rotated = secret.get('lastRotated')
            if last_rotated:
                last_date = datetime.fromisoformat(last_rotated.replace("Z", "+00:00"))
                age = (datetime.now(timezone.utc) - last_date).days
                if age < ROTATE_AFTER_DAYS:
                    logger.info("Rotation skipped — only %d days since last rotation", age)
                    return {"status":"skipped","days_since":age}

            # list existing keys
            keys = iam_client.list_access_keys(UserName=username).get('AccessKeyMetadata', [])
            old_key_ids = [k['AccessKeyId'] for k in keys]

            # create new key
            try:
                created = iam_client.create_access_key(UserName=username)['AccessKey']
                new_ak = created['AccessKeyId']
                new_sk = created['SecretAccessKey']
                logger.info("Created new key %s", new_ak)
            except Exception:
                logger.exception("Failed to create new key")
                publish_sns("❌ Access Key Rotation Failure", f"Failed to create new key for {username}")
                raise

            # short wait for propagation
            time.sleep(VALIDATION_SLEEP)

            # validate
            if not validate_credentials(new_ak, new_sk):
                try:
                    iam_client.delete_access_key(UserName=username, AccessKeyId=new_ak)
                except Exception:
                    logger.exception("Failed to delete invalid newly created key")
                publish_sns("❌ Access Key Rotation Failed", f"Validation failed for {username}")
                raise Exception("Validation failed")

            # update secret
            secret['accessKeyId'] = new_ak
            secret['secretAccessKey'] = new_sk
            secret['lastRotated'] = datetime.now(timezone.utc).isoformat()
            secret['version'] = secret.get('version', 0) + 1

            try:
                put_secret(secret)
            except Exception:
                logger.exception("Failed to update secret, deleting new key to avoid orphan")
                try:
                    iam_client.delete_access_key(UserName=username, AccessKeyId=new_ak)
                except Exception:
                    logger.exception("Failed to delete new key after secret update failed")
                publish_sns("❌ Access Key Rotation Failed", f"Secret update failed for {username}")
                raise

            # delete old keys (except the new one)
            for key in old_key_ids:
                if key == new_ak:
                    continue
                try:
                    iam_client.delete_access_key(UserName=username, AccessKeyId=key)
                    logger.info("Deleted old key: %s", key)
                except Exception:
                    logger.exception("Failed to delete old key: %s", key)

            publish_sns("✅ AWS Access Key Rotation Success", f"IAM Access key for {username} rotated successfully. New AccessKeyId: {new_ak}")
            logger.info("Rotation complete for %s", username)
            return {"status":"success","newAccessKeyId":new_ak}
Outputs:
  LambdaArn:
    Description: ARN of the rotation Lambda
    Value: !GetAtt AccessKeyRotationFunction.Arn
    Export:
      Name: !Sub "${Prefix}-RotationLambdaArn"

  LambdaName:
    Value: !Ref AccessKeyRotationFunction
    Export:
      Name: !Sub "${Prefix}-RotationLambdaName"
```

**SAM deploy notes**

* Deploy with `sam build` then `sam deploy --guided` (supply `Prefix`, `LambdaRoleArnExportName`, `SecretArnExportName`, `SnsTopicArnExportName`).
* If you prefer not to use `InlineCode`, change to `CodeUri` and point to a package in S3 or local code.

---

# 5) eventbridge-stack.yaml

Creates EventBridge rule with a scheduled cron expression (you can set cron or rate expression via parameter) and sets the Lambda (imported) as the target. Also creates permission for Events to invoke the Lambda.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: EventBridge scheduled rule to trigger rotation Lambda.

Parameters:
  Prefix:
    Type: String
    Default: prod
    Description: Prefix for names/exports
  RotationLambdaArnExportName:
    Type: String
    Description: Export name of the Lambda ARN (e.g. prod-RotationLambdaArn)
  ScheduleExpression:
    Type: String
    Default: "cron(0 0 1 1,4,7,10 ? *)"
    Description: "Schedule expression for rotation. Default: cron(0 0 1 1,4,7,10 ? *) — quarterly on 1st of Jan/Apr/Jul/Oct at 00:00 UTC"

Resources:
  RotateScheduleRule:
    Type: AWS::Events::Rule
    Properties:
      Name: !Sub "${Prefix}-AccessKeyRotateSchedule"
      ScheduleExpression: !Ref ScheduleExpression
      State: ENABLED
      Targets:
        - Id: "AccessKeyRotateTarget"
          Arn: !ImportValue { 'Fn::Sub': "${RotationLambdaArnExportName}" }
          Input: "{}"

  PermissionForEventsToInvokeLambda:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !ImportValue { 'Fn::Sub': "${RotationLambdaArnExportName}" }
      Action: lambda:InvokeFunction
      Principal: events.amazonaws.com
      SourceArn: !GetAtt RotateScheduleRule.Arn

Outputs:
  RuleArn:
    Value: !GetAtt RotateScheduleRule.Arn
    Export:
      Name: !Sub "${Prefix}-RotateRuleArn"
```

**Notes**

* Default schedule uses quarterly cron. Change `ScheduleExpression` parameter to whatever you prefer (e.g., monthly, daily, rate(90 days) not supported; use a cron or run daily with Lambda checking `lastRotated` as in our code).
* Because Lambda and EventBridge are in different stacks, EventBridge imports the Lambda ARN. Deploy EventBridge after SAM so the Lambda ARN export exists.

---

# Example deployment commands (CLI)

Replace `<prefix>` and `<iam-username>` with your values.

1. Deploy secrets stack:

```bash
aws cloudformation deploy \
  --template-file secrets-stack.yaml \
  --stack-name <prefix>-secrets \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides Prefix=<prefix> IAMUserName=<iam-username>
```

2. Deploy sns stack:

```bash
aws cloudformation deploy \
  --template-file sns-stack.yaml \
  --stack-name <prefix>-sns \
  --parameter-overrides Prefix=<prefix>
```

3. Deploy iam stack (imports the export names from previous two stacks):

```bash
aws cloudformation deploy \
  --template-file iam-stack.yaml \
  --stack-name <prefix>-iam \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    Prefix=<prefix> \
    SecretArnExportName=<prefix>-SecretArn \
    SnsTopicArnExportName=<prefix>-SNSTopicArn
```

4. Build & deploy SAM stack (make sure you have `sam` CLI and you are logged in with AWS credentials — SAML users ensure AWS CLI profile is configured):

```bash
sam build --template-file sam-lambda-template.yaml
sam deploy --template-file .aws-sam/build/template.yaml --stack-name <prefix>-lambda \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    Prefix=<prefix> \
    LambdaRoleArnExportName=<prefix>-LambdaRoleArn \
    SecretArnExportName=<prefix>-SecretArn \
    SnsTopicArnExportName=<prefix>-SNSTopicArn \
    RotateAfterDays=90
```

5. Deploy EventBridge stack (after SAM stack deployed and exported lambda ARN exists):

```bash
aws cloudformation deploy \
  --template-file eventbridge-stack.yaml \
  --stack-name <prefix>-eventbridge \
  --parameter-overrides \
    Prefix=<prefix> \
    RotationLambdaArnExportName=<prefix>-RotationLambdaArn \
    ScheduleExpression="cron(0 0 1 1,4,7,10 ? *)"
```

---

# Extra operational considerations

* **Secrets retrieval by applications**: ensure your apps read the secret from Secrets Manager and implement refresh logic or use Secrets Manager client-side caching with refresh interval.
* **Canary / Staging**: test in staging before prod; rotate a non-critical service first.
* **Alarms & Monitoring**: Create CloudWatch Alarms for Lambda errors and subscribe SNS. You can add CloudWatch alarm stacks similarly as separate CloudFormation stacks.
* **Rollbacks**: Secrets Manager retains versions — if something goes wrong, you can restore a previous version or update secret manually.
* **IAM scoping**: we restricted Secrets & SNS actions to their ARNs; IAM actions still require Resource: `*` for key lifecycle operations — document and restrict who holds the IAM stack. Keep the role tight and audit.

---
Perfect 👍 — let’s take your current **inline Lambda (Python)** and convert it into a **SAM project structure** where:

✅ The code lives in a folder (not inline).
✅ `CodeUri` points to that folder.
✅ You can build → package → deploy using `sam build`, `sam package`, and `sam deploy`.
✅ Works well with your modular CloudFormation stacks from before.

---

## 🧩 Project structure

Use this folder layout (create files locally):

```
access-key-rotation/
│
├── sam-lambda-template.yaml         # SAM template
└── src/
    ├── lambda_function.py           # Python Lambda code
    └── requirements.txt             # Python dependencies (empty or minimal)
```

You can keep your CloudFormation stacks (`sns-stack.yaml`, `iam-stack.yaml`, etc.) in a sibling folder like `infra/` if you want separation.

---

## 🐍 lambda_function.py

Copy the previous Python code (from the InlineCode block) into `src/lambda_function.py`:

```python
import os
import json
import time
import logging
from datetime import datetime, timezone

import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

secrets_client = boto3.client('secretsmanager')
iam_client = boto3.client('iam')
sns_client = boto3.client('sns')
sts_client = boto3.client('sts')

SECRET_ARN = os.environ['SECRET_ARN']
SNS_TOPIC_ARN = os.environ['SNS_TOPIC_ARN']
ROTATE_AFTER_DAYS = int(os.environ.get('ROTATE_AFTER_DAYS', '90'))
VALIDATION_SLEEP = int(os.environ.get('VALIDATION_SLEEP', '3'))

def publish_sns(subject, message):
    try:
        sns_client.publish(TopicArn=SNS_TOPIC_ARN, Subject=subject, Message=message)
        logger.info("SNS published: %s", subject)
    except Exception:
        logger.exception("Failed to publish SNS")

def get_secret():
    resp = secrets_client.get_secret_value(SecretId=SECRET_ARN)
    return json.loads(resp['SecretString'])

def put_secret(secret):
    secrets_client.put_secret_value(SecretId=SECRET_ARN, SecretString=json.dumps(secret))

def validate_credentials(access_key_id, secret_access_key):
    try:
        session = boto3.Session(aws_access_key_id=access_key_id, aws_secret_access_key=secret_access_key)
        sts = session.client('sts')
        sts.get_caller_identity()
        return True
    except Exception:
        logger.exception("Validation failed for new key")
        return False

def lambda_handler(event, context):
    logger.info("Starting rotation at %s", datetime.now(timezone.utc).isoformat())
    secret = get_secret()
    username = secret.get('username')
    if not username:
        raise Exception("Secret must include 'username'")

    last_rotated = secret.get('lastRotated')
    if last_rotated:
        last_date = datetime.fromisoformat(last_rotated.replace("Z", "+00:00"))
        age = (datetime.now(timezone.utc) - last_date).days
        if age < ROTATE_AFTER_DAYS:
            logger.info("Rotation skipped — only %d days since last rotation", age)
            return {"status": "skipped", "days_since": age}

    # List existing keys
    keys = iam_client.list_access_keys(UserName=username).get('AccessKeyMetadata', [])
    old_key_ids = [k['AccessKeyId'] for k in keys]

    try:
        created = iam_client.create_access_key(UserName=username)['AccessKey']
        new_ak = created['AccessKeyId']
        new_sk = created['SecretAccessKey']
        logger.info("Created new key %s", new_ak)
    except Exception:
        logger.exception("Failed to create new key")
        publish_sns("❌ Access Key Rotation Failure", f"Failed to create new key for {username}")
        raise

    time.sleep(VALIDATION_SLEEP)

    if not validate_credentials(new_ak, new_sk):
        try:
            iam_client.delete_access_key(UserName=username, AccessKeyId=new_ak)
        except Exception:
            logger.exception("Failed to delete invalid new key")
        publish_sns("❌ Access Key Rotation Failed", f"Validation failed for {username}")
        raise Exception("Validation failed")

    secret.update({
        "accessKeyId": new_ak,
        "secretAccessKey": new_sk,
        "lastRotated": datetime.now(timezone.utc).isoformat(),
        "version": secret.get('version', 0) + 1
    })

    try:
        put_secret(secret)
    except Exception:
        logger.exception("Failed to update secret, deleting new key to avoid orphan")
        try:
            iam_client.delete_access_key(UserName=username, AccessKeyId=new_ak)
        except Exception:
            logger.exception("Failed to delete new key after secret update failed")
        publish_sns("❌ Access Key Rotation Failed", f"Secret update failed for {username}")
        raise

    for key in old_key_ids:
        if key == new_ak:
            continue
        try:
            iam_client.delete_access_key(UserName=username, AccessKeyId=key)
            logger.info("Deleted old key: %s", key)
        except Exception:
            logger.exception("Failed to delete old key: %s", key)

    publish_sns("✅ Access Key Rotation Success", f"IAM Access key for {username} rotated successfully. New AccessKeyId: {new_ak}")
    return {"status": "success", "newAccessKeyId": new_ak}
```

---

## 📦 requirements.txt

If you’re only using `boto3` (already available in Lambda runtime), you can leave this empty.
If you add dependencies later (like requests or jsonschema), list them here.

```text
# requirements.txt
# boto3 is available by default in Lambda; nothing needed yet.
```

---

## 🧱 sam-lambda-template.yaml (CodeUri version)

Replace the `InlineCode` block with:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: SAM template that deploys Access Key Rotation Lambda (CodeUri version).

Parameters:
  Prefix:
    Type: String
    Default: prod
  LambdaRoleArnExportName:
    Type: String
  SecretArnExportName:
    Type: String
  SnsTopicArnExportName:
    Type: String
  RotateAfterDays:
    Type: Number
    Default: 90
  ValidationSleep:
    Type: Number
    Default: 3

Resources:
  AccessKeyRotationFunction:
    Type: AWS::Serverless::Function
    Properties:
      FunctionName: !Sub "${Prefix}-AccessKeyRotate"
      Handler: lambda_function.lambda_handler
      Runtime: python3.10
      CodeUri: src/
      Role: !ImportValue { 'Fn::Sub': "${LambdaRoleArnExportName}" }
      Timeout: 300
      MemorySize: 256
      Environment:
        Variables:
          SECRET_ARN: !ImportValue { 'Fn::Sub': "${SecretArnExportName}" }
          SNS_TOPIC_ARN: !ImportValue { 'Fn::Sub': "${SnsTopicArnExportName}" }
          ROTATE_AFTER_DAYS: !Ref RotateAfterDays
          VALIDATION_SLEEP: !Ref ValidationSleep

Outputs:
  LambdaArn:
    Value: !GetAtt AccessKeyRotationFunction.Arn
    Export:
      Name: !Sub "${Prefix}-RotationLambdaArn"
```

---

## 🚀 Build → Package → Deploy flow

Run these commands from inside your `access-key-rotation/` folder:

### 1️⃣ Build locally

```bash
sam build
```

This creates `.aws-sam/build/` with dependencies packaged.

### 2️⃣ Package (optional if using `sam deploy --guided`)

You can explicitly package if you want the zip in S3 first:

```bash
sam package \
  --s3-bucket my-sam-artifacts-bucket \
  --output-template-file packaged.yaml
```

### 3️⃣ Deploy (guided)

If you haven’t deployed before:

```bash
sam deploy --guided
```

You’ll be prompted for:

* Stack Name: `prod-lambda`
* AWS Region
* Parameters:

  * `Prefix`: prod
  * `LambdaRoleArnExportName`: `prod-LambdaRoleArn`
  * `SecretArnExportName`: `prod-SecretArn`
  * `SnsTopicArnExportName`: `prod-SNSTopicArn`
* Save these values to `samconfig.toml` so future deploys are one command.

Then later, you can redeploy easily:

```bash
sam deploy
```

---

## 🧾 Validation

After successful deploy:

```bash
aws lambda invoke --function-name prod-AccessKeyRotate response.json
cat response.json
```

You should see something like:

```json
{"status":"skipped","days_since":25}
```

(if key was rotated recently)

---

## 🔁 Connect EventBridge

Once deployed, run:

```bash
aws cloudformation deploy \
  --template-file ../infra/eventbridge-stack.yaml \
  --stack-name prod-eventbridge \
  --parameter-overrides \
    Prefix=prod \
    RotationLambdaArnExportName=prod-RotationLambdaArn \
    ScheduleExpression="cron(0 0 1 1,4,7,10 ? *)"
```

This links the EventBridge rule to your Lambda so it runs automatically per schedule.

---

## ✅ Summary

You now have:

* Code stored in `src/` (version-controlled).
* Modular stacks for IAM, SNS, Secrets, Lambda, and Scheduler.
* SAM-managed Lambda (easy local test & deploy).
* Reusable infra stacks with imports between them.

---

Would you like me to also add:

* ✅ an **SNS email subscription** stack (for notifications)?
* ✅ a **CloudWatch Alarm** stack to alert on Lambda errors?

Both can plug into your existing SNS topic and follow the same modular export/import pattern.
