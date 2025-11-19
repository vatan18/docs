https://chatgpt.com/share/691d464c-709c-800e-a42a-7cad8bc3cb8c
---

# ✅ **DevOps Lab Setup Plan**

## **Goal**

Build a **complete, functional, zero-cost DevOps lab** covering CI/CD, containerization, image management, Kubernetes orchestration, and networking—using open-source tools that mirror real-world enterprise environments.

## **Constraints**

* **Zero Cost**: Fully open-source or free-tier self-hosted tools only.
* **Full DevOps Lifecycle**: Code → CI/CD → image build → registry → K8s deployment → DNS/networking.
* **Realistic Tools**: Must match what companies actually use (GitLab, K8s, Helm, etc.).
* **Ease of Setup**: Lightweight and practical for labs (K3s instead of full kubeadm).

---

# 🎯 **Key Architectural Choices (with rationale)**

### **1. GitLab CE (Self-Hosted)**

✔ All-in-one: Git, CI/CD, Issues, Container Registry
✔ Easy integration with runners
✔ Saves time — no need to combine Jenkins + Gitea + Harbor separately

**Why good?**
Ek hi UI me sab mil jaata hai — perfect for lab environments.

---

### **2. K3s**

✔ Lightweight Kubernetes (uses containerd)
✔ Suitable for old hardware or limited VMs
✔ Faster to bootstrap than kubeadm or minikube

**Why good?**
Low RAM + quick setup + real K8s API → perfect for DevOps practice.

---

### **3. Pi-hole for DNS**

✔ Local DNS resolution
✔ No need to modify `/etc/hosts` on all machines
✔ Centralized DNS for domains like:
`gitlab.homelab.local`, `registry.local`, `argo.homelab.local`

---

## 🏗 **Implementation Plan (Improved Step-by-Step)**

---

# **Phase 1: Infrastructure & Core Services**

### **1. Provision VMs / Hardware**

* **VM 1** – GitLab + Docker/Compose
* **VM 2** – K3s Server
* **VM 3 & 4** – K3s Agent/Worker Nodes

*(3 nodes gives real cluster feel: master + workers)*

---

### **2. Install Docker + Docker Compose**

On GitLab Host VM:

```bash
sudo apt install docker.io docker-compose
```

---

### **3. Deploy GitLab CE (via Docker Compose)**

Use an official or customized `docker-compose.yml` file:

* GitLab web
* GitLab Registry
* GitLab API

---

### **4. Set Up Local DNS with Pi-Hole**

* Install Pi-hole on a Pi or small VM.
* Set your router DHCP DNS = Pi-hole.
* Add local DNS records:

  * `gitlab.homelab.local → 192.168.x.x`
  * `registry.homelab.local → 192.168.x.x`

---

# **Phase 2: Kubernetes (K3s) Cluster Setup**

### **1. Install K3s Server**

```bash
curl -sfL https://get.k3s.io | sh -
```

### **2. Join Worker Nodes**

Use the token from:
`/var/lib/rancher/k3s/server/node-token`

---

### **3. Access Kubeconfig**

Copy file from server:
`/etc/rancher/k3s/k3s.yaml`
Modify IP and use with:

```bash
kubectl get nodes
```

---

# **Phase 3: CI/CD Integration & Image Management**

### **1. Install GitLab Runner**

Option 1: Run on worker node
Option 2: Run inside Docker on GitLab host

Register:

```bash
gitlab-runner register
```

### **2. Image Management**

Primary: **GitLab Container Registry**

* Zero cost
* Auto-integrated with GitLab
* Easy push/pull in pipelines

Use:

```
registry.gitlab.homelab.local:5050
```

### **3. (Optional) Advanced Registry: Harbor**

If you want:

* vulnerability scanning
* replication
* Notary signing
* role-based multi-tenant registry

Install via Helm inside K3s.

---

### **4. Deployment from GitLab CI**

Methods:

* Raw `kubectl apply`
* **Helm charts**
* **ArgoCD** (declarative GitOps)

Recommended:
✔ Start with Helm
✔ Later add ArgoCD for GitOps practice

---

# 📘 **Summary of Tools**

| Function                   | Tool                        | Role                        |
| -------------------------- | --------------------------- | --------------------------- |
| Source Code + CI/CD        | **GitLab CE**               | Repo, pipelines, registry   |
| Kubernetes                 | **K3s**                     | Lightweight K8s cluster     |
| DNS                        | **Pi-hole**                 | Local DNS & DNS routing     |
| Image Storage              | **GitLab Registry**         | Primary OCI registry        |
| Optional Advanced Registry | **Harbor**                  | Scanning, RBAC, replication |
| Deployment                 | **Helm / kubectl / ArgoCD** | Deploy apps to K8s          |

---

# 📌 **Overall Review & Suggestions**

### ✔ Your concept is solid, professional, and reflects real-world DevOps design.

### ✔ The tool choices are excellent for a free lab.

### ✔ Document structure is clear but needed polishing — now fixed.

### 🔧 Minor Suggestions

* Add **Traefik Ingress** (K3s default) for routing to apps.
* Add **Prometheus + Grafana** for monitoring practice.
* Add **Loki** for logs (easy + zero cost).
* Add **Keycloak** if you want auth practice.
* Use **Terraform/Ansible** later to automate VM provisioning.

---

If you want, I can also prepare:
✅ Architecture Diagram
✅ docker-compose.yml for GitLab
✅ K3s deployment commands pack
✅ GitLab CI template for build → push → deploy
✅ Terraform + Ansible setup for automation

----------------------------------------------------------
##### 2nd prompt ###########
Chalo, pura lab bana dete hain end-to-end 😄
Main everything ek hi answer me de raha hoon: diagram, Docker Compose, K3s commands, CI/CD, Terraform + Ansible skeleton. Aap directly isko as a “starter kit” use kar sakte ho.

---

## 1️⃣ Architecture Diagram (High-Level)

Use this Mermaid diagram (GitLab supports it in wiki, ya Markdown viewers me):

```mermaid
flowchart LR
    Dev[Dev Laptop\nkubectl, git, browser] -->|HTTP/SSH| GL[GitLab CE\n(Docker on VM1)]
    Dev -->|HTTPS| Pi[Pi-hole DNS]

    subgraph DNS
        Pi[Pi-hole\nDNS Server]
    end

    Pi -->|Resolves gitlab.homelab.local| GL
    Pi -->|Resolves registry.homelab.local| GL
    Pi -->|Resolves apps.homelab.local| K3sServer

    subgraph K3s Cluster
        K3sServer[K3s Server\nVM2]
        K3sW1[K3s Worker 1\nVM3]
        K3sW2[K3s Worker 2\nVM4]

        K3sServer <--> K3sW1
        K3sServer <--> K3sW2

        subgraph Apps
            App1[Sample App\nDeployment/Service]
            Harbor[(Optional Harbor\nRegistry)]
            Argo[ArgoCD\n(GitOps)]
        end
    end

    GL -->|GitLab Runner\n(on K3s or VM1)| K3sW1
    GL -->|Container Registry\nregistry.homelab.local| Dev
    GL -->|Push Images| K3sServer
    Harbor <-.Optional Mirror/Scan Images .-> GL
```

---

## 2️⃣ GitLab CE via Docker Compose

### 2.1 Directory structure (GitLab VM)

```bash
mkdir -p /srv/gitlab/{config,logs,data}
cd /srv/gitlab
nano docker-compose.yml
```

### 2.2 `docker-compose.yml`

```yaml
version: "3.8"

services:
  gitlab:
    image: gitlab/gitlab-ce:latest
    container_name: gitlab
    restart: always
    hostname: gitlab.homelab.local
    environment:
      GITLAB_OMNIBUS_CONFIG: |
        external_url 'http://gitlab.homelab.local'
        registry_external_url 'http://registry.homelab.local'
        gitlab_rails['gitlab_shell_ssh_port'] = 2222

        # Optional: disable email if not configured yet
        gitlab_rails['smtp_enable'] = false

        # Registry config (embedded)
        registry['enable'] = true
        registry['internal_key'] = '/var/opt/gitlab/gitlab-rails/etc/gitlab-registry.key'
        registry['api_url'] = 'http://localhost:5000'
        registry_nginx['enable'] = true

    ports:
      - "80:80"       # HTTP
      - "443:443"     # HTTPS if you later add TLS
      - "2222:22"     # SSH for git over ssh
    volumes:
      - ./config:/etc/gitlab
      - ./logs:/var/log/gitlab
      - ./data:/var/opt/gitlab
    shm_size: '256m'
```

### 2.3 Start GitLab

```bash
docker compose up -d
```

Then in Pi-hole, add DNS:

* `gitlab.homelab.local` → `<GitLab_VM_IP>`
* `registry.homelab.local` → `<GitLab_VM_IP>`

---

## 3️⃣ K3s Cluster Setup (Server + Agents)

Assume:

* Server: `k3s-server` (VM2) → IP: `192.168.1.20`
* Worker1: `k3s-worker1` (VM3)
* Worker2: `k3s-worker2` (VM4)

### 3.1 Install K3s Server

On **k3s-server**:

```bash
curl -sfL https://get.k3s.io | sh -s - server \
  --disable traefik \
  --write-kubeconfig-mode 644

# Check status
sudo kubectl get nodes
```

(Traefik disable is optional; if you want to use Traefik as default ingress, remove `--disable traefik`.)

Get join token:

```bash
sudo cat /var/lib/rancher/k3s/server/node-token
```

Copy token somewhere safe.

### 3.2 Install K3s Agent Nodes

On **each worker** (k3s-worker1, k3s-worker2):

```bash
export K3S_URL="https://192.168.1.20:6443"
export K3S_TOKEN="<PASTE_SERVER_TOKEN_HERE>"

curl -sfL https://get.k3s.io | K3S_URL=$K3S_URL K3S_TOKEN=$K3S_TOKEN sh -
```

Verify on server:

```bash
sudo kubectl get nodes -o wide
```

### 3.3 Use K3s From Your Laptop

On **k3s-server**:

```bash
sudo cat /etc/rancher/k3s/k3s.yaml
```

Copy contents to your laptop at: `~/.kube/config-k3s`

Edit `server: https://127.0.0.1:6443` → `server: https://192.168.1.20:6443`

On laptop:

```bash
export KUBECONFIG=~/.kube/config-k3s
kubectl get nodes
```

---

## 4️⃣ Sample App Manifests for Deployment

Let’s create a simple app namespace + deployment + service.

### 4.1 Namespace

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: demo-app
```

### 4.2 Deployment + Service

Assume image will be:
`registry.homelab.local:5050/my-group/my-app:latest`
(GitLab project path ke according change hoga.)

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: demo-app
  namespace: demo-app
spec:
  replicas: 2
  selector:
    matchLabels:
      app: demo-app
  template:
    metadata:
      labels:
        app: demo-app
    spec:
      containers:
        - name: demo-app
          image: registry.homelab.local:5050/my-group/my-app:latest
          imagePullPolicy: Always
          ports:
            - containerPort: 8080
          env:
            - name: ENV
              value: "lab"

---
apiVersion: v1
kind: Service
metadata:
  name: demo-app-svc
  namespace: demo-app
spec:
  selector:
    app: demo-app
  ports:
    - port: 80
      targetPort: 8080
      protocol: TCP
  type: ClusterIP
```

---

## 5️⃣ GitLab Runner + CI/CD Pipeline (.gitlab-ci.yml)

### 5.1 GitLab Runner Install (Docker – GitLab VM)

```bash
docker run -d --name gitlab-runner --restart always \
  -v /srv/gitlab-runner/config:/etc/gitlab-runner \
  -v /var/run/docker.sock:/var/run/docker.sock \
  gitlab/gitlab-runner:latest
```

Register:

```bash
docker exec -it gitlab-runner gitlab-runner register
```

Prompts (example inputs):

* URL: `http://gitlab.homelab.local`
* Token: (Project → Settings → CI/CD → Runners → Registration token)
* Description: `docker-runner`
* Executor: `docker`
* Default image: `docker:20.10`

### 5.2 `.gitlab-ci.yml` (Build → Push → Deploy to K3s)

Assume:

* App is in a directory with `Dockerfile`
* Kubernetes manifests in `k8s/`
* You store kubeconfig as base64 in CI variable `KUBE_CONFIG_B64`
* GitLab registry is used (CI built-in vars).

```yaml
stages:
  - build
  - deploy

variables:
  DOCKER_DRIVER: overlay2
  DOCKER_TLS_CERTDIR: "/certs"
  IMAGE_TAG: "$CI_REGISTRY_IMAGE:$CI_COMMIT_SHORT_SHA"
  LATEST_TAG: "$CI_REGISTRY_IMAGE:latest"

build-and-push:
  stage: build
  image: docker:20.10
  services:
    - docker:20.10-dind
  variables:
    DOCKER_HOST: tcp://docker:2375
    DOCKER_TLS_CERTDIR: ""
  script:
    - echo "Logging into GitLab Container Registry..."
    - docker login -u "$CI_REGISTRY_USER" -p "$CI_REGISTRY_PASSWORD" "$CI_REGISTRY"
    - echo "Building image $IMAGE_TAG"
    - docker build -t "$IMAGE_TAG" -t "$LATEST_TAG" .
    - echo "Pushing image..."
    - docker push "$IMAGE_TAG"
    - docker push "$LATEST_TAG"
  only:
    - main
    - master

deploy-to-k3s:
  stage: deploy
  image: bitnami/kubectl:latest
  before_script:
    - echo "Decoding Kubeconfig..."
    - echo "$KUBE_CONFIG_B64" | base64 -d > kubeconfig
    - export KUBECONFIG=$PWD/kubeconfig
  script:
    - kubectl apply -f k8s/namespace.yaml
    - kubectl set image deployment/demo-app demo-app="$LATEST_TAG" -n demo-app || \
      kubectl apply -f k8s/deployment.yaml
    - kubectl rollout status deployment/demo-app -n demo-app
  only:
    - main
    - master
```

**Note:**
`KUBE_CONFIG_B64` banane ke liye server pe:

```bash
cat ~/.kube/config | base64 -w0
```

Is value ko GitLab project → Settings → CI/CD → Variables me add karo.

---

## 6️⃣ Terraform Skeleton (VM Provisioning)

Ye example **Proxmox** provider ka hai, kyunki homelab me common hai. Aap provider apne hypervisor ke hisaab se change kar sakte ho (libvirt, vSphere, etc.).

### 6.1 `main.tf`

```hcl
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    proxmox = {
      source  = "Telmate/proxmox"
      version = "~> 3.0"
    }
  }
}

provider "proxmox" {
  pm_api_url          = var.pm_api_url
  pm_user             = var.pm_user
  pm_password         = var.pm_password
  pm_tls_insecure     = true
}

variable "pm_api_url" {}
variable "pm_user" {}
variable "pm_password" {}

variable "vm_template" {
  description = "Name of the Proxmox template to clone (cloud-init ready)"
}

variable "vm_network_bridge" {
  default     = "vmbr0"
}

variable "vm_ids" {
  type = map(number)
  default = {
    gitlab     = 101
    k3s_server = 102
    k3s_w1     = 103
    k3s_w2     = 104
  }
}

variable "vm_names" {
  type = map(string)
  default = {
    gitlab     = "vm-gitlab"
    k3s_server = "vm-k3s-server"
    k3s_w1     = "vm-k3s-worker1"
    k3s_w2     = "vm-k3s-worker2"
  }
}

resource "proxmox_vm_qemu" "vm" {
  for_each = var.vm_names

  name        = each.value
  vmid        = var.vm_ids[each.key]
  clone       = var.vm_template
  target_node = "pve"

  cores   = 2
  sockets = 1
  memory  = 4096

  network {
    model  = "virtio"
    bridge = var.vm_network_bridge
  }

  disk {
    size    = "40G"
    type    = "virtio"
    storage = "local-lvm"
  }

  os_type = "cloud-init"

  ipconfig0 = "ip=dhcp"
}
```

Yeh basic skeleton hai — aap CPU/RAM per-VM customize kar sakte ho.

---

## 7️⃣ Ansible Setup (Install Docker, GitLab Runner, K3s)

### 7.1 Inventory Example (`inventory.ini`)

```ini
[gitlab]
gitlab.homelab.local ansible_host=192.168.1.10

[k3s_server]
k3s-server ansible_host=192.168.1.20

[k3s_workers]
k3s-worker1 ansible_host=192.168.1.21
k3s-worker2 ansible_host=192.168.1.22

[all:vars]
ansible_user=ubuntu
ansible_ssh_private_key_file=~/.ssh/id_rsa
```

### 7.2 Playbook: Install Docker + K3s + Runner (`site.yml`)

```yaml
---
- name: Setup GitLab host (Docker + Runner)
  hosts: gitlab
  become: yes
  tasks:
    - name: Install Docker
      apt:
        name:
          - docker.io
          - docker-compose
        state: present
        update_cache: yes

    - name: Enable and start Docker
      systemd:
        name: docker
        enabled: yes
        state: started

    - name: Run GitLab Runner container
      docker_container:
        name: gitlab-runner
        image: gitlab/gitlab-runner:latest
        restart_policy: always
        volumes:
          - /srv/gitlab-runner/config:/etc/gitlab-runner
          - /var/run/docker.sock:/var/run/docker.sock

- name: Install K3s Server
  hosts: k3s_server
  become: yes
  tasks:
    - name: Install K3s server
      shell: |
        curl -sfL https://get.k3s.io | INSTALL_K3S_EXEC="server --write-kubeconfig-mode 644" sh -
      args:
        creates: /usr/local/bin/k3s

- name: Install K3s Workers
  hosts: k3s_workers
  become: yes
  vars:
    k3s_server_url: "https://192.168.1.20:6443"
    k3s_token: "<PUT_TOKEN_HERE_OR_USE_VAULT>"
  tasks:
    - name: Install K3s agent
      shell: |
        curl -sfL https://get.k3s.io | K3S_URL={{ k3s_server_url }} K3S_TOKEN={{ k3s_token }} sh -
      args:
        creates: /usr/local/bin/k3s-agent
```

Run:

```bash
ansible-playbook -i inventory.ini site.yml
```

(Production me token ko Ansible Vault me daalna better hai.)

---

## 8️⃣ Bonus: Small To-Do Checklist for You

1. **Pi-hole** pe DNS entries add karo:

   * `gitlab.homelab.local`
   * `registry.homelab.local`
   * `k3s-api.homelab.local` (optional for API)
2. GitLab up karke ek test project banao.
3. `Dockerfile` + `k8s/` folder add karo.
4. CI variables set karo:

   * `KUBE_CONFIG_B64`
5. Runner register karke `.gitlab-ci.yml` commit karo.
6. Pipeline run → image registry me push → app K3s pe deploy.

---

If you want, next step me hum **Monitoring stack (Prometheus + Grafana + Loki)** aur **ArgoCD GitOps flow** bhi is lab ke upar design kar sakte hain.
Acha, ab pure lab ko **observability + GitOps** se level up karte hain 😎
Main monitoring (Prometheus + Grafana + Loki) **plus** ArgoCD GitOps flow dono ka full setup de raha hoon.

---

## 1️⃣ Big Picture – Monitoring + GitOps on Your Existing Lab

Add these new pieces on top of your current setup:

* **Namespace `monitoring`** → Prometheus, Alertmanager, Grafana, Loki, Promtail
* **Namespace `argocd`** → ArgoCD controller + UI
* **ArgoCD** pulls manifests/Helm charts from **GitLab** and syncs to **K3s**
* Logs from apps → Promtail → Loki → Grafana
* Metrics from K8s + apps → Prometheus → Grafana

### Architecture (Mermaid)

```mermaid
flowchart LR
    Dev[Dev Laptop\nGit, kubectl] -->|Push Code + Manifests| GitLab[GitLab CE]
    GitLab -->|Git Repo (manifests/Helm)| ArgoCD[ArgoCD\n(argocd namespace)]

    subgraph K3s Cluster
      direction LR
      subgraph Monitoring
        Prom[Prometheus]
        Graf[Grafana]
        Loki[(Loki)]
        Promtail[Promtail DaemonSet]
        Alert[Alertmanager]
      end

      subgraph Apps
        App1[Demo App]
        App2[Other Services]
      end

      ArgoCD -->|Sync| Apps
      Promtail --> Loki
      Apps --> Prom
      Prom --> Graf
      Loki --> Graf
      Prom --> Alert
    end
```

---

## 2️⃣ Create `monitoring` Namespace

```bash
kubectl create namespace monitoring
```

You can keep all monitoring/logging tools isolated here.

---

## 3️⃣ Prometheus + Grafana via Helm (kube-prometheus-stack)

Assuming Helm is installed on your laptop and `KUBECONFIG` set to K3s cluster.

### 3.1 Add Helm Repo & Update

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
```

### 3.2 Create `values-prom-stack.yaml`

```yaml
# values-prom-stack.yaml
grafana:
  adminUser: admin
  adminPassword: "changeme123"   # change in real setup or use Secret
  service:
    type: ClusterIP
  ingress:
    enabled: true
    ingressClassName: "traefik"  # if using K3s default ingress
    hosts:
      - grafana.homelab.local

prometheus:
  service:
    type: ClusterIP

alertmanager:
  enabled: true
  service:
    type: ClusterIP

# Optional: reduce retention for lab
prometheusSpec:
  retention: 2d
  resources:
    requests:
      cpu: 200m
      memory: 512Mi
```

### 3.3 Install kube-prometheus-stack

```bash
helm install monitoring prometheus-community/kube-prometheus-stack \
  -n monitoring \
  -f values-prom-stack.yaml
```

### 3.4 DNS for Grafana

Pi-hole me ek record add karo:

* `grafana.homelab.local` → K3s Node IP (jahan Traefik/LB aata hai – simple case me master/server IP)

Check:

```bash
kubectl get pods -n monitoring
kubectl get svc -n monitoring
```

---

## 4️⃣ Loki + Promtail for Logs

### 4.1 Add Grafana Helm Repo

```bash
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update
```

### 4.2 Create `values-loki.yaml`

```yaml
# values-loki.yaml
loki:
  auth_enabled: false
  commonConfig:
    replication_factor: 1
  storage:
    type: filesystem
  persistence:
    enabled: false   # for lab. You can enable & use PVC later.

promtail:
  enabled: true
  config:
    clients:
      - url: http://loki.monitoring.svc.cluster.local:3100/loki/api/v1/push
    positions:
      filename: /run/promtail/positions.yaml
    server:
      http_listen_port: 9080
      grpc_listen_port: 0
    scrape_configs:
      - job_name: kubernetes-pods
        pipeline_stages:
          - docker: {}
        kubernetes_sd_configs:
          - role: pod
        relabel_configs:
          - source_labels: [__meta_kubernetes_pod_node_name]
            target_label: node
          - source_labels: [__meta_kubernetes_pod_namespace]
            target_label: namespace
          - source_labels: [__meta_kubernetes_pod_name]
            target_label: pod
```

### 4.3 Install Loki Stack

```bash
helm install loki grafana/loki-stack \
  -n monitoring \
  -f values-loki.yaml
```

### 4.4 Connect Grafana → Loki

Grafana UI → **Configuration → Data Sources** → add Loki datasource with URL:

* `http://loki.monitoring.svc.cluster.local:3100`

Ab aap Grafana me **Explore** section se K8s logs query kar sakte ho.

---

## 5️⃣ ArgoCD Installation (GitOps Layer)

### 5.1 Create Namespace

```bash
kubectl create namespace argocd
```

### 5.2 Install ArgoCD (Standard Manifest)

Run from your laptop:

```bash
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

> Agar aap direct internet se nahi karna chahte: manifest ko download karke GitLab ya local disk se bhi `kubectl apply -f` kar sakte ho.

### 5.3 Expose ArgoCD via Ingress (Traefik)

Create `argocd-ingress.yaml`:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: argocd-server-ingress
  namespace: argocd
  annotations:
    kubernetes.io/ingress.class: traefik
spec:
  rules:
    - host: argocd.homelab.local
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: argocd-server
                port:
                  number: 80
```

Apply:

```bash
kubectl apply -f argocd-ingress.yaml
```

Pi-hole DNS entry:

* `argocd.homelab.local` → K3s server/node IP

### 5.4 Get Initial Admin Password

```bash
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d && echo
```

Login at: `https://argocd.homelab.local` (or HTTP if TLS not configured, depending on your setup).

---

## 6️⃣ GitOps Repo Structure (Recommended)

GitLab me ek **separate repo** banao, example: `gitlab.homelab.local/devops/gitops-config`.

Structure:

```text
gitops-config/
  apps/
    demo-app/
      base/
        kustomization.yaml
        deployment.yaml
        service.yaml
      overlays/
        dev/
          kustomization.yaml
          patch-resources.yaml
        prod/
          kustomization.yaml
          patch-resources.yaml
  argocd/
    demo-app.yaml
    root-app-of-apps.yaml   # optional if you want app-of-apps pattern
```

Simple version: bas `apps/demo-app/` + `argocd/demo-app.yaml` se start kar sakte ho.

---

## 7️⃣ Sample ArgoCD Application (Sync Demo App from GitLab)

`argocd/demo-app.yaml`:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: demo-app
  namespace: argocd
spec:
  project: default
  source:
    repoURL: 'http://gitlab.homelab.local/devops/gitops-config.git'
    targetRevision: main
    path: apps/demo-app/base
  destination:
    server: 'https://kubernetes.default.svc'
    namespace: demo-app
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
```

Apply:

```bash
kubectl apply -f argocd/demo-app.yaml
```

Ab ArgoCD UI me `demo-app` dikhega, aur woh GitLab repo me changes track karega.

---

## 8️⃣ Link CI Pipeline → GitOps (Optional but Powerful)

Current flow:

1. **App repo** pipeline → build & push image → update image tag in K8s manifest
2. **GitOps repo** holds manifests which ArgoCD syncs

Best practice:

* App repo pipeline just **build + push** image
* Another job updates GitOps repo (via MR/commit) with new image tag in `kustomization.yaml` or values.
* ArgoCD auto-syncs those changes.

Example (simplified):

* `gitops-config/apps/demo-app/base/deployment.yaml` uses image:

  ```yaml
  image: registry.homelab.local:5050/my-group/my-app:{{ .Values.imageTag }}
  ```

Or if plain manifests, pipeline does:

```bash
# In app CI, after push:
git clone http://gitlab.homelab.local/devops/gitops-config.git
cd gitops-config/apps/demo-app/base
yq -i '.spec.template.spec.containers[0].image = env(NEW_IMAGE)' deployment.yaml
git commit -am "Update image to $NEW_IMAGE"
git push
```

(You can use CI service account token for this.)

---

## 9️⃣ Observability Sanity Checks

After installing everything, test:

### 9.1 Check Monitoring Stack

```bash
kubectl get pods -n monitoring
```

* Pods should be `Running`: Prometheus, Grafana, Alertmanager, Loki, Promtail.

### 9.2 Check Metrics

* Open `grafana.homelab.local`
* Login → Dashboards → check Kubernetes/Nodes/Pods metrics

### 9.3 Check Logs

* Grafana → Explore → Data Source: Loki
* Query: `{namespace="demo-app"}`

---

## 🔟 What You Have Now (Complete Lab)

* **Code + CI/CD** → GitLab CE + Runner
* **Image Registry** → GitLab Registry
* **Cluster** → K3s (1 server, 2 workers)
* **DNS** → Pi-hole (homelab domains)
* **Monitoring** → Prometheus + Alertmanager + Grafana
* **Logging** → Loki + Promtail
* **GitOps** → ArgoCD pulling from GitLab GitOps repo

Ye ab **production-style DevOps platform ka mini version** ban gaya 🧠💪

---

If you want, next iteration me hum:

* **Dashboards design** (Grafana for apps, infra, CI metrics)
* **Alert rules examples** (CPU high, pod crashloop, etc.)
* **SLO/SLA style monitoring** (latency, error rate)

bhi design kar sakte hain. Just bolo:

> “alerts + dashboards bhi bana do”
-----------------
Bhai **3 confusion** tumhare clear karta hoon ek-ek karke — *simple Hinglish me*, with exact fixes so that **data kabhi corrupt na ho**, aur **routing bilkul sahi chale**.

---

# ✅ **1. Are we using Traefik Ingress for routing?**

**YES — K3s by default uses Traefik as the Ingress Controller**, unless you disable it.

👉 In my earlier setup, I wrote:

```
--disable traefik
```

**That line is optional.**

If you want **Traefik** to do routing for apps (recommended for beginning), then:

### ✔ Do NOT disable Traefik

So install K3s like:

```bash
curl -sfL https://get.k3s.io | sh -
```

Now Traefik is available automatically.

### ✔ All app routing will happen via Traefik Ingress

Example:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: demo-app-ingress
  namespace: demo-app
  annotations:
    kubernetes.io/ingress.class: traefik
spec:
  rules:
    - host: demo.homelab.local
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: demo-app-svc
                port:
                  number: 80
```

Add DNS in Pi-hole:

```
demo.homelab.local → K3s-server-IP
```

### 🔥 Final Answer:

**Yes, Traefik ingress will route all apps like demo.homelab.local, argocd.homelab.local, grafana.homelab.local.**

---

# ✅ **2. GitLab CE & GitLab Runner — Are these separate containers?**

### ✔ YES — They **must run separately**.

* **GitLab CE** → main application (big app with registry, shell, API)
* **GitLab Runner** → executes CI pipelines

They are ALWAYS separate in every installation (K8s, Docker, VM, even official Helm chart).
This is **normal** and safe.

**BUT — your earlier corruption happened because:**
👉 You accidentally created **two GitLab CE containers**, not one CE + one Runner.

This creates:

* double Postgres
* double Redis
* files overwriting
* GitLab configs clashing
* data corrupt

---

# ✅ **3. How to ensure GitLab CE data NEVER gets corrupted again**

Very important point — so read step by step.

---

## ✔ Rule 1 — GitLab CE MUST have persistent volumes

Your `docker-compose.yml` is correct:

```
    volumes:
      - ./config:/etc/gitlab
      - ./logs:/var/log/gitlab
      - ./data:/var/opt/gitlab
```

This ensures:

* Postgres data → `/var/opt/gitlab/postgresql`
* Repos → `/var/opt/gitlab/gitlab-rails/shared/repositories`
* Container registry → `/var/opt/gitlab/gitlab-rails/shared/registry`
* Config → `/etc/gitlab/gitlab.rb`
* TLS keys → `/etc/gitlab/ssl`

So even if the container stops, updates, crashes —
👉 **Your GitLab data is always safe**.

---

## ✔ Rule 2 — DO NOT start GitLab CE twice

Use:

```
docker ps
```

You should see only:

```
gitlab      (gitlab ce)
gitlab-runner    (runner)
```

If ever you see two containers BOTH having image `gitlab/gitlab-ce:latest`,
STOP RIGHT THERE.

---

## ✔ Rule 3 — Lock GitLab container name so NO duplicates start

In `docker-compose.yml` we already have:

```
container_name: gitlab
```

This guarantees:

* If someone tries to run a second GitLab, Docker will ERROR OUT.
* No accidental duplicates = no corruption.

---

## ✔ Rule 4 — Use a single `docker-compose.yml` and NEVER run `docker run` manually for GitLab

Only use:

```
docker compose up -d
docker compose down
docker compose restart
```

Never:

```
docker run gitlab/gitlab-ce
```

That creates a **second container** → your earlier corruption issue.

---

## ✔ Rule 5 — Backups (GitLab recommended)

Enable built-in backups:

```
gitlab-rake gitlab:backup:create
```

Store snapshot in:

```
/var/opt/gitlab/backups/
```

Restore anytime:

```
gitlab-rake gitlab:backup:restore BACKUP=<timestamp>
```

---

## ✔ Rule 6 — Keep GitLab Runner OUTSIDE GitLab CE directories

Runner volumes:

```
/srv/gitlab-runner/config:/etc/gitlab-runner
```

GitLab CE volumes:

```
/srv/gitlab/config
/srv/gitlab/data
/srv/gitlab/logs
```

No overlap → no corruption.

---

# 🧠 **Final Summary in Hinglish (easy language)**

### 🔵 **Traefik Ingress**

* Haan bhai, apps Traefik se route honge.
* Bas K3s installation me Traefik disable mat karna.

---

### 🔵 **GitLab CE + Runner**

* Dono alag container honge — yahi sahi approach hai.
* Pehle corruption isliye hua tha kyunki **2 GitLab CE containers** chal gaye the.

---

### 🔵 **Data Corruption Prevention**

1. `config/logs/data` volumes MUST be mounted
2. `container_name: gitlab` use karo
3. GitLab container ko `docker run` se kabhi start mat karna
4. Sirf `docker compose` use karo
5. Runner ko alag rakhna
6. Backups enable karo

**Aise karne se GitLab ka data 100% safe rahega.**

---

If you want, I can also generate:

📦 **Backup Automation Script (cron)**
📜 **GitLab Disaster Recovery Plan**
🔒 **TLS setup (LetsEncrypt or self-signed)**
🗄️ **External Storage (NFS) for GitLab Data**

Just say **"yes generate that also"**.
---------------------------------------
