# Managing Multiple Kubernetes Contexts

This wiki document explains how to manage multiple Kubernetes contexts, particularly when switching between AWS EKS clusters and local Kubernetes installations.

## Understanding the Problem

When you connect to an AWS EKS cluster using the `aws eks update-kubeconfig` command, it modifies your kubeconfig file to point to the EKS cluster. This can prevent you from accessing your local Kubernetes installation without proper context management.

## Viewing Available Contexts

To see all Kubernetes contexts configured on your system:

```bash
kubectl config get-contexts
```

Example output:
```
CURRENT   NAME                                                              CLUSTER                                                           AUTHINFO                                                          NAMESPACE
*         arn:aws:eks:us-east-2:313686187887:cluster/vatan-terraform-eks   arn:aws:eks:us-east-2:313686187887:cluster/vatan-terraform-eks   arn:aws:eks:us-east-2:313686187887:cluster/vatan-terraform-eks   vatanboard-ns
          arn:aws:eks:us-east-2:313686187887:cluster/vatan-testing-eks     arn:aws:eks:us-east-2:313686187887:cluster/vatan-testing-eks     arn:aws:eks:us-east-2:313686187887:cluster/vatan-testing-eks     vatanboard-ns
          default                                                           default                                                           default                                                           vatanboard-ns
```

The asterisk (`*`) indicates the currently active context.

## Switching Between Contexts

### Method 1: Using `kubectl config use-context`

To switch to a different context (e.g., your local Kubernetes):

```bash
kubectl config use-context default
```

To switch to a specific EKS cluster:

```bash
kubectl config use-context arn:aws:eks:us-east-2:313686187887:cluster/vatan-terraform-eks
```

### Method 2: Using the `--context` Flag

You can also use the `--context` flag with any kubectl command to use a specific context without changing your current context:

```bash
kubectl --context=default get pods
kubectl --context=arn:aws:eks:us-east-2:313686187887:cluster/vatan-terraform-eks get pods
```

## Viewing Current Context

To check which context is currently active:

```bash
kubectl config current-context
```

## Advanced Context Management

### Using kubectx Tool

For more efficient context switching, consider using the `kubectx` tool:

1. Install kubectx:
   ```bash
   # On macOS with Homebrew
   brew install kubectx
   
   # On Linux with snap
   sudo snap install kubectx
   ```

2. Switch contexts with simpler commands:
   ```bash
   kubectx default
   ```

### Creating Shell Aliases

For frequently used clusters, you can create shell aliases in your `.bashrc` or `.zshrc`:

```bash
# Add to your .bashrc or .zshrc
alias k8s-local='kubectl config use-context default'
alias k8s-eks='kubectl config use-context arn:aws:eks:us-east-2:313686187887:cluster/vatan-terraform-eks'
```

## Managing Namespaces

To switch to a different namespace within a context:

```bash
kubectl config set-context --current --namespace=your-namespace
```

## Best Practices

1. **Rename Long Contexts**: Consider renaming long AWS ARNs to simpler names:
   ```bash
   kubectl config rename-context arn:aws:eks:us-east-2:313686187887:cluster/vatan-terraform-eks eks-terraform
   ```

2. **Separate Kubeconfig Files**: For production environments, consider using separate kubeconfig files:
   ```bash
   export KUBECONFIG=~/.kube/eks-config
   ```

3. **Regularly Clean Up**: Remove outdated or unused contexts:
   ```bash
   kubectl config delete-context context-name
   ```

4. **Use Visual Indicators**: Set your shell prompt to show your current Kubernetes context for awareness.

## Troubleshooting

If you're still having issues switching contexts:

1. Verify your kubeconfig file is not corrupted:
   ```bash
   cat ~/.kube/config
   ```

2. Check file permissions:
   ```bash
   ls -la ~/.kube/config
   ```

3. Try resetting your connection to a specific cluster:
   ```bash
   aws eks update-kubeconfig --name cluster-name --region region-name
   ```