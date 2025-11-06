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

Managing numerous ALBs can lead to increased operational overhead and costs.
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

*   **WAF Rules:** Define the specific WAF rules you want to apply based on your `inbound-cidrs.txt` and other security requirements.

## 5. Modifying Ingress Resources for a Shared ALB

### Example Ingress Modification:

**Modified Ingress for shared ALB:**
This is a comprehensive guide! It clearly outlines the steps for consolidating ALBs and integrating WAF.
Here's an example of how you would modify a single Ingress file to use a shared ALB and offload the CIDR restrictions to WAF via annotations.

### Single Ingress File with Shared ALB and WAF Annotations

Instead of using `alb.ingress.kubernetes.io/inbound-cidrs` directly on the Ingress, we'll configure WAF to handle these restrictions by referencing WAF IP Sets you've created (e.g., via CloudFormation, as in your `EKSWAFWebACL` example).

Existing ingress file
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: portal-service
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
  name: new-portal-service
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
    alb.ingress.kubernetes.io/wafv2-acl-arn: arn:aws:wafv2:AWS_REGION:YOUR_ACCOUNT_ID:regional/webacl/EKS-WAF-ALB/WEB_ACL_UNIQUE_ID # Example ARN
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

## 5. S3 Bucket Policy for Access Logs

The ALB needs permission to write logs to your S3 bucket. You must attach a bucket policy that grants the AWS managed ALB account ID write access.

Replace `YOUR_AWS_REGION` and `YOUR_ACCOUNT_ID` with your actual AWS region and the account ID where the S3 bucket resides. The `ELB_ACCOUNT_ID` is a specific AWS service account ID that varies by region. You can find the correct `ELB_ACCOUNT_ID` for your region in the [AWS documentation for ALB access logs](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/enable-access-logging.html).

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::ELB_ACCOUNT_ID:root"
      },
      "Action": "s3:PutObject",
      "Resource": "arn:aws:s3:::your-access-log-bucket-name/AWSLogs/YOUR_ACCOUNT_ID/*",
      "Condition": {
        "StringEquals": {
          "s3:x-amz-acl": "bucket-owner-full-control"
        }
      }
    }
  ]
}
```

## 6. WAF WebACL CloudFormation Reference

For those managing infrastructure with CloudFormation, here's an example of how a WAF WebACL could be defined. This template showcases managed rule groups, IP set references, and domain-based routing logic.

This is a reference example.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'WAF WebACL for EKS ALBs with managed rule groups and IP set references'

Parameters:
  EnvironmentName:
    Type: String
    Default: UAT
    Description: Deployment environment (e.g. UAT, PROD)
  OfficeNetworkIPSetARN:
    Type: String
    Default: 'arn:aws:wafv2:AWS_REGION:YOUR_ACCOUNT_ID:regional/ipset/OfficeNetworkIPSet/UNIQUE_ID_1' # Example ARN
    Description: ARN of the allowed office network IP Set
  PartnerNetworkIPSetARN:
    Type: String
    Default: 'arn:aws:wafv2:AWS_REGION:YOUR_ACCOUNT_ID:regional/ipset/PartnerNetworkIPSet/UNIQUE_ID_2' # Example ARN
    Description: ARN of the partner network IP Set

Resources:
  OfficeNetworkIPSet:
    Type: AWS::WAFv2::IPSet
    Properties:
      Name: "office-network-ip-set"
      Description: "Allowed office network CIDRs for UAT ALBs"
      Scope: REGIONAL
      IPAddressVersion: IPV4
      Addresses:
        - "203.0.113.0/24" # Example CIDR block for office
        - "198.51.100.0/24" # Another example CIDR
        # Add more CIDR blocks as needed
        
  EKSWAFWebACL:
    Type: AWS::WAFv2::WebACL
    Properties:
      Name: !Sub 'EKS-WAF-ALB-${EnvironmentName}'
      Scope: REGIONAL
      Description: WAF for EKS ALBs
      DefaultAction:
        Block: {}  # Default to block all requests unless explicitly allowed
      VisibilityConfig:
        SampledRequestsEnabled: true
        CloudWatchMetricsEnabled: true
        MetricName: !Sub 'EKS-WAF-ALB-${EnvironmentName}'
      Rules:
        # Priority 0 is for explicit ALLOW rules at the top
        - Name: DomainSpecificAccessRules
          Priority: 0
          Statement:
            OrStatement:
              Statements:
                # Rule for 'dashboard.example.com' allowing access from OfficeNetworkIPSet
                - AndStatement:
                    Statements:
                      - ByteMatchStatement:
                          SearchString: "dashboard.example.com"
                          FieldToMatch:
                            SingleHeader:
                              Name: "host"
                          TextTransformations:
                            - Priority: 0
                              Type: "LOWERCASE"
                          PositionalConstraint: "EXACTLY"
                      - IPSetReferenceStatement:
                          Arn: !GetAtt OfficeNetworkIPSet.Arn # Reference the created IPSet
                          IPSetForwardedIPConfig:
                            HeaderName: "X-Forwarded-For"
                            FallbackBehavior: "MATCH"
                            Position: "FIRST"
                # Rule for 'customer-portal.example.com' allowing access from PartnerNetworkIPSet
                - AndStatement:
                    Statements:
                      - ByteMatchStatement:
                          SearchString: "customer-portal.example.com"
                          FieldToMatch:
                            SingleHeader:
                              Name: "host"
                          TextTransformations:
                            - Priority: 0
                              Type: "LOWERCASE"
                          PositionalConstraint: "EXACTLY"
                      - IPSetReferenceStatement:
                          Arn: !Ref PartnerNetworkIPSetARN # Reference an externally defined IPSet
                          IPSetForwardedIPConfig:
                            HeaderName: "X-Forwarded-For"
                            FallbackBehavior: "MATCH"
                            Position: "FIRST"
                # Add more domain-specific AND IPSet combinations here.
                # Example for 'api.example.com' accessible from anywhere (or another specific IP set)
                - ByteMatchStatement:
                    SearchString: "api.example.com"
                    FieldToMatch:
                      SingleHeader:
                        Name: "host"
                    TextTransformations:
                      - Priority: 0
                        Type: "LOWERCASE"
                    PositionalConstraint: "EXACTLY"
          Action:
            Allow: {} # Allow if any of the OrStatement conditions are met
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: DomainSpecificAccessRule

        # Managed Rule Groups (starting from Priority 1 and onwards)
        - Name: AWS-AWSManagedRulesAnonymousIpList
          Priority: 1
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesAnonymousIpList
          OverrideAction:
            None: {}
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: AWS-AWSManagedRulesAnonymousIpList
            
        - Name: AWS-AWSManagedRulesAmazonIpReputationList
          Priority: 2
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesAmazonIpReputationList
          OverrideAction:
            None: {}
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: AWS-AWSManagedRulesAmazonIpReputationList
            
        - Name: AWS-AWSManagedRulesKnownBadInputsRuleSet
          Priority: 3
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesKnownBadInputsRuleSet
          OverrideAction:
            None: {}
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: AWS-AWSManagedRulesKnownBadInputsRuleSet
            
        - Name: AWS-AWSManagedRulesLinuxRuleSet
          Priority: 4
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesLinuxRuleSet
          OverrideAction:
            None: {}
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: AWS-AWSManagedRulesLinuxRuleSet
            
        - Name: AWS-AWSManagedRulesPHPRuleSet
          Priority: 5
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesPHPRuleSet
          OverrideAction:
            None: {}
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: AWS-AWSManagedRulesPHPRuleSet
            
        - Name: AWS-AWSManagedRulesUnixRuleSet
          Priority: 6
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesUnixRuleSet
          OverrideAction:
            None: {}
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: AWS-AWSManagedRulesUnixRuleSet
            
        - Name: AWS-AWSManagedRulesSQLiRuleSet
          Priority: 7
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesSQLiRuleSet
          OverrideAction:
            None: {}
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: AWS-AWSManagedRulesSQLiRuleSet
            
        - Name: AWS-AWSManagedRulesWindowsRuleSet
          Priority: 8
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesWindowsRuleSet
          OverrideAction:
            None: {}
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: AWS-AWSManagedRulesWindowsRuleSet
            
Outputs:
  WebACLId:
    Description: The ID of the WAF WebACL
    Value: !GetAtt EKSWAFWebACL.Id
    Export:
      Name: !Sub '${AWS::StackName}-WebACLId'

```
json rule builder for waf
```json
{
  "Name": "AllowPubliclyAccessibleServices",
  "Priority": 2, # Adjusted priority to be after managed rules
  "Statement": {
    "OrStatement": {
      "Statements": [
        {
          "ByteMatchStatement": {
            "SearchString": "public-ckyc-service.example.com",
            "FieldToMatch": {
              "SingleHeader": {
                "Name": "host"
              }
            },
            "TextTransformations": [
              {
                "Priority": 0,
                "Type": "LOWERCASE"
              }
            ],
            "PositionalConstraint": "EXACTLY"
          }
        },
        {
          "ByteMatchStatement": {
            "SearchString": "public-landing-page.example.com",
            "FieldToMatch": {
              "SingleHeader": {
                "Name": "host"
              }
            },
            "TextTransformations": [
              {
                "Priority": 0,
                "Type": "LOWERCASE"
              }
            ],
            "PositionalConstraint": "EXACTLY"
          }
        },
        {
          "ByteMatchStatement": {
            "SearchString": "guest-view-documents.example.com",
            "FieldToMatch": {
              "SingleHeader": {
                "Name": "host"
              }
            },
            "TextTransformations": [
              {
                "Priority": 0,
                "Type": "LOWERCASE"
              }
            ],
            "PositionalConstraint": "EXACTLY"
          }
        },
        {
          "ByteMatchStatement": {
            "SearchString": "open-api-gateway.example.com",
            "FieldToMatch": {
              "SingleHeader": {
                "Name": "host"
              }
            },
            "TextTransformations": [
              {
                "Priority": 0,
                "Type": "LOWERCASE"
              }
            ],
            "PositionalConstraint": "EXACTLY"
          }
        },
        {
          "ByteMatchStatement": {
            "SearchString": "vendor-info-management.example.com",
            "FieldToMatch": {
              "SingleHeader": {
                "Name": "host"
              }
            },
            "TextTransformations": [
              {
                "Priority": 0,
                "Type": "LOWERCASE"
              }
            ],
            "PositionalConstraint": "EXACTLY"
          }
        },
        {
          "ByteMatchStatement": {
            "SearchString": "external-vendor-portal.example.com",
            "FieldToMatch": {
              "SingleHeader": {
                "Name": "host"
              }
            },
            "TextTransformations": [
              {
                "Priority": 0,
                "Type": "LOWERCASE"
              }
            ],
            "PositionalConstraint": "EXACTLY"
          }
        },
        {
          "ByteMatchStatement": {
            "SearchString": "cibil-check.example.com",
            "FieldToMatch": {
              "SingleHeader": {
                "Name": "host"
              }
            },
            "TextTransformations": [
              {
                "Priority": 0,
                "Type": "LOWERCASE"
              }
            ],
            "PositionalConstraint": "EXACTLY"
          }
        },
        {
          "ByteMatchStatement": {
            "SearchString": "config-portal-api.example.com",
            "FieldToMatch": {
              "SingleHeader": {
                "Name": "host"
              }
            },
            "TextTransformations": [
              {
                "Priority": 0,
                "Type": "LOWERCASE"
              }
            ],
            "PositionalConstraint": "EXACTLY"
          }
        },
        {
          "ByteMatchStatement": {
            "SearchString": "data-analytics-api.example.com",
            "FieldToMatch": {
              "SingleHeader": {
                "Name": "host"
              }
            },
            "TextTransformations": [
              {
                "Priority": 0,
                "Type": "LOWERCASE"
              }
            ],
            "PositionalConstraint": "EXACTLY"
          }
        },
        {
          "ByteMatchStatement": {
            "SearchString": "new-app-release-test.example.com",
            "FieldToMatch": {
              "SingleHeader": {
                "Name": "host"
              }
            },
            "TextTransformations": [
              {
                "Priority": 0,
                "Type": "LOWERCASE"
              }
            ],
            "PositionalConstraint": "EXACTLY"
          }
        },
        {
          "ByteMatchStatement": {
            "SearchString": "utility-services.example.com",
            "FieldToMatch": {
              "SingleHeader": {
                "Name": "host"
              }
            },
            "TextTransformations": [
              {
                "Priority": 0,
                "Type": "LOWERCASE"
              }
            ],
            "PositionalConstraint": "EXACTLY"
          }
        },
        {
          "ByteMatchStatement": {
            "SearchString": "hr-verification.example.com",
            "FieldToMatch": {
              "SingleHeader": {
                "Name": "host"
              }
            },
            "TextTransformations": [
              {
                "Priority": 0,
                "Type": "LOWERCASE"
              }
            ],
            "PositionalConstraint": "EXACTLY"
          }
        },
        {
          "ByteMatchStatement": {
            "SearchString": "cron-jobs-endpoint.example.com",
            "FieldToMatch": {
              "SingleHeader": {
                "Name": "host"
              }
            },
            "TextTransformations": [
              {
                "Priority": 0,
                "Type": "LOWERCASE"
              }
            ],
            "PositionalConstraint": "EXACTLY"
          }
        },
        {
          "ByteMatchStatement": {
            "SearchString": "payment-client-interface.example.com",
            "FieldToMatch": {
              "SingleHeader": {
                "Name": "host"
              }
            },
            "TextTransformations": [
              {
                "Priority": 0,
                "Type": "LOWERCASE"
              }
            ],
            "PositionalConstraint": "EXACTLY"
          }
        },
        {
          "ByteMatchStatement": {
            "SearchString": "secure-forms-web.example.com",
            "FieldToMatch": {
              "SingleHeader": {
                "Name": "host"
              }
            },
            "TextTransformations": [
              {
                "Priority": 0,
                "Type": "LOWERCASE"
              }
            ],
            "PositionalConstraint": "EXACTLY"
          }
        }
      ]
    }
  },
  "Action": {
    "Allow": {}
  },
  "VisibilityConfig": {
    "SampledRequestsEnabled": true,
    "CloudWatchMetricsEnabled": true,
    "MetricName": "AllowPubliclyAccessibleServices"
  }
}
```
## Troubleshoot WAF 403 Errors

The `curl -vk https://customer-portal.example.com/` command is used to check whether your AWS WAF, ALB, or Ingress routing is working properly.

without dns mapping check
curl -vk https://k8s-sharedalb-045.us-east-1.elb.amazonaws.com \
     -H "Host: bikebazaarappsuat.bikebazaar.com"

Here’s what each flag does:

`-v` → verbose output (shows detailed connection steps)

`-k` → allows insecure SSL connections (useful if your certificate is self-signed or not trusted, though ideally you'd use a valid cert)

`https://customer-portal.example.com/` → the URL of your domain behind WAF/ALB

## example 404 error
curl -v bikebazaarappsuat.bikebazaar.com
* TLSv1.2 (IN), TLS header, Supplemental data (23):
< HTTP/2 404 
< server: awselb/2.0
< date: Wed, 15 Oct 2025 08:19:04 GMT
< content-type: text/plain; charset=utf-8
< content-length: 0
< 
* Connection #0 to host k8s-sharedalb-bc078dd9.ap-south-1.elb.amazonaws.com
here 404 was target-group unhealthy due to ingress misconfiguration 



## 7. Verification and Testing

After applying the changes, thoroughly verify your setup:

*   **Check ALB Status:**
    Confirm that a single ALB is created/updated for the `shared-application-alb` group.

```sh
kubectl get ingress -n <your-namespace> new-portal-service -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
```

You should see the DNS name of the shared ALB.

*   **Access Logs:**
    Verify that log files are being delivered to your specified S3 bucket. This may take a few minutes for the first logs to appear.

*   **WAF Association:**
    In the AWS WAF console, navigate to your `EKS-WAF-ALB` web ACL. Under "Associated AWS resources," confirm that your shared ALB is listed.

*   **Application Connectivity:**
    Test all services previously served by individual ALBs to ensure they are now accessible through the shared ALB's DNS name (and your updated CNAME records).

    *   Test HTTP and HTTPS.
    *   Test all paths and hosts.

*   **WAF Rule Testing:**
    If you've added specific WAF rules (e.g., blocking certain IPs, SQL injection, XSS), try to trigger them to ensure they are functioning as expected.

    *   Specifically test your IP-based access rules. Try accessing `dashboard.example.com` from an allowed IP (e.g., from your `OfficeNetworkIPSet`) and a blocked IP (one not in any allowed set).
    *   Test other publicly accessible services like `api.example.com`.

    *   Caution: Only test rules you've specifically configured to block. Be mindful of potential impact.

## 8. Troubleshooting

*   **Ingress Events:** Check `kubectl describe ingress <ingress-name>` for any events or errors reported by the AWS Load Balancer Controller.

*   **Controller Logs:** Review the logs of the `aws-load-balancer-controller` pod for detailed errors.

```sh
kubectl logs -n kube-system deploy/aws-load-balancer-controller
```