✅ **Sensitive data** comes from **AWS Secrets Manager**
✅ **Configurable app vars** come from **Kubernetes ConfigMap**
✅ **Jenkins pipeline** automatically fetches & syncs AWS secrets before deploy

---

## 🧱 1. AWS Secrets Manager setup

First, store your sensitive values there (run only once):

```bash
cat > secrets.json <<EOF
{
  "DB_USERNAME": "admin",
  "DB_PASSWORD": "supersecret",
  "API_KEY": "xxxxxx",
  "JWT_SECRET": "xxxxxx"
}
EOF

aws secretsmanager create-secret \
  --name bb-hr-bgv-uat-secrets \
  --secret-string file://secrets.json \
  --region ap-south-1
```

---

## 🧩 2. Create ConfigMap (for non-sensitive vars)

Create file: `manifest/configmap.yaml`

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: bb-hr-bgv-uat-config
data:
  NODE_ENV: "uat"
  PORT: "443"
  LOG_LEVEL: "info"
  BASE_URL: "https://chatbotserveruat.bikebazaar.com"
  FEATURE_TOGGLE_XYZ: "true"
```

Apply it:

```bash
kubectl apply -f manifest/configmap.yaml
```

---

## 🧠 3. Update Deployment Manifest

File: `manifest/deployment.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: bb-hr-bgv-uat
spec:
  replicas: 1
  selector:
    matchLabels:
      app: bb-hr-bgv-uat
  template:
    metadata:
      labels:
        app: bb-hr-bgv-uat
    spec:
      containers:
      - name: bb-hr-bgv-uat
        image: 444320815966.dkr.ecr.ap-south-1.amazonaws.com/bb_hr_bgv_uat:latest
        ports:
        - containerPort: 443
        envFrom:
        - configMapRef:
            name: bb-hr-bgv-uat-config
        - secretRef:
            name: bb-hr-bgv-uat-secret
```

> 🔹 `secretRef` will be created dynamically by Jenkins (see below).

---

## ⚙️ 4. Jenkinsfile — Complete CI/CD with Secrets Fetch + Deploy

Here’s your **full Jenkinsfile**, combining your current logic + secret sync:

```groovy
pipeline {
  agent any

  environment {
    registry = '444320815966.dkr.ecr.ap-south-1.amazonaws.com/bb_hr_bgv_uat'
    aws_region = 'ap-south-1'
    eks_cluster = 'WheelsEMI-UAT-2-EKS-Cluster'
    secret_name = 'bb-hr-bgv-uat-secrets'
    // credentials configured in Jenkins for AWS access
    aws_credentials = 'aws-jenkins-creds'
  }

  stages {

    stage('Cleanup Old Build') {
      steps {
        echo "Cleaning old build containers..."
        sh 'docker system prune -f || true'
      }
    }

    stage('Docker Build & Push') {
      steps {
        sh '''
          echo "Building Docker image..."
          docker build -t $registry:latest .
          echo "Logging into ECR..."
          aws ecr get-login-password --region $aws_region | docker login --username AWS --password-stdin $registry
          echo "Pushing image..."
          docker push $registry:latest
        '''
      }
    }

    stage('Fetch Secrets from AWS Secrets Manager') {
      steps {
        withAWS(credentials: aws_credentials, region: "${aws_region}") {
          script {
            sh '''
              echo "Fetching secrets from AWS Secrets Manager..."
              aws secretsmanager get-secret-value \
                --secret-id $secret_name \
                --region $aws_region \
                --query SecretString \
                --output text > secrets.json

              echo "Converting secrets JSON to key=value format..."
              jq -r 'to_entries|map("\\(.key)=\\(.value)")|.[]' secrets.json > .env.k8s

              echo "Creating Kubernetes Secret..."
              kubectl create secret generic bb-hr-bgv-uat-secret \
                --from-env-file=.env.k8s \
                --dry-run=client -o yaml | kubectl apply -f -
            '''
          }
        }
      }
    }

    stage('Deploy to EKS') {
      steps {
        withAWS(credentials: aws_credentials, region: "${aws_region}") {
          script {
            sh '''
              echo "Updating kubeconfig..."
              aws eks update-kubeconfig --region $aws_region --name $eks_cluster
              echo "Applying manifests..."
              kubectl apply -f manifest/configmap.yaml
              kubectl apply -f manifest/deployment.yaml
              kubectl apply -f manifest/service.yaml
              kubectl apply -f manifest/bb-hr-bgv-uat-hpa.yaml
              kubectl apply -f manifest/new-bb-hr-bgv-uat-ingress.yaml
              kubectl rollout status deployment/bb-hr-bgv-uat
              kubectl get pods -o wide
            '''
          }
        }
      }
    }
  }

  post {
    always {
      echo "Cleaning workspace..."
      cleanWs()
    }
  }
}
```

---

## 📦 5. Node.js App Code Change

In your `server.js` (or main app file), make sure to use:

```js
require('dotenv').config();

console.log("Loaded environment:", process.env.NODE_ENV);
```

You **don’t** need the `.env.uat` logic anymore —
Because environment variables are injected directly by Kubernetes now.

---

## 🔐 6. Secrets Rotation / Update Flow

When secrets change in AWS:

1. Update the secret in AWS Secrets Manager (manually or via automation).
2. Jenkins will **automatically fetch** the latest values at next deployment.
3. It will update the K8s Secret before applying manifests.

---

## 🧭 7. Final Architecture

| Type              | Source                                     | Updated By | Frequency |
| ----------------- | ------------------------------------------ | ---------- | --------- |
| **Sensitive**     | AWS Secrets Manager → Jenkins → K8s Secret | DevOps     | Rare      |
| **Non-sensitive** | ConfigMap YAML in Git                      | Developer  | Frequent  |

---

## ✅ Benefits of this setup

* No `.env` files shipped in Docker image 🔒
* AWS manages secret encryption & rotation
* Developers can edit configs without touching secrets
* Jenkins automates secret synchronization
* Kubernetes stays clean, modular, and environment-aware


