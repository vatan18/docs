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

-------------------
✅ 1. Download certs from EC2 to Local
Run this from your local machine:

scp -r -i dev-ioncourt-tracker.pem ubuntu@<EC2_PUBLIC_IP>:/home/ubuntu/partner-subscription-server/certs ./certs
Copies certs folder from EC2 → your local ./certs directory.

Replace <EC2_PUBLIC_IP> with the actual IP or DNS name of the EC2 instance.

✅ 2. Upload certs from Local to EC2
Run this from your local machine:

scp -r -i dev-ioncourt-tracker.pem ./certs ubuntu@10.96.101.115:/home/ubuntu/partner-subscription-server/
Copies local certs folder → EC2 at /home/ubuntu/partner-subscription-server/certs.