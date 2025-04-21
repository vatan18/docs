# Kubernetes Core Components

Kubernetes is a powerful container orchestration system that manages containerized applications across a cluster of machines. It has a **master-worker architecture**, where the **Control Plane (Master)** manages the cluster, and **Worker Nodes** run the applications.

---

## 🧠 Master Components (Control Plane)

The **Control Plane** is responsible for managing the cluster and orchestrating workloads.

### 📜 1. API Server (`kube-apiserver`)
- Acts as the front-end for the Kubernetes control plane.
- Receives REST commands and updates cluster state.

### 🧠 2. Scheduler (`kube-scheduler`)
- Assigns workloads (pods) to worker nodes based on resources and constraints.

### 👮 3. Controller Manager (`kube-controller-manager`)
- Runs controllers that watch the state of the cluster and make changes to reach the desired state.

### 📘 4. etcd
- A key-value store used as the backing store for all cluster data.

### 🔒 5. Cloud Controller Manager (optional)
- Integrates with cloud provider APIs (e.g., AWS, GCP) for things like Load Balancers and Node management.

#### Master Components Flowchart

```mermaid
flowchart TD
    subgraph Control Plane
        API[Kube API Server]
        SCH[Kube Scheduler]
        CTRL[Kube Controller Manager]
        ETCD[ ETCD ]
        CCM[Cloud Controller Manager]
    end

    User[(kubectl CLI / Dashboard)] --> API
    API --> ETCD
    API --> SCH
    API --> CTRL
    API --> CCM
    SCH --> API
    CTRL --> API
    CCM --> API
```

---

## 🔧 Worker Node Components

Worker nodes are where the actual workloads (pods/containers) run.

### 🧱 1. Kubelet
- Ensures containers are running in a pod.
- Communicates with the API server and reports back status.

### 📦 2. Kube Proxy
- Maintains network rules for pod communication and service access.

### 🐳 3. Container Runtime
- Responsible for running containers (e.g., containerd, Docker, CRI-O).

#### Worker Components Flowchart

```mermaid
flowchart TD
    subgraph Worker Node
        KLT[Kubelet]
        KPR[Kube Proxy]
        CRT[Container Runtime]
        POD[Pods]
    end

    API[Kube API Server] --> KLT
    KLT --> CRT
    CRT --> POD
    KPR --> POD
```

---

## 🕸️ Master-Worker Interaction Overview

This diagram shows how master and worker components interact in a full cluster:

```mermaid
flowchart LR
    subgraph Control Plane
        APIS[Kube API Server]
        SCHD[Kube Scheduler]
        CTRL[Kube Controller Manager]
        ETD[etcd]
    end

    subgraph Worker Node 1
        KL1[Kubelet]
        KR1[Kube Proxy]
        CR1[Container Runtime]
        P1[Pod A]
    end

    subgraph Worker Node 2
        KL2[Kubelet]
        KR2[Kube Proxy]
        CR2[Container Runtime]
        P2[Pod B]
    end

    User[(kubectl)]
    User --> APIS
    APIS --> ETD
    APIS --> SCHD
    APIS --> CTRL

    APIS --> KL1
    APIS --> KL2

    KL1 --> CR1 --> P1
    KL2 --> CR2 --> P2
    KR1 --> P1
    KR2 --> P2
```

---

## ✅ Summary Table

| Component              | Role                  | Master/Worker |
|------------------------|-----------------------|---------------|
| Kube API Server        | Entry point to cluster| Master        |
| etcd                   | Cluster data store    | Master        |
| Kube Scheduler         | Pod placement         | Master        |
| Controller Manager     | Maintains state       | Master        |
| Kubelet                | Node agent            | Worker        |
| Kube Proxy             | Networking rules      | Worker        |
| Container Runtime      | Runs containers       | Worker        |

