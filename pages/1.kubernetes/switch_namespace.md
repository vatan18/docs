# Switch namespaces in Kubernetes

### 1. **Set a Default Namespace for Your Context**
```sh
kubectl config set-context --current --namespace=<namespace>
```
Example:
```sh
kubectl config set-context --current --namespace=dev
```
This sets the default namespace for all `kubectl` commands in the current context.

### 2. **Use `-n` or `--namespace` in Commands**
If you don't want to change the default namespace, you can specify it in each command:
```sh
kubectl get pods -n <namespace>
```
Example:
```sh
kubectl get pods -n dev
```

### 3. **Verify the Active Namespace**
To check which namespace is currently set as default:
```sh
kubectl config view --minify | grep namespace
```