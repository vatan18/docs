# Authenticate GitHub Using AWS IAM Role

To set up GitHub Actions with an IAM role, you need to manually add GitHub as an OpenID Connect (OIDC) identity provider in your AWS account. Follow these steps:

## 1. Add GitHub as an OIDC Identity Provider

1. **Go to the AWS IAM Console:**
   - Navigate to the IAM console.

2. **Add a New Identity Provider:**
   - In the left-hand navigation pane, click on **Identity providers**.
   - Click **Add provider**.
   - For **Provider type**, select **OpenID Connect**.

3. **Configure the Identity Provider:**
   - **Provider URL:** Enter `https://token.actions.githubusercontent.com`
   - **Audience:** Enter `sts.amazonaws.com`

4. After configuring the provider, click **Add provider**.

---

## 2. Create an IAM Role for GitHub Actions

1. **Create a New Role:**
   - Go to **Roles** in the IAM console.
   - Click **Create role**.
   - Choose **Custom trust policy** and enter a trust policy.

2. **Configure the Trust Policy:**
   - Here’s an example of a trust policy that allows GitHub Actions to assume this role:

     ```json
     {
       "Version": "2012-10-17",
       "Statement": [
         {
           "Effect": "Allow",
           "Principal": {
             "Federated": "arn:aws:iam::YOUR_ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
           },
           "Action": "sts:AssumeRoleWithWebIdentity",
           "Condition": {
             "StringLike": {
               "token.actions.githubusercontent.com:sub": "repo:YOUR_ORG/YOUR_REPO:*"
             }
           }
         }
       ]
     }
     ```

3. **Replace `YOUR_ACCOUNT_ID`, `YOUR_ORG`, and `YOUR_REPO`** with your actual AWS account ID, GitHub organization, and repository names.

4. **Attach Policies to the Role:**
   - Attach the necessary policies to the role that define the permissions GitHub Actions will have when assuming the role.

---

## 3. Update Your GitHub Actions Workflow

Finally, configure your GitHub Actions workflow to use the IAM role:

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          role-to-assume: arn:aws:iam::YOUR_ACCOUNT_ID:role/YOUR_ROLE_NAME
          aws-region: YOUR_AWS_REGION

      - name: Deploy to S3
        run: |
          aws s3 sync . s3://your-bucket-name
```

### Example Workflow

```yaml
name: 'run commands on aws using github-action-role'
on:
  push:
permissions: write-all
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          role-to-assume: arn:aws:iam::607089492772:role/github-action-role
          aws-region: us-east-2

      - name: Run command
        run: |
          aws sts get-caller-identity
```

---

## 4. Test and Verify

Once everything is configured, run your GitHub Actions workflow to verify that it can assume the IAM role and perform actions on AWS.

By setting up GitHub as an OIDC provider and configuring a role with the necessary permissions, you can securely integrate GitHub Actions with AWS without using long-term credentials.

--- 
\