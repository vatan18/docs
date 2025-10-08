This guide outlines the process of consolidating multiple AWS Application Load Balancers (ALBs) managed by Kubernetes Ingress resources into a single shared Ingress ALB. It also covers integrating AWS WAF for enhanced security on your subdomains and services, specifically focusing on how to translate Ingress-level CIDR restrictions into WAF rules.

## Table of Contents

1.  [Introduction](#1-introduction)
2.  [Prerequisites](#2-prerequisites)
3.  [Identifying Existing Ingress Resources and CIDRs](#3-identifying-existing-ingress-resources-and-cidrs)
4.  [Planning Your Migration](#4-planning-your-migration)
5.  [Modifying Ingress Resources for a Shared ALB](#5-modifying-ingress-resources-for-a-shared-alb)
    *   [Enabling ALB Access Logs](#enabling-alb-access-logs)
    *   [S3 Bucket Policy for Access Logs](#s3-bucket-policy-for-access-logs)
6.  [Integrating AWS WAF](#6-integrating-aws-waf)
7.  [Verification and Testing](#7-verification-and-testing)
8.  [Troubleshooting](#8-troubleshooting)

## 1. Introduction

Managing numerous ALBs can lead to increased operational overhead and costs. By utilizing the `alb.ingress.kubernetes.io/group.name` annotation, you can consolidate multiple Ingress resources under a single AWS ALB. This approach simplifies management, potentially reduces costs, and provides a centralized point for security configurations like AWS WAF.

This guide will walk you through fetching existing Ingress configurations, modifying them to use a shared ALB, configuring access logs, and attaching WAF to protect your applications, specifically handling domain-based IP restrictions.

## 2. Prerequisites

Before you begin, ensure you have the following:

*   **Kubernetes Cluster:** An EKS cluster or a Kubernetes cluster with the AWS Load Balancer Controller installed and configured.
*   **`kubectl`:** Configured to connect to your Kubernetes cluster.
*   **`jq`:** A lightweight and flexible command-line JSON processor.
*   **AWS CLI:** Configured with appropriate permissions to manage ALBs, S3, and WAF.
*   **IAM Permissions:** Sufficient IAM permissions to create/modify Ingress resources, S3 buckets/policies, and WAF Web ACLs.
*   **S3 Bucket:** An S3 bucket for storing ALB access logs.

## 3. Identifying Existing Ingress Resources and CIDRs

First, let's gather information about your current Ingress configurations and any specific inbound CIDR restrictions. This helps in understanding your current setup and planning the migration.

### Fetch All Ingress Files

This command will output all Ingress resources in YAML format, which you can save for reference and modification.

```sh
kubectl get ingress --all-namespaces -o yaml > all-ingress.yaml
```

### Fetch All Inbound CIDRs Used by ALBs

This command specifically extracts Ingress resources that have the `alb.ingress.kubernetes.io/inbound-cidrs` annotation and lists their namespace, name, and the associated CIDRs.

```sh
kubectl get ingress --all-namespaces -o json | \
jq -r '.items[] | select(.metadata.annotations."alb.ingress.kubernetes.io/inbound-cidrs") |
        "\(.metadata.namespace)/\(.metadata.name): \(.metadata.annotations."alb.ingress.kubernetes.io/inbound-cidrs")"' \
> inbound-cidrs.txt
```
Review `inbound-cidrs.txt` to understand which services currently have IP restrictions. You'll use this information to create WAF IP sets and rules.

## 4. Planning Your Migration

Before making changes, it's crucial to plan:

*   **Shared ALB Name:** Choose a descriptive group name for your shared ALB (e.g., `shared-application-alb`).

*   **Consolidation Strategy:** Decide which Ingress resources will be part of the shared ALB. It's often best to group services that share common security requirements or operational teams.

*   **DNS Updates:** Be prepared to update DNS records to point to the new shared ALB's CNAME once it's created and validated.

*   **Downtime Strategy:** Plan for potential downtime during the migration. A phased approach or blue/green deployment is recommended for critical services.

*   **WAF Rules:** Define the specific WAF rules you want to apply based on your `inbound-cidrs.txt` and other security requirements.

## 5. Modifying Ingress Resources for a Shared ALB

Now, let's modify your `all-ingress.yaml` (or individual Ingress files) to group them under a single ALB.

For each Ingress resource you want to include in the shared ALB, you'll need to add or modify the following annotations:

*   `alb.ingress.kubernetes.io/group.name: shared-application-alb`: This is the key annotation that tells the AWS Load Balancer Controller to group this Ingress with others using the same group name under a single ALB.

*   `alb.ingress.kubernetes.io/group.order: <number>`: (Optional but Recommended) Specifies the order of evaluation for listener rules within the shared ALB. Lower numbers are evaluated first.

*   `alb.ingress.kubernetes.io/listen-ports: '[{"HTTP": 80}, {"HTTPS": 443}]'`: Ensures the shared ALB listens on standard HTTP and HTTPS ports.

*   `alb.ingress.kubernetes.io/ssl-redirect: '443'`: (Optional) Enforces HTTPS redirection for HTTP traffic.

*   `alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:AWS_REGION:YOUR_ACCOUNT_ID:certificate/CERTIFICATE_ID`: Replace with your ACM certificate ARN for HTTPS.


### Example Ingress Modification:

**Modified Ingress for shared ALB:**
This is a comprehensive guide! It clearly outlines the steps for consolidating ALBs and integrating WAF.
Here's an example of how you would modify a single Ingress file to use a shared ALB and offload the CIDR restrictions to WAF via annotations.

### Single Ingress File with Shared ALB and WAF Annotations

This example assumes you have two subdomains: `dashboard.example.com` and `customer-portal.example.com`. Instead of using `alb.ingress.kubernetes.io/inbound-cidrs` directly on the Ingress, we'll configure WAF to handle these restrictions by referencing WAF IP Sets you've created (e.g., via CloudFormation, as in your `EKSWAFWebACL` example).

Existing ingress
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: portal-service-uat
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
    alb.ingress.kubernetes.io/subnets: subnet-0a9dcf032e3c5e1b2,subnet-0992fb71762d02729 # Example Subnets
    alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:AWS_REGION:YOUR_ACCOUNT_ID:certificate/a180632b-ac1d-44d3-85a5-6d25a9912313 # Example ARN
    alb.ingress.kubernetes.io/ssl-policy: ELBSecurityPolicy-TLS13-1-2-2021-06
spec:
  rules:
    - host: "customer-portal.example.com"
      http:
        paths:
          - path: "/"
            pathType: Prefix
            backend:
              service:
                name: portal-service-backend
                port:
                  number: 443
```
New ingress
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: new-portal-service-uat
  namespace: default
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
    alb.ingress.kubernetes.io/group.name: shared-application-alb # same group name for all Ingresses sharing a single ALB
    alb.ingress.kubernetes.io/backend-protocol: HTTP
    alb.ingress.kubernetes.io/certificate-arn: "arn:aws:acm:AWS_REGION:YOUR_ACCOUNT_ID:certificate/a180632b-ac1d-44d3-85a5-6d25a9912313" # Example ARN
    alb.ingress.kubernetes.io/healthcheck-protocol: HTTP
    alb.ingress.kubernetes.io/listen-ports: '[{"HTTP": 80}, {"HTTPS": 443}]'
    alb.ingress.kubernetes.io/ssl-redirect: '443'
    alb.ingress.kubernetes.io/subnets: subnet-0a9dcf032e3c5e1b2,subnet-0992fb71762d02729 # Example Subnets
    alb.ingress.kubernetes.io/load-balancer-attributes: idle_timeout.timeout_seconds=3000
    alb.ingress.kubernetes.io/ssl-policy: ELBSecurityPolicy-TLS13-1-2-2021-06
    alb.ingress.kubernetes.io/wafv2-acl-arn: arn:aws:wafv2:AWS_REGION:YOUR_ACCOUNT_ID:regional/webacl/EKS-WAF-ALB-UAT/WEB_ACL_UNIQUE_ID # Example ARN
spec:
  rules:
  - host: customer-portal.example.com
    http:
      paths:
      - backend:
          service:
            name: portal-service-backend
            port:
              number: 443
        path: /
        pathType: Prefix
```

**Explanation of Changes:**

1.  **Consolidation:** All rules for `dashboard.example.com` and `customer-portal.example.com` (and any other services you want to route through this shared ALB) are now within a single `Ingress` resource.
2.  **Shared ALB Group:** `alb.ingress.kubernetes.io/group.name: shared-application-alb` and `alb.ingress.kubernetes.io/group.order: '1'` are set to ensure this Ingress is part of your shared ALB configuration.
3.  **WAF Association:** The key annotation `alb.ingress.kubernetes.io/wafv2-acl-arn: arn:aws:wafv2:AWS_REGION:YOUR_ACCOUNT_ID:regional/webacl/EKS-WAF-ALB-Environment/WEB_ACL_UNIQUE_ID` is added. This tells the AWS Load Balancer Controller to associate your defined WAF WebACL with the shared ALB it creates or manages.
4.  **Removal of `inbound-cidrs`:** The `alb.ingress.kubernetes.io/inbound-cidrs` annotation is explicitly *removed*. Its functionality is now delegated entirely to AWS WAF.
5.  **WAF Rule Implementation (External to Ingress):**
    *   You would maintain your `EKSWAFWebACL` (from your CloudFormation example) to define the actual CIDR-based access rules.
    *   **ReferenceIPSet1ARN** would contain the CIDRs allowed for `dashboard.example.com`.
    *   **ReferenceIPSet2ARN** would contain the CIDRs allowed for `customer-portal.example.com`.
    *   The WAF rules (`DashboardAccessRule`, `CustomerPortalAccessRule`) in your CloudFormation template use `ByteMatchStatement` on the `Host` header to identify the subdomain and then `IPSetReferenceStatement` to check the client's IP against the relevant IP set.

**How to Apply:**

1.  **Create WAF IP Sets:** Ensure you have created the necessary WAF IP Sets (e.g., `OfficeNetworkIPSet` and `PartnerNetworkIPSet` from your CFT example) in AWS WAF, populated with your desired CIDRs for each domain.
2.  **Deploy WAF WebACL:** Deploy or update your CloudFormation stack that defines the `EKSWAFWebACL` and its rules, ensuring it references the correct IP Set ARNs.
3.  **Update Ingress:** Replace your existing multiple Ingress files with this consolidated `shared-alb-main-ingress.yaml` (after filling in your specific details like certificate ARN, service names, and WAF ARN).
    ```sh
    kubectl apply -f shared-alb-main-ingress.yaml
    ```
4.  **Verification:** Follow the verification and testing steps in your guide, paying close attention to WAF association and rule testing.

This approach centralizes both your ALB configuration and your advanced security rules, making management more efficient.

Here's a visual representation of how this consolidated setup works: 
