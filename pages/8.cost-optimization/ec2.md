Perfect 👍 — you want to automatically check **CPU utilization for all EC2 instances** across, say, the **last few months (October + November)** using **AWS CLI** and **CloudWatch metrics**.

Let’s build this properly step-by-step 👇

---

## 🧩 GOAL

✅ Find **all EC2 instance IDs**
✅ Fetch **average CPU utilization** for each
✅ Cover **October and November (2 months)**
✅ Output a clear list or table (instance ID + average CPU%)

---

## 🧠 Step-by-Step Solution

### **1️⃣ Get All EC2 Instance IDs**

```bash
aws ec2 describe-instances \
  --region ap-south-1 \
  --query "Reservations[].Instances[].InstanceId" \
  --output text > instance_ids.txt
```

This will create a file `instance_ids.txt` with all instance IDs:

```
i-0123456789abcdef1
i-0a1234abcd5678
i-0ffedcba98765432
...
```

---

### **2️⃣ Loop Through Each Instance and Get CPU Average (for last 60 days)**

```bash
#!/bin/bash

REGION="ap-south-1"
START_DATE=$(date -u -d '60 days ago' +%Y-%m-%dT%H:%M:%SZ)
END_DATE=$(date -u +%Y-%m-%dT%H:%M:%SZ)

echo "InstanceID,AverageCPU(%)" > ec2_cpu_report.csv

for instance in $(aws ec2 describe-instances \
    --region $REGION \
    --query "Reservations[].Instances[].InstanceId" \
    --output text); do
    
    avg_cpu=$(aws cloudwatch get-metric-statistics \
        --metric-name CPUUtilization \
        --start-time $START_DATE \
        --end-time $END_DATE \
        --period 86400 \
        --namespace AWS/EC2 \
        --statistics Average \
        --dimensions Name=InstanceId,Value=$instance \
        --region $REGION \
        --query "Datapoints[].Average" \
        --output text | awk '{ total += $1; count++ } END { if (count > 0) print total/count; else print 0 }')
    
    echo "$instance,${avg_cpu:-0}" >> ec2_cpu_report.csv
    echo "✔ Checked: $instance → Avg CPU = ${avg_cpu:-0}%"
done

echo "✅ Report generated: ec2_cpu_report.csv"
```

Save this as `ec2_cpu_usage_report.sh`, make it executable:

```bash
chmod +x ec2_cpu_usage_report.sh
./ec2_cpu_usage_report.sh
```

---

### **3️⃣ Output Example (`ec2_cpu_report.csv`):**

| Instance ID         | Average CPU (%) |
| ------------------- | --------------- |
| i-0123456789abcdef1 | 1.23            |
| i-0a1234abcd5678    | 7.84            |
| i-0ffedcba98765432  | 0.45            |

---

### **4️⃣ Interpretation:**

* Instances with **<5% average CPU** → likely **idle / underutilized**
* Instances with **>60–70% average CPU** → potentially **overloaded**
* You can use these insights for:

  * Stopping idle ones
  * Resizing (t3.xlarge → t3.medium, etc.)
  * Applying Savings Plans

---

### **5️⃣ For October Only (Custom Date Range Example)**

If you want **October only**, change:

```bash
START_DATE="2024-10-01T00:00:00Z"
END_DATE="2024-10-31T23:59:59Z"
```

And rerun the same script.

---

### ⚙️ Optional — More Metrics

You can easily expand this script to check:

* NetworkIn / NetworkOut
* DiskReadOps / DiskWriteOps
* EBSIdleTime

For example:

```bash
--metric-name NetworkOut
--namespace AWS/EC2
```

---

### 💡 Best Practice:

Once you generate `ec2_cpu_report.csv`, sort it:

```bash
sort -t, -k2 -n ec2_cpu_report.csv
```

→ Gives you idle instances at the top (lowest CPU %).

---

Would you like me to modify this script so it:

* Checks **both CPU and Network usage** (to detect truly idle EC2s), and
* Generates a combined **idle-instance summary** (ready for cleanup)?
