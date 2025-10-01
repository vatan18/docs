# Renew SSL Certificate with Ingress

## Process
1. [Verify Jetstack Helm repository is added](#verify-jetstack-helm-repository-is-added)
2. [Verify the ClusterIssuer is present](#verify-the-clusterissuer-is-present)
3. [Verify Secret, Certificate, and CertificateRequest](#verify-secret-certificate-and-certificaterequest)
4. [Create Certificate Resource](#create-certificate-resource)
5. [Create Ingress with TLS Configuration](#create-ingress-with-tls-configuration)

## Verify Jetstack Helm repository is added
```sh
helm repo list | grep jetstack || (helm repo add jetstack https://charts.jetstack.io && helm repo update)
```

## Verify the ClusterIssuer is present
```sh
kubectl get clusterissuer letsencrypt-dns-cloudflare -o yaml
```
If the ClusterIssuer is missing, follow the steps in the initial SSL setup to create it.

## Create Certificate Resource
```yaml
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: example-tls-cert
  namespace: cert-manager
spec:
  secretName: example-tls-secret
  issuerRef:
    name: letsencrypt-dns-cloudflare
    kind: ClusterIssuer
  dnsNames:
    - example.com
    - '*.example.com'  # Wildcard certificate
```
Apply the certificate configuration:
```sh
kubectl apply -f certificate.yaml
```

## Create Ingress with TLS Configuration
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: your-app-ingress
  annotations:
    # Specify the DNS challenge issuer
    cert-manager.io/cluster-issuer: letsencrypt-dns-cloudflare
    # Optional: Traefik specific annotations
    traefik.ingress.kubernetes.io/router.entrypoints: websecure
    traefik.ingress.kubernetes.io/router.tls: "true"
spec:
  ingressClassName: traefik
  tls:
  - hosts:
    - example.com
    - '*.example.com'  # Wildcard certificate
    secretName: example-tls-secret
  rules:
  - host: example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: your-service
            port:
              number: 80
```
Apply the ingress configuration:
```sh
kubectl apply -f ingress.yaml
```

## Verify Secret, Certificate, and CertificateRequest
Check if the secret exists:
```sh
kubectl get secret -n cert-manager
```

Check the certificate status:
```sh
kubectl get certificate -n cert-manager
kubectl describe certificate <certificate-name> -n cert-manager
```

Check the CertificateRequest:
```sh
kubectl get certificaterequest -n cert-manager
kubectl describe certificaterequest <certificate-request-name> -n cert-manager
```

## Manual Certificate Renewal
If needed, manually trigger renewal:
```sh
kubectl annotate certificate example-tls-cert cert-manager.io/renew-before=10m
```

