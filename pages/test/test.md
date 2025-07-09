---
# Source: strapi/templates/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: strapi
  labels:
    helm.sh/chart: strapi-0.1.1
    app.kubernetes.io/name: strapi
    app.kubernetes.io/instance: strapi
    app.kubernetes.io/version: "1.16.0"
    app.kubernetes.io/managed-by: Helm
spec:
  type: ClusterIP
  ports:
    - port: 80
      targetPort: 1337
      protocol: TCP
      name: "1337"
  selector:
    app.kubernetes.io/name: strapi
    app.kubernetes.io/instance: strapi
---
# Source: strapi/templates/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: strapi
  labels:
    helm.sh/chart: strapi-0.1.1
    app.kubernetes.io/name: strapi
    app.kubernetes.io/instance: strapi
    app.kubernetes.io/version: "1.16.0"
    app.kubernetes.io/managed-by: Helm
spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 25%
      maxSurge: 25%
  selector:
    matchLabels:
      app.kubernetes.io/name: strapi
      app.kubernetes.io/instance: strapi
  template:
    metadata:
      labels:
        app.kubernetes.io/name: strapi
        app.kubernetes.io/instance: strapi
    spec:
      serviceAccountName: default
      securityContext:
        {}
      volumes:
        - name: strapi-data
          persistentVolumeClaim:
            claimName: strapi-pvc
      containers:
        - name: strapi
          securityContext:
            {}
          image: ":latest"
          imagePullPolicy: Always
          terminationMessagePath: "/tmp/my-log"
          volumeMounts:
            - name: strapi-data
              mountPath: /srv/app
          ports:
            - name: http
              containerPort: 1337
              protocol: TCP
          env:
            - name: HOST
              value: "0.0.0.0"
            
          livenessProbe:
            httpGet:
              path: /admin
              port: http
            initialDelaySeconds: 60
            periodSeconds: 10
            timeoutSeconds: 5
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: /admin
              port: http
            initialDelaySeconds: 30
            periodSeconds: 10
            timeoutSeconds: 3
            failureThreshold: 3
          resources:
            null
---
# Source: strapi/templates/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: strapi
  labels:
    helm.sh/chart: strapi-0.1.1
    app.kubernetes.io/name: strapi
    app.kubernetes.io/instance: strapi
    app.kubernetes.io/version: "1.16.0"
    app.kubernetes.io/managed-by: Helm
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: strapi
  minReplicas: 2
  maxReplicas: 5
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 75
---
# Source: strapi/templates/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: strapi
  labels:
    helm.sh/chart: strapi-0.1.1
    app.kubernetes.io/name: strapi
    app.kubernetes.io/instance: strapi
    app.kubernetes.io/version: "1.16.0"
    app.kubernetes.io/managed-by: Helm
  annotations:
    nginx.ingress.kubernetes.io/enable-cors: "true"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  rules:
    - host: "dev-strapi.ionsport.com"
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: strapi
                port:
                  number: 80
---
# Source: strapi/templates/tests/test-connection.yaml
apiVersion: v1
kind: Pod
metadata:
  name: "strapi-test-connection"
  labels:
    helm.sh/chart: strapi-0.1.1
    app.kubernetes.io/name: strapi
    app.kubernetes.io/instance: strapi
    app.kubernetes.io/version: "1.16.0"
    app.kubernetes.io/managed-by: Helm
  annotations:
    "helm.sh/hook": test-success
spec:
  containers:
    - name: wget
      image: busybox
      command: ['wget']
      args: ['strapi:80']
  restartPolicy: Never
