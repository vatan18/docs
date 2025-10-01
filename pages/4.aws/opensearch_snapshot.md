# 📘 **Manual Snapshot Backup of Amazon OpenSearch into S3**

## 🔍 Overview

Amazon OpenSearch Service supports **manual snapshots** to back up your cluster's **indexes and state** to your own S3 bucket. These are useful for:
- Disaster recovery
- Migrating data between domains or accounts

### This guide walks through:
- Required AWS setup (IAM Role, S3 Bucket)
- Python script to register the repository and trigger snapshots
- Checking snapshot status
- Using OpenSearch Dashboard (Dev Tools)

---

## ✅ Prerequisites

### 1. **S3 Bucket**
Create an S3 bucket (e.g., `my-opensearch-snapshots`) to store snapshots.

> ❗ Do **not** apply Glacier lifecycle rules to this bucket.

---

### 2. **IAM Role for OpenSearch (Snapshot Role)**
Create an IAM role (e.g., `OpenSearchSnapshotRole`) and attach the following policies:

#### 📜 IAM Policy to Access S3

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "s3:ListBucket"
      ],
      "Effect": "Allow",
      "Resource": [
        "arn:aws:s3:::my-opensearch-snapshots"
      ]
    },
    {
      "Action": [
        "s3:GetObject", 
        "s3:PutObject", 
        "s3:DeleteObject"
      ],
      "Effect": "Allow",
      "Resource": [
        "arn:aws:s3:::my-opensearch-snapshots/*"
      ]
    }
  ]
}
```

#### 🤝 Trust Relationship with OpenSearch

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "es.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

---

### 3. **Permissions for Snapshot Registration**
Attach the following policy to the **IAM user or role** running the script:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "iam:PassRole",
      "Resource": "arn:aws:iam::ACCOUNT_ID:role/OpenSearchSnapshotRole"
    },
    {
      "Effect": "Allow",
      "Action": "es:ESHttpPut",
      "Resource": "arn:aws:es:REGION:ACCOUNT_ID:domain/DOMAIN_NAME/*"
    }
  ]
}
```

---

## 🐍 Python Script to Register Snapshot Repository

```python
import boto3
import requests
from requests_aws4auth import AWS4Auth
import json
import os


def get_aws_auth(region, service='es'):
    """
    Returns an AWS4Auth object using either environment variables or boto3 session credentials.
    """
    session = boto3.Session()
    credentials = session.get_credentials()
    return AWS4Auth(
        credentials.access_key,
        credentials.secret_key,
        region,
        service,
        session_token=credentials.token
    )


def register_snapshot_repository(host, region, repo_name, bucket_name, role_arn):
    """
    Registers a snapshot repository in OpenSearch using S3.
    """
    awsauth = get_aws_auth(region)
    path = f"/_snapshot/{repo_name}"
    url = host + path

    payload = {
        "type": "s3",
        "settings": {
            "bucket": bucket_name,
            "region": region,
            "role_arn": role_arn
        }
    }

    headers = {"Content-Type": "application/json"}

    try:
        response = requests.put(
            url, auth=awsauth, json=payload, headers=headers)
        response.raise_for_status()
        print(f"[SUCCESS] Registered snapshot repository '{repo_name}'")
    except requests.exceptions.RequestException as e:
        print(f"[ERROR] Failed to register repository '{repo_name}': {e}")
        return {'statusCode': response.status_code, 'body': response.text}

    return {'statusCode': response.status_code, 'body': response.text}


def main():
    repo = {
        "host": "https://search-elasticsearch-emr245peftznltrs6ygp4hp35y.us-east-2.es.amazonaws.com",
        "region": "us-east-2",
        "repo_name": "elasticsearch-snapshot-repo",
        "bucket_name": "legaltech-openseach-snapshot",
        "role_arn": "arn:aws:iam::126859476350:role/opensearch-snapshot-role-bs"
    }

    result = register_snapshot_repository(**repo)
    print(f"Response: {result}")


if __name__ == "__main__":
    main()
```

---

## 📸 Creating a Manual Snapshot

Once your repository is registered, you can create a snapshot using:

```bash
PUT /_snapshot/elasticsearch-snapshot-repo/snapshot-2025-04-21
```

In Python:

```python
def create_snapshot(domain_endpoint, repo_name, snapshot_name, awsauth):
    url = f"{domain_endpoint}/_snapshot/{repo_name}/{snapshot_name}"
    response = requests.put(url, auth=awsauth)
    print(f"[{response.status_code}] Snapshot Creation Response:")
    print(response.text)

# Call this after registering repo
create_snapshot(
    domain_endpoint="https://search-your-opensearch-domain.us-west-2.es.amazonaws.com",
    repo_name="elasticsearch-snapshot-repo",
    snapshot_name="snapshot-2025-04-21",
    awsauth=awsauth
)
```

---

## 🔎 Checking Snapshot Status

To verify the status of a snapshot:

```bash
GET /_snapshot/elasticsearch-snapshot-repo/snapshot-2025-04-21
```

In Python:

```python
def get_snapshot_status(domain_endpoint, repo_name, snapshot_name, awsauth):
    url = f"{domain_endpoint}/_snapshot/{repo_name}/{snapshot_name}"
    response = requests.get(url, auth=awsauth)
    print(f"[{response.status_code}] Snapshot Status Response:")
    print(response.text)

# Usage:
get_snapshot_status(
    domain_endpoint="https://search-your-opensearch-domain.us-west-2.es.amazonaws.com",
    repo_name="elasticsearch-snapshot-repo",
    snapshot_name="snapshot-2025-04-21",
    awsauth=awsauth
)
```

---

## 🧹 Deleting a Snapshot

To delete a manual snapshot:

```bash
DELETE /_snapshot/elasticsearch-snapshot-repo/snapshot-2025-04-21
```

---

## 🖥️ Using OpenSearch Dashboard (Dev Tools)

These snapshot operations can also be performed directly from the **OpenSearch Dashboard → Dev Tools**:

```bash
PUT _snapshot/elasticsearch-snapshot-repo
{
  "type": "s3",
  "settings": {
    "bucket": "legaltech-openseach-snapshot",
    "region": "us-east-2",
    "role_arn": "arn:aws:iam::126859476350:role/opensearch-snapshot-role-bs"
  }
}
```

```bash
PUT _snapshot/elasticsearch-snapshot-repo/snapshot-2025-04-21
```

```bash
GET _snapshot/elasticsearch-snapshot-repo/snapshot-2025-04-21
```

---

## 🧾 Summary Checklist

| Task                            | Done |
|-------------------------------|------|
| ✅ Create S3 bucket             | ☐    |
| ✅ Create IAM role + trust     | ☐    |
| ✅ Attach IAM policies         | ☐    |
| ✅ Register snapshot repo      | ☐    |
| ✅ Trigger snapshot            | ☐    |
| ✅ Check snapshot status       | ☐    |
| ✅ Use Dashboard Dev Tools     | ☐    |

---