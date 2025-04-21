# Display Scale down
## Description: Scale down Display/Resolution in X11-based Linux Desktops

This guide provides methods to scale the desktop display or individual applications while keeping the screen resolution unchanged. It focuses on manual configurations using the Xorg X11 system for desktops such as KDE, Gnome, and XFCE. The goal is to scale desktop environments or applications without altering the actual screen resolution.

## Scaling Applications

## Scaling the Desktop with Xorg X11

### Xrandr Scaling

Xrandr, an Xorg extension, can scale the desktop, making it suitable for HiDPI displays without altering the actual screen resolution.

### Get the Screen Name:

Use the following command to identify the connected screen:

```bash
xrandr | grep connected | grep -v disconnected | awk '{print $1}'

```

### Scale Down the Desktop (Zoom-In):

```bash
xrandr --output screen-name --scale 0.8x0.8

```

### Scale Up the Desktop (Zoom-Out):

```bash
xrandr --output screen-name --scale 1.2x1.2

```

### Reset Scaling:

```bash
xrandr --output screen-name --scale 1x1

```

### Simulate Higher Resolutions

You can simulate higher resolutions by combining `--mode`, `--panning`, and `--scale` options in `xrandr`.

### Example for Simulated Resolution:

1. Get the current screen resolution:
    
    ```bash
    xdpyinfo | grep -B 2 resolution
    
    ```
    
2. Calculate the new scaled resolution. For example, for a 1366x768 screen:
    - Scale factor: 1.2
    - New resolution: 1640x922
3. Apply the changes:
    
    ```bash
    xrandr --output screen-name --mode 1366x768 --panning 1640x922 --scale 1.2x1.2
    
    ```
    

### Reset to Default:

```bash
xrandr --output screen-name --mode 1366x768 --panning 1366x768 --scale 1x1

```

### Making Xrandr Changes Persistent

You can make xrandr changes persistent by adding the xrandr commands to an autostart script.

Example script in `~/.config/autostart`:

```bash
# Script to apply xrandr settings at startup
xrandr --output eDP1 --mode 1366x768 --panning 1574x886 --scale 1.15x1.15

```

## Wayland as an Alternative

While Xrandr works well for X11, **Wayland** is recommended for better scaling, especially with fractional scaling. Unlike X11, Wayland allows different scales per monitor and better rendering for HiDPI displays.

### Enabling Wayland:

1. Install `plasma-wayland-session` or `plasma-workspace-wayland` for KDE.
2. During login, switch from "Plasma (X11)" to "Plasma (Wayland)".

## References:

- https://unix.stackexchange.com/questions/596887/how-to-scale-the-resolution-display-of-the-desktop-and-or-applications
- **KDE Settings**: `systemsettings5 > display`, `kcmshell5 xserver`, `kinfocenter`
- **Useful Commands**: `gsettings`, `xdpyinfo`, `xrandr`

For more detailed information, refer to [Xorg Documentation](https://gitlab.freedesktop.org/xorg) or the respective desktop environment's documentation.