# Remove Sudo Requirement for Docker Commands

## Add User to Docker Group

1. Add current user to docker group:
```bash
sudo usermod -aG docker $USER
```

2. Apply changes without logout:
```bash
newgrp docker
```

## Verification
Try running a Docker command without sudo:
```bash
docker ps
```
-----------------------------
## docker-compose rebuild 
```bash
docker-compose up --build
```
## docker-compose rebuild from scratch 
```bash
docker-compose down -v --remove-orphans && docker-compose up --build
```