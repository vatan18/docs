# 🧭 Kubernetes Ingress Consolidation using AWS ALB & WAF

This document provides a step-by-step guide to consolidating multiple Application Load Balancers (ALBs) into a **shared ALB** using Kubernetes Ingress on AWS EKS.
It also includes AWS WAF integration for centralized IP-based access control and domain-level routing.

---

## 📘 Table of Contents

1. [Overview](#1-overview)
2. [Prerequisites](#2-prerequisites)
3. [Identify Existing Ingress and CIDRs](#3-identify-existing-ingress-and-cidrs)
4. [Modify Ingress for Shared ALB](#4-modify-ingress-for-shared-alb)
5. [Set Up Access Logs](#5-set-up-access-logs)
6. [Attach AWS WAF](#6-attach-aws-waf)
7. [CloudFormation Templates](#7-cloudformation-templates)
8. [Verification & Testing](#8-verification--testing)
9. [Troubleshooting](#9-troubleshooting)
10. [Security Guidelines](#10-security-guidelines)

---

## 1. Overview

Using a single shared ALB for multiple applications improves:

* **Cost efficiency** (single ALB)
* **Centralized WAF protection**
* **Simplified management**
* **Unified access logging**

---

## 2. Prerequisites

Before starting, ensure you have:

* **AWS Load Balancer Controller** installed on your EKS cluster
* **AWS CLI** and **kubectl** configured
* **IAM permissions** for managing ALB, S3, and WAF
* **S3 bucket** ready for ALB logs
* **Certificates** created in AWS ACM

---

## 3. Identify Existing Ingress and CIDRs

### Export All Ingresses

```bash
kubectl get ingress --all-namespaces -o yaml > all-ingress.yaml
```

### Extract CIDR Restrictions

```bash
kubectl get ingress --all-namespaces -o json | \
jq -r '.items[] | select(.metadata.annotations."alb.ingress.kubernetes.io/inbound-cidrs") |
"\(.metadata.namespace)/\(.metadata.name): \(.metadata.annotations."alb.ingress.kubernetes.io/inbound-cidrs")"' \
> inbound-cidrs.txt
```

You’ll use the extracted CIDRs to create **AWS WAF IP sets**.

---

## 4. Modify Ingress for Shared ALB

### Updated Ingress Example

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
    alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:AWS_REGION:YOUR_ACCOUNT_ID:CERTIFICATE_ID # Example ARN
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
Updated ingress
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: new-portal-service
  namespace: default
  annotations:
    kubernetes.io/ingress.class: alb
    # Shared ALB group — all services sharing this name will attach to one ALB
    alb.ingress.kubernetes.io/group.name: shared-alb
    alb.ingress.kubernetes.io/group.order: '1'

    # ALB settings
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
    alb.ingress.kubernetes.io/backend-protocol: HTTP
    alb.ingress.kubernetes.io/listen-ports: '[{"HTTP":80},{"HTTPS":443}]'
    alb.ingress.kubernetes.io/ssl-redirect: '443'
    
    # Security & compliance
    alb.ingress.kubernetes.io/subnets: subnet-xxxx,subnet-yyyy
    alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:{{AWS_REGION}}:{{AWS_ACCOUNT_ID}}:certificate/{{CERTIFICATE_ID}}
    alb.ingress.kubernetes.io/wafv2-acl-arn: arn:aws:wafv2:{{AWS_REGION}}:{{AWS_ACCOUNT_ID}}:regional/webacl/EKS-WAF-ALB/{{WEBACL_ID}}
    alb.ingress.kubernetes.io/ssl-policy: ELBSecurityPolicy-TLS13-1-2-2021-06

    # Access Logs and timeout
    alb.ingress.kubernetes.io/load-balancer-attributes: >-
      access_logs.s3.enabled=true,
      access_logs.s3.bucket={{ACCESS_LOG_BUCKET}},
      access_logs.s3.prefix={{ACCESS_LOG_PREFIX}},
      idle_timeout.timeout_seconds=300
spec:
  rules:
    - host: "customer-portal.example.com"
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: portal-service-backend
                port:
                  number: 443
```
⚙️ Optional: Force Delete Old ALB (if stuck)

If the old ALB doesn’t auto-delete after migration:
```bash
kubectl delete ingress old-portal-service
```
Then confirm from AWS console:
ALB → old load balancer → status: deleted
Target groups → remove old orphan ones if necessary.

**Explanation of Changes:**

1.  **Shared ALB Group:** `alb.ingress.kubernetes.io/group.name: shared-application-alb` and `alb.ingress.kubernetes.io/group.order: '1'` are set to ensure this Ingress is part of your shared ALB configuration.
2.  **WAF Association:** The key annotation `alb.ingress.kubernetes.io/wafv2-acl-arn: arn:aws:wafv2:AWS_REGION:YOUR_ACCOUNT_ID:regional/webacl/EKS-WAF-ALB-Environment/WEB_ACL_UNIQUE_ID` is added. This tells the AWS Load Balancer Controller to associate your defined WAF WebACL with the shared ALB it creates or manages.
3.  **Removal of `inbound-cidrs`:** The `alb.ingress.kubernetes.io/inbound-cidrs` annotation is explicitly *removed*. Its functionality is now delegated entirely to AWS WAF.
4. **Loadbalancer**- S3 Bucket Policy for Access Logs
## 5. S3 Bucket Policy for Access Logs
---

## 5. Set Up Access Logs
Replace `YOUR_AWS_REGION` and `YOUR_ACCOUNT_ID` with your actual AWS region and the account ID where the S3 bucket resides. The `ELB_ACCOUNT_ID` is a specific AWS service account ID that varies by region. You can find the correct `ELB_ACCOUNT_ID` for your region in the [AWS documentation for ALB access logs](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/enable-access-logging.html).

### Example S3 Bucket Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "AWS": "arn:aws:iam::{{ELB_ACCOUNT_ID}}:root" },
      "Action": "s3:PutObject",
      "Resource": "arn:aws:s3:::{{ACCESS_LOG_BUCKET}}/AWSLogs/{{AWS_ACCOUNT_ID}}/*",
      "Condition": { "StringEquals": { "s3:x-amz-acl": "bucket-owner-full-control" } }
    }
  ]
}
```

---

## 6. Attach AWS WAF

You’ll now attach an AWS WAF WebACL to the shared ALB, defining domain-based IP restrictions.

---

## 7. CloudFormation Templates

### 🧩 7.1 — Create WAF IP Sets (YAML)

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'AWS WAF IP sets for example.com'

Resources:
  OfficeNetwork:
    Type: AWS::WAFv2::IPSet
    Properties:
      Name: "office-network-ipset"
      Description: "Allowed office CIDRs"
      Scope: REGIONAL
      IPAddressVersion: IPV4
      Addresses:
        - "{{OFFICE_CIDR_1}}"
        - "{{OFFICE_CIDR_2}}"

  PartnerNetwork:
    Type: AWS::WAFv2::IPSet
    Properties:
      Name: "partner-network-ipset"
      Description: "Allowed partner CIDRs"
      Scope: REGIONAL
      IPAddressVersion: IPV4
      Addresses:
        - "{{PARTNER_CIDR_1}}"

Outputs:
  OfficeNetworkArn:
    Value: !GetAtt OfficeNetwork.Arn
  PartnerNetworkArn:
    Value: !GetAtt PartnerNetwork.Arn
```

---

### 🧱 7.1 JSON Builder (Equivalent)

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "AWS WAF IP sets for example.com",
  "Resources": {
    "OfficeNetwork": {
      "Type": "AWS::WAFv2::IPSet",
      "Properties": {
        "Name": "office-network-ipset",
        "Description": "Allowed office CIDRs",
        "Scope": "REGIONAL",
        "IPAddressVersion": "IPV4",
        "Addresses": ["{{OFFICE_CIDR_1}}", "{{OFFICE_CIDR_2}}"]
      }
    },
    "PartnerNetwork": {
      "Type": "AWS::WAFv2::IPSet",
      "Properties": {
        "Name": "partner-network-ipset",
        "Description": "Allowed partner CIDRs",
        "Scope": "REGIONAL",
        "IPAddressVersion": "IPV4",
        "Addresses": ["{{PARTNER_CIDR_1}}"]
      }
    }
  },
  "Outputs": {
    "OfficeNetworkArn": { "Value": { "Fn::GetAtt": ["OfficeNetwork", "Arn"] } },
    "PartnerNetworkArn": { "Value": { "Fn::GetAtt": ["PartnerNetwork", "Arn"] } }
  }
}
```

---

### 🧩 7.2 — WAF RuleGroup (Domain ↔ IPSet Mapping)

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Domain and IPSet Routing Rule for example.com'

Resources:
  DomainAndIPSetRoutingRule:
    Type: AWS::WAFv2::RuleGroup
    Properties:
      Name: "DomainAndIPSetRoutingRule"
      Scope: REGIONAL
      Capacity: 200
      VisibilityConfig:
        SampledRequestsEnabled: true
        CloudWatchMetricsEnabled: true
        MetricName: "DomainAndIPSetRoutingRule"
      Rules:
        - Name: "ExampleDomainRouting"
          Priority: 0
          Statement:
            OrStatement:
              Statements:
                - AndStatement:
                    Statements:
                      - ByteMatchStatement:
                          SearchString: "app.example.com"
                          FieldToMatch: { SingleHeader: { Name: "host" } }
                          TextTransformations: [{ Priority: 0, Type: "LOWERCASE" }]
                          PositionalConstraint: "EXACTLY"
                      - IPSetReferenceStatement:
                          ARN: arn:aws:wafv2:{{AWS_REGION}}:{{AWS_ACCOUNT_ID}}:regional/ipset/office-network-ipset/{{IPSET_ID_1}}
                - AndStatement:
                    Statements:
                      - ByteMatchStatement:
                          SearchString: "partner.example.com"
                          FieldToMatch: { SingleHeader: { Name: "host" } }
                          TextTransformations: [{ Priority: 0, Type: "LOWERCASE" }]
                          PositionalConstraint: "EXACTLY"
                      - IPSetReferenceStatement:
                          ARN: arn:aws:wafv2:{{AWS_REGION}}:{{AWS_ACCOUNT_ID}}:regional/ipset/partner-network-ipset/{{IPSET_ID_2}}
          Action:
            Allow: {}
```

---

### 🧱 7.2 JSON Builder (Equivalent)

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Domain and IPSet Routing Rule for example.com",
  "Resources": {
    "DomainAndIPSetRoutingRule": {
      "Type": "AWS::WAFv2::RuleGroup",
      "Properties": {
        "Name": "DomainAndIPSetRoutingRule",
        "Scope": "REGIONAL",
        "Capacity": 200,
        "VisibilityConfig": {
          "SampledRequestsEnabled": true,
          "CloudWatchMetricsEnabled": true,
          "MetricName": "DomainAndIPSetRoutingRule"
        },
        "Rules": [
          {
            "Name": "ExampleDomainRouting",
            "Priority": 0,
            "Statement": {
              "OrStatement": {
                "Statements": [
                  {
                    "AndStatement": {
                      "Statements": [
                        {
                          "ByteMatchStatement": {
                            "SearchString": "app.example.com",
                            "FieldToMatch": { "SingleHeader": { "Name": "host" } },
                            "TextTransformations": [{ "Priority": 0, "Type": "LOWERCASE" }],
                            "PositionalConstraint": "EXACTLY"
                          }
                        },
                        {
                          "IPSetReferenceStatement": {
                            "ARN": "arn:aws:wafv2:{{AWS_REGION}}:{{AWS_ACCOUNT_ID}}:regional/ipset/office-network-ipset/{{IPSET_ID_1}}"
                          }
                        }
                      ]
                    }
                  },
                  {
                    "AndStatement": {
                      "Statements": [
                        {
                          "ByteMatchStatement": {
                            "SearchString": "partner.example.com",
                            "FieldToMatch": { "SingleHeader": { "Name": "host" } },
                            "TextTransformations": [{ "Priority": 0, "Type": "LOWERCASE" }],
                            "PositionalConstraint": "EXACTLY"
                          }
                        },
                        {
                          "IPSetReferenceStatement": {
                            "ARN": "arn:aws:wafv2:{{AWS_REGION}}:{{AWS_ACCOUNT_ID}}:regional/ipset/partner-network-ipset/{{IPSET_ID_2}}"
                          }
                        }
                      ]
                    }
                  }
                ]
              }
            },
            "Action": { "Allow": {} }
          }
        ]
      }
    }
  }
}
```

---

### 🧩 7.3 — Attach RuleGroup to WebACL

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Attach RuleGroup to WebACL for Shared ALB'

Resources:
  EKSWebACL:
    Type: AWS::WAFv2::WebACL
    Properties:
      Name: "EKS-WAF-ALB"
      Scope: REGIONAL
      DefaultAction: { Block: {} }
      VisibilityConfig:
        SampledRequestsEnabled: true
        CloudWatchMetricsEnabled: true
        MetricName: "EKS-WAF-ALB"
      Rules:
        - Name: "DomainAndIPSetRoutingRule"
          Priority: 0
          OverrideAction: { None: {} }
          Statement:
            RuleGroupReferenceStatement:
              Arn: arn:aws:wafv2:{{AWS_REGION}}:{{AWS_ACCOUNT_ID}}:regional/rulegroup/DomainAndIPSetRoutingRule/{{RULEGROUP_ID}}
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: "DomainAndIPSetRoutingRule"
```

---

## 8. Verification & Testing

```bash
# Verify ALB
kubectl get ingress -A | grep alb

# Check Logs
aws s3 ls s3://{{ACCESS_LOG_BUCKET}}/AWSLogs/{{AWS_ACCOUNT_ID}}/

# Validate WAF
aws wafv2 get-web-acl --name EKS-WAF-ALB --scope REGIONAL
```

---

## 9. Troubleshooting

| Issue           | Resolution Command                                                | Notes                      |
| --------------- | ----------------------------------------------------------------- | -------------------------- |
| ALB not visible | `kubectl logs -n kube-system deploy/aws-load-balancer-controller` | Check IAM or subnet config |
| 403 Forbidden   | Inspect WAF logs in CloudWatch                                    | Verify IPSet references    |
| 404 Not Found   | Validate backend Service health                                   | Target group issue         |

---

## ✅ Summary

| Step | Description                    |
| ---- | ------------------------------ |
| 1    | Export Ingress and CIDRs       |
| 2    | Plan shared ALB setup          |
| 3    | Modify Ingress for shared ALB  |
| 4    | Configure AWS WAF with IP sets |
| 5    | Attach WAF to ALB              |
| 6    | Validate and test end-to-end   |
