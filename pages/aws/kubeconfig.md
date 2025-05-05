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