# Configure Ingress for Prometheus and Grafana

## Description

Ingress resources allow you to expose services within your cluster using URLs. Below are Ingress configurations for Prometheus and Grafana.

### 1.1 Create Ingress Resource for Prometheus

Save the following YAML as `prometheus-ingress.yaml`:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: prometheus-igrs
  namespace: monitoring
  labels:
    app: prometheus
spec:
  rules:
  - host: prometheus.local
    http:
      paths:
      - pathType: Prefix
        path: "/"
        backend:
          service:
            name: prometheus-server
            port:
              number: 80

```

### 1.2 Create Ingress Resource for Grafana

Save the following YAML as `grafana-ingress.yaml`:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: grafana-igrs
  namespace: monitoring
  labels:
    app: grafana
spec:
  rules:
  - host: grafana.local
    http:
      paths:
      - pathType: Prefix
        path: "/"
        backend:
          service:
            name: grafana
            port:
              number: 80

```

### Apply the Ingress Files

Apply the Ingress resources using `kubectl`:

```bash
kubectl apply -f grafana-ingress.yaml
kubectl apply -f prometheus-ingress.yaml
```

---

### Step 2: Update `/etc/hosts` (Optional for Local Access)

To access Prometheus and Grafana via their hostnames (`prometheus.local` and `grafana.local`), add entries to your local `/etc/hosts` file, pointing them to your cluster’s IP address.

Example entry:

```
<host_ip> prometheus.local grafana.local
```

---

These configurations should make Prometheus available at `http://prometheus.local` and Grafana at `http://grafana.local`. Make sure that your Ingress controller is set up and configured in your cluster to handle these resources.