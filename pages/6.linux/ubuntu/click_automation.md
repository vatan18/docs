# Documentation for GCR Image Deletion Script

This document provides an overview of a Bash script designed to automate the deletion of Google Container Registry (GCR) images on Google Cloud using mouse and keyboard automation. The script utilizes the `xdotool` tool and is bound to a keyboard shortcut for quick activation on Ubuntu.

## Purpose
The script automates the following actions:
1. Simulates mouse clicks at specific coordinates in a browser to interact with the GCR user interface.
2. Switches the browser tab to perform additional operations.

## Prerequisites
### 1. Install `xdotool`
Ensure that `xdotool` is installed on your Ubuntu system. To install:
```bash
sudo apt-get update
sudo apt-get install xdotool
```

### 2. Script File
Save the script as a `.sh` file, e.g., `delete_gcr_images.sh`. The script is as follows:

```bash
#!/bin/bash

sleep 3  # Gives you time to position cursor
#xdotool click --repeat 1 1
xdotool mousemove 1648 566 click 1
xdotool mousemove 1847 230 click 1
sleep 0.5
xdotool mousemove 2530 731 click 1
xdotool mousemove 2535 760 click 1

sleep 0.5
xdotool key --clearmodifiers ctrl+Tab
```

### 3. Keyboard Shortcut Setup
To bind the script to a keyboard shortcut:

1. Open the **Settings** on Ubuntu.
2. Navigate to **Keyboard Shortcuts**.
3. Click **Add Custom Shortcut**.
4. Enter the following details:
   - **Name**: Delete GCR Images
   - **Command**: `/path/to/delete_gcr_images.sh`
5. Assign a shortcut key combination, e.g., `Ctrl + Shift + S`.

Ensure the script has executable permissions:
```bash
chmod +x /path/to/delete_gcr_images.sh
```

## How It Works
1. **Activation**: Press `Ctrl + Shift + S` to trigger the script.
2. **Delay**: A 3-second delay is added to allow you to position the cursor or switch to the appropriate browser window.
3. **Mouse Actions**: The script moves the mouse to specific coordinates and performs clicks to delete GCR images.
   - Coordinates can be adjusted based on your screen resolution or the browser UI layout.
4. **Tab Switch**: The script simulates a `Ctrl + Tab` keypress to switch to the next browser tab.

## Notes
- Adjust the coordinates in the script (`xdotool mousemove`) to match your screen resolution and the location of the clickable elements in the GCR UI.
- Add more actions to the script if additional steps are required for image deletion.
- Test the script with caution to avoid accidental clicks outside the intended targets.

## Troubleshooting
1. **Script Not Working:**
   - Verify that `xdotool` is installed.
   - Check that the script has executable permissions.
   - Ensure the correct path to the script is provided in the keyboard shortcut configuration.
2. **Coordinates Are Incorrect:**
   - Use the following command to identify precise screen coordinates:
     ```bash
     xdotool getmouselocation
     ```
3. **Keyboard Shortcut Not Responding:**
   - Confirm that the shortcut is properly configured in the system settings.

## Disclaimer
The script is designed for automating browser actions in a controlled environment. Use responsibly and ensure compliance with Google Cloud policies and terms of service.

