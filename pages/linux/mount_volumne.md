# Add an additional EBS volume to a running AWS EC2 machine 

### **Step 1: Create and Attach an EBS Volume**
1. **Go to AWS Console > EC2 > Elastic Block Store (EBS).**
2. **Click "Create Volume".**  
   - Choose the **same availability zone** as your EC2 instance.  
   - Select the desired size, type (`gp3` or `gp2` for general-purpose SSD), and IOPS.  
   - Click **Create Volume**.

3. **Attach the EBS Volume to the EC2 Instance.**  
   - Go to **Volumes** in the EBS dashboard.
   - Select the newly created volume and click **Actions > Attach Volume**.
   - Choose the target EC2 instance.
   - Set a device name (e.g., `/dev/xvdf` or `/dev/sdf`).
   - Click **Attach**.

---

### **Step 2: Format and Mount the Volume**
1. **Connect to the EC2 instance** via SSH:
   ```bash
   ssh ubuntu@your-ec2-ip
   ```

2. **Check if the volume is detected:**
   ```bash
   lsblk
   ```
   You should see a new device (e.g., `/dev/xvdf` or `/dev/nvme1n1`).

3. **Format the volume (if it's new and unformatted):**
   ```bash
   sudo mkfs -t ext4 /dev/xvdf
   ```
   _(Replace `/dev/xvdf` with your actual device name from `lsblk`.)_

4. **Create the mount point:**
   ```bash
   sudo mkdir -p /home/ubuntu/kbparse
   ```

5. **Mount the volume:**
   ```bash
   sudo mount /dev/xvdf /home/ubuntu/kbparse
   ```

6. **Verify the mount:**
   ```bash
   df -h
   ```

---

### **Step 3: Make the Mount Persistent (Optional)**
To ensure the volume mounts automatically after a reboot:
1. **Get the volume’s UUID:**
   ```bash
   sudo blkid /dev/xvdf
   ```
   You will see output like:
   ```
   /dev/xvdf: UUID="1234-5678-ABCD" TYPE="ext4"
   ```

2. **Edit `/etc/fstab`:**
   ```bash
   sudo nano /etc/fstab
   ```
   Add this line at the bottom:
   ```
   UUID=1234-5678-ABCD  /home/ubuntu/kbparse  ext4  defaults,nofail  0 2
   ```

3. **Test the fstab entry (to prevent boot issues):**
   ```bash
   sudo mount -a
   ```
