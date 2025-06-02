 sudo certbot certonly --standalone  -d "*.example.com" -d example.com
sudo certbot certonly --manual --preferred-challenges dns \
  -d "*.ioncourt.com" -d ioncourt.com

sudo certbot certonly --manual --preferred-challenges dns \
  -d dev-partnersubscription.ioncourt.com/fullchain.pem
mkdir -p /home/ubuntu/partner-subscription-server/certs
   40  sudo cp /etc/letsencrypt/live/dev-partnersubscription.ioncourt.com/privkey.pem /home/ubuntu/partner-subscription-server/certs/key.pem
   41  sudo cp /etc/letsencrypt/live/dev-partnersubscription.ioncourt.com/fullchain.pem /home/ubuntu/partner-subscription-server/certs/cert.pem
   42  sudo chown ubuntu:ubuntu /home/ubuntu/partner-subscription-server/certs/*.pem
   43  chmod 600 /home/ubuntu/partner-subscription-server/certs/key.pem
   44  chmod 644 /home/ubuntu/partner-subscription-server/certs/cert.pem