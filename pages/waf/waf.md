---

## 🔹 Rule: `DomainAndIPSetRoutingRule`

This rule is more **restrictive and conditional** than the previous one.

It doesn’t just check *domain names* —
it also checks *source IP addresses* using **IP sets**.

---

### 🧩 Rule structure overview

At a high level:

```json
"OrStatement": {
  "Statements": [
    { "AndStatement": { ... } },
    { "AndStatement": { ... } },
    { "AndStatement": { ... } },
    { "AndStatement": { ... } }
  ]
}
```

So there are **4 “AND” blocks**, combined using **OR**.

That means:

> If **any one** of those 4 blocks passes, the request is **allowed**.

Each **AND block** requires both:

1. The **Host header** to match one of the listed subdomains.
2. The **client IP** to be part of a specific **IPSet (allowed IP list)**.

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
{
  "Name": "DomainAndIPSetRoutingRule",
  "Priority": 0,
  "Statement": {
    "OrStatement": {
      "Statements": [
        {
          "AndStatement": {
            "Statements": [
              {
                "OrStatement": {
                  "Statements": [
                    {
                      "ByteMatchStatement": {
                        "SearchString": "chatbotserveruat.bikebazaar.com",
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
                        "SearchString": "chatbotportaluat.bikebazaar.com",
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
                        "SearchString": "idfcapiuat.bikebazaar.com",
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
                        "SearchString": "loscolenderapiuat.bikebazaar.com",
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
                        "SearchString": "brescorecardapiuat.bikebazaar.com",
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
                        "SearchString": "newbikebazaaruat.bikebazaar.com",
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
                        "SearchString": "bikebazaarappsuat.bikebazaar.com",
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
                        "SearchString": "gbluat.bikebazaar.com",
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
                        "SearchString": "gblbackenduat.bikebazaar.com",
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
                        "SearchString": "gblpaymentsuat.bikebazaar.com",
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
                        "SearchString": "ittestserver.bikebazaar.net",
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
                        "SearchString": "nachuat.bikebazaar.com",
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
                        "SearchString": "nachserveruat.bikebazaar.com",
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
                        "SearchString": "bbmuthootdisburalapiuat.bikebazaar.com",
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
                        "SearchString": "muthootcustomercollectionapiuat.bikebazaar.com",
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
                        "SearchString": "middlewareuateks.bikebazaar.com",
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
                        "SearchString": "painsuranceapiuat.bikebazaar.com",
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
                        "SearchString": "yubiapiuat.bikebazaar.com",
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
                        "SearchString": "authuat.bikebazaar.com",
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
                        "SearchString": "bbmandateintegrationsuat.bikebazaar.com",
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
                        "SearchString": "bbmandateintegrationscronuat.bikebazaar.com",
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
                        "SearchString": "sfdcdataapiuat.bikebazaar.com",
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
                        "SearchString": "ekycencryptionuat.bikebazaar.com",
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
                        "SearchString": "ekycapiuat.bikebazaar.com",
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
                        "SearchString": "ssfbapiuat.bikebazaar.com",
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
              {
                "IPSetReferenceStatement": {
                  "ARN": "arn:aws:wafv2:ap-south-1:444320815966:regional/ipset/alb-office-nw-uat/68207fcf-8fd7-442c-8c3d-ebe3c2e6d02d",
                  "IPSetForwardedIPConfig": {
                    "HeaderName": "X-Forwarded-For",
                    "FallbackBehavior": "MATCH",
                    "Position": "FIRST"
                  }
                }
              }
            ]
          }
        },
        {
          "AndStatement": {
            "Statements": [
              {
                "OrStatement": {
                  "Statements": [
                    {
                      "ByteMatchStatement": {
                        "SearchString": "businessrulesapiuat.bikebazaar.com",
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
                        "SearchString": "bbsfdcnewmiddlewareapiuat.bikebazaar.com",
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
              {
                "IPSetReferenceStatement": {
                  "ARN": "arn:aws:wafv2:ap-south-1:444320815966:regional/ipset/default-business-rules-api-uat/2286cd67-4632-42e5-9b06-97fd5e4e6ee7",
                  "IPSetForwardedIPConfig": {
                    "HeaderName": "X-Forwarded-For",
                    "FallbackBehavior": "MATCH",
                    "Position": "FIRST"
                  }
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
                  "SearchString": "digitaljourneyuat.bikebazaar.com",
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
                "IPSetReferenceStatement": {
                  "ARN": "arn:aws:wafv2:ap-south-1:444320815966:regional/ipset/default-digital-journey-backend-uat/1b3f7dec-0323-4612-981b-31034b09cbb4",
                  "IPSetForwardedIPConfig": {
                    "HeaderName": "X-Forwarded-For",
                    "FallbackBehavior": "MATCH",
                    "Position": "FIRST"
                  }
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
                  "SearchString": "finonelmsapiuat.bikebazaar.com",
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
                "IPSetReferenceStatement": {
                  "ARN": "arn:aws:wafv2:ap-south-1:444320815966:regional/ipset/default-finone-lms-api-uat/ba5e491e-8d59-4cf9-b067-73881b2e3a4f",
                  "IPSetForwardedIPConfig": {
                    "HeaderName": "X-Forwarded-For",
                    "FallbackBehavior": "MATCH",
                    "Position": "FIRST"
                  }
                }
              }
            ]
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
    "MetricName": "DomainAndIPSetRoutingRule"
  }
}
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
---

## 🧩 Let’s decode each “AndStatement”

---

### **1️⃣ ALB Office Network **

```json
"ARN": "arn:aws:wafv2:ap-south-1:ACCOUNT-ID:regional/ipset/alb-office-nw"
```

✅ Host must match any of ~25 allowed  domains like:

* chatbotserver.bikebazaar.com
* nach.bikebazaar.com
* middlewareeks.bikebazaar.com
* ekycapi.bikebazaar.com
  etc.

✅ AND source IP must be in the `alb-office-nw` IPSet.
This IPSet probably contains **office IP ranges**, so only office network users can reach these services.

---

### **2️⃣ Business Rules API **

```json
"ARN": "arn:aws:wafv2:ap-south-1:ACCOUNT-ID:regional/ipset/default-business-rules-api"
```

✅ Host matches either:

* `businessrulesapi.bikebazaar.com`
* `bbsfdcnewmiddlewareapi.bikebazaar.com`

✅ AND IP is in the **default-business-rules-api** IP set.

---

### **3️⃣ Digital Journey Backend **

```json
"ARN": "arn:aws:wafv2:ap-south-1:ACCOUNT-ID:regional/ipset/default-digital-journey-backend"
```

✅ Host = `digitaljourney.bikebazaar.com`
✅ AND IP from the **digital-journey-backend** IPSet.

---

### **4️⃣ FinOne LMS API **

```json
"ARN": "arn:aws:wafv2:ap-south-1:ACCOUNT-ID:regional/ipset/default-finone-lms-api"
```

✅ Host = `finonelmsapi.bikebazaar.com`
✅ AND IP from the **finone-lms-api** IPSet.

---

## 🧠 Combined logic (summary)

Here’s how both rules work together:

| Rule Name                     | Priority | Purpose                                                                                   | Logic Type                           | Result                  |
| ----------------------------- | -------- | ----------------------------------------------------------------------------------------- | ------------------------------------ | ----------------------- |
| **DomainAndIPSetRoutingRule** | 0        | Strict allowlist — allow access only if domain **AND** source IP match defined conditions | OR of multiple ANDs (domain + IPSet) | ✅ Allow                 |
| **AllowAlbOpenToAll**      | 1        | General allow for known  domains (based only on Host header)                           | OR of multiple domain matches        | ✅ Allow                 |
| *(default or later rules)*    | N/A      | Catch-all or managed AWS WAF rules (bad IPs, anonymous, etc.)                             | –                                    | 🚫 Block if not matched |

---

### ⚙️ How AWS WAF processes them

AWS WAF evales **rules in order of priority**:

1️⃣ **`DomainAndIPSetRoutingRule` (priority 0)**

* Checks both **domain** and **IP** together.
* If matched → **Allow immediately** (no further rules checked).

2️⃣ **`AllowAlbOpenToAll` (priority 1)**

* Checked **only if** previous rule didn’t match.
* Allows all known  domains **without IP restrictions** (useful for public endpoints).

3️⃣ If none match → next managed or custom rules (maybe block everything else).

---

### 🧩 Example flow

| Incoming Request                   | Host Header               | Source IP                 | Allowed By                | Result |
| ---------------------------------- | ------------------------- | ------------------------- | ------------------------- | ------ |
| chatbotserver.bikebazaar.com    | 10.0.5.2 (office IP)      | DomainAndIPSetRoutingRule | ✅ Allowed                 |        |
| chatbotserver.bikebazaar.com    | 103.x.x.x (public)        | AllowAlbOpenToAll      | ✅ Allowed                 |        |
| random.bikebazaar.com           | 103.x.x.x                 | (no rule matches)         | 🚫 Blocked                |        |
| businessrulesapi.bikebazaar.com | IP in business-rule IPSet | DomainAndIPSetRoutingRule | ✅ Allowed                 |        |
| businessrulesapi.bikebazaar.com | IP outside IPSet          | AllowAlbOpenToAll      | ✅ Allowed (via next rule) |        |

---

### 🔒 TL;DR Summary

| Concept                       | Explanation                                                                                                 |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **DomainAndIPSetRoutingRule** | Allows  domains only if both domain and source IP match specific IP sets (tighter access control).       |
| **AllowAlbOpenToAll**      | Allows known  domains regardless of IP (public-facing access).                                           |
| **Order matters**             | The first rule (priority 0) is checked first — if it matches, request is immediately allowed.               |
| **Others blocked**            | Anything not matching these hostnames (or blocked by managed rules) is denied by the WebACL default action. |

