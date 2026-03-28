#!/bin/bash
set -e

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "❌ Вкажи файл бекапу:"
    echo "   ./scripts/restore.sh ./backups/backup_20260328_120000.sql"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Файл не знайдено: $BACKUP_FILE"
    exit 1
fi

echo "️Відновлюємо базу з $BACKUP_FILE..."
read -p "Ти впевнений? Поточні дані будуть замінені! (y/n): " CONFIRM
if [ "$CONFIRM" != "y" ]; then
    echo "Скасовано."
    exit 0
fi

echo "Відновлюємо..."
docker-compose exec -T db psql \
    -U "${DB_USER:-postgres}" \
    "${DB_NAME:-morningstar}" < "$BACKUP_FILE"

echo "Базу відновлено!"