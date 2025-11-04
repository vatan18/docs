### 🐘 **Full PostgreSQL Backup + Restore Script**

Save as: `backup_and_restore_kgs_drive.sh`

```bash
#!/bin/bash
set -e  # Stop the script if any command fails

# === Configuration ===
HOST="kgs-drive-qa.cyklnogb0lgn.ap-south-1.rds.amazonaws.com"
PORT="5432"
USER="postgres"
DB_NAME="kgs-drive"
BACKUP_FILE="dump (1).backup"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_BEFORE="pre_restore_${DB_NAME}_${DATE}.backup"

echo "========================================"
echo " 🐘  PostgreSQL Backup and Restore Script "
echo "========================================"
echo ""

# Step 1: Take backup before restore
echo "🔹 Taking backup of current database '$DB_NAME'..."
pg_dump -h $HOST -U $USER -p $PORT -Fc -f "$BACKUP_BEFORE" "$DB_NAME"
echo "✅ Backup saved as $BACKUP_BEFORE"
echo ""

# Step 2: Drop existing connections
echo "🔹 Terminating existing connections to '$DB_NAME'..."
psql -h $HOST -U $USER -p $PORT -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='$DB_NAME';"

# Step 3: Drop existing database
echo "🔹 Dropping existing database '$DB_NAME'..."
psql -h $HOST -U $USER -p $PORT -d postgres -c "DROP DATABASE IF EXISTS \"$DB_NAME\";"

# Step 4: Recreate database
echo "🔹 Creating new database '$DB_NAME'..."
psql -h $HOST -U $USER -p $PORT -d postgres -c "CREATE DATABASE \"$DB_NAME\";"

# Step 5: Restore new dump
echo "🔹 Restoring database from '$BACKUP_FILE'..."
pg_restore -h $HOST -U $USER -d "$DB_NAME" -p $PORT --verbose "$BACKUP_FILE"

echo ""
echo "✅ All done! Database '$DB_NAME' restored successfully."
echo "📦 Previous backup saved as: $BACKUP_BEFORE"
```

---

### ⚙️ **How to Run**

1. Save it:

   ```bash
   nano backup_and_restore_kgs_drive.sh
   ```

   (Paste the code above.)

2. Make it executable:

   ```bash
   chmod +x backup_and_restore_kgs_drive.sh
   ```

3. Run:

   ```bash
   ./backup_and_restore_kgs_drive.sh
   ```

---

### 🧠 Notes

* Backup file (`pre_restore_kgs-drive_YYYYMMDD_HHMMSS.backup`) will be created in the same directory.
* If your `.backup` is version-mismatched again, you can convert it first using the same `pg_dump` version as the server.
* If the dump is plain SQL, replace the `pg_restore` line with:

  ```bash
  psql -h $HOST -U $USER -d "$DB_NAME" -p $PORT -f "$BACKUP_FILE"
  ```

Perfect 👌 — then you don’t need `tee` or log redirection at all.
To see **live output** (both normal and error logs) directly on your terminal, just run it like this 👇

---

### ✅ Run the script and see **live logs in real time**

```bash
bash -x ./backup_and_restore_kgs_drive.sh
```

**Explanation:**

* `bash -x` → enables debug mode so every command being executed is printed live.
  (You’ll see both the commands and their outputs line-by-line.)

---

### 💡 If you don’t want debug trace (just clean live output)

Then simply run:

```bash
bash ./backup_and_restore_kgs_drive.sh
```

That will show all stdout and stderr live in terminal — perfect for watching progress (e.g., from `pg_dump`, `pg_restore`, etc).

---

### 🔍 Optional — to highlight errors in red (nicer for watching)

If your shell supports colors, run:

```bash
bash -x ./backup_and_restore_kgs_drive.sh 2> >(grep --color=always -E "ERROR|FATAL|^" >&2)
```

That way, any line containing `ERROR` or `FATAL` will be shown in red.

