Steps to Access Multiple AWS EKS Clusters in k9s
1️⃣ Set Up AWS Profiles for Each Account

Configure named profiles using aws configure:

bash
aws configure --profile account1
aws configure --profile account2
aws configure --profile account3
This ensures each AWS account has its own credentials stored.

2️⃣ Update Kubeconfig for Each EKS Cluster

Use AWS CLI to fetch credentials for different EKS clusters:

bash
aws eks update-kubeconfig --name cluster1 --region <region> --profile account1
aws eks update-kubeconfig --name cluster2 --region <region> --profile account2
aws eks update-kubeconfig --name cluster3 --region <region> --profile account3
This creates multiple Kubernetes contexts for each cluster.

3️⃣ List and Switch Contexts

View available Kubernetes contexts:

bash
kubectl config get-contexts
Switch between clusters:

bash
kubectl config use-context <context-name>
4️⃣ Use k9s with the Correct Context

Start k9s:

bash
k9s
Press : and type contexts to see available contexts.

Select the desired cluster to start managing resources.

To connect to a specific context: k9s --context your-context-name
To connect to a specific namespace: k9s --namespace your-namespace

kubectl get nodes --context arn:aws:eks:us-east-1:[Account-ID]:cluster/cluster-name

Would you like help automating this setup for easier multi-cluster access? 🚀
Authentication Delay

If your AWS session has expired, K9s might struggle to fetch cluster details.

Try running:

sh
aws sts get-caller-identity
If the session is expired, refresh credentials with:

sh
aws eks update-kubeconfig --name dev-cms-eks --region us-east-1
Slow API Calls

K9s heavily relies on API calls to retrieve cluster resources.

Check if your cluster is responding slowly:

sh
kubectl get nodes --context arn:aws:eks:us-east-1:559050236125:cluster/dev-cms-eks
If this takes a while, the cluster itself might be under load.

Large Resource Load

K9s loads all available namespaces, pods, and workloads when starting. If your cluster has a lot of resources, it could slow things down.

Try launching K9s in a specific namespace to reduce load:

sh
k9s --context arn:aws:eks:us-east-1:559050236125:cluster/dev-cms-eks --namespace default
K9s Cache Issues

Sometimes, resetting K9s config helps:

sh
rm -rf ~/.k9s/config.yaml ~/.k9s/plugin.yaml
Network Latency

If you're on a slow internet connection or a VPN, API requests might be delayed.

Try running:

sh
ping 7EA889995015DA72970C5BC102A45092.gr7.us-east-1.eks.amazonaws.com
A high response time might indicate network issues.

K9s Version Issues

Ensure you're on the latest K9s release:

sh
k9s version
If outdated, upgrade it:

sh
brew upgrade k9s  # (Mac)
choco upgrade k9s  # (Windows)