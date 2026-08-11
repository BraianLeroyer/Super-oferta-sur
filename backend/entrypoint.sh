#!/usr/bin/env bash
set -e

echo "Esperando a la base de datos PostgreSQL..."
python -c "
import time, psycopg2, os
db_url = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@db:5432/la_anonima_db')
for i in range(30):
    try:
        conn = psycopg2.connect(db_url)
        conn.close()
        print('¡PostgreSQL disponible!')
        break
    except Exception as e:
        print(f'Esperando DB... ({i+1}/30)')
        time.sleep(1)
"

echo "Ejecutando Seeding e Inicialización..."
python app/seed.py

exec "$@"
