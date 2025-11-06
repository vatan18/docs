Perfect ⚙️ — here’s a **simple, quick-reference “Port Debugging Cheat Sheet”**
→ clear, minimal, and designed for fast real-world troubleshooting by **DevOps engineers**.

---

# 🚦 **PORT TROUBLESHOOTING QUICK GUIDE**

| 🔍 Where                   | ⚠️ Symptom                                    | 💣 Likely Cause                        | 🧰 What to Check / Command                                      | ✅ Fix                                                      |                           |
| -------------------------- | --------------------------------------------- | -------------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------- | ------------------------- |
| **Pod**                    | `curl localhost:<port>` fails                 | App not listening                      | `kubectl exec -it <pod> -- ss -tuln`                            | Ensure app uses same port as `.env` and binds to `0.0.0.0` |                           |
| **Pod Start Error**        | `EADDRINUSE`                                  | Port already in use                    | `netstat -tuln` inside pod                                      | Use a different port or kill duplicate process             |                           |
| **Service**                | ALB shows `502 Bad Gateway`                   | `targetPort` ≠ Pod’s `containerPort`   | `kubectl describe svc <svc>`                                    | Match `targetPort` = `containerPort`                       |                           |
| **Ingress**                | Route unreachable    `502 Bad Gateway`        | Ingress `port.number` ≠ Service `port` | `kubectl describe ingress <ing>`                                | Align Ingress and Service ports                            |                           |
| **ALB Target Group**       | Targets unhealthy                             | Health check hitting wrong port        | AWS ALB Target Group → Health tab                               | Update health check port/path                              |                           |
| **External Access**        | Works via `kubectl port-forward`, not via ALB | Security Group or Subnet issue         | AWS SG inbound rules                                            | Allow target port in SG                                    |                           |
| **HTTP/HTTPS Confusion**   | `curl https://` returns 502                   | Backend uses HTTP, not HTTPS           | Ingress annotation `alb.ingress.kubernetes.io/backend-protocol` | Set to `HTTP` if app isn’t SSL-enabled                     |                           |
| **App Works Locally Only** | No response in cluster                        | App binds to `localhost`               | Logs show `Listening on 127.0.0.1`                              | Bind to `0.0.0.0` in code                                  |                           |
| **NodePort**               | Port allocation error                         | Two services using same NodePort       | `kubectl get svc -A                                             | grep NodePort`                                             | Change to unique NodePort |
| **Pod not Ready**          | Health probe fail                             | App not responding on declared port    | `kubectl describe pod <pod>`                                    | Match readiness/liveness probe port                        |                           |

---

### ⚙️ **Standard Port Alignment**

| Component               | Port            | Owner                          |
| ----------------------- | --------------- | ------------------------------ |
| **Ingress (ALB)**       | 80 / 443        | External listener (DevOps)     |
| **Service**             | 80 / 443 / 5000 | Internal routing (DevOps)      |
| **TargetPort**          | 5000            | Forwards to container (DevOps) |
| **ContainerPort**       | 5000            | Pod’s exposed port (DevOps)    |
| **.env / App.listen()** | 5000            | App config (Developer)         |

---

### 🧭 **Quick Debug Flow**

1️⃣ `kubectl get pods -o wide` → pod running?
2️⃣ `kubectl exec -it <pod> -- ss -tuln` → app listening?
3️⃣ `kubectl describe svc <svc>` → port ↔ targetPort correct?
4️⃣ `kubectl describe ingress <ing>` → backend port matches Service port?
5️⃣ ALB Target Group health? → healthy = ✅, unhealthy = wrong port/path

---
Perfect question ✅ — here’s the **simple, short, no-nonsense answer** you can keep in your notes 👇

---

## ⚙️ **Quick Port Decision Guide (DevOps View) for new app**

### 🧠 **How to Decide**

* If app is **public (HTTPS)** → use **443**
* If app is **HTTP / internal** → use **80**
* If app is **custom internal microservice** → use **same as app**, e.g. **5000** or **3000**
* Whatever you pick for **Ingress `port.number`**, it **must match Service `port`**

### ✅ Example (common)

```yaml
Ingress backend.port.number: 443
Service port: 443
Service targetPort: 5000
Pod containerPort: 5000
App PORT=5000
```

✔ Works perfectly.

---

**TL;DR:**

> 🔸 Developer fixes `.env` → DevOps copies that to `containerPort` + `targetPort`.
> 🔸 DevOps chooses any `Service port` (80 / 443 / 5000),
> 🔸 Ingress backend port = Service port.
Sure ✅ — here’s your **clean & simple visual quick summary** (copy-ready for README or docs):

---

### 🧩 **Visual Quick Summary**

```
ALB (443/80)
   │
   ▼
Ingress ──[port.number: 443]──▶ Service ──[port:443 → targetPort:5000]──▶ Pod ──[containerPort:5000]──▶ App (PORT=5000)
```
Perfect ✅ — here are the **simple visual summaries** for both **Node.js** and **Python (Flask/FastAPI/Django)** based apps 👇

### 🐍 **Python App Example (Flask / FastAPI)**

```
ALB (443)
   │
   ▼
Ingress ──[port.number: 8000]──▶ Service ──[port:8000 → targetPort:8000]──▶ Pod ──[containerPort:8000]──▶ Python App (PORT=8000)
```

🧩 In code:

```python
app.run(host="0.0.0.0", port=8000)
```

💡 **Rule:**
Use the same port in `.env`, container, and Service.
Ingress and Service port can be any (like 443, 80, 8000) — just keep them matching.

`Ingress port.number = Service port`
`Service targetPort = containerPort = App PORT`

