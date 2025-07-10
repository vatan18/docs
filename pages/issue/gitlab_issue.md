# ✅ Post-Restore or Permission Issue Fix Script

Use this block after restoring a backup or migrating GitLab, especially if services like Redis/PostgreSQL fail to start due to permission errors.

## 🔧 1. Reset Ownership of GitLab Data

```bash
chown -R git:git /var/opt/gitlab
```

## 🔧 2. Fix Redis Permissions (if Redis won't start)

Check for permission denied in `/var/log/gitlab/redis/current`.

```bash
ls -l /var/opt/gitlab/redis/redis.conf
chown git:git /var/opt/gitlab/redis/redis.conf
```

If the directory itself has bad permissions:

```bash
chown -R git:git /var/opt/gitlab/redis
```

## 🔧 3. Fix PostgreSQL Permissions (if PostgreSQL won't start)

Check log file: `/var/log/gitlab/postgresql/current`

```bash
ls -ld /var/opt/gitlab/postgresql/data
chown -R git:git /var/opt/gitlab/postgresql
```

## 🚀 Restart GitLab After Fixes

Restart all services:

```bash
gitlab-ctl restart
```

Or restart specific failing services:

Example:

```bash
gitlab-ctl restart redis postgresql
```

## 📊 Check GitLab Status

```bash
gitlab-ctl status
```

You should see all services marked as `run`.

## 📄 Tail Logs for Troubleshooting

If something goes down again, inspect its log:

```bash
tail -n 50 /var/log/gitlab/redis/current
tail -n 50 /var/log/gitlab/postgresql/current
tail -n 50 /var/log/gitlab/gitlab-rails/production.log
```

## ⛑️ Optional: Reconfigure GitLab (if config changes)

Use this if you've changed `gitlab.rb` or after major permission or structural repairs:

```bash
gitlab-ctl reconfigure
```

---

#!/bin/bash

# GitLab Post-Restore Permission Fix Script
# Use this after restoring a backup or migrating GitLab
# Run as root or with sudo privileges

set -e  # Exit on any error

echo "🔧 GitLab Post-Restore Permission Fix Script"
echo "=============================================="

# Function to check if a service is running
check_service() {
    local service=$1
    if gitlab-ctl status | grep -q "$service.*run"; then
        echo "✅ $service is running"
        return 0
    else
        echo "❌ $service is not running"
        return 1
    fi
}

# Function to display logs for troubleshooting
show_logs() {
    echo ""
    echo "📄 Recent logs for troubleshooting:"
    echo "-----------------------------------"
    echo "Redis logs:"
    tail -n 10 /var/log/gitlab/redis/current 2>/dev/null || echo "No Redis logs found"
    echo ""
    echo "PostgreSQL logs:"
    tail -n 10 /var/log/gitlab/postgresql/current 2>/dev/null || echo "No PostgreSQL logs found"
    echo ""
}

```bash
echo ""
echo "🔧 Step 1: Resetting ownership of GitLab data directories..."
chown -R git:git /var/opt/gitlab
echo "✅ GitLab data ownership reset"

echo ""
echo "🔧 Step 2: Fixing Redis permissions..."
if [ -f /var/opt/gitlab/redis/redis.conf ]; then
    chown git:git /var/opt/gitlab/redis/redis.conf
    echo "✅ Redis config permissions fixed"
else
    echo "⚠️  Redis config not found, skipping"
fi

if [ -d /var/opt/gitlab/redis ]; then
    chown -R git:git /var/opt/gitlab/redis
    echo "✅ Redis directory permissions fixed"
fi

echo ""
echo "🔧 Step 3: Fixing PostgreSQL permissions..."
if [ -d /var/opt/gitlab/postgresql ]; then
    chown -R git:git /var/opt/gitlab/postgresql
    echo "✅ PostgreSQL permissions fixed"
else
    echo "⚠️  PostgreSQL directory not found, skipping"
fi

echo ""
echo "🚀 Step 4: Restarting GitLab services..."
gitlab-ctl restart
echo "✅ GitLab services restarted"

echo ""
echo "⏳ Waiting for services to fully start..."
sleep 15

echo ""
echo "📊 Step 5: Checking GitLab status..."
gitlab-ctl status

echo ""
echo "🔍 Service Check Summary:"
echo "------------------------"
services=("redis" "postgresql" "gitlab-rails" "nginx" "sidekiq")
all_running=true

for service in "${services[@]}"; do
    if ! check_service "$service"; then
        all_running=false
    fi
done

if [ "$all_running" = true ]; then
    echo ""
    echo "🎉 All critical services are running!"
    echo "GitLab should now be accessible."
else
    echo ""
    echo "⚠️  Some services are not running. Showing recent logs..."
    show_logs
    echo ""
    echo "💡 Troubleshooting suggestions:"
    echo "1. Check specific service logs: tail -f /var/log/gitlab/[service]/current"
    echo "2. Try restarting specific services: gitlab-ctl restart [service-name]"
    echo "3. If issues persist, run: gitlab-ctl reconfigure"
fi

echo ""
echo "📋 Additional commands for troubleshooting:"
echo "- View all logs: gitlab-ctl tail"
echo "- Restart specific service: gitlab-ctl restart [service-name]"
echo "- Reconfigure GitLab: gitlab-ctl reconfigure"
echo "- Check GitLab health: gitlab-rake gitlab:check"
echo ""
echo "Script completed!"