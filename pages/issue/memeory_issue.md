### 🧠 Step 1: Find Top Memory-Consuming Processes

Run this command to **list top memory users** and **save to a file**:

```bash
ps aux --sort=-%mem | head -n 20 | tee top_memory_processes.txt
```

**Explanation:**

* `ps aux` → shows all processes
* `--sort=-%mem` → sorts by memory usage (descending)
* `head -n 20` → shows top 20
* `tee` → saves output to `top_memory_processes.txt` while showing on screen

You can view the saved file anytime:

```bash
cat top_memory_processes.txt
```

---

### 🧰 Step 2: Check Real-Time Usage (Optional)

Use `top` or `htop` (better UI):

```bash
sudo apt install htop -y
htop
```

Inside `htop`:

* Press **F6** → sort by **MEM%**
* Press **F9** → kill a process if needed

---

### ⚡ Step 3: Optimize / Free Memory

#### 🧹 1. Clear cached memory safely

```bash
sudo sync; sudo sysctl -w vm.drop_caches=3
```

✅ This clears **page cache**, **dentries**, and **inodes**.
(*It doesn’t kill processes, just frees memory used for caching.*)

---

#### 🧩 2. Disable Unused Services

Check what’s running at startup:

```bash
sudo systemctl list-unit-files --type=service --state=enabled
```

Then disable what’s unnecessary, e.g.:

```bash
sudo systemctl disable bluetooth.service
sudo systemctl disable cups.service
```

---

#### ⚙️ 3. Manage Swap (if memory is low)

Check swap usage:

```bash
swapon --show
```

If swap is too small, increase it:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

To make it permanent:

```bash
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

#### 🚀 4. Adjust “swappiness” (how often system swaps)

Default is 60; lower it to 10 (keeps things in RAM longer):

```bash
sudo sysctl vm.swappiness=10
```

To make permanent:

```bash
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
```

---

#### 🧠 5. Identify Memory Leaks or Heavy Apps

You can check detailed memory map for a process:

```bash
sudo pmap -x <PID> | less
```

(Replace `<PID>` with process ID from the earlier list.)

---

#### 🧽 6. Remove Unused Packages

```bash
sudo apt autoremove --purge
sudo apt clean
```

---

### 🧾 Step 4: (Optional) Create a Cron Job to Log Memory Usage Daily

```bash
crontab -e
```

Add:

```
0 9 * * * ps aux --sort=-%mem | head -n 10 >> /var/log/top_memory_usage.log
```

→ Logs top 10 memory-consuming processes every morning at 9 AM.

