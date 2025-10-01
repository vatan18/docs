# Backup Local Folder on ownCloud using rsync

## Overview
To back up a local folder on **ownCloud** in **Ubuntu**, we use `rsync`, a powerful file synchronization tool. The command ensures efficient data transfer while preserving file attributes.

## Installing ownCloud Client (If Not Installed)
To install the ownCloud client, run:
```bash
sudo apt update
sudo apt install owncloud-client
```

## Sync Local Folder with ownCloud
- Open **ownCloud Client** (`owncloud` command if running from the terminal).
- **Login** to your ownCloud server.
- Click **"Add Folder Sync Connection"**.
- Choose your **local folder** and map it to the **ownCloud directory**.

## Using rsync for Backup
To manually back up a folder to ownCloud, use the `rsync` command:

```bash
rsync -avz /home/vatan.kumar201/gunnerroofing/ /home/vatan.kumar201/ownCloud/gunnerroofing

rsync -avz /home/vatan.kumar201/lth/ /home/vatan.kumar201/ownCloud/lth/
```

### Explanation of Options:
- **`-a` (Archive mode)** → Preserves file attributes like timestamps, permissions, symbolic links, and directories.
- **`-v` (Verbose mode)** → Displays detailed output of the transfer process.
- **`-z` (Compression)** → Reduces data transfer size by compressing files during transfer.

## Automate Backup with Cron
To automate the backup process, add a cron job:
```bash
crontab -e
```
Then add the following lines to schedule backups every night at 2 AM:
```bash
0 2 * * * rsync -avz /home/vatan.kumar201/gunnerroofing/ /home/vatan.kumar201/ownCloud/gunnerroofing
0 2 * * * rsync -avz /home/vatan.kumar201/lth/ /home/vatan.kumar201/ownCloud/lth/
```

## Verify Sync
To check if the files are correctly synced, use:
```bash
owncloudcmd --status /home/vatan.kumar201/ownCloud/
```

## Conclusion
Using `rsync` with ownCloud ensures that your local folders are backed up efficiently while maintaining file integrity. Automating the process with **cron** further simplifies the task. 🚀

