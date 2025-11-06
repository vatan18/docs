**DevOps vs Developer debugging responsibility matrix** every cloud engineer should have in their toolkit.

Below is a **complete structured table** of all major **HTTP status codes (1xx–5xx)** divided into **two key sections**:

---

# 🧩 STATUS CODE TROUBLESHOOTING MATRIX

### For **DevOps/Cloud Engineers** vs **Developers (App Teams)**

---

## 🛰️ SECTION 1: NETWORKING / INFRASTRUCTURE SIDE (DevOps Focus)

| Status Code       | Meaning                 | Likely Root Cause (Infra/Network)                                | Who Looks First    | Common Fix Area                                                      |
| ----------------- | ----------------------- | ---------------------------------------------------------------- | ------------------ | -------------------------------------------------------------------- |
| **1xx (100–199)** | Informational responses | Rarely visible; ALB or Nginx handshake info                      | —                  | Ignore unless misconfigured proxy                                    |
| **301 / 302**     | Redirect                | Ingress redirect (HTTP→HTTPS) misconfigured or infinite loop     | DevOps             | Check Ingress annotations / `alb.ingress.kubernetes.io/ssl-redirect` |
| **400**           | Bad Request             | Request blocked by WAF, malformed header, proxy issue            | DevOps → Developer | Check ALB/WAF logs; validate JSON or Content-Type                    |
| **401**           | Unauthorized            | Missing/invalid authentication token                             | Developer          | Ensure API key or token is passed correctly                          |
| **403**           | Forbidden               | WAF rule blocking, IAM policy deny, security group block         | DevOps             | Check AWS WAF logs, ALB access logs, IAM permissions                 |
| **404**           | Not Found               | Ingress or Service path misconfigured, or pod not exposing route | DevOps             | Validate Ingress `path`, Service `targetPort`, app route             |
| **408**           | Request Timeout         | Slow backend or ALB timeout                                      | Both               | Increase ALB idle timeout, or fix app slowness                       |
| **409**           | Conflict                | Usually app-level (duplicate data)                               | Developer          | Handle duplicate resource logic                                      |
| **429**           | Too Many Requests       | WAF rate limit, ALB throttling, API Gateway burst limit          | DevOps             | Tune WAF rate limits or backend capacity                             |
| **502**           | Bad Gateway             | ALB cannot reach pod, Service port mismatch                      | DevOps             | Check Service `targetPort`, pod logs, health checks                  |
| **503**           | Service Unavailable     | Pod crashed, scaled to 0, or failing health check                | DevOps             | Check pod readiness/liveness, replicas, ALB health                   |
| **504**           | Gateway Timeout         | App too slow or network issue                                    | DevOps             | Increase ALB timeout or app performance                              |
| **5xx (502–504)** | Infra error             | Any upstream issue between ALB ↔ Ingress ↔ Service               | DevOps             | Network route, container health, scaling issues                      |

---

## 🧠 SECTION 2: APPLICATION SIDE (Developer Focus)

| Status Code | Meaning                | Likely Root Cause (App/Logic)                     | Who Looks First | Common Fix Area                                            |
| ----------- | ---------------------- | ------------------------------------------------- | --------------- | ---------------------------------------------------------- |
| **200**     | OK                     | Success                                           | —               | —                                                          |
| **201**     | Created                | Successful POST                                   | —               | —                                                          |
| **204**     | No Content             | Successful DELETE/PUT                             | —               | —                                                          |
| **400**     | Bad Request            | Invalid payload, JSON parse error, missing fields | Developer       | Validate request schema, use proper error handling         |
| **401**     | Unauthorized           | Token expired or invalid credentials              | Developer       | Fix JWT validation or auth middleware                      |
| **403**     | Forbidden              | Authenticated but no permission                   | Developer       | RBAC / user access logic                                   |
| **404**     | Not Found              | Route missing in code or bad URL                  | Developer       | Verify Express routes / NestJS controllers                 |
| **405**     | Method Not Allowed     | Route exists but wrong HTTP verb used             | Developer       | Add correct handler for GET/POST/PUT etc.                  |
| **408**     | Request Timeout        | Backend blocking operation                        | Developer       | Optimize query / async timeout                             |
| **409**     | Conflict               | Resource already exists                           | Developer       | Add duplicate check logic                                  |
| **415**     | Unsupported Media Type | Wrong Content-Type header                         | Developer       | Expect correct `application/json` or `multipart/form-data` |
| **422**     | Unprocessable Entity   | Validation failed                                 | Developer       | Add better validation layer (Joi, Zod, etc.)               |
| **429**     | Too Many Requests      | App-level rate limit                              | Developer       | Tune throttling logic                                      |
| **500**     | Internal Server Error  | Uncaught exception / DB failure                   | Developer       | Add `try/catch`, check logs, fix runtime bug               |
| **501**     | Not Implemented        | Route stub or missing feature                     | Developer       | Implement missing logic                                    |
| **502**     | Bad Gateway            | Misconfigured proxy inside app                    | Both            | Fix Nginx/Express reverse proxy                            |
| **503**     | Service Unavailable    | App crashed or restarting                         | Both            | Check logs, crash loop, memory leaks                       |
| **504**     | Gateway Timeout        | Slow DB query or async call                       | Developer       | Optimize backend calls, use async timeouts                 |

---

## 🧭 HOW TO TROUBLESHOOT QUICKLY

| Step | DevOps Checks                                  | Developer Checks                         |
| ---- | ---------------------------------------------- | ---------------------------------------- |
| 1️⃣  | Check ALB Target Group health in AWS Console   | Check API endpoint in Postman            |
| 2️⃣  | Run `kubectl get pods`, `kubectl describe pod` | Check app logs (`kubectl logs <pod>`)    |
| 3️⃣  | Validate `Service` → `targetPort` mapping      | Validate routes and middleware           |
| 4️⃣  | Inspect `Ingress` annotations / DNS            | Fix backend logic or DB access           |
| 5️⃣  | Review ALB/WAF logs for blocked IPs            | Handle exceptions & add error middleware |

---

## 🧰 Typical Ownership Split

| Layer                                 | Owner     | Example Status Codes | Tools to Check                                    |
| ------------------------------------- | --------- | -------------------- | ------------------------------------------------- |
| **DNS / ALB / Ingress / Service**     | DevOps    | 502, 503, 504, 403   | AWS Console, `kubectl describe ingress`, ALB logs |
| **Pod Networking / Health / Scaling** | DevOps    | 503, 504             | `kubectl get pods`, metrics-server                |
| **Application Routes / DB / Logic**   | Developer | 400, 401, 404, 500   | App logs, APM (Datadog, NewRelic)                 |
| **Auth / Business Logic**             | Developer | 401, 403, 409        | API middleware, JWT libraries                     |

---

### 🔥 TL;DR — Quick Mapping

| Category               | Typical Codes                     | Owned By   |
| ---------------------- | --------------------------------- | ---------- |
| **Infra / Networking** | 301, 302, 400, 403, 502, 503, 504 | DevOps     |
| **App / Logic**        | 400, 401, 404, 405, 409, 422, 500 | Developers |