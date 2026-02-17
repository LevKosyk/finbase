# Backup and Restore

## Backup
1. Set `DATABASE_URL` for production DB connection.
2. Run:
   ```bash
   chmod +x scripts/backup_db.sh
   DATABASE_URL='postgres://...' ./scripts/backup_db.sh
   ```
3. Store dumps in secure remote storage (S3/Backblaze) with retention policy.

## Restore Test
1. Create temporary database.
2. Run:
   ```bash
   pg_restore --no-owner --no-privileges --dbname='postgres://...' backups/finbase_YYYYMMDD_HHMMSS.dump
   ```
3. Execute smoke checks:
   - Login
   - Dashboard load
   - Income/expense create
   - Export/documents

## Schedule
- Daily backup.
- Weekly restore test in staging.
