Here's a **generalized one-liner workflow** you can use for **any SSL certificate update** on Nginx safely. It handles:

* Backup old certs
* Copy new certs
* Set permissions
* Reload Nginx

---

```bash
# Variables - change these as needed
DOMAIN="grafana.bikebazaar.com"                 # your domain or identifier
CERT_DIR="/etc/grafana_certs"                  # folder where Nginx reads certs
NEW_CERT="/home/ubuntu/bikebazaar-com-chain.pem"  # new certificate file
NEW_KEY="/home/ubuntu/bikebazaar-com.key"         # new private key file

# Step 0: Create backup folder with timestamp
BACKUP_DIR="$CERT_DIR/backup_$(date +%F_%H%M)"
sudo mkdir -p "$BACKUP_DIR"

# Step 1: Backup existing certs
sudo cp "$CERT_DIR/server.crt" "$BACKUP_DIR/"
sudo cp "$CERT_DIR/server.key" "$BACKUP_DIR/"

# Step 2: Copy new certs
sudo cp "$NEW_CERT" "$CERT_DIR/server.crt"
sudo cp "$NEW_KEY" "$CERT_DIR/server.key"

# Step 3: Set permissions
sudo chmod 644 "$CERT_DIR/server.crt"
sudo chmod 600 "$CERT_DIR/server.key"
sudo chown root:root "$CERT_DIR/server."*

# Step 4: Test Nginx config
sudo nginx -t && echo "Nginx config is OK ✅" || echo "Nginx config has errors ❌"

# Step 5: Reload Nginx
sudo systemctl reload nginx && echo "Nginx reloaded ✅"
```

---

### ✅ Notes:

1. **Change variables** at the top for **any domain or path**.
2. The script **backs up automatically** with timestamp.
3. After reload, you can verify:

```bash
openssl s_client -connect grafana.bikebazaar.com:443 -servername grafana.bikebazaar.com
```
