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

