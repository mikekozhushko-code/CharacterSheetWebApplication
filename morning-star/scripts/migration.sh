#!/bin/bash

APP=$1

if [ -z "$APP" ]; then
  echo "Застосовуємо всі міграції..."
  docker-compose exec backend python manage.py migrate
else
  echo "Створюємо міграції для '$APP'..."
  docker-compose exec backend python manage.py makemigrations "$APP"
  echo "Застосовуємо міграції для '$APP'..."
  docker-compose exec backend python manage.py migrate "$APP"
fi