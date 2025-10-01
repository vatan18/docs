# Kubernetes Commands

## 1. Cluster Information
```sh
kubectl cluster-info           # Display cluster information
kubectl version                # Show client and server versions
kubectl get nodes              # List all nodes in the cluster
kubectl describe node <node>   # Get detailed information about a node
```

## 2. Working with Pods
```sh
kubectl get pods                        # List all pods in the current namespace
kubectl get pods -A                     # List all pods across all namespaces
kubectl describe pod <pod-name>         # Get details of a specific pod
kubectl delete pod <pod-name>           # Delete a pod
kubectl logs <pod-name>                 # View logs of a pod
kubectl logs -f <pod-name>              # Stream logs of a pod
kubectl logs <pod-name> -c <container>  # View logs of a specific container inside a pod
```

## 3. Deployments and ReplicaSets
```sh
kubectl get deployments                  # List deployments
kubectl describe deployment <name>       # Show details of a deployment
kubectl scale deployment <name> --replicas=3  # Scale a deployment
kubectl rollout status deployment <name> # Show rollout status
kubectl rollout undo deployment <name>   # Rollback to the previous deployment
kubectl rollout restart deployment -n traefik-ns  # Restart a deployment in traefik namespace
kubectl rollout restart deployment -n vatanboard-ns  # Restart a deployment in vatanboard namespace
kubectl delete deployment <name>         # Delete a deployment
```

## 4. Services
```sh
kubectl get services                # List all services
kubectl describe service <name>      # Show details of a service
kubectl expose deployment <name> --type=NodePort --port=80  # Expose a deployment as a service
kubectl delete service <name>        # Delete a service
```

## 5. Ingress and Traffic Management
```sh
kubectl get ingressroutes -n vatanboard-ns  # List ingress routes in vatanboard namespace
kubectl get ingressclasses                    # List available ingress classes
```

## 6. Certificates and Security
```sh
kubectl get ClusterIssuer           # List all ClusterIssuers
kubectl get CertificateRequest      # List all CertificateRequests
```

## 7. ConfigMaps and Secrets
```sh
kubectl get configmaps              # List all ConfigMaps
kubectl describe configmap <name>   # Show details of a ConfigMap
kubectl delete configmap <name>     # Delete a ConfigMap

kubectl get secrets                 # List all secrets
kubectl describe secret <name>      # Show details of a secret
kubectl delete secret <name>        # Delete a secret
```

## 8. Namespaces
```sh
kubectl get namespaces              # List all namespaces
kubectl create namespace <name>     # Create a new namespace
kubectl delete namespace <name>     # Delete a namespace
kubectl config set-context --current --namespace=<name>  # Switch to a specific namespace
```

## 9. Context and Config Management
```sh
kubectl config get-contexts                      # List all available contexts
kubectl config current-context                   # Show the current context
kubectl config use-context <context-name>        # Switch to a different context
kubectl config set-context <context-name> --namespace=<name>  # Set default namespace for a context
kubectl config view                              # View kubeconfig settings
kubectl config delete-context <context-name>    # Delete a specific context
```

## 10. Executing Commands in a Pod
```sh
kubectl exec <pod-name> -- <command>          # Run a command in a pod
kubectl exec -it <pod-name> -- /bin/sh        # Open an interactive shell in a pod (sh)
kubectl exec -it <pod-name> -- /bin/bash      # Open an interactive shell in a pod (bash)
kubectl exec -it <pod-name> -c <container> -- /bin/sh  # Open a shell inside a specific container
```

## 11. Port Forwarding
```sh
kubectl port-forward <pod-name> 8080:80       # Forward local port 8080 to pod port 80
kubectl port-forward service/<service-name> 8080:80  # Forward a service port
```

## 12. Managing Resources
```sh
kubectl apply -f <file>.yaml        # Apply a configuration file
kubectl create -f <file>.yaml       # Create resources from a file
kubectl delete -f <file>.yaml       # Delete resources from a file
```

## 13. Troubleshooting
```sh
kubectl get events                   # View cluster events
kubectl describe pod <pod-name>      # Show detailed pod information
kubectl get pods --field-selector=status.phase=Pending  # List pending pods
kubectl top pods                     # Show CPU and memory usage of pods
kubectl top nodes                    # Show CPU and memory usage of nodes
```

