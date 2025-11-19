Awesome ask. Here’s a tight, production-style blueprint that uses **your VPC stack** + **EC2 in private subnets** + **Dockerized microservices** + **two NGINX layers** with **two ALBs (public & private)**:

* **3 microservices**:

  * `public-api` (Node.js) → exposed via **public ALB** → **external-nginx**
  * `orders-api` (Python/FastAPI) → internal only via **private ALB** → **internal-nginx**
  * `inventory-api` (Python/Flask) → internal only via **private ALB** → **internal-nginx**
* **External NGINX** (container) listens on **8080** (target for *public ALB*).
* **Internal NGINX** (container) listens on **8081** (target for *private ALB*).
* **EC2** in **private subnets** only; no public IP; outbound via your NAT instance.
* **Security**: Only ALB SGs can reach the EC2 SG on 8080/8081. No 0.0.0.0/0 to instances.
* **Central logging ready**: NGINX access/error + app logs to stdout → (later ship with CW agent/Fluent Bit).

---

# 1) Use your VPC (as-is)

First deploy your VPC stack (the YAML you shared).
We’ll **import** these outputs:

* `${environment}-${product}-${service}` (VpcId)
* `...-public-subnet-1/2` (for the public ALB)
* `...-private-subnet-1/2` (for the private ALB + EC2)

> Quick security tip: In your VPC template, **remove/limit the SSH (22) 0.0.0.0/0** rule from the generic SG. Prefer SSM Session Manager.

---

# 2) Infra add-on CloudFormation (ALBs, SGs, EC2 LT/ASG)

Create a **second stack** that references your VPC exports.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: Microservices on EC2 (private) with dual NGINX, public+private ALBs

Parameters:
  Env:
    Type: String
    AllowedValues: [staging, prod]
  Product:
    Type: String
    Default: test
  Service:
    Type: String
    Default: app
  InstanceType:
    Type: String
    Default: t3.small
  KeyName:
    Type: AWS::EC2::KeyPair::KeyName
    Default: ""  # empty -> prefer SSM; set only if you must use SSH

Mappings:
  AmiMap:
    ap-south-1:
      Linux: ami-0f58b397bc5c1f2e8  # Amazon Linux 2023 (example; update per region)

Resources:
  VpcId:
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub "/${Env}/${Product}/${Service}/vpc-id"
      Type: String
      Value: !ImportValue
        'Fn::Sub': '${Env}-${Product}-vpc'  # matches your VPC Output Export Name

  # Import actual values
  VpcLookup:
    Type: AWS::CloudFormation::CustomResource
    Version: "1.0"
    Properties:
      ServiceToken: "noop" # placeholder to allow Fn::ImportValue below without unused resource warning

  VPC:
    Type: AWS::EC2::VPC::Id
    Properties: {}

  # Subnets (adjust Export names to your outputs)
  PublicSubnet1:
    Type: AWS::EC2::Subnet::Id
    Properties: {}
  PublicSubnet2:
    Type: AWS::EC2::Subnet::Id
    Properties: {}
  PrivateSubnet1:
    Type: AWS::EC2::Subnet::Id
    Properties: {}
  PrivateSubnet2:
    Type: AWS::EC2::Subnet::Id
    Properties: {}

  # Security Groups
  AlbPublicSg:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Public ALB SG (80/443 from internet)
      VpcId: !ImportValue
        'Fn::Sub': '${Env}-${Product}-vpc'
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
      Tags: [{Key: Name, Value: !Sub '${Env}-${Product}-${Service}-alb-public-sg'}]

  AlbPrivateSg:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Private ALB SG (VPC-only)
      VpcId: !ImportValue
        'Fn::Sub': '${Env}-${Product}-vpc'
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: !FindInMap [envMap, !Ref Env, VpcCidrBlock]  # if available; else use VPC CIDR literal
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
      Tags: [{Key: Name, Value: !Sub '${Env}-${Product}-${Service}-alb-private-sg'}]

  AppInstanceSg:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: App EC2 SG (allow only from ALBs)
      VpcId: !ImportValue
        'Fn::Sub': '${Env}-${Product}-vpc'
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 8080         # external-nginx (public ALB -> EC2)
          ToPort: 8080
          SourceSecurityGroupId: !Ref AlbPublicSg
        - IpProtocol: tcp
          FromPort: 8081         # internal-nginx (private ALB -> EC2)
          ToPort: 8081
          SourceSecurityGroupId: !Ref AlbPrivateSg
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
      Tags: [{Key: Name, Value: !Sub '${Env}-${Product}-${Service}-app-sg'}]

  # Public ALB (internet-facing)
  PublicAlb:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Scheme: internet-facing
      Type: application
      Subnets:
        - !ImportValue
          'Fn::Sub': '${Env}-${Product}-vpc-public-subnet-1'
        - !ImportValue
          'Fn::Sub': '${Env}-${Product}-vpc-public-subnet-2'
      SecurityGroups: [!Ref AlbPublicSg]
      Tags: [{Key: Name, Value: !Sub '${Env}-${Product}-${Service}-alb-public'}]

  # Private ALB (internal)
  PrivateAlb:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Scheme: internal
      Type: application
      Subnets:
        - !ImportValue
          'Fn::Sub': '${Env}-${Product}-vpc-private-subnet-1'
        - !ImportValue
          'Fn::Sub': '${Env}-${Product}-vpc-private-subnet-2'
      SecurityGroups: [!Ref AlbPrivateSg]
      Tags: [{Key: Name, Value: !Sub '${Env}-${Product}-${Service}-alb-private'}]

  # Target Groups (instance targets to ports on the EC2)
  TgExternalNginx:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      VpcId: !ImportValue
        'Fn::Sub': '${Env}-${Product}-vpc'
      Protocol: HTTP
      Port: 8080
      TargetType: instance
      HealthCheckPath: /healthz
      Matcher: { HttpCode: '200-399' }

  TgInternalNginx:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      VpcId: !ImportValue
        'Fn::Sub': '${Env}-${Product}-vpc'
      Protocol: HTTP
      Port: 8081
      TargetType: instance
      HealthCheckPath: /healthz
      Matcher: { HttpCode: '200-399' }

  # Listeners
  PublicAlbHttp:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref PublicAlb
      Port: 80
      Protocol: HTTP
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref TgExternalNginx

  # (Optional) HTTPS listener when you add ACM:
  # PublicAlbHttps:
  #   Type: AWS::ElasticLoadBalancingV2::Listener
  #   Properties:
  #     LoadBalancerArn: !Ref PublicAlb
  #     Port: 443
  #     Protocol: HTTPS
  #     Certificates: [{ CertificateArn: arn:aws:acm:... }]
  #     DefaultActions:
  #       - Type: forward
  #         TargetGroupArn: !Ref TgExternalNginx

  PrivateAlbHttp:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref PrivateAlb
      Port: 80
      Protocol: HTTP
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref TgInternalNginx

  # Launch Template + UserData to run Docker & compose
  AppLt:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateData:
        InstanceType: !Ref InstanceType
        ImageId: !FindInMap [AmiMap, !Ref "AWS::Region", Linux]
        IamInstanceProfile:
          Name: !Sub '${Env}-${Product}-${Service}-ec2-ssm'   # create separately: SSM + CW logs policy
        SecurityGroupIds: [!Ref AppInstanceSg]
        MetadataOptions:
          HttpTokens: required
        KeyName: !If [HasKey, !Ref KeyName, !Ref "AWS::NoValue"]
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            set -eux
            dnf -y update || yum -y update || true
            # Install docker & compose
            dnf -y install docker || yum -y install docker
            systemctl enable --now docker
            curl -L "https://github.com/docker/compose/releases/download/2.29.2/docker-compose-linux-x86_64" -o /usr/local/bin/docker-compose
            chmod +x /usr/local/bin/docker-compose

            mkdir -p /opt/micro && cd /opt/micro

            cat > docker-compose.yml <<'YAML'
            version: "3.9"
            services:
              public-api:
                image: node:20-alpine
                command: sh -c "node /srv/app.js"
                volumes:
                  - ./apps/public-api:/srv
                expose: ["3000"]

              orders-api:
                image: python:3.11-alpine
                working_dir: /srv
                command: sh -c "pip install -U pip && pip install fastapi uvicorn && uvicorn app:app --host 0.0.0.0 --port 8001"
                volumes:
                  - ./apps/orders-api:/srv
                expose: ["8001"]

              inventory-api:
                image: python:3.11-alpine
                working_dir: /srv
                command: sh -c "pip install -U pip && pip install flask && python app.py"
                volumes:
                  - ./apps/inventory-api:/srv
                expose: ["8002"]

              external-nginx:
                image: nginx:1.27-alpine
                ports:
                  - "8080:8080"   # target of PUBLIC ALB
                volumes:
                  - ./nginx/external.conf:/etc/nginx/conf.d/default.conf:ro
                healthcheck:
                  test: ["CMD-SHELL", "wget -qO- http://127.0.0.1:8080/healthz || exit 1"]
                  interval: 10s
                  timeout: 3s
                  retries: 3

              internal-nginx:
                image: nginx:1.27-alpine
                ports:
                  - "8081:8081"   # target of PRIVATE ALB
                volumes:
                  - ./nginx/internal.conf:/etc/nginx/conf.d/default.conf:ro
                healthcheck:
                  test: ["CMD-SHELL", "wget -qO- http://127.0.0.1:8081/healthz || exit 1"]
                  interval: 10s
                  timeout: 3s
                  retries: 3
            YAML

            mkdir -p apps/public-api apps/orders-api apps/inventory-api nginx

            # Node public-api (port 3000)
            cat > apps/public-api/app.js <<'NODE'
            const http = require('http');
            const server = http.createServer((req, res) => {
              if (req.url === '/healthz') { res.writeHead(200); return res.end('ok'); }
              res.writeHead(200, {'Content-Type': 'application/json'});
              res.end(JSON.stringify({service:'public-api', path:req.url}));
            });
            server.listen(3000, '0.0.0.0', () => console.log('public-api on 3000'));
            NODE

            # Python FastAPI orders-api (port 8001)
            cat > apps/orders-api/app.py <<'PY'
            from fastapi import FastAPI
            app = FastAPI()
            @app.get("/healthz")
            def health(): return "ok"
            @app.get("/orders")
            def orders(): return {"service":"orders-api","items":[{"id":1},{"id":2}]}
            PY

            # Python Flask inventory-api (port 8002)
            cat > apps/inventory-api/app.py <<'PY'
            from flask import Flask, jsonify
            app = Flask(__name__)
            @app.get("/healthz")
            def health(): return "ok"
            @app.get("/inventory")
            def inv(): return jsonify(service="inventory-api", items=[{"sku":"A"},{"sku":"B"}])
            if __name__ == "__main__":
              app.run(host="0.0.0.0", port=8002)
            PY

            # External NGINX (8080) -> public-api (3000)
            cat > nginx/external.conf <<'NGX'
            server {
              listen 8080;
              location /healthz { return 200 "ok"; add_header Content-Type text/plain; }
              location / {
                proxy_pass http://127.0.0.1:3000;
                proxy_set_header Host $host;
                proxy_set_header X-Real-IP $remote_addr;
              }
            }
            NGX

            # Internal NGINX (8081) -> private services
            cat > nginx/internal.conf <<'NGX'
            server {
              listen 8081;
              location /healthz { return 200 "ok"; add_header Content-Type text/plain; }
              location /orders/ {
                proxy_pass http://127.0.0.1:8001/;
                proxy_set_header Host $host;
                proxy_set_header X-Real-IP $remote_addr;
              }
              location /inventory/ {
                proxy_pass http://127.0.0.1:8002/;
                proxy_set_header Host $host;
                proxy_set_header X-Real-IP $remote_addr;
              }
            }
            NGX

            /usr/local/bin/docker-compose up -d

  AppAsg:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      VPCZoneIdentifier:
        - !ImportValue
          'Fn::Sub': '${Env}-${Product}-vpc-private-subnet-1'
        - !ImportValue
          'Fn::Sub': '${Env}-${Product}-vpc-private-subnet-2'
      MinSize: '1'
      MaxSize: '3'
      DesiredCapacity: '1'
      LaunchTemplate:
        LaunchTemplateId: !Ref AppLt
        Version: !GetAtt AppLt.LatestVersionNumber
      TargetGroupARNs:
        - !Ref TgExternalNginx
        - !Ref TgInternalNginx
      Tags:
        - Key: Name
          Value: !Sub '${Env}-${Product}-${Service}-app'
          PropagateAtLaunch: true

Outputs:
  PublicAlbDNS:
    Value: !GetAtt PublicAlb.DNSName
  PrivateAlbDNS:
    Value: !GetAtt PrivateAlb.DNSName
```

> Notes
> • Replace the `ImportValue` export names with the exact names from your VPC stack (I used illustrative ones).
> • Add an **EC2 Instance Profile** granting SSM + (optional) CloudWatch Logs if you’ll ship logs.
> • Add an **HTTPS listener** with an ACM certificate on the public ALB when ready.

---

# 3) How traffic maps (as you requested)

* **Public service (Node)**
  Internet → **Public ALB (80/443)** → **Target Group: TgExternalNginx (port 8080)** → **external-nginx** → `public-api:3000`

* **Private services (Python)**
  Internal callers (VPC/Peered VPC/VPN) → **Private ALB (80)** → **Target Group: TgInternalNginx (port 8081)** → **internal-nginx** →

  * `/orders/` → `orders-api:8001`
  * `/inventory/` → `inventory-api:8002`

This exactly matches “**2 LBs (public + private), external and internal NGINX, 1 public service + 2 private services**.”

---

# 4) Centralized logging (quick start)

* Keep stdout/stderr for all containers → later add **Fluent Bit** or **CloudWatch agent** as a sidecar that tails `/var/lib/docker/containers/*/*.log` and ships to **CloudWatch Logs** or **OpenSearch**.
* ALB access logs → enable to **S3** (per ALB attributes).
* Add **VPC Flow Logs** to S3/CW for network visibility.

---

# 5) Security guardrails (recap)

* Only **80/443** open on **public ALB**.
* **Private ALB** is `internal`, only reachable inside VPC.
* **EC2** opens **8080/8081** only to the **respective ALB SGs** (no public CIDR).
* Prefer **SSM Session Manager** over SSH.
* RDS/Redis/etc. in private subnets, SG allows only from **AppInstanceSg**.

---

If you want, I can tailor the **ImportValue names** to match your exact VPC exports, and add the **ACM HTTPS listener** + a tiny **Fluent Bit** block to push logs to CloudWatch.
