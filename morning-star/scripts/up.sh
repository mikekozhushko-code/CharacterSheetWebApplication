#!/bin/bash
set -e

echo "Зупиняємо контейнери..."
docker-compose down

echo "Перебудовуємо образи..."
docker-compose build --no-cache

echo "Запускаємо..."
docker-compose up -d

echo "Готово!"