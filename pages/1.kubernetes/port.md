Example
# Deployment
ports:
  - containerPort: 5000

# Service
ports:
  - port: 80         # Cluster/internal port
    targetPort: 5000 # Must match containerPort

# Ingress
rules:
  http:
    paths:
      - backend:
          service:
            name: your-service
            port:
              number: 80 # Must match Service's 'port'

✅ Fix: Ensure Ingress points to the Service’s port, not targetPort.