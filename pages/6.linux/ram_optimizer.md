# Memory Optimizer for Low-RAM Linux Systems

A comprehensive memory management solution for Linux systems with limited RAM (3-4GB). This tool automatically monitors and optimizes memory usage by managing browser processes, clearing caches, and optimizing swap usage.

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Troubleshooting](#troubleshooting)
- [Browser Optimization](#browser-optimization)
- [RAM Upgrade Guide](#ram-upgrade-guide)
- [Contributing](#contributing)

## Features

- **Automatic Memory Monitoring**: Checks RAM and swap usage every 5 minutes
- **Multi-Browser Support**: Optimizes Firefox, Brave, Chrome, and Chromium
- **VS Code Optimization**: Manages heavy extension processes
- **Aggressive Cache Cleaning**: Clears system caches, journal logs, and thumbnails
- **Swap Optimization**: Dynamically adjusts swap parameters
- **Detailed Logging**: Tracks all optimization activities
- **Systemd Integration**: Runs as a reliable system service

## Prerequisites

- Linux system with systemd
- Root/sudo access
- Bash shell
- 3GB+ RAM (optimized for low-memory systems)

## Installation

### Quick Install

```bash
# Download the script
curl -o /tmp/memory_optimizer.sh https://raw.githubusercontent.com/YOUR_USERNAME/memory-optimizer/main/memory_optimizer.sh

# Or clone the repository
git clone https://github.com/YOUR_USERNAME/memory-optimizer.git
cd memory-optimizer

# Run the installation script
sudo ./install.sh
```

### Manual Installation

#### Step 1: Create the Memory Optimizer Script

```bash
sudo nano /usr/local/bin/memory_optimizer.sh
```

Paste the following script:

```bash
#!/bin/bash
# Advanced Memory Management for Low-RAM Systems

LOG_FILE="/var/log/memory_optimizer.log"
WARN_THRESHOLD=75
CRITICAL_THRESHOLD=85

log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

get_ram_usage() {
    free | awk '/Mem:/ {printf "%.0f", $3/$2 * 100}'
}

get_swap_usage() {
    free | awk '/Swap:/ {if($2>0) printf "%.0f", $3/$2 * 100; else print "0"}'
}

# Kill memory-hogging browser tabs/processes
optimize_browsers() {
    log_message "Optimizing browsers..."
    
    # Check and optimize Firefox
    if pgrep -x "firefox" > /dev/null; then
        log_message "Found Firefox processes"
        ps aux | grep firefox | awk '$6 > 500000 {print $2}' | while read pid; do
            if [ ! -z "$pid" ]; then
                log_message "Killing heavy Firefox process: $pid (>500MB)"
                kill -9 "$pid" 2>/dev/null
            fi
        done
    fi
    
    # Check and optimize Brave
    if pgrep -x "brave" > /dev/null; then
        log_message "Found Brave processes"
        ps aux | grep brave | awk '$6 > 500000 {print $2}' | while read pid; do
            if [ ! -z "$pid" ]; then
                log_message "Killing heavy Brave process: $pid (>500MB)"
                kill -9 "$pid" 2>/dev/null
            fi
        done
    fi
    
    # Check and optimize Chrome/Chromium
    if pgrep -x "chrome" > /dev/null || pgrep -x "chromium" > /dev/null; then
        log_message "Found Chrome/Chromium processes"
        ps aux | grep -E "chrome|chromium" | awk '$6 > 500000 {print $2}' | while read pid; do
            if [ ! -z "$pid" ]; then
                log_message "Killing heavy Chrome/Chromium process: $pid (>500MB)"
                kill -9 "$pid" 2>/dev/null
            fi
        done
    fi
}

# Optimize VS Code
optimize_vscode() {
    log_message "Optimizing VS Code..."
    pkill -f "extensionHost" 2>/dev/null
    pkill -f "typescript-language-server" 2>/dev/null
    pkill -f "eslint" 2>/dev/null
}

# Clean system caches aggressively
clean_caches() {
    log_message "Cleaning system caches..."
    sync
    echo 3 > /proc/sys/vm/drop_caches
    
    journalctl --vacuum-time=3d --quiet
    apt-get clean 2>/dev/null
    rm -rf /home/*/.cache/thumbnails/* 2>/dev/null
}

# Optimize swap usage
optimize_swap() {
    log_message "Optimizing swap..."
    sysctl -w vm.swappiness=10 2>/dev/null
    sysctl -w vm.vfs_cache_pressure=150 2>/dev/null
}

# Main execution
RAM_USAGE=$(get_ram_usage)
SWAP_USAGE=$(get_swap_usage)

log_message "RAM: ${RAM_USAGE}% | SWAP: ${SWAP_USAGE}%"

if [ "$RAM_USAGE" -ge "$CRITICAL_THRESHOLD" ] || [ "$SWAP_USAGE" -ge 80 ]; then
    log_message "CRITICAL: Memory pressure detected!"
    
    clean_caches
    optimize_swap
    optimize_browsers
    optimize_vscode
    
    if [ "$(get_ram_usage)" -ge "$CRITICAL_THRESHOLD" ]; then
        log_message "Killing non-essential processes..."
        pkill -f "gnome-software" 2>/dev/null
        pkill -f "update-notifier" 2>/dev/null
        pkill -f "tracker" 2>/dev/null
    fi
    
elif [ "$RAM_USAGE" -ge "$WARN_THRESHOLD" ]; then
    log_message "WARNING: High memory usage"
    clean_caches
    optimize_swap
fi

log_message "Optimization complete. RAM: $(get_ram_usage)% | SWAP: $(get_swap_usage)%"
```

#### Step 2: Make Script Executable

```bash
sudo chmod +x /usr/local/bin/memory_optimizer.sh
```

#### Step 3: Create Log File

```bash
sudo touch /var/log/memory_optimizer.log
sudo chmod 644 /var/log/memory_optimizer.log
```

#### Step 4: Test the Script

```bash
sudo /usr/local/bin/memory_optimizer.sh
cat /var/log/memory_optimizer.log
```

#### Step 5: Set Up Automatic Execution

**Option A: Cron Job (Simpler)**

```bash
sudo crontab -e
```

Add this line:
```
*/5 * * * * /usr/local/bin/memory_optimizer.sh
```

**Option B: Systemd Service + Timer (Recommended)**

Create service file:
```bash
sudo nano /etc/systemd/system/memory-optimizer.service
```

```ini
[Unit]
Description=Memory Optimizer Service
After=multi-user.target

[Service]
Type=oneshot
ExecStart=/usr/local/bin/memory_optimizer.sh
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

Create timer file:
```bash
sudo nano /etc/systemd/system/memory-optimizer.timer
```

```ini
[Unit]
Description=Memory Optimizer Timer
Requires=memory-optimizer.service

[Timer]
OnBootSec=2min
OnUnitActiveSec=5min
Unit=memory-optimizer.service

[Install]
WantedBy=timers.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable memory-optimizer.timer
sudo systemctl start memory-optimizer.timer
```

## Configuration

### Adjusting Thresholds

Edit the script to change when optimization triggers:

```bash
sudo nano /usr/local/bin/memory_optimizer.sh
```

Modify these values:
```bash
WARN_THRESHOLD=75      # Warning level (75%)
CRITICAL_THRESHOLD=85  # Critical level (85%)
```

### Adjusting Browser Memory Limits

Change the memory threshold for killing browser processes (default: 500MB):

```bash
# Find this line in optimize_browsers():
awk '$6 > 500000 {print $2}'

# Change 500000 to desired value in KB:
# 300000 = 300MB
# 700000 = 700MB
```

### Configure ZRAM (Optional)

If using ZRAM:

```bash
sudo nano /etc/default/zram-config
```

```bash
ZRAM_SIZE=4096  # 4GB compressed RAM
COMP_ALG=lz4    # Faster compression
```

### System Swap Settings

```bash
# Temporary changes
sudo sysctl -w vm.swappiness=10
sudo sysctl -w vm.vfs_cache_pressure=150

# Permanent changes
echo "vm.swappiness=10" | sudo tee -a /etc/sysctl.conf
echo "vm.vfs_cache_pressure=150" | sudo tee -a /etc/sysctl.conf
```

## Usage

### Manual Execution

```bash
sudo /usr/local/bin/memory_optimizer.sh
```

### Check Status

```bash
# View logs
tail -f /var/log/memory_optimizer.log

# Check last 20 entries
tail -20 /var/log/memory_optimizer.log

# Check timer status
sudo systemctl status memory-optimizer.timer

# List all timers
sudo systemctl list-timers
```

### Stop/Start Service

```bash
# Stop timer
sudo systemctl stop memory-optimizer.timer

# Start timer
sudo systemctl start memory-optimizer.timer

# Restart timer
sudo systemctl restart memory-optimizer.timer

# Disable timer
sudo systemctl disable memory-optimizer.timer
```

### Monitor RAM Usage

```bash
# Real-time monitoring
watch -n 2 'free -h && echo "---" && tail -5 /var/log/memory_optimizer.log'

# One-time check
free -h
```

## Troubleshooting

### Script Not Running

```bash
# Check if service is active
sudo systemctl status memory-optimizer.timer

# Check for errors
sudo journalctl -u memory-optimizer.service -n 50

# Manually test script
sudo bash -x /usr/local/bin/memory_optimizer.sh
```

### No Logs Being Created

```bash
# Check log file permissions
ls -la /var/log/memory_optimizer.log

# Recreate log file
sudo touch /var/log/memory_optimizer.log
sudo chmod 644 /var/log/memory_optimizer.log
```

### Browser Keeps Crashing

If browsers crash too frequently, increase the memory threshold:

```bash
sudo nano /usr/local/bin/memory_optimizer.sh

# Change from 500000 (500MB) to 700000 (700MB)
awk '$6 > 700000 {print $2}'
```

### VS Code Extensions Breaking

Disable VS Code optimization:

```bash
sudo nano /usr/local/bin/memory_optimizer.sh

# Comment out the optimize_vscode line:
# optimize_vscode
```

### High Swap Usage Persists

```bash
# Add more swap space
sudo fallocate -l 8G /swapfile2
sudo chmod 600 /swapfile2
sudo mkswap /swapfile2
sudo swapon /swapfile2
echo '/swapfile2 none swap sw 0 0' | sudo tee -a /etc/fstab
```

## Browser Optimization

### Firefox Configuration

Create or edit `~/.mozilla/firefox/*.default-release/user.js`:

```javascript
user_pref("browser.cache.memory.capacity", 51200);
user_pref("browser.sessionhistory.max_entries", 5);
user_pref("browser.cache.memory.max_entry_size", 5120);
user_pref("browser.sessionstore.interval", 60000);
```

### Brave/Chrome Launch Options

```bash
# Create desktop file with memory limits
cat > ~/.local/share/applications/brave-memory-optimized.desktop << 'EOF'
[Desktop Entry]
Version=1.0
Name=Brave (Memory Optimized)
Exec=brave-browser --disk-cache-size=52428800 --media-cache-size=52428800
Terminal=false
Icon=brave-browser
Type=Application
Categories=Network;WebBrowser;
EOF
```

### Recommended Browser Extensions

1. **Tab Suspender Extensions**
   - Chrome/Brave: "The Great Suspender" or "Tab Wrangler"
   - Firefox: "Auto Tab Discard"

2. **Memory Optimization**
   - "OneTab" - Consolidate tabs into a list
   - "Limit Tabs" - Restrict maximum open tabs

3. **Ad Blockers** (Reduce memory from ads)
   - uBlock Origin (all browsers)
   - Built-in Brave Shields

## RAM Upgrade Guide

### Check Current RAM Configuration

```bash
# Detailed RAM info
sudo dmidecode --type memory | grep -E "Size|Type:|Speed:|Locator:|Manufacturer"

# Simpler check
sudo lshw -short -C memory

# Maximum supported RAM
sudo dmidecode -t memory | grep "Maximum Capacity"

# Current RAM modules
free -h
sudo dmidecode -t memory | grep -A 16 "Memory Device" | grep -E "Size|Speed|Type:|Locator"
```

### Determine Laptop vs Desktop

```bash
sudo dmidecode | grep -A 3 "System Information"
sudo dmidecode -t memory | grep "Form Factor"
```

### RAM Cost Estimates (India, 2025)

| Type | Capacity | Approximate Cost (₹) |
|------|----------|---------------------|
| DDR4 Desktop | 4GB | 800-1,200 |
| DDR4 Desktop | 8GB | 1,500-2,500 |
| DDR4 Desktop | 16GB | 3,000-4,500 |
| DDR4 Laptop (SODIMM) | 8GB | 1,800-2,800 |
| DDR4 Laptop (SODIMM) | 16GB | 3,500-5,000 |

### Recommended RAM Brands

- **Crucial** - Best value, lifetime warranty
- **Corsair** - Reliable, good support
- **Kingston** - Budget-friendly
- **G.Skill** - Performance oriented
- **Samsung/Hynix** - OEM quality

### Where to Buy

**Online:**
- Amazon India
- Flipkart
- MD Computers
- PrimeABGB

**Offline (Major Cities):**
- Delhi: Nehru Place
- Mumbai: Lamington Road
- Bangalore: SP Road
- Gurgaon: Cyber Hub electronics stores

## Uninstallation

```bash
# Stop and disable timer
sudo systemctl stop memory-optimizer.timer
sudo systemctl disable memory-optimizer.timer

# Remove files
sudo rm /usr/local/bin/memory_optimizer.sh
sudo rm /etc/systemd/system/memory-optimizer.service
sudo rm /etc/systemd/system/memory-optimizer.timer
sudo rm /var/log/memory_optimizer.log

# Remove cron job (if used)
sudo crontab -e
# Delete the line: */5 * * * * /usr/local/bin/memory_optimizer.sh

# Reload systemd
sudo systemctl daemon-reload
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### How to Contribute

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Reporting Issues

Please use GitHub Issues to report bugs or request features. Include:
- Your Linux distribution and version
- RAM configuration
- Error messages or logs
- Steps to reproduce

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by the challenges of running modern development tools on low-memory systems
- Thanks to the Linux community for swap and memory management best practices

## Support

For issues and questions:
- **GitHub Issues**: [Report a bug](https://github.com/YOUR_USERNAME/memory-optimizer/issues)
- **Discussions**: [Ask questions](https://github.com/YOUR_USERNAME/memory-optimizer/discussions)

---

**Note**: This tool is designed for systems with 3-8GB RAM. For systems with more RAM, the aggressive optimization may not be necessary. For production servers, consult with your system administrator before deploying.

**Warning**: This script kills processes aggressively. Save your work frequently and test thoroughly before deploying in production environments.