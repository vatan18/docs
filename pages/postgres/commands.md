# PostgreSQL Docker and Database Management Guide

## PostgreSQL Binary Paths
Common paths for PostgreSQL 16 binaries:
```bash
PSQL_PATH=/usr/lib/postgresql/16/bin/psql
PGDUMP_PATH=/usr/lib/postgresql/16/bin/pg_dump
PGRESTORE_PATH=/usr/lib/postgresql/16/bin/pg_restore
```

## Docker Container Management
[Previous Docker container section remains the same as it uses Docker commands...]

## Database Initialization

### Create Users and Databases
```bash
# Using PSQL with heredoc
/usr/lib/postgresql/16/bin/psql -v ON_ERROR_STOP=1 \
    --username "$POSTGRES_USER" \
    --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE USER docker;
    CREATE DATABASE docker;
    GRANT ALL PRIVILEGES ON DATABASE docker TO docker;
    CREATE DATABASE myapp_dev;
    CREATE DATABASE myapp_test;
EOSQL

# Create database with specific encoding and locale
/usr/lib/postgresql/16/bin/psql -v ON_ERROR_STOP=1 \
    --username "$POSTGRES_USER" \
    --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE DATABASE multilingual_db \
    WITH ENCODING='UTF8' \
    LC_COLLATE='en_US.UTF-8' \
    LC_CTYPE='en_US.UTF-8' \
    TEMPLATE=template0;
EOSQL
```

## Database Backup and Restore

### pg_dump Commands
```bash
# Basic SQL format dump
/usr/lib/postgresql/16/bin/pg_dump -h localhost \
    -U postgres \
    -d database_name \
    -f backup.sql

# Custom format dump (compressed)
/usr/lib/postgresql/16/bin/pg_dump --verbose \
    --host=hostname \
    --port=5432 \
    --username=user \
    --format=c \
    --file backup.dump \
    -n public database_name

# Dump with exclude tables
/usr/lib/postgresql/16/bin/pg_dump --verbose \
    --host=hostname \
    --port=5432 \
    --username=user \
    --format=c \
    --exclude-table=table1 \
    --exclude-table=table2 \
    --file backup.dump \
    database_name

# Dump specific schemas with clean option
/usr/lib/postgresql/16/bin/pg_dump --verbose \
    --host=hostname \
    --port=5432 \
    --username=user \
    --format=c \
    --clean \
    --file backup.dump \
    --schema=schema1 \
    --schema=schema2 \
    database_name

# Dump only data (no schema)
/usr/lib/postgresql/16/bin/pg_dump --verbose \
    --host=hostname \
    --port=5432 \
    --username=user \
    --format=c \
    --data-only \
    --file backup.dump \
    database_name
```

### pg_restore Commands
```bash
# Basic restore from custom format
/usr/lib/postgresql/16/bin/pg_restore --verbose \
    --host=hostname \
    --port=5432 \
    --username=user \
    --dbname=database_name \
    backup.dump

# Restore with specific options and parallel jobs
/usr/lib/postgresql/16/bin/pg_restore --verbose \
    --host=hostname \
    --port=5432 \
    --username=user \
    --format=c \
    --dbname=database_name \
    --no-owner \
    --no-privileges \
    --jobs=4 \
    backup.dump

# Restore specific schemas with clean option
/usr/lib/postgresql/16/bin/pg_restore --verbose \
    --host=hostname \
    --port=5432 \
    --username=user \
    --dbname=database_name \
    --clean \
    --schema=schema_name \
    backup.dump

# Restore only data (no schema)
/usr/lib/postgresql/16/bin/pg_restore --verbose \
    --host=hostname \
    --port=5432 \
    --username=user \
    --data-only \
    --dbname=database_name \
    backup.dump
```

### Practical Examples for Different Environments

```bash
# Development Environment Backup
/usr/lib/postgresql/16/bin/pg_dump --verbose \
    --host=dev-gunner-aurorapgdb-db-cluster.example.com \
    --port=5432 \
    --username=gunner_admin \
    --format=c \
    --file /path/to/backups/dev-backup-$(date +%Y%m%d%H%M).dump \
    -n public database_name

# QA Environment Restore
/usr/lib/postgresql/16/bin/pg_restore --verbose \
    --host=qa-gunner-aurorapgdb-db-cluster.example.com \
    --port=5432 \
    --username=gunner_admin \
    --format=c \
    --dbname=target_database \
    /path/to/backups/dev-backup.dump

# Production Backup with Compression
/usr/lib/postgresql/16/bin/pg_dump --verbose \
    --host=prod-db-cluster.example.com \
    --port=5432 \
    --username=prod_admin \
    --format=c \
    --compress=9 \
    --file /path/to/backups/prod-backup-$(date +%Y%m%d%H%M).dump \
    database_name
```

## PSQL Interactive Commands

```bash
# Connect to database with specific version
/usr/lib/postgresql/16/bin/psql \
    -h hostname \
    -U username \
    -d database_name

# Common PSQL meta-commands (execute after connecting)
\l                  # List all databases
\c dbname           # Connect to specific database
\dt                 # List all tables
\dt schema.*        # List tables in specific schema
\d tablename        # Describe table
\du                 # List users and roles
\dx                 # List installed extensions
\dn                # List schemas
\dp                # List table access privileges
\timing            # Toggle timing of commands
\e                 # Open editor
\x                 # Toggle expanded display
\q                 # Quit psql
```

## Advanced Usage Examples

```bash
# Backup with progress report and compression
/usr/lib/postgresql/16/bin/pg_dump --verbose \
    --host=hostname \
    --port=5432 \
    --username=user \
    --format=c \
    --compress=9 \
    --file backup.dump \
    --progress \
    database_name

# Restore with schema validation only (no actual restore)
/usr/lib/postgresql/16/bin/pg_restore --verbose \
    --host=hostname \
    --port=5432 \
    --username=user \
    --list \
    backup.dump

# Backup specific tables with data filtering
/usr/lib/postgresql/16/bin/pg_dump --verbose \
    --host=hostname \
    --port=5432 \
    --username=user \
    --format=c \
    --table=public.table1 \
    --where="created_at > '2024-01-01'" \
    --file backup.dump \
    database_name
```

## Important Notes

1. **Version Management:**
   - Always use full paths to ensure correct version usage
   - Keep track of PostgreSQL versions across environments
   - Test compatibility when moving data between versions

2. **Backup Best Practices:**
   - Include timestamp in backup filenames
   - Use compressed format (-Fc) for large databases
   - Consider using --jobs for parallel operations
   - Regular validation of backup files

3. **Common Issues:**
   - Wrong binary version for target database
   - Path permission issues
   - Version mismatch between pg_dump and pg_restore
   - Insufficient disk space for operations

4. **Security:**
   - Use .pgpass file for password management
   - Set appropriate file permissions
   - Use SSL for remote connections
   - Regular audit of user permissions