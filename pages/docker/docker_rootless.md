# Running Multiple Docker Instances

## Overview
This guide explains how to run both rootful and rootless Docker instances on Ubuntu 22.04.

## Setup Instructions

1. Install rootless Docker:
```bash
dockerd-rootless-setuptool.sh install 
systemctl --user start docker.service
```

2. Configure Docker daemon:
```bash
# For rootful Docker
export DOCKER_HOST="unix:///var/run/docker.sock"

# For rootless Docker
export DOCKER_HOST="unix://$XDG_RUNTIME_DIR/docker.sock"
```

## Notes
- Both instances work independently
- Separate image caches and container lists
- Network setups may require additional configuration
```