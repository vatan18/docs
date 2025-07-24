# Complete Guide: Self-Hosted GitHub Actions Runner on Kubernetes with ARC

This guide will walk you through setting up self-hosted GitHub Actions runners on Kubernetes using Actions Runner Controller (ARC). We'll start with setting up a local Kubernetes cluster using Minikube and then deploy ARC.

## Prerequisites

- Docker installed on your system
- `kubectl` command-line tool
- `helm` package manager for Kubernetes
- A GitHub account with repository/organization access

## Step 1: Install Required Tools

### Install Minikube
```bash
# For macOS
brew install minikube

# For Ubuntu/Debian
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube

# For Windows (using Chocolatey)
choco install minikube
```

### Install kubectl
```bash
# For macOS
brew install kubectl

# For Ubuntu/Debian
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# For Windows (using Chocolatey)
choco install kubernetes-cli
```

### Install Helm
```bash
# For macOS
brew install helm

# For Ubuntu/Debian
curl https://baltocdn.com/helm/signing.asc | gpg --dearmor | sudo tee /usr/share/keyrings/helm.gpg > /dev/null
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/helm.gpg] https://baltocdn.com/helm/stable/debian/ all main" | sudo tee /etc/apt/sources.list.d/helm-stable-debian.list
sudo apt-get update && sudo apt-get install helm

# For Windows (using Chocolatey)
choco install kubernetes-helm
```

## Step 2: Start Minikube Cluster

```bash
# Start Minikube with sufficient resources
minikube start --cpus=4 --memory=8192 --disk-size=50gb

# Verify cluster is running
kubectl cluster-info
kubectl get nodes
```

## Step 3: Create GitHub App for ARC

ARC requires a GitHub App for authentication. Follow these steps:

### 3.1 Create GitHub App
1. Go to your GitHub organization settings or personal account settings
2. Navigate to **Developer settings** → **GitHub Apps**
3. Click **New GitHub App**
4. Fill in the following details:
   - **GitHub App name**: `your-org-arc-runner`
   - **Homepage URL**: `https://github.com/your-org`
   - **Webhook URL**: `https://example.com/webhook` (can be dummy for now)
   - **Webhook secret**: Generate a random string

### 3.2 Set Permissions
Under **Repository permissions**, set:
- **Actions**: Read
- **Administration**: Read
- **Checks**: Read
- **Contents**: Read
- **Metadata**: Read
- **Pull requests**: Read

Under **Organization permissions**, set:
- **Self-hosted runners**: Write

### 3.3 Subscribe to Events
Select these webhook events:
- **Workflow job**
- **Workflow run**
- **Pull request**
- **Push**

### 3.4 Install the App
1. After creating the app, note down the **App ID**
2. Generate and download a **private key**
3. Install the app to your organization/repository

## Step 4: Install ARC Controller

### 4.1 Create Namespace
```bash
kubectl create namespace arc-systems
```

### 4.2 Create GitHub App Secret
First, convert your private key to base64:

```bash
# Convert private key to base64 (replace path with your key file)
cat /path/to/your/private-key.pem | base64 -w 0
```

Create the secret:
```bash
kubectl create secret generic github-app-secret \
  --namespace=arc-systems \
  --from-literal=github_app_id=YOUR_APP_ID \
  --from-literal=github_app_installation_id=YOUR_INSTALLATION_ID \
  --from-literal=github_app_private_key="$(cat /path/to/your/private-key.pem)"
```

### 4.3 Install ARC Controller using Helm
```bash
# Add the ARC Helm repository
helm repo add actions-runner-controller https://actions-runner-controller.github.io/actions-runner-controller

# Update Helm repositories
helm repo update

# Install the controller
NAMESPACE="arc-systems"
helm install arc \
  --namespace "${NAMESPACE}" \
  --create-namespace \
  oci://ghcr.io/actions/actions-runner-controller-charts/gha-runner-scale-set-controller

# Verify installation
kubectl get pods -n arc-systems
```

## Step 5: Deploy Runner Scale Set

### 5.1 Create Runner Namespace
```bash
kubectl create namespace arc-runners
```

### 5.2 Create Values File for Runner Scale Set
Create a file called `runner-values.yaml`:

```yaml
# runner-values.yaml
githubConfigUrl: "https://github.com/YOUR_ORG"  # or https://github.com/YOUR_ORG/YOUR_REPO
githubConfigSecret: "github-app-secret"

maxRunners: 5
minRunners: 1

# Runner image configuration
template:
  spec:
    containers:
    - name: runner
      image: ghcr.io/actions/actions-runner:latest
      env:
      - name: ACTIONS_RUNNER_CONTAINER_HOOKS
        value: /home/runner/k8s/index.js
      - name: ACTIONS_RUNNER_POD_NAME
        valueFrom:
          fieldRef:
            fieldPath: metadata.name
      - name: ACTIONS_RUNNER_REQUIRE_JOB_CONTAINER
        value: "false"
      volumeMounts:
      - name: work
        mountPath: /home/runner/_work
    volumes:
    - name: work
      emptyDir: {}

# Controller service account
controllerServiceAccount:
  namespace: arc-systems
  name: arc-gha-runner-scale-set-controller
```

### 5.3 Create GitHub App Secret in Runner Namespace
```bash
kubectl create secret generic github-app-secret \
  --namespace=arc-runners \
  --from-literal=github_app_id=YOUR_APP_ID \
  --from-literal=github_app_installation_id=YOUR_INSTALLATION_ID \
  --from-literal=github_app_private_key="$(cat /path/to/your/private-key.pem)"
```

### 5.4 Deploy Runner Scale Set
```bash
# Install the runner scale set
helm install arc-runner-set \
  --namespace arc-runners \
  oci://ghcr.io/actions/actions-runner-controller-charts/gha-runner-scale-set \
  -f runner-values.yaml

# Verify deployment
kubectl get pods -n arc-runners
kubectl get runnerscalesets -n arc-runners
```

## Step 6: Verify Setup

### 6.1 Check Runner Registration
1. Go to your GitHub repository/organization settings
2. Navigate to **Actions** → **Runners**
3. You should see your runner scale set listed

### 6.2 Check Kubernetes Resources
```bash
# Check controller pods
kubectl get pods -n arc-systems

# Check runner pods
kubectl get pods -n arc-runners

# Check runner scale sets
kubectl get runnerscalesets -A

# View logs if needed
kubectl logs -n arc-systems -l app.kubernetes.io/name=gha-runner-scale-set-controller
```

## Step 7: Test with a Workflow

Create a test workflow in your repository (`.github/workflows/test.yml`):

```yaml
name: Test Self-Hosted Runner
on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: arc-runner-set  # This should match your runner scale set name
    steps:
    - uses: actions/checkout@v4
    
    - name: Test runner
      run: |
        echo "Hello from self-hosted runner!"
        echo "Runner name: $RUNNER_NAME"
        echo "Runner OS: $RUNNER_OS"
        kubectl version --client
```

## Troubleshooting

### Common Issues and Solutions

1. **Pods in CrashLoopBackOff**:
   ```bash
   kubectl logs <pod-name> -n arc-systems
   kubectl describe pod <pod-name> -n arc-systems
   ```

2. **Authentication Issues**:
   - Verify GitHub App ID and Installation ID
   - Check private key format and permissions
   - Ensure the GitHub App is installed on the correct organization/repository

3. **Runner Not Appearing in GitHub**:
   - Check the `githubConfigUrl` in your values file
   - Verify the GitHub App has correct permissions
   - Check controller logs for authentication errors

4. **Resource Constraints**:
   ```bash
   # Check resource usage
   kubectl top nodes
   kubectl top pods -A
   
   # Increase Minikube resources if needed
   minikube stop
   minikube start --cpus=6 --memory=12288
   ```

### Useful Commands

```bash
# Monitor runner scaling
kubectl get pods -n arc-runners -w

# Check runner scale set status
kubectl describe runnerscaleset -n arc-runners

# View all ARC resources
kubectl get all -n arc-systems
kubectl get all -n arc-runners

# Delete everything (if you want to start over)
helm uninstall arc-runner-set -n arc-runners
helm uninstall arc -n arc-systems
kubectl delete namespace arc-runners
kubectl delete namespace arc-systems
```

## Advanced Configuration

### Custom Runner Images
Create a custom Dockerfile with additional tools:

```dockerfile
FROM ghcr.io/actions/actions-runner:latest

USER root

# Install additional tools
RUN apt-get update && apt-get install -y \
    docker.io \
    nodejs \
    npm \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

USER runner
```

### Scaling Configuration
Modify your `runner-values.yaml` for custom scaling:

```yaml
maxRunners: 10
minRunners: 2

# Auto-scaling based on queue
scaling:
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15
```

## Cleanup

When you're done testing:

```bash
# Remove runner scale set
helm uninstall arc-runner-set -n arc-runners

# Remove controller
helm uninstall arc -n arc-systems

# Delete namespaces
kubectl delete namespace arc-runners
kubectl delete namespace arc-systems

# Stop Minikube
minikube stop
minikube delete
```

## Next Steps

- Configure resource limits and requests for production use
- Set up monitoring and observability
- Implement security policies and network policies
- Consider using cloud-managed Kubernetes for production workloads
- Explore advanced ARC features like webhook-driven scaling

This setup provides a solid foundation for running self-hosted GitHub Actions runners on Kubernetes with automatic scaling capabilities.