#!/bin/bash
# Veridia HealthTech — Database Backup Script
# Usage: ./scripts/backup.sh [daily|weekly|manual]

set -e

BACKUP_TYPE="${1:-daily}"
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/veridia_${BACKUP_TYPE}_${TIMESTAMP}.sql.gz"

# Create backup directory
mkdir -p "$BACKUP_DIR"

echo "🗄️  Starting ${BACKUP_TYPE} backup..."

# Database connection from environment
DATABASE_URL="${DATABASE_URL:-postgresql://user:pass@localhost:5432/veridia}"

# Extract connection details
DB_HOST=$(echo "$DATABASE_URL" | sed -n 's|.*@\([^:]*\).*|\1|p')
DB_PORT=$(echo "$DATABASE_URL" | sed -n 's|.*:\([0-9]*\)/.*|\1|p')
DB_NAME=$(echo "$DATABASE_URL" | sed -n 's|.*/\([^?]*\).*|\1|p')
DB_USER=$(echo "$DATABASE_URL" | sed -n 's|://\([^:]*\):.*|\1|p')

# Run pg_dump
PGPASSWORD="${DATABASE_URL##*:}" pg_dump \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --format=custom \
  --compress=9 \
  --verbose \
  > "$BACKUP_FILE" 2>/dev/null

# Check if backup was successful
if [ $? -eq 0 ]; then
  BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
  echo "✅ Backup completed: $BACKUP_FILE ($BACKUP_SIZE)"
  
  # Cleanup old backups (keep 30 days for daily, 90 days for weekly)
  if [ "$BACKUP_TYPE" = "daily" ]; then
    find "$BACKUP_DIR" -name "veridia_daily_*" -mtime +30 -delete
    echo "🧹 Cleaned up daily backups older than 30 days"
  elif [ "$BACKUP_TYPE" = "weekly" ]; then
    find "$BACKUP_DIR" -name "veridia_weekly_*" -mtime +90 -delete
    echo "🧹 Cleaned up weekly backups older than 90 days"
  fi
else
  echo "❌ Backup failed!"
  exit 1
fi
