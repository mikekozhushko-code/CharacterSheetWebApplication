#!/bin/bash
set -e

BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql"

mkdir -p "$BACKUP_DIR"

echo "Створюємо бекап..."
docker-compose exec -T db pg_dump \
    -U "${DB_USER:-postgres}" \
    "${DB_NAME:-morningstar}" > "$BACKUP_FILE"

echo "Бекап збережено: $BACKUP_FILE"