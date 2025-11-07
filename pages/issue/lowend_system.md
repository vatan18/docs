
# For a permanent change (requires additional configuration steps), you might need to install and configure cpufrequtils and disable the default ondemand service:
```bash
sudo apt install cpufrequtils
echo 'GOVERNOR="performance"' | sudo tee /etc/default/cpufrequtils
sudo systemctl disable ondemand.service
```

Reverting Changes
To return your system to its default power management settings, you can either select Balanced in the GUI Power Settings or use the command line:
bash

sudo powerprofilesctl set balanced

Use code with caution.
bash

# To revert manual cpufrequtils changes:
sudo apt remove cpufrequtils
# Or edit /etc/default/cpufrequtils and change GOVERNOR="ondemand" (or remove the file)


