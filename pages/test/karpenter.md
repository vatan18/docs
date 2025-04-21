md
# AWS EKS Karpenter Implementation

## Introduction
Karpenter is an open-source Kubernetes node provisioning tool that automatically scales EC2 instances based on workload demands. This guide outlines the steps to set up Karpenter in your **AWS EKS cluster running on EC2**.

## Prerequisites
- AWS EKS cluster already running on EC2 instances.
- AWS CLI and kubectl configured.
- Helm installed for managing Karpenter deployment.
- IAM permissions to create roles and policies.

## Step 1: Install Karpenter
### Add the Helm Repository and Install Karpenter
```sh
helm repo add karpenter https://charts.karpenter.sh
helm repo update
helm install karpenter karpenter/karpenter --namespace karpenter --create-namespace
Step 2: Configure IAM Role for Karpenter
Create an IAM role that Karpenter will use to launch and terminate nodes.

Create an IAM policy in JSON format:

json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["ec2:RunInstances", "ec2:TerminateInstances"],
      "Resource": "*"
    }
  ]
}
Attach this role to Karpenter:

sh
aws iam create-role --role-name KarpenterNodeRole --assume-role-policy-document file://karpenter-trust.json
aws iam attach-role-policy --role-name KarpenterNodeRole --policy-arn arn:aws:iam::aws:policy/AmazonEC2FullAccess
Step 3: Deploy Karpenter Provisioner
Karpenter uses Provisioner configurations to manage node scaling.

Create a YAML configuration file for provisioning:

yaml
apiVersion: karpenter.k8s.aws/v1alpha5
kind: Provisioner
metadata:
  name: default
spec:
  requirements:
    - key: "node.kubernetes.io/instance-type"
      operator: In
      values: ["t3.medium", "t3.large"]
    - key: "topology.kubernetes.io/zone"
      operator: In
      values: ["us-east-1a", "us-east-1b"]
  provider:
    subnetSelector:
      karpenter.sh/discovery: "eks-cluster"
  ttlSecondsAfterEmpty: 300
Apply the provisioner:

sh
kubectl apply -f karpenter-provisioner.yaml
Step 4: Verify Auto-Scaling
Deploy a test workload to validate Karpenter’s functionality.

sh
kubectl create deployment karpenter-test --image=nginx --replicas=5
kubectl get nodes --watch
Check if new nodes are provisioned dynamically based on resource needs.

Conclusion
With Karpenter set up, your EKS on EC2 can dynamically scale nodes based on workload demands, reducing costs and improving resource efficiency.