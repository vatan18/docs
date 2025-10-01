'''Summary:
Bottlerocket AMI:

Optimized for containers, minimal OS focused on performance.

Comes in x86_64 (Intel/AMD) and arm64 (Graviton) versions.

Best for container-only workloads in EKS.

EKS Optimized AMI:

Based on Amazon Linux 2, optimized for Kubernetes workloads in EKS.

Supports both x86_64 and arm64 versions.

Suitable for more general workloads beyond just containers.
cli command - 
aws ssm get-parameter --region us-east-1 --name "/aws/service/bottlerocket/aws-k8s-1.32/x86_64/latest/image_id" --query Parameter.Value --output text
ami-0b6ef2ef3518ddbba
aws ssm get-parameter \
  --region us-east-1 \
  --name "/aws/service/bottlerocket/aws-k8s-1.32/arm64/latest/image_id" \
  --query "Parameter.Value" \
  --output text
ami-0d6fdf644c07969ee


AWS-Codebuild 
Container Runtime:
AWS CodeBuild offers several standard container runtimes you can choose based on your architecture:

ARM64 (Graviton-based):

aws/codebuild/amazonlinux-aarch64-standard:2.0

aws/codebuild/amazonlinux-aarch64-standard:3.0

x86_64 (Intel/AMD):

aws/codebuild/amazonlinux-x86_64-standard:4.0

aws/codebuild/amazonlinux-x86_64-standard:5.0

aws/codebuild/amazonlinux-x86_64-standard:corretto11

aws/codebuild/amazonlinux-x86_64-standard:corretto8

Dockerfile Changes for Alpine 20:
Here's how you can modify the Dockerfile to use Alpine 20 and update the architecture to ARM64 (--platform=linux/arm64):

Dockerfile
Copy
Edit
# Use Alpine 20 as the base image
FROM --platform=linux/arm64 node:18-alpine20 as build

# Install build dependencies
RUN apk update && apk add --no-cache build-base gcc autoconf automake zlib-dev libpng-dev vips-dev git > /dev/null 2>&1

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /opt/

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install global npm packages
RUN npm install -g node-gyp

# Set retry timeout and install production dependencies
RUN npm config set fetch-retry-maxtimeout 600000 -g && npm install --only=production
ENV PATH /opt/node_modules/.bin:$PATH

WORKDIR /opt/app

# Copy application files
COPY . .

# Run build command
RUN npm run build

# Final image setup
FROM --platform=linux/arm64 node:18-alpine20

RUN apk add --no-cache vips-dev

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /opt/

# Copy dependencies from the build stage
COPY --from=build /opt/node_modules ./node_modules

WORKDIR /opt/app

# Copy the application files from build stage
COPY --from=build /opt/app ./

# Update PATH
ENV PATH /opt/node_modules/.bin:$PATH

# Set ownership and user
RUN chown -R node:node /opt/app
USER node

EXPOSE 1337

CMD ["npm", "run", "start"]
Key Changes:
Base Image: alpine:20 is used to make the image smaller and more efficient.

ARM64: The --platform=linux/arm64 option ensures compatibility with ARM-based instances like AWS Graviton.

Docker Image: The Dockerfile uses multi-stage builds to minimize the final image size.

Key Takeaways:
Bottlerocket AMI is optimized for container workloads and can be used with either x86_64 or arm64 architecture.

EKS Optimized AMI supports a wider range of workloads but is less minimal than Bottlerocket.

'''
AWSTemplateFormatVersion: '2010-09-09'
Description: 'AWS EKS cluster with default node group and addons'
Parameters:
  environment:
    Type: String
    Description: Environment type
  product:
    Type: String
    Description: Product name
  service:
    Type: String
    Default: 'eks'
    Description: Service name
  storageSize:
    Type: Number
    Default: 80
    Description: Node disk size in GB 
  isProdEnv:
    Type: String
    Default: "false"
    AllowedValues: ["true", "false"]
    Description: Set to true for production-like environments
  isArm64:
    Type: String
    Default: "false"
    AllowedValues: ["true", "false"]
    Description: Set to true for ARM64 architecture, false for x86_64
  eksVersion:
    Type: String
    Default: '1.32'
    Description: EKS cluster version
  vpcCniVersion:
    Type: String
    Default: v1.19.3-eksbuild.1
  kubeProxyVersion:
    Type: String
    Default: v1.32.0-eksbuild.2
  coreDnsVersion:
    Type: String
    Default: v1.11.4-eksbuild.2 
  ebsCsiVersion:
    Type: String
    Default: v1.41.0-eksbuild.1
  podIdentityVersion:
    Type: String
    Default: v1.3.5-eksbuild.2 
Conditions:
  isProd: !Equals [!Ref isProdEnv, "true"]
  isArm64Architecture: !Equals [!Ref isArm64, "true"]
Mappings:
  default:
    dev:
      minSize: 1
      maxSize: 2
      desiredSize: 1
    prod:
      minSize: 2
      maxSize: 4
      desiredSize: 2
Resources:
  eksClusterRole:
    Type: 'AWS::IAM::Role'
    Properties:
      RoleName: !Sub '${environment}-${product}-${service}-cluster-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: eks.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/AmazonEKSClusterPolicy'
  clusterAutoscalerPolicy:
    Type: 'AWS::IAM::ManagedPolicy'
    Properties:
      ManagedPolicyName: !Sub '${environment}-${product}-${service}-autoscaler-policy'
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Action:
              - 'autoscaling:DescribeAutoScalingGroups'
              - 'autoscaling:DescribeAutoScalingInstances'
              - 'autoscaling:DescribeLaunchConfigurations'
              - 'autoscaling:DescribeTags'
              - 'autoscaling:SetDesiredCapacity'
              - 'autoscaling:TerminateInstanceInAutoScalingGroup'
              - 'ec2:DescribeLaunchTemplateVersions'
              - 'ec2:DescribeInstances'
              - 'ec2:DescribeInstanceTypes'
              - 'ec2:DescribeImages'
              - 'ec2:GetInstanceTypesFromInstanceRequirements'
            Resource: '*'
  workerNodeInstanceRole:
    Type: 'AWS::IAM::Role'
    Properties:
      RoleName: !Sub '${environment}-${product}-${service}-node-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy'
        - 'arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy'
        - 'arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly'
        - 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
        - !Ref clusterAutoscalerPolicy
  eksSecurityGroup:
    Type: 'AWS::EC2::SecurityGroup'
    Properties:
      GroupDescription: 'Security group for EKS cluster allowing only VPC CIDR'
      VpcId: !ImportValue 
        'Fn::Sub': '${environment}-${product}-vpc'
      SecurityGroupIngress:
        -
          IpProtocol: -1
          FromPort: 0
          ToPort: 65535
          CidrIp: 10.94.0.0/16
        -
          IpProtocol: -1
          FromPort: 0
          ToPort: 65535
          CidrIp: 10.95.0.0/16
        -
          IpProtocol: -1
          FromPort: 0
          ToPort: 65535
          CidrIp: 10.96.0.0/16
  eksCluster:
    Type: 'AWS::EKS::Cluster'
    Properties:
      Name: !Sub '${environment}-${product}-${service}'
      Version: !Ref eksVersion
      RoleArn: !GetAtt eksClusterRole.Arn
      ResourcesVpcConfig:
        SecurityGroupIds:
          - !Ref eksSecurityGroup
        SubnetIds:
          - !ImportValue
              Fn::Sub: '${environment}-${product}-vpc-private-subnet-a'
          - !ImportValue
              Fn::Sub: '${environment}-${product}-vpc-private-subnet-b'
          - !ImportValue
              Fn::Sub: '${environment}-${product}-vpc-private-subnet-c'
        EndpointPublicAccess: false
        EndpointPrivateAccess: true
  eksNodeGroup:
    Type: 'AWS::EKS::Nodegroup'
    DependsOn: eksCluster
    Properties:
      ClusterName: !Ref eksCluster
      NodegroupName: !Sub '${environment}-${product}-${service}-default'
      NodeRole: !GetAtt workerNodeInstanceRole.Arn
      ScalingConfig:
        MinSize: !FindInMap [default, !Ref environment, minSize]
        MaxSize: !FindInMap [default, !Ref environment, maxSize]
        DesiredSize: !FindInMap [default, !Ref environment, desiredSize]
      Subnets:
        - !ImportValue
            Fn::Sub: '${environment}-${product}-vpc-private-subnet-a'
        - !ImportValue
            Fn::Sub: '${environment}-${product}-vpc-private-subnet-b'
        - !ImportValue
            Fn::Sub: '${environment}-${product}-vpc-private-subnet-c'
      # AMI Type based on CPU architecture
      AmiType: !If [isArm64Architecture, 'AL2_ARM_64', 'AL2_x86_64']
      DiskSize: !Ref storageSize
      # Instance types based on both environment and CPU architecture
      InstanceTypes: 
        !If
          - isProd
          - !If
              - isArm64Architecture
              - [m6g.xlarge, m6gd.large]  # Prod + ARM64
              - [t3a.xlarge]              # Prod + x86_64
          - !If
              - isArm64Architecture
              - [t4g.medium, t4g.large]   # Non-Prod + ARM64
              - [m4.large, m5.large, m5a.large, t2.large, t3.large, t3a.large, m5ad.large, m5d.large, m6a.large, m6i.large, m6in.large, m7i.large]  # Non-Prod + x86_64
      # Capacity type based on environment
      CapacityType: !If [isProd, 'ON_DEMAND', 'SPOT']
  vpcCniAddon:
    Type: 'AWS::EKS::Addon'
    DependsOn: eksNodeGroup
    Properties:
      AddonName: vpc-cni
      ClusterName: !Ref eksCluster
      AddonVersion: !Ref vpcCniVersion
      ResolveConflicts: PRESERVE
  kubeProxyAddon:
    Type: 'AWS::EKS::Addon'
    DependsOn: eksNodeGroup
    Properties:
      AddonName: kube-proxy
      ClusterName: !Ref eksCluster
      AddonVersion: !Ref kubeProxyVersion
      ResolveConflicts: PRESERVE
  coreDnsAddon:
    Type: 'AWS::EKS::Addon'
    DependsOn: eksNodeGroup
    Properties:
      AddonName: coredns
      ClusterName: !Ref eksCluster
      AddonVersion: !Ref coreDnsVersion
      ResolveConflicts: PRESERVE
  ebsCsiDriverRole:
    Type: 'AWS::IAM::Role'
    Properties:
      RoleName: !Sub '${environment}-${product}-${service}-ebs-csi-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy'
  ebsCsiAddon:
    Type: 'AWS::EKS::Addon'
    DependsOn: eksNodeGroup
    Properties:
      AddonName: aws-ebs-csi-driver
      ClusterName: !Ref eksCluster
      AddonVersion: !Ref ebsCsiVersion
      ResolveConflicts: PRESERVE
      ServiceAccountRoleArn: !GetAtt ebsCsiDriverRole.Arn
  podIdentityAgentAddon:
    Type: 'AWS::EKS::Addon'
    DependsOn: eksNodeGroup
    Properties:
      AddonName: eks-pod-identity-agent
      ClusterName: !Ref eksCluster
      AddonVersion: !Ref podIdentityVersion
      ResolveConflicts: PRESERVE
Outputs:
  eksClusterEndpoint:
    Description: 'The endpoint for your EKS Kubernetes API'
    Value: !GetAtt eksCluster.Endpoint
'''    