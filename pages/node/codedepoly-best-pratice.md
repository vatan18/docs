📘 EC2 Setup & AWS CodeDeploy – Best Practices with PM2 and Auto Scaling
1️⃣ EC2 User Data Script – Use Only for Initial Setup (Dependency Installation Phase)
✅ Use this only once to prepare a base EC2 instance. This instance is later used to create an AMI for Auto Scaling groups.

bash
Copy
Edit
#!/bin/bash

# Log output for debugging
exec > >(tee /var/log/user-data.log | logger -t user-data -s 2>/dev/console) 2>&1

# System update
sudo apt-get update

# ---------------- CloudWatch Agent ----------------
sudo apt-get install -y amazon-cloudwatch-agent

sudo mkdir -p /opt/aws/amazon-cloudwatch-agent/etc/

cat << 'EOL' > /tmp/amazon-cloudwatch-agent.json
{
  "agent": {
    "metrics_collection_interval": 60,
    "run_as_user": "root"
  },
  "metrics": {
    "namespace": "CWAgent",
    "metrics_collected": {
      "disk": {
        "measurement": [ "used_percent" ],
        "resources": [ "/" ],
        "append_dimensions": {
          "InstanceId": "${aws:InstanceId}",
          "InstanceType": "${aws:InstanceType}",
          "AutoScalingGroupName": "${aws:AutoScalingGroupName}"
        }
      },
      "mem": {
        "measurement": [ "used_percent" ],
        "append_dimensions": {
          "InstanceId": "${aws:InstanceId}",
          "InstanceType": "${aws:InstanceType}",
          "AutoScalingGroupName": "${aws:AutoScalingGroupName}"
        }
      }
    }
  }
}
EOL

sudo mv /tmp/amazon-cloudwatch-agent.json /opt/aws/amazon-cloudwatch-agent/etc/
sudo chmod 644 /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json

sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
sudo systemctl enable amazon-cloudwatch-agent
sudo systemctl restart amazon-cloudwatch-agent

# ---------------- Node.js, npm, PM2 ----------------
sudo apt install -y curl
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2

# ---------------- AWS CodeDeploy Agent ----------------
sudo apt install -y ruby wget unzip
cd /home/ubuntu
wget https://aws-codedeploy-ap-south-1.s3.ap-south-1.amazonaws.com/latest/install
chmod +x install
sudo ./install auto
sudo service codedeploy-agent start
rm -f install

# ---------------- AWS CLI ----------------
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
rm -rf aws awscliv2.zip

# ---------------- Start the App ----------------
if [ -d "/home/ubuntu/tracker-server" ]; then
  sudo -u ubuntu bash -c 'cd /home/ubuntu/tracker-server && pm2 start dist/server.js --name tracker-server -i 0'
else
  echo "Directory /home/ubuntu/tracker-server does not exist."
fi

echo "Initial setup complete."
2️⃣ What to Do with Auto Scaling EC2 Instances
✅ Don't use user-data again. Your EC2 should come from a pre-baked AMI where:

All dependencies are installed

Code is deployed (optional)

PM2 is configured

pm2 save is done

PM2 Setup for Auto Scaling
Start the app:

bash
Copy
Edit
pm2 start dist/server.js --name tracker-server -i max     # cluster mode
# OR
pm2 start dist/server.js --name tracker-server            # fork mode
Save the process list:

Start your app with PM2 (if not already done):

bash
Copy
Edit
pm2 start dist/server.js --name tracker-server -i 0
# OR
pm2 start dist/server.js --name tracker-server
Save the process list:
#!/bin/bash
# Restart agents in case the AMI saved them in a stopped state
sudo systemctl restart codedeploy-agent
sudo systemctl restart amazon-cloudwatch-agent

echo "User-data complete. CodeDeploy will handle application deployment."

bash
Copy
Edit
pm2 save
Generate and configure PM2 startup script:

bash
Copy
Edit
pm2 startup
This command will print another command like:

ruby
Copy
Edit
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu
You must copy and run that exact command PM2 gives.

Re-run pm2 save again (optional but safe):

bash
Copy
Edit
pm2 save


3️⃣ AWS CodeDeploy – Best Practices (Especially with Auto Scaling)
Practice	Description
✅ Use AppSpec YAML	Use appspec.yml to define hooks (BeforeInstall, AfterInstall, ApplicationStart, etc.)
✅ Avoid user-data for app logic	Only install dependencies via user-data. App logic should be in CodeDeploy lifecycle scripts
✅ Always Bake AMI	Install Node, PM2, and all packages, then create AMI before launching Auto Scaling group
✅ Use pm2 save and startup	Ensures the app auto-starts even after EC2 reboot
✅ Log output for debugging	Use exec > >(tee ...) in scripts to store output logs
✅ Keep buildspec clean	Let CodeDeploy handle app logic; avoid mixing it in buildspec.yml
✅ Tag Auto Scaling instances	Helps with identifying CodeDeploy deployment targets properly

✅ Summary
Use EC2 user-data only once for dependency setup → then create AMI

In Auto Scaling, use the AMI directly. No user-data needed.

Set up PM2 with startup and save, either in BeforeInstall or ApplicationStart lifecycle hooks.

Stick to CodeDeploy lifecycle hooks for app logic (build, start, restart).

Follow AMI baking + CodeDeploy pattern for the most stable deployments.