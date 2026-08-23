#!/bin/bash
# Veridia HealthTech — Database Restore Script
# Usage: ./scripts/restore.sh <backup-file>

set -e

if [ -z "$1" ]; then
  echo "Usage: $0 <backup-file>"
  echo "Example: $0 ./backups/veridia_daily_20260115_120000.sql.gz"
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ Backup file not found: $BACKUP_FILE"
  exit 1
fi

echo "⚠️  WARNING: This will overwrite the current database!"
echo "Press Ctrl+C to cancel, or wait 5 seconds to continue..."
sleep 5

# Database connection from environment
DATABASE_URL="${DATABASE_URL:-postgresql://user:pass@localhost:5432/veridia}"

# Extract connection details
DB_HOST=$(echo "$DATABASE_URL" | sed -n 's|.*@\([^:]*\).*|\1|p')
DB_PORT=$(echo "$DATABASE_URL" | sed -n 's|.*:\([0-9]*\)/.*|\1|p')
DB_NAME=$(echo "$DATABASE_URL" | sed -n 's|.*/\([^?]*\).*|\1|p')
DB_USER=$(echo "$DATABASE_URL" | sed -n 's|://\([^:]*\):.*|\1|p')

echo "🔄 Restoring from: $BACKUP_FILE"

# Restore using pg_restore
PGPASSWORD="${DATABASE_URL##*:}" pg_restore \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --clean \
  --if-exists \
  --verbose \
  "$BACKUP_FILE" 2>/dev/null

if [ $? -eq 0 ]; then
  echo "✅ Restore completed successfully!"
else
  echo "⚠️  Restore completed with some warnings (this is normal for existing objects)"
fi
