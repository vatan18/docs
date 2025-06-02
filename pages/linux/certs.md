# 1. Generate wildcard cert with DNS challenge
sudo certbot certonly --manual --preferred-challenges dns \
  -d "*.ioncourt.com" -d ioncourt.com

# Wait for Certbot to prompt → then add DNS TXT record → Press Enter

# 2. Create certs folder for your app
mkdir -p /home/ubuntu/partner-subscription-server/certs

# 3. Copy wildcard cert and key to your app's certs folder
sudo cp /etc/letsencrypt/live/ioncourt.com/privkey.pem /home/ubuntu/partner-subscription-server/certs/key.pem
sudo cp /etc/letsencrypt/live/ioncourt.com/fullchain.pem /home/ubuntu/partner-subscription-server/certs/cert.pem

# 4. Set correct ownership and permissions
sudo chown ubuntu:ubuntu /home/ubuntu/partner-subscription-server/certs/*.pem
chmod 600 /home/ubuntu/partner-subscription-server/certs/key.pem
chmod 644 /home/ubuntu/partner-subscription-server/certs/cert.pem

# 5. Start your application
bash start_application.sh
