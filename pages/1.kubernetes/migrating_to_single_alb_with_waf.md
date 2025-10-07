# Migrating Multiple ALBs to a Single Ingress ALB with WAF Integration
![Diagram showing multiple Kubernetes Ingress resources consolidating into a single shared AWS ALB, with AWS WAF integrating to apply IP-based access rules per subdomain before traffic reaches the EKS cluster.](images/shared-alb-waf-diagram.png)

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
kubectl get ingress --all-namespaces -o yaml > uat-all-ingress.yaml
Fetch All Inbound CIDRs Used by ALBs

This command specifically extracts Ingress resources that have the alb.ingress.kubernetes.io/inbound-cidrs annotation and lists their namespace, name, and the associated CIDRs.

kubectl get ingress --all-namespaces -o json | \
jq -r '.items[] | select(.metadata.annotations."alb.ingress.kubernetes.io/inbound-cidrs") | 
        "\(.metadata.namespace)/\(.metadata.name): \(.metadata.annotations."alb.ingress.kubernetes.io/inbound-cidrs")"' \
> uat-inbound-cidrs.txt
```
Review uat-inbound-cidrs.txt to understand which services currently have IP restrictions. You'll use this information to create WAF IP sets and rules.
4. Planning Your Migration

Before making changes, it's crucial to plan:

    Shared ALB Name: Choose a descriptive group name for your shared ALB (e.g., shared-alb).

    Consolidation Strategy: Decide which Ingress resources will be part of the shared ALB. It's often best to group services that share common security requirements or operational teams.

    DNS Updates: Be prepared to update DNS records to point to the new shared ALB's CNAME once it's created and validated.

    Downtime Strategy: Plan for potential downtime during the migration. A phased approach or blue/green deployment is recommended for critical services.

    WAF Rules: Define the specific WAF rules you want to apply based on your uat-inbound-cidrs.txt and other security requirements.

5. Modifying Ingress Resources for a Shared ALB

Now, let's modify your uat-all-ingress.yaml (or individual Ingress files) to group them under a single ALB.

For each Ingress resource you want to include in the shared ALB, you'll need to add or modify the following annotations:

    alb.ingress.kubernetes.io/group.name: shared-alb: This is the key annotation that tells the AWS Load Balancer Controller to group this Ingress with others using the same group name under a single ALB.

    alb.ingress.kubernetes.io/group.order: <number>: (Optional but Recommended) Specifies the order of evaluation for listener rules within the shared ALB. Lower numbers are evaluated first.

    alb.ingress.kubernetes.io/listen-ports: '[{"HTTP": 80}, {"HTTPS": 443}]': Ensures the shared ALB listens on standard HTTP and HTTPS ports.

    alb.ingress.kubernetes.io/ssl-redirect: '443': (Optional) Enforces HTTPS redirection for HTTP traffic.

    alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:REGION:ACCOUNT_ID:certificate/CERT_ID: Replace with your ACM certificate ARN for HTTPS.

Example Ingress Modification:

ingress (example):
> ` ```yaml`
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-service-ingress
  namespace: my-app
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing
spec:
  rules:
  - host: my-service.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: my-service
            port:
              number: 80
> ` ``` `

Modified Ingress for shared ALB:
> ` ```yaml`
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-service-ingress
  namespace: my-app
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/group.name: shared-alb # <-- Add this
    alb.ingress.kubernetes.io/group.order: '10'    # <-- Add this (adjust order as needed)
    alb.ingress.kubernetes.io/listen-ports: '[{"HTTP": 80}, {"HTTPS": 443}]' # <-- Add/Ensure
    alb.ingress.kubernetes.io/ssl-redirect: '443'  # <-- Add (if desired)
    alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:REGION:ACCOUNT_ID:certificate/CERT_ID # <-- Add your cert ARN
spec:
  rules:
  - host: my-service.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: my-service
            port:
              number: 80
> ` ``` `    
  
```sh
Apply these changes to all relevant Ingress resources:    
kubectl apply -f ingress.yaml
 ```
## 5. S3 Bucket Policy for Access Logs

The ALB needs permission to write logs to your S3 bucket. You must attach a bucket policy that grants the AWS managed ALB account ID write access.

Replace YOUR_REGION and YOUR_ACCOUNT_ID with your actual AWS region and the account ID where the S3 bucket resides. The ELB_ACCOUNT_ID is a specific AWS service account ID that varies by region.  

## 6. WAF WebACL CloudFormation Reference

For those managing infrastructure with CloudFormation, here's an example of how a WAF WebACL could be defined. This template showcases managed rule groups, IP set references, and domain-based routing logic.

This is a reference example. 
> Resources:
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
        # Managed Rule Groups - high priority numbers so custom rules run first
        - Name: AWS-AWSManagedRulesAnonymousIpList
          Priority: 100
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesAnonymousIpList
          OverrideAction:
            None: {} # Allow this managed rule group to block if it detects issues
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: AWS-AWSManagedRulesAnonymousIpList
            
        - Name: AWS-AWSManagedRulesAmazonIpReputationList
          Priority: 101
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesAmazonIpReputationList
          OverrideAction:
            None: {} # Allow this managed rule group to block if it detects issues
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: AWS-AWSManagedRulesAmazonIpReputationList
        
        # Add other AWS Managed Rule Groups here as needed, e.g., Common Rule Set, Bot Control, etc.
        # Ensure they have appropriate priorities.
                     
        # Custom Rule 10: Domain-Based Access for a Specific Service
        # This rule allows traffic to 'service1.example.com' if the source IP is in ReferenceIPSet1
        - Name: Service1DomainAccessRule
          Priority: 10 # Custom rules typically have lower (earlier) priorities
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
                    Arn: !Ref ReferenceIPSet1ARN # Using parameter or give directly IP Set ARN
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
> ` ``` `  

7. Verification and Testing

After applying the changes, thoroughly verify your setup:

    Check ALB Status:
    Confirm that a single ALB is created/updated for the shared-alb group.
    
```sh
Apply these changes to all relevant Ingress resources:    
kubectl get ingress -n <your-namespace> shared-alb-config-ingress -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
```

    You should see the DNS name of the shared ALB.

    Access Logs:
    Verify that log files are being delivered to your specified S3 bucket. This may take a few minutes for the first logs to appear.

    WAF Association:
    In the AWS WAF console, navigate to your shared-alb-web-acl. Under "Associated AWS resources," confirm that your shared ALB is listed.

    Application Connectivity:
    Test all services previously served by individual ALBs to ensure they are now accessible through the shared ALB's DNS name (and your updated CNAME records).

        Test HTTP and HTTPS.

        Test all paths and hosts.

    WAF Rule Testing:
    If you've added specific WAF rules (e.g., blocking certain IPs, SQL injection, XSS), try to trigger them to ensure they are functioning as expected.

        Specifically test your IP-based access rules. Try accessing admin.example.com (or service1.example.com from the CFN example) from an allowed IP and a blocked IP.

        Caution: Only test rules you've specifically configured to block. Be mindful of potential impact.

8. Troubleshooting

    Ingress Events: Check kubectl describe ingress <ingress-name> for any events or errors reported by the AWS Load Balancer Controller.

    Controller Logs: Review the logs of the aws-load-balancer-controller pod for detailed errors.
    code Bash

```sh    
kubectl logs -n kube-system deploy/aws-load-balancer-controller
```