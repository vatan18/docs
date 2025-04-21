# Disk Usage Command Documentation

## 1. Command to Check Disk Usage in Home Directory

```bash
du -h --max-depth=1 ~/
```

### Description:
This command displays the disk usage of each directory within the home directory. It provides a summary of the space used by each directory, making it easier to identify large directories at a glance.

### Options:
- `du`: Disk usage command.
- `-h`: Human-readable format. Sizes are displayed in KB, MB, GB, etc.
- `--max-depth=1`: Limits the output to directories directly within the specified directory (`~/`), without diving into subdirectories.
- `~/`: Represents the user's home directory.

### Example Output:
```
1.5G    /home/user/Documents
2.3G    /home/user/Downloads
500M    /home/user/Pictures
```

### Usage Notes:
- This command helps in understanding the space distribution among directories in your home directory.
- For more detailed analysis, you can increase the `--max-depth` value to explore subdirectories.

---

## 2. Command to List Directories or Files Larger Than 10 GB

```bash
du -h --max-depth=1 ~/ | grep '^[0-9\.]\+G'
```

### Description:
This command filters the output of `du` to display only directories or files in the home directory that are using more than 10 GB of space. It helps in identifying large directories or files that may need attention.

### Options:
- `du -h --max-depth=1 ~/`: Same as the previous command; lists disk usage for directories directly within the home directory in a human-readable format.
- `grep '^[0-9\.]\+G'`: Filters the output to show only lines where the size is specified in gigabytes (GB).

### Example Output:
```
15G    /home/user/large_directory
12G    /home/user/another_large_directory
```

### Usage Notes:
- This command is useful for pinpointing large directories or files that could be consuming significant disk space.
- If you want to filter by a different size threshold, you can adjust the `grep` pattern accordingly.
