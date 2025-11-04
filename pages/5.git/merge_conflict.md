## 🔍 What’s Going Wrong

Your script runs this line every time:

```bash
GIT_OUTPUT=$(git pull origin "$BRANCH" 2>&1)
```

And since the code in `/var/www/html/uat.ssc` is often **manually changed** (like your earlier `git reset --hard 0c2eb8a`),
Git sees that your local branch history differs from `origin/develop`.

So when you run `git pull`, Git tries to **merge** — and that’s when it throws merge conflicts.

---

## 💥 Why Merge Conflicts Keep Happening

Because:

* You reset or modify local commits manually.
* `git pull` tries to merge remote changes instead of overwriting them.
* The script doesn’t handle that cleanly.

---

## ✅ Fix Options

### **Option 1 — Use `git fetch` + `git reset --hard` (Best for Deployment Servers)**

You don’t want to merge on a deployment server — you want to **mirror** the remote branch exactly.
take backup first 
```bash
cp -r /var/www/html/uat.ssc /var/www/html/uat.ssc.bak_$(date +%F_%T)
```
Create a full bacKup with tar if size is huge
```bash
# 1️⃣ Set variables
APP_DIR="/var/www/html/uat.ssc"
BACKUP_DIR="/home/ubuntu/backups"
TIMESTAMP=$(date +%F-%H%M)

# 2️⃣ Create backup directory (if not exists)
sudo mkdir -p "$BACKUP_DIR"

# 3️⃣ Create full compressed backup (preserves permissions & owners)
sudo tar -czpf "$BACKUP_DIR/uat_ssc_backup_$TIMESTAMP.tar.gz" "$APP_DIR"

# 4️⃣ Verify backup file created
ls -lh "$BACKUP_DIR"
```
Restore if needed
```bash
sudo systemctl stop nginx php8.1-fpm  # optional, if running
sudo tar -xzp -f "$BACKUP_DIR/uat_ssc_backup_$TIMESTAMP.tar.gz" -C /
sudo systemctl start nginx php8.1-fpm
```
So modify your script like this with merge conflict 👇

```bash
#!/bin/bash

APP_DIR="/var/www/html/uat.ssc"
BRANCH="develop"
LOG_FILE="/var/log/dev-uat.ssc-deploy.log"

echo "===== Deployment started at $(date) =====" >> "$LOG_FILE"

cd "$APP_DIR" || { echo "[ERROR] Cannot cd to $APP_DIR" >> "$LOG_FILE"; exit 1; }

# Fetch latest code
git fetch origin "$BRANCH" >> "$LOG_FILE" 2>&1

# Reset local code to match remote exactly
git reset --hard origin/"$BRANCH" >> "$LOG_FILE" 2>&1

echo "[SUCCESS] Code reset to latest remote version." >> "$LOG_FILE"

# Clear caches and rebuild
php artisan config:cache >> "$LOG_FILE" 2>&1
php artisan route:cache >> "$LOG_FILE" 2>&1
php artisan view:cache >> "$LOG_FILE" 2>&1

echo "===== Deployment completed at $(date) =====" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"
```

---

### 🧠 Why This Is Better

* **No merge conflicts ever.**
* Always ensures UAT code = remote `develop` branch.
* Cleaner logs, more predictable deployments.

---

### ⚙️ Optional Cleanup Before Switching

To ensure clean slate:

```bash
sudo chown -R ubuntu:ubuntu /var/www/html/uat.ssc
sudo git -C /var/www/html/uat.ssc reset --hard
sudo git -C /var/www/html/uat.ssc clean -fd
```

Then replace your script with the new one above.

---
auto-rollback if the deployment fails (so it reverts to the previous commit automatically)
Perfect ✅ — adding **auto-rollback** is a smart move for UAT or production deployments.
It protects you if a new code update causes app errors or breaks the site.

Let’s enhance your deployment script accordingly 👇

---

## ⚡ Final Script — Safe Auto-Rollback Deployment (`uat.ssc.sh`)

```bash
#!/bin/bash

APP_DIR="/var/www/html/uat.ssc"
BRANCH="develop"
LOG_FILE="/var/log/dev-uat.ssc-deploy.log"

echo "===== Deployment started at $(date) =====" >> "$LOG_FILE"

cd "$APP_DIR" || { echo "[ERROR] Cannot cd to $APP_DIR" >> "$LOG_FILE"; exit 1; }

# Store current commit ID before updating (for rollback)
PREVIOUS_COMMIT=$(git rev-parse HEAD)
echo "[INFO] Previous commit: $PREVIOUS_COMMIT" >> "$LOG_FILE"

# Fetch the latest remote branch
if ! git fetch origin "$BRANCH" >> "$LOG_FILE" 2>&1; then
  echo "[ERROR] Git fetch failed!" >> "$LOG_FILE"
  exit 1
fi

# Hard reset local code to the remote branch
if ! git reset --hard origin/"$BRANCH" >> "$LOG_FILE" 2>&1; then
  echo "[ERROR] Git reset failed!" >> "$LOG_FILE"
  exit 1
fi

NEW_COMMIT=$(git rev-parse HEAD)
echo "[INFO] Updated to new commit: $NEW_COMMIT" >> "$LOG_FILE"

# Clear caches
php artisan config:clear >> "$LOG_FILE" 2>&1
php artisan cache:clear >> "$LOG_FILE" 2>&1
php artisan route:clear >> "$LOG_FILE" 2>&1
php artisan view:clear >> "$LOG_FILE" 2>&1

# Rebuild caches
php artisan config:cache >> "$LOG_FILE" 2>&1
php artisan route:cache >> "$LOG_FILE" 2>&1
php artisan view:cache >> "$LOG_FILE" 2>&1

# Optional: Run a basic health check on the app
# Replace the URL with your UAT health endpoint
HEALTH_URL="https://uat.ssc.gunnerroofing.com/health"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL")

if [ "$HTTP_STATUS" != "200" ]; then
  echo "[ERROR] Health check failed! HTTP $HTTP_STATUS — rolling back..." >> "$LOG_FILE"
  git reset --hard "$PREVIOUS_COMMIT" >> "$LOG_FILE" 2>&1
  php artisan config:cache >> "$LOG_FILE" 2>&1
  php artisan route:cache >> "$LOG_FILE" 2>&1
  php artisan view:cache >> "$LOG_FILE" 2>&1
  echo "[ROLLBACK] Rolled back to previous commit: $PREVIOUS_COMMIT" >> "$LOG_FILE"
else
  echo "[SUCCESS] Deployment verified successfully." >> "$LOG_FILE"
fi

echo "===== Deployment completed at $(date) =====" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"
```

---

## 🧠 How This Works

| Step                                            | Description                                                     |
| ----------------------------------------------- | --------------------------------------------------------------- |
| `PREVIOUS_COMMIT=$(git rev-parse HEAD)`         | Saves current commit ID before pulling                          |
| `git fetch` + `git reset --hard origin/$BRANCH` | Brings your repo to the latest remote commit                    |
| Health Check                                    | Hits a URL (e.g. `/health` or `/api/ping`) to confirm app is up |
| If health fails                                 | Script automatically rolls back to the previous commit          |
| Logs                                            | Everything goes to `/var/log/dev-uat.ssc-deploy.log`            |

---

## 🩺 Tips

* Update the `HEALTH_URL` to an endpoint that reliably returns HTTP 200 only if your app is working.
* You can also replace the curl check with a simple file or database check.
* Make sure this script runs under the same user that owns `/var/www/html/uat.ssc` (e.g., `ubuntu`).

---

Also send a **Slack or email notification** when it rolls back (so you know instantly when deployment failed)

Excellent 💪 — let’s make your deployment script **notify you instantly** on Slack (or email) if it **fails or rolls back**.

You’ll get an alert like:

> 🚨 UAT Deployment Failed — rolled back to previous commit `abc1234`

Below is the **final enhanced version** of your `uat.ssc.sh` script with **Slack + Email notifications** built in.

---

## ⚙️ Final Script — Auto-Rollback + Slack + Email Alerts

```bash
#!/bin/bash

APP_DIR="/var/www/html/uat.ssc"
BRANCH="develop"
LOG_FILE="/var/log/dev-uat.ssc-deploy.log"

# Slack Webhook (replace with your actual webhook)
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/XXXX/XXXX/XXXX"

# Email alert settings (optional)
TO_EMAIL="devops-team@gunnerroofing.com"
FROM_EMAIL="noreply@gunnerroofing.com"
MAIL_SUBJECT="UAT Deployment Notification"

echo "===== Deployment started at $(date) =====" >> "$LOG_FILE"

cd "$APP_DIR" || { echo "[ERROR] Cannot cd to $APP_DIR" >> "$LOG_FILE"; exit 1; }

# Store current commit ID for rollback
PREVIOUS_COMMIT=$(git rev-parse HEAD)
echo "[INFO] Previous commit: $PREVIOUS_COMMIT" >> "$LOG_FILE"

# Fetch and reset to remote branch
if ! git fetch origin "$BRANCH" >> "$LOG_FILE" 2>&1; then
  echo "[ERROR] Git fetch failed!" >> "$LOG_FILE"
  curl -X POST -H 'Content-type: application/json' \
    --data "{\"text\":\"🚨 *UAT Deployment Failed:* Git fetch failed on branch $BRANCH.\"}" \
    "$SLACK_WEBHOOK_URL"
  echo "Git fetch failed" | mail -s "$MAIL_SUBJECT" "$TO_EMAIL"
  exit 1
fi

if ! git reset --hard origin/"$BRANCH" >> "$LOG_FILE" 2>&1; then
  echo "[ERROR] Git reset failed!" >> "$LOG_FILE"
  curl -X POST -H 'Content-type: application/json' \
    --data "{\"text\":\"🚨 *UAT Deployment Failed:* Git reset failed on branch $BRANCH.\"}" \
    "$SLACK_WEBHOOK_URL"
  echo "Git reset failed" | mail -s "$MAIL_SUBJECT" "$TO_EMAIL"
  exit 1
fi

NEW_COMMIT=$(git rev-parse HEAD)
echo "[INFO] Updated to new commit: $NEW_COMMIT" >> "$LOG_FILE"

# Clear and rebuild caches
php artisan config:clear >> "$LOG_FILE" 2>&1
php artisan cache:clear >> "$LOG_FILE" 2>&1
php artisan route:clear >> "$LOG_FILE" 2>&1
php artisan view:clear >> "$LOG_FILE" 2>&1
php artisan config:cache >> "$LOG_FILE" 2>&1
php artisan route:cache >> "$LOG_FILE" 2>&1
php artisan view:cache >> "$LOG_FILE" 2>&1

# Health check
HEALTH_URL="https://uat.ssc.gunnerroofing.com/health"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL")

if [ "$HTTP_STATUS" != "200" ]; then
  echo "[ERROR] Health check failed! HTTP $HTTP_STATUS — rolling back..." >> "$LOG_FILE"

  # Rollback to previous commit
  git reset --hard "$PREVIOUS_COMMIT" >> "$LOG_FILE" 2>&1
  php artisan config:cache >> "$LOG_FILE" 2>&1
  php artisan route:cache >> "$LOG_FILE" 2>&1
  php artisan view:cache >> "$LOG_FILE" 2>&1

  echo "[ROLLBACK] Rolled back to previous commit: $PREVIOUS_COMMIT" >> "$LOG_FILE"

  # Send Slack & Email alerts
  curl -X POST -H 'Content-type: application/json' \
    --data "{\"text\":\"🚨 *UAT Deployment Rolled Back!* Health check failed (HTTP $HTTP_STATUS). Rolled back to commit $PREVIOUS_COMMIT.\"}" \
    "$SLACK_WEBHOOK_URL"

  echo "Deployment failed, rolled back to commit $PREVIOUS_COMMIT" | mail -s "$MAIL_SUBJECT" "$TO_EMAIL"

else
  echo "[SUCCESS] Deployment verified successfully." >> "$LOG_FILE"
  curl -X POST -H 'Content-type: application/json' \
    --data "{\"text\":\"✅ *UAT Deployment Successful!* Updated to commit $NEW_COMMIT.\"}" \
    "$SLACK_WEBHOOK_URL"

  echo "Deployment successful for commit $NEW_COMMIT" | mail -s "$MAIL_SUBJECT" "$TO_EMAIL"
fi

echo "===== Deployment completed at $(date) =====" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"
```

---

## 🧠 What It Does

| Function          | Description                                                            |
| ----------------- | ---------------------------------------------------------------------- |
| **Auto-rollback** | If health check fails, it resets to the previous commit automatically. |
| **Slack alerts**  | Sends success/failure messages to a Slack channel via webhook.         |
| **Email alerts**  | Sends email notification (if `mail` command configured).               |
| **Logging**       | Logs every action in `/var/log/dev-uat.ssc-deploy.log`.                |

---

## ⚙️ Setup Steps

1. **Slack Webhook**

   * In Slack, go to:
     *Settings → Integrations → Incoming Webhooks → Add to channel*
   * Copy the URL and replace `SLACK_WEBHOOK_URL`.

2. **Mail command setup**

   ```bash
   sudo apt install mailutils -y
   ```

   Then ensure `/etc/ssmtp/ssmtp.conf` or `postfix` is configured.

3. **Make script executable**

   ```bash
   sudo chmod +x /home/ubuntu/auto-deployment/uat.ssc.sh
   ```

4. **Test manually**

   ```bash
   bash /home/ubuntu/auto-deployment/uat.ssc.sh
   ```
