# Accessing Traefik Dashboard in K3s

## Overview

K3s comes with Traefik ingress controller pre-installed in the `kube-system` namespace. This guide explains how to access the Traefik dashboard.

## Prerequisites Check

1. Verify that the dashboard is enabled:
    - Check for `-api.dashboard=true` in `containers.args` of Traefik deployment
    - If enabled, dashboard is accessible at `http://<pod_ip>:9000`

## Setting Up Local Domain Access

### Step 1: Update Traefik Deployment

Add the following label to the deployment:

```yaml
spec:
  template:
    labels:
      app: traefik-dashboard

```

### Step 2: Create Service and Ingress

Create a file named `traefik-dashboard.yaml`:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: traefik-svc
  namespace: kube-system
spec:
  type: LoadBalancer
  selector:
    app: traefik-dashboard
  ports:
  - port: 80
    targetPort: 9000
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: traefik-igrs
  labels:
    name: traefik-igrs
  namespace: kube-system
spec:
  rules:
  - host: traefik.local
    http:
      paths:
      - pathType: Prefix
        path: "/"
        backend:
          service:
            name: traefik-svc
            port:
              number: 80

```

### Step 3: Configure DNS

Add domain mapping in either:

- Local `/etc/hosts` file
- Your domain DNS configuration

## Accessing the Dashboard

- URL format: `http://<domain_name>/dashboard/`
- **Important**: Always include the trailing slash (`/`) after `dashboard`

## Troubleshooting

- If you get an error, verify that:
    1. The trailing slash is present in the URL
    2. DNS mapping is correctly configured
    3. All components are in the `kube-system` namespace