# Kubernetes Entities

## 1. Cluster-Level Entities
- **Node**: A physical or virtual machine in the cluster.
- **Namespace**: A logical grouping of resources within a cluster.
- **Context**: A combination of cluster, namespace, and user configuration.

## 2. Workload Management
- **Pod**: The smallest deployable unit, running one or more containers.
- **Deployment**: Manages the deployment and scaling of Pods.
- **ReplicaSet**: Ensures a specified number of pod replicas are running.
- **DaemonSet**: Ensures that a copy of a pod runs on all nodes.
- **StatefulSet**: Manages stateful applications with stable network IDs.
- **Job**: Runs a batch task until completion.
- **CronJob**: Runs scheduled jobs at specified times.

## 3. Networking and Traffic Management
- **Service**: Exposes a set of Pods as a network service.
- **Ingress**: Manages external access to Services inside the cluster.
- **IngressClass**: Defines the type of Ingress controller used in the cluster.
- **IngressRoute**: A CRD (Custom Resource Definition) for managing Ingress traffic in some controllers.
- **Endpoint**: Represents the IPs where a Service is reachable.

## 4. Storage and Configuration
- **ConfigMap**: Stores non-sensitive configuration data as key-value pairs.
- **Secret**: Stores sensitive information like passwords or API keys.
- **PersistentVolume (PV)**: A piece of storage provisioned by an administrator.
- **PersistentVolumeClaim (PVC)**: A request for storage by a user.
- **StorageClass**: Defines the storage type and parameters for dynamic volume provisioning.

## 5. Security and Identity Management
- **ServiceAccount**: Provides an identity for processes running in a Pod.
- **Role & RoleBinding**: Defines permissions within a specific namespace.
- **ClusterRole & ClusterRoleBinding**: Defines permissions across all namespaces.
- **NetworkPolicy**: Controls communication between pods based on rules.
- **ClusterIssuer**: Manages certificate issuance at the cluster level.
- **CertificateRequest**: Requests a certificate from a ClusterIssuer.

## 6. Resource Management
- **LimitRange**: Defines constraints on resource usage within a namespace.
- **ResourceQuota**: Limits resource consumption in a namespace.

## 7. Logging and Monitoring
- **Event**: Provides information on state changes and errors in the cluster.
- **MetricServer**: Collects resource usage data for Pods and Nodes.

## 8. Custom Resource Definitions (CRDs)
- **CustomResourceDefinition (CRD)**: Allows users to define and manage their own Kubernetes objects.

These entities form the core components of Kubernetes, allowing for scalable, secure, and efficient application deployment and management.

