# 🧠 HTTP Status Code Debugging Playbook (All Codes with Commands)

This guide helps DevOps and developers debug **any HTTP status code (1xx–5xx)**  
with ready-to-use **commands and verification steps** across environments — UAT, staging, or production.

---

## 📘 Table of Contents

1. [Overview](#overview)
2. [Quick Reference Table](#quick-reference-table)
3. [Debugging by Category](#debugging-by-category)
   - [1xx — Informational](#1xx--informational)
   - [2xx — Success](#2xx--success)
   - [3xx — Redirection](#3xx--redirection)
   - [4xx — Client Errors](#4xx--client-errors)
   - [5xx — Server Errors](#5xx--server-errors)
4. [Application-Level Debugging](#application-level-debugging)
5. [Infrastructure-Level Debugging](#infrastructure-level-debugging)
6. [Best Practices](#best-practices)
7. [Incident Template](#incident-template)
8. [Command Summary](#command-summary)

---

## 🧩 Overview

HTTP status codes provide quick insight into system behavior.  
Each section includes **sample commands** and **confirmation checks** to identify the cause quickly.

---

## ⚡ Quick Reference Table

| Category | Code Range | Meaning | Common Tools |
|-----------|-------------|----------|---------------|
| **1xx** | 100–199 | Informational | `curl -v`, logs |
| **2xx** | 200–299 | Success | `curl`, `grep`, API logs |
| **3xx** | 300–399 | Redirection | `curl -I`, `grep Location` |
| **4xx** | 400–499 | Client Error | `curl -v`, `tcpdump`, app logs |
| **5xx** | 500–599 | Server Error | `kubectl logs`, `journalctl`, infra logs |

---

## 🧠 Debugging by Category

---

### 🟦 1xx — Informational

**Codes:** 100, 101, 102  
These are handshake or connection setup messages.

**Confirm with:**
```bash
curl -v https://example.com
````

**What to check:**

* For 101 Switching Protocols → Confirm WebSocket or HTTP/2 upgrade:

  ```bash
  curl -i -H "Connection: Upgrade" -H "Upgrade: websocket" https://example.com
  ```
* Usually no action is required unless connection stalls.

---

### 🟩 2xx — Success

**Codes:** 200, 201, 202, 204
Indicates successful response.

**Confirm response details:**

```bash
curl -i https://example.com/api/resource
```

**Debugging Steps:**

1. Validate response headers and body.

   ```bash
   curl -s -o /dev/null -w "%{http_code}\n" https://example.com
   ```
2. For **201 Created**:

   ```bash
   curl -X POST -d '{"name":"test"}' -H "Content-Type: application/json" https://example.com/api/create
   ```

   Check backend DB or S3 to confirm persistence.
3. For **204 No Content**, verify backend actually performed the intended action.

---

### 🟨 3xx — Redirection

**Codes:** 301, 302, 304, 307, 308

**Confirm redirect chain:**

```bash
curl -IL https://example.com
```

**Key checks:**

* `Location:` header shows new URL.
* Looping redirect? → Verify base URLs, HTTPS rules, or reverse proxy config.

**Check if HTTPS redirect is enforced:**

```bash
curl -I http://example.com
```

**Debugging Points:**

* Clear CDN or Cloudflare cache.
* Verify app’s redirect logic in code.
* Ensure relative URLs don’t cause loops.

---

### 🟥 4xx — Client Errors

**Codes:** 400, 401, 403, 404, 405, 408, 429

#### 🔹 400 Bad Request

```bash
curl -v -X POST -H "Content-Type: application/json" -d '{"bad":"json"' https://example.com/api
```

Check malformed payload or missing headers.

#### 🔹 401 Unauthorized

```bash
curl -v -H "Authorization: Bearer <token>" https://example.com/protected
```

Check token expiry and authentication backend.

#### 🔹 403 Forbidden

```bash
curl -v https://example.com
```

Check:

* IAM/WAF rules
* App-level ACL/RBAC
* File or directory permissions

#### 🔹 404 Not Found

```bash
curl -I https://example.com/wrongpath
```

Validate the path in code or routes.

#### 🔹 405 Method Not Allowed

```bash
curl -X PUT https://example.com/api/endpoint
```

Then:

```bash
curl -i -X OPTIONS https://example.com/api/endpoint
```

→ Look at the `Allow:` header for permitted methods.

#### 🔹 408 Request Timeout

Increase timeout:

```bash
curl -m 60 -v https://example.com
```

Check server performance, slow queries, or LB timeout settings.

#### 🔹 429 Too Many Requests

```bash
curl -v https://example.com
```

Inspect headers:

```
Retry-After: 30
```

→ Implement backoff or increase API rate limit.

---

### ⛔ 5xx — Server Errors

**Codes:** 500, 502, 503, 504, 507, 511

#### 🔹 500 Internal Server Error

```bash
curl -v https://example.com
kubectl logs <pod-name> | tail -n 50
```

Check for stack traces or unhandled exceptions.

#### 🔹 502 Bad Gateway

```bash
curl -vk https://example.com
```

* Check upstream server connectivity.
* Validate reverse proxy config (Nginx, Envoy, ALB).

#### 🔹 503 Service Unavailable

```bash
kubectl get pods -A | grep <service-name>
kubectl describe pod <pod>
```

* Pod crash, scaling issue, or deployment rolling restart.

#### 🔹 504 Gateway Timeout

```bash
curl -m 5 -v https://example.com
```

Then check backend:

```bash
telnet backend-service 8080
```

→ May indicate DB/API latency.

#### 🔹 507 Insufficient Storage

```bash
df -h
du -sh /var/log/*
```

Free up disk space or increase EBS volume.

#### 🔹 511 Network Authentication Required

Check proxy/firewall restrictions:

```bash
curl -v --proxy http://proxy.example.com https://example.com
```

---

## 🧱 Application-Level Debugging

1. **Check Logs**

   ```bash
   tail -f /var/log/app.log
   ```
2. **Check Environment Variables**

   ```bash
   printenv | grep <keyword>
   ```
3. **Verify Config Files**

   ```bash
   cat /etc/nginx/sites-enabled/default
   ```
4. **Database & API health**

   ```bash
   curl http://localhost:8080/health
   ```

---

## ☁️ Infrastructure-Level Debugging

1. **Pods / Containers**

   ```bash
   kubectl get pods -A
   kubectl logs <pod> --tail=100
   ```
2. **Service & Network**

   ```bash
   kubectl get svc -A
   kubectl describe svc <service>
   ```
3. **DNS Resolution**

   ```bash
   dig example.com
   ```
4. **Firewall / Security Group**

   ```bash
   sudo iptables -L
   aws ec2 describe-security-groups --region <region>
   ```

---

## 🧩 Best Practices (**Most important starts with this always**)

* Always start debugging with:

  ```bash
  curl -v https://service.domain.com
  ```
* Add correlation IDs in logs.
* Monitor using APM tools (Datadog, New Relic, Prometheus).
* Enable access & error logs for all web tiers.
* Automate synthetic checks every 5–15 minutes.

```bash
curl -k -H "Host: vendorportaluat.example.com" https://k8s-sharedalb-045.ap-south-1.elb.amazonaws.com
```
### ⚙️ Breakdown of Parameters:

| Flag                                                                      | Meaning                                                | What it Helps Debug                                                                                                    |
| ------------------------------------------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `-k`                                                                      | **Ignore SSL verification** (accept self-signed certs) | Confirms HTTPS connection even if your ALB has invalid or staging certs                                                |
| `-H "Host: vendorportaluat.example.com"`                               | **Overrides the HTTP Host header**                     | Simulates a request as if it was going to `vendorportaluat.example.com` while directly hitting the **ALB DNS name** |
| `https://k8s-sharedalb-bc078dd908-169625045.ap-south-1.elb.amazonaws.com` | Actual **ALB endpoint**                                | Bypasses Route53/DNS and checks whether ALB → Ingress → Service → Pod routing works                                    |

### 🧠 Why & When You Use It

✅ **DNS Bypass Test:**
Checks if problem is DNS or ingress.
If this works (200 OK) but your domain fails, DNS or WAF might be the issue.

### ⚡ Expected Outputs & Quick Read Guide

| Output Type                       | What It Means                               | Action                                                  |
| --------------------------------- | ------------------------------------------- | ------------------------------------------------------- |
| `curl: (7) Failed to connect`     | ALB DNS unreachable                         | Check ALB security groups / NACL / VPC endpoint         |
| `curl: (35) SSL connect error`    | TLS handshake issue                         | Check SSL cert, listener protocol (HTTPS/HTTP mismatch) |
| `HTTP/1.1 404 Not Found`          | Ingress rule mismatch (Host/path not found) | Check ingress `spec.rules.host`                         |
| `HTTP/1.1 403 Forbidden`          | WAF, Auth, or IP restrictions               | Check WAF ACLs, auth filters                            |
| `HTTP/1.1 405 Method Not Allowed` | Backend app not handling HTTP method        | Inspect API route and method                            |
| `HTTP/1.1 200 OK`                 | Success                                     | Backend and ingress routing is good                     |

---

### 🚀 Fast Reading Tips for Debugging

When you run:

```bash
curl -vk -H "Host: vendorportaluat.example.com" https://k8s-sharedalb-bc078dd908-169625045.ap-south-1.elb.amazonaws.com
```

* **Look for these instantly:**

  1. `* Connected to ...` → means network path works ✅
  2. `> Host:` → confirms Host header override applied correctly
  3. `< HTTP/1.1 ...` or `< HTTP/2 ...` → look here for the **status code**
  4. `< Server:` or `< x-powered-by:` → confirms backend reached (Node.js/Express, Nginx, etc.)
  5. `content-length` or `content-type` → shows app actually returned content

If it stops **before `< HTTP`**, your request didn’t reach app (network, WAF, or TLS issue).


Here’s a **complete reference guide**:
👉 **`curl -vk` & `curl -k -H "Host: ..."`** — example outputs for **every common case (200–599)**
plus what they mean and how to fix them **fast**.

---

## 🧾 cURL Output Examples — All Cases & Meanings

### ✅ 200 — OK (Everything Working)

**Command:**

```bash
curl -vk -H "Host: vendorportaluat.bikebazaar.com" https://k8s-sharedalb-...elb.amazonaws.com
```

**Output (sample):**

```
* Connected to k8s-sharedalb-bc078dd908-...ap-south-1.elb.amazonaws.com (13.232.xx.xx)
> GET / HTTP/2
> Host: vendorportaluat.bikebazaar.com
< HTTP/2 200
< content-type: text/html; charset=UTF-8
< x-powered-by: Express
< cache-control: public, max-age=0
```

🧠 **Interpretation:**

* ALB → Ingress → Service → Pod → App all working ✅
* SSL valid, Host matched, app responded.
  ✅ **No action needed.**

---

### 🟢 201 — Created (API Success)

**Output:**

```
< HTTP/1.1 201 Created
< content-type: application/json
< location: /api/user/123
```

🧠 **Interpretation:**

* Backend API successfully created resource.
  ✅ Indicates healthy backend logic.

---

### ⚠️ 301 / 302 — Redirect (Unexpected or Loop)

**Output:**

```
< HTTP/1.1 302 Found
< location: https://vendorportaluat.bikebazaar.com/login
```

🧠 **Interpretation:**

* Redirect due to auth/login.
* If infinite redirects (`curl -L` keeps looping) → misconfigured `BASE_URL` or HTTPS redirect rule.
  🔧 **Check:**
  Ingress annotations (`nginx.ingress.kubernetes.io/force-ssl-redirect`) or app’s redirect base URL.

---

### 🟠 400 — Bad Request

**Output:**

```
< HTTP/1.1 400 Bad Request
< server: awselb/2.0
```

🧠 **Interpretation:**

* ALB didn’t like request syntax or invalid Host header.
* Sometimes seen if SSL listener expects HTTPS but sent HTTP.
  🔧 **Check:**
  `curl -vk` scheme (use `https://` not `http://`)
  Ingress `host` rule spelling.

---

### 🚫 401 — Unauthorized

**Output:**

```
< HTTP/1.1 401 Unauthorized
< www-authenticate: Basic realm="Restricted"
```

🧠 **Interpretation:**

* Auth token, API key, or basic auth missing/invalid.
  🔧 **Check:**
  Add header:

```bash
-H "Authorization: Bearer <token>"
```

---

### 🔒 403 — Forbidden

**Output:**

```
< HTTP/1.1 403 Forbidden
< x-amzn-waf-action: BLOCK
< x-cache: Miss from cloudfront
```

🧠 **Interpretation:**

* WAF rule blocked request or IAM / ALB SG restricted source IP.
  🔧 **Check:**
* WAF logs (blocked rule ID)
* Security group ingress rules
* If WAF → go to **AWS WAF → Web ACL → Sampled Requests**

---

### ❌ 404 — Not Found

**Output:**

```
< HTTP/1.1 404 Not Found
< server: nginx/1.21.6
< content-length: 162
```

🧠 **Interpretation:**

* Host/path not matching ingress rule.
  🔧 **Check:**

```bash
kubectl get ingress -A | grep vendorportaluat
kubectl describe ingress <name>
```

Make sure:

```yaml
spec:
  rules:
  - host: vendorportaluat.bikebazaar.com
    http:
      paths:
      - path: /
        backend:
          service:
            name: vendorportal-service
```

---

### ⚔️ 405 — Method Not Allowed

**Output:**

```
< HTTP/1.1 405 Method Not Allowed
< allow: GET, POST
```

🧠 **Interpretation:**

* Backend route doesn’t handle the HTTP method (e.g., PUT or DELETE).
  🔧 **Check:**
  App route definitions / API gateway method mappings.

---

### 🔍 408 — Request Timeout

**Output:**

```
curl: (28) Operation timed out after 5000 milliseconds with 0 bytes received
```

🧠 **Interpretation:**

* ALB target group or service timed out waiting for backend response.
  🔧 **Check:**
* Pod logs
* Target group health check path
* Network latency / SG rules

---

### ⚠️ 429 — Too Many Requests

**Output:**

```
< HTTP/1.1 429 Too Many Requests
< retry-after: 30
```

🧠 **Interpretation:**

* Rate limiting (WAF, API gateway, or backend throttle).
  🔧 **Check:**
  Rate-limit policies or backend connection pool saturation.

---

### 💀 500 — Internal Server Error

**Output:**

```
< HTTP/1.1 500 Internal Server Error
< x-powered-by: Express
```

🧠 **Interpretation:**

* Request reached backend but failed.
  🔧 **Check:**
  Pod logs:

```bash
kubectl logs <pod-name> -n <namespace> | tail -n 50
```

---

### 💣 502 — Bad Gateway

**Output:**

```
< HTTP/1.1 502 Bad Gateway
< server: awselb/2.0
```

🧠 **Interpretation:**

* ALB received response but target (Ingress or Service) failed to respond properly.
  🔧 **Check:**
* Ingress Controller logs (`kubectl logs -n ingress-nginx`)
* Target group health check failing

---

### ⚡ 503 — Service Unavailable

**Output:**

```
< HTTP/1.1 503 Service Unavailable
< server: awselb/2.0
```

🧠 **Interpretation:**

* ALB can’t find healthy backend targets.
  🔧 **Check:**

```bash
aws elbv2 describe-target-health --target-group-arn <arn>
```

If `TargetHealthState=unhealthy` → fix health check or app crash.

---

### ⛔ 504 — Gateway Timeout

**Output:**

```
curl: (28) Operation timed out after 30000 milliseconds
```

🧠 **Interpretation:**

* Backend took too long to respond.
  🔧 **Check:**
* Application latency (pod logs)
* ALB idle timeout
* Network connectivity

---

### 💥 526 — Invalid SSL Certificate (CloudFront / ALB)

**Output:**

```
< HTTP/1.1 526 Invalid SSL certificate
```

🧠 **Interpretation:**

* SSL cert on origin invalid or expired.
  🔧 **Check:**

```bash
openssl s_client -connect vendorportaluat.bikebazaar.com:443 -showcerts
```

---

### 🚨 Fast Read Strategy (During Live Debugging)

When reading curl output:

| Look For                         | Meaning                             |
| -------------------------------- | ----------------------------------- |
| `* Connected to`                 | Network path works                  |
| `> Host:`                        | Host header override applied        |
| `< HTTP/...`                     | Status code → primary diagnosis     |
| `< x-powered-by:`                | Reached app backend                 |
| `* SSL connection using TLSv1.3` | SSL handshake successful            |
| No `< HTTP` but timeout          | Network or WAF issue before backend |



## ⚙️ Command Summary

| Purpose           | Command                                        |
| ----------------- | ---------------------------------------------- |
| Test endpoint     | `curl -vk https://url` (First command to use)  |
| Bypass dns mapping| 'curl -k -H "Host: vendorportaluat.example.com" https://k8s-alb.ap-south-1.elb.amazonaws.com |
| Get headers only  | `curl -I https://url`                          |
| Follow redirects  | `curl -L https://url`                          |
| Inspect DNS       | `dig domain.com`                               |
| Trace route       | `traceroute domain.com`                        |
| Check pod logs    | `kubectl logs <pod>`                           |
| Describe pod      | `kubectl describe pod <pod>`                   |
| Disk usage        | `df -h`                                        |
| File size summary | `du -sh *`                                     |
| Nginx reload      | `sudo nginx -t && sudo systemctl reload nginx` |
| System logs       | `journalctl -xe`                               |
| CPU/mem usage     | `top` or `htop`                                |
