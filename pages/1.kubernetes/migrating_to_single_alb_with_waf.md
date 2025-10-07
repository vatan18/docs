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

*   **Shared ALB Name:** Choose a descriptive group name for your shared ALB (e.g., `shared-alb`).

*   **Consolidation Strategy:** Decide which Ingress resources will be part of the shared ALB. It's often best to group services that share common security requirements or operational teams.

*   **DNS Updates:** Be prepared to update DNS records to point to the new shared ALB's CNAME once it's created and validated.

*   **Downtime Strategy:** Plan for potential downtime during the migration. A phased approach or blue/green deployment is recommended for critical services.

*   **WAF Rules:** Define the specific WAF rules you want to apply based on your `inbound-cidrs.txt` and other security requirements.

## 5. Modifying Ingress Resources for a Shared ALB

Now, let's modify your `all-ingress.yaml` (or individual Ingress files) to group them under a single ALB.

For each Ingress resource you want to include in the shared ALB, you'll need to add or modify the following annotations:

*   `alb.ingress.kubernetes.io/group.name: shared-alb`: This is the key annotation that tells the AWS Load Balancer Controller to group this Ingress with others using the same group name under a single ALB.

*   `alb.ingress.kubernetes.io/group.order: <number>`: (Optional but Recommended) Specifies the order of evaluation for listener rules within the shared ALB. Lower numbers are evaluated first.

*   `alb.ingress.kubernetes.io/listen-ports: '[{"HTTP": 80}, {"HTTPS": 443}]'`: Ensures the shared ALB listens on standard HTTP and HTTPS ports.

*   `alb.ingress.kubernetes.io/ssl-redirect: '443'`: (Optional) Enforces HTTPS redirection for HTTP traffic.

*   `alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:REGION:ACCOUNT_ID:certificate/CERT_ID`: Replace with your ACM certificate ARN for HTTPS.

### Example Ingress Modification:

**Modified Ingress for shared ALB:**
This is a comprehensive guide! It clearly outlines the steps for consolidating ALBs and integrating WAF.
Here's an example of how you would modify a single Ingress file to use a shared ALB and offload the CIDR restrictions to WAF via annotations.

### Single Ingress File with Shared ALB and WAF Annotations

This example assumes you have two subdomains: `service1.example.com` and `service2.example.com`. Instead of using `alb.ingress.kubernetes.io/inbound-cidrs` directly on the Ingress, we'll configure WAF to handle these restrictions by referencing WAF IP Sets you've created (e.g., via CloudFormation, as in your `EKSWAFWebACL` example).

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: shared-alb-main-ingress
  namespace: default # Or the namespace where your main services reside
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/group.name: shared-alb
    alb.ingress.kubernetes.io/group.order: '1' # This Ingress might serve as the primary configuration
    alb.ingress.kubernetes.io/listen-ports: '[{"HTTP": 80}, {"HTTPS": 443}]'
    alb.ingress.kubernetes.io/ssl-redirect: '443'
    alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:REGION:ACCOUNT_ID:certificate/CERT_ID # Replace with your ACM cert ARN

    # WAF Integration Annotations
    alb.ingress.kubernetes.io/wafv2-acl-arn: arn:aws:wafv2:REGION:ACCOUNT_ID:webacl/EKS-WAF-ALB-Environment/WEB_ACL_ID # Replace with your WAF WebACL ARN

    # IMPORTANT: The 'alb.ingress.kubernetes.io/inbound-cidrs' annotation is REMOVED from here.
    # Its functionality is now handled by WAF rules, which use IP Sets.
    # For instance, if you previously had:
    # alb.ingress.kubernetes.io/inbound-cidrs: 192.168.1.0/24,10.0.0.0/16
    # These CIDRs should now be defined in WAF IP Sets (e.g., ReferenceIPSet1, ReferenceIPSet2 in your CFT).

spec:
  rules:
  - host: service1.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: service1-service # Your Kubernetes Service for service1
            port:
              number: 80
  - host: service2.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: service2-service # Your Kubernetes Service for service2
            port:
              number: 80
  # You can add more hosts and their corresponding backends to this single Ingress file.
  # The WAF rules will then evaluate traffic based on the 'Host' header for each domain.
```

**Explanation of Changes:**

1.  **Consolidation:** All rules for `service1.example.com` and `service2.example.com` (and any other services you want to route through this shared ALB) are now within a single `Ingress` resource.
2.  **Shared ALB Group:** `alb.ingress.kubernetes.io/group.name: shared-alb` and `alb.ingress.kubernetes.io/group.order: '1'` are set to ensure this Ingress is part of your shared ALB configuration.
3.  **WAF Association:** The key annotation `alb.ingress.kubernetes.io/wafv2-acl-arn: arn:aws:wafv2:REGION:ACCOUNT_ID:webacl/EKS-WAF-ALB-Environment/WEB_ACL_ID` is added. This tells the AWS Load Balancer Controller to associate your defined WAF WebACL with the shared ALB it creates or manages.
4.  **Removal of `inbound-cidrs`:** The `alb.ingress.kubernetes.io/inbound-cidrs` annotation is explicitly *removed*. Its functionality is now delegated entirely to AWS WAF.
5.  **WAF Rule Implementation (External to Ingress):**
    *   You would maintain your `EKSWAFWebACL` (from your CloudFormation example) to define the actual CIDR-based access rules.
    *   **ReferenceIPSet1ARN** would contain the CIDRs allowed for `service1.example.com`.
    *   **ReferenceIPSet2ARN** would contain the CIDRs allowed for `service2.example.com`.
    *   The WAF rules (`Service1DomainAccessRule`, `Service2DomainAccessRule`) in your CloudFormation template use `ByteMatchStatement` on the `Host` header to identify the subdomain and then `IPSetReferenceStatement` to check the client's IP against the relevant IP set.

**How to Apply:**

1.  **Create WAF IP Sets:** Ensure you have created the necessary WAF IP Sets (e.g., `ReferenceIPSet1` and `ReferenceIPSet2` from your CFT example) in AWS WAF, populated with your desired CIDRs for each domain.
2.  **Deploy WAF WebACL:** Deploy or update your CloudFormation stack that defines the `EKSWAFWebACL` and its rules, ensuring it references the correct IP Set ARNs.
3.  **Update Ingress:** Replace your existing multiple Ingress files with this consolidated `shared-alb-main-ingress.yaml` (after filling in your specific details like certificate ARN, service names, and WAF ARN).
    ```sh
    kubectl apply -f shared-alb-main-ingress.yaml
    ```
4.  **Verification:** Follow the verification and testing steps in your guide, paying close attention to WAF association and rule testing.

This approach centralizes both your ALB configuration and your advanced security rules, making management more efficient.

Here's a visual representation of how this consolidated setup works: 

## 5. S3 Bucket Policy for Access Logs

The ALB needs permission to write logs to your S3 bucket. You must attach a bucket policy that grants the AWS managed ALB account ID write access.

Replace `YOUR_REGION` and `YOUR_ACCOUNT_ID` with your actual AWS region and the account ID where the S3 bucket resides. The `ELB_ACCOUNT_ID` is a specific AWS service account ID that varies by region.

## 6. WAF WebACL CloudFormation Reference

For those managing infrastructure with CloudFormation, here's an example of how a WAF WebACL could be defined. This template showcases managed rule groups, IP set references, and domain-based routing logic.

This is a reference example.

```yaml
Resources:
  gropAIPSet1ARN:
    Type: AWS::WAFv2::IPSet
    Properties:
      Name: "alb-office-nw-uat"
      Description: "Allowed office network CIDRs for UAT ALBs"
      Scope: REGIONAL
      IPAddressVersion: IPV4
      Addresses:
        - "102.124.57.15/32"
        - "102.124.55.15/32"
        - "102.124.58.15/32"
  EKSWAFWebACL:
    Type: AWS::WAFv2::WebACL
    Properties:
      Name: !Sub 'EKS-WAF-ALB-${Environment}'
      Scope: REGIONAL
      Description: WAF for EKS ALBs
      DefaultAction:
        Block: {} # A more secure default action, allowing explicit Allow rules to take precedence
      VisibilityConfig:
        SampledRequestsEnabled: true
        CloudWatchMetricsEnabled: true
        MetricName: !Sub 'EKS-WAF-ALB-${Environment}'
      Rules:
        # Custom Rule 1: Domain-Based Access for a Specific Service
        # This rule allows traffic to 'service1.example.com' if the source IP is in ReferenceIPSet1
        - Name: Service1DomainAccessRule
          Priority: 1 # Custom rules typically have lower (earlier) priorities
          Statement:
            AndStatement:
              Statements:
                - ByteMatchStatement: # Match the Host header
                    SearchString: "service1.example.com"
                    FieldToMatch:
                      SingleHeader:
                        Name: "host"
                    TextTransformations:
                      - Priority: 0
                        Type: "LOWERCASE"
                    PositionalConstraint: "EXACTLY"
                - IPSetReferenceStatement: # Check if IP is in the allowed set
                    Arn: !Ref gropAIPSet1ARN # Using parameter or give directly IP Set ARN
                    IPSetForwardedIPConfig: # Important for ALBs to check the true client IP
                      HeaderName: "X-Forwarded-For"
                      FallbackBehavior: "MATCH"
                      Position: "FIRST" # Check the first IP in X-Forwarded-For (client IP)
          Action:
            Allow: {} # Explicitly allow if both conditions match
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: Service1DomainAccessRule

        # Custom Rule 11: Another Domain-Based Access for a Different Service
        # This rule allows traffic to 'service2.example.com' if the source IP is in ReferenceIPSet2
        - Name: Service2DomainAccessRule
          Priority: 11
          Statement:
            AndStatement:
              Statements:
                - ByteMatchStatement:
                    SearchString: "service2.example.com"
                    FieldToMatch:
                      SingleHeader:
                        Name: "host"
                    TextTransformations:
                      - Priority: 0
                        Type: "LOWERCASE"
                    PositionalConstraint: "EXACTLY"
                - IPSetReferenceStatement:
                    Arn: !Ref ReferenceIPSet2ARN
                    IPSetForwardedIPConfig:
                      HeaderName: "X-Forwarded-For"
                      FallbackBehavior: "MATCH"
                      Position: "FIRST"
          Action:
            Allow: {}
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: Service2DomainAccessRule

        # Add more custom rules here as needed for other domains and IP sets

Outputs:
  WebACLId:
    Description: The ID of the WAF WebACL
    Value: !GetAtt EKSWAFWebACL.Id
    Export:
      Name: !Sub '${AWS::StackName}-WebACLId'
```

## 7. Verification and Testing

After applying the changes, thoroughly verify your setup:

*   **Check ALB Status:**
    Confirm that a single ALB is created/updated for the `shared-alb` group.

```sh
kubectl get ingress -n <your-namespace> shared-alb-config-ingress -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
```

You should see the DNS name of the shared ALB.

*   **Access Logs:**
    Verify that log files are being delivered to your specified S3 bucket. This may take a few minutes for the first logs to appear.

*   **WAF Association:**
    In the AWS WAF console, navigate to your `shared-alb-web-acl`. Under "Associated AWS resources," confirm that your shared ALB is listed.

*   **Application Connectivity:**
    Test all services previously served by individual ALBs to ensure they are now accessible through the shared ALB's DNS name (and your updated CNAME records).

    *   Test HTTP and HTTPS.
    *   Test all paths and hosts.

*   **WAF Rule Testing:**
    If you've added specific WAF rules (e.g., blocking certain IPs, SQL injection, XSS), try to trigger them to ensure they are functioning as expected.

    *   Specifically test your IP-based access rules. Try accessing `admin.example.com` (or `service1.example.com` from the CFN example) from an allowed IP and a blocked IP.

    *   Caution: Only test rules you've specifically configured to block. Be mindful of potential impact.

## 8. Troubleshooting

*   **Ingress Events:** Check `kubectl describe ingress <ingress-name>` for any events or errors reported by the AWS Load Balancer Controller.

*   **Controller Logs:** Review the logs of the `aws-load-balancer-controller` pod for detailed errors.

```sh
kubectl logs -n kube-system deploy/aws-load-balancer-controller
```