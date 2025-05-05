AWS SSO Configuration & Multi-Account Access Automation
1️⃣ Setting Up AWS SSO for Multiple Accounts
Step 1: Configure AWS SSO
Run the command:

bash
aws configure sso
Enter your SSO Start URL: https://ioncourt.awsapps.com/start/#

Set the SSO Region: us-east-1

Select the AWS account(s) & roles.

Assign a profile name for each account.

Step 2: Verify Configured Profiles
After setup, list profiles:

bash
aws configure list-profiles
You should see configured profiles:

bash
account1
account2
account3
dev-cms
2️⃣ Automate AWS Profile Switching
Instead of manually switching profiles, create a helper script:

bash
#!/bin/bash

# List available profiles
echo "Available AWS profiles:"
aws configure list-profiles

# Select profile
read -p "Enter AWS profile to use: " PROFILE

# Authenticate with selected profile
aws sso login --profile "$PROFILE"
aws sts get-caller-identity --profile "$PROFILE"

echo "Switched to profile: $PROFILE"
Save this as switch-profile.sh

Make it executable:

bash
chmod +x switch-profile.sh
Run it:

bash
./switch-profile.sh
3️⃣ Automate Kubernetes Context Switching
Now, integrate this with EKS cluster switching:

bash
#!/bin/bash

declare -A CLUSTERS
CLUSTERS["account1"]="eks-cluster-1"
CLUSTERS["account2"]="eks-cluster-2"
CLUSTERS["account3"]="eks-cluster-3"

echo "Available contexts:"
for profile in "${!CLUSTERS[@]}"; do
  echo "[$profile] - ${CLUSTERS[$profile]}"
done

# User input for profile
read -p "Enter profile name: " PROFILE

if [[ -n "${CLUSTERS[$PROFILE]}" ]]; then
  aws sso login --profile "$PROFILE"
  aws eks update-kubeconfig --name "${CLUSTERS[$PROFILE]}" --profile "$PROFILE"
  kubectl config use-context "arn:aws:eks:us-east-1:$PROFILE:cluster/${CLUSTERS[$PROFILE]}"
  echo "Switched to Kubernetes context for: ${CLUSTERS[$PROFILE]}"
else
  echo "Invalid profile!"
fi
4️⃣ Automate Debugging Workflows in k9s
Fast Log Inspection
Set aliases in your ~/.bashrc or ~/.zshrc:

bash
alias k9slogs="k9s --namespace default --show-managed=false --all-namespaces"
alias k9spods="k9s -c pods"
alias k9services="k9s -c svc"
alias k9debug="kubectl get pods -A | grep CrashLoopBackOff"
Auto-Restart Faulty Pods
bash
#!/bin/bash

POD_NAME="strapi"
NAMESPACE="default"

while true; do
  STATUS=$(kubectl get pod "$POD_NAME" -n "$NAMESPACE" --no-headers | awk '{print $3}')
  
  if [[ "$STATUS" == "CrashLoopBackOff" ]]; then
    echo "Restarting $POD_NAME..."
    kubectl delete pod "$POD_NAME" -n "$NAMESPACE"
  fi

  sleep 30  # Check every 30 seconds
done
🚀 Run this script in the background (./watchdog.sh &) to auto-restart stuck pods.

5️⃣ Automate Helm Rollbacks
If a deployment fails, rollback automatically:

bash
helm rollback strapi 10  # Reverts to Revision 10
Run helm history strapi to view previous versions.

🔹 Summary
✅ Set up AWS SSO for multiple accounts ✅ Use a script for fast AWS profile switching ✅ Automate EKS cluster context switching ✅ Enhance k9s debugging workflows ✅ Implement automatic pod restarts ✅ Streamline Helm rollbacks