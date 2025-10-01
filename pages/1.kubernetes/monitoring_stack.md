# Monitoring Stack with Prometheus and Grafana

## Description

This documentation covers the setup of a monitoring stack with Prometheus and Grafana on a Kubernetes cluster using Helm.

---

## Prerequisites

- A working Kubernetes cluster
- `kubectl` configured to connect to your cluster
- `curl` for downloading Helm
- `helm` package manager for Kubernetes

---

## Step 1: Install Helm

Helm is used to manage Kubernetes applications. Install Helm using one of the following methods:

### Option 1: Install Helm Using `curl` (Recommended)

```bash
curl <https://raw.githubusercontent.com/helm/helm/master/scripts/get-helm-3> | bash
```

### Option 2: Install Helm Using Package Managers

For **Ubuntu/Debian**:

```bash
# Add the Helm GPG key
curl <https://baltocdn.com/helm/signing.asc> | gpg --dearmor | sudo tee /usr/share/keyrings/helm.gpg > /dev/null

# Install necessary transport packages
sudo apt-get install apt-transport-https --yes

# Add Helm repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/helm.gpg] <https://baltocdn.com/helm/stable/debian/> all main" | sudo tee /etc/apt/sources.list.d/helm-stable-debian.list

# Update package manager and install Helm
sudo apt-get update
sudo apt-get install helm
```

---

## Step 2: Install Prometheus

Prometheus will be installed from the `prometheus-community` Helm repository.

1. **Add the Prometheus Helm Chart Repository**:
    
    ```bash
    helm repo add prometheus-community <https://prometheus-community.github.io/helm-charts>
    helm repo update
    ```
    
2. **Create a Custom Namespace** for monitoring (optional but recommended):
    
    ```bash
    kubectl create namespace monitoring
    ```
    
3. **Install Prometheus** in the `monitoring` namespace:
    
    ```bash
    helm install --namespace monitoring prometheus prometheus-community/prometheus
    ```
    

---

## Step 3: Install Grafana

Grafana will be installed from the `grafana` Helm repository.

1. **Add the Grafana Helm Chart Repository**:
    
    ```bash
    helm repo add grafana <https://grafana.github.io/helm-charts>
    helm repo update
    ```
    
2. **Install Grafana** in the `monitoring` namespace:
    
    ```bash
    helm install --namespace monitoring grafana grafana/grafana --set release-namespace=monitoring
    ```
    

---

## Step 4: Access Grafana

To access Grafana, retrieve the default password for the `admin` user.

```bash
kubectl get secret --namespace monitoring grafana -o jsonpath="{.data.admin-password}" | base64 --decode ; echo
```

This command decodes and displays the password for Grafana’s `admin` user.

---