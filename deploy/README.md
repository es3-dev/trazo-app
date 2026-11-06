# Despliegue público de TRAZO

Esta configuración publica la aplicación con HTTPS automático mediante Caddy. PostgreSQL y la API no exponen puertos al exterior: solo se publica el proxy web en `80` y `443`.

## Requisitos

1. Un servidor Linux con Docker Engine y Docker Compose Plugin.
2. Un dominio o subdominio que apunte por DNS (registro `A`) a la IP pública del servidor.
3. Puertos TCP `80` y `443` permitidos en el firewall y en el proveedor.

## Primera publicación

```bash
cp .env.production.example .env.production
# Genere secretos con `openssl rand -hex 32` y edite .env.production:
# dominio, contraseña de PostgreSQL y JWT_SECRET.
docker compose --env-file .env.production -f docker-compose.production.yml up -d --build
```

Caddy solicita y renueva el certificado HTTPS automáticamente cuando el DNS ya apunta al servidor. Compruebe la publicación con:

```bash
docker compose --env-file .env.production -f docker-compose.production.yml ps
curl -I https://SU_DOMINIO/health
```

## Operación

Actualización: ejecute de nuevo el comando `up -d --build`. Copia de seguridad: `docker compose --env-file .env.production -f docker-compose.production.yml exec -T db pg_dump -U trazo trazo_db > trazo_backup.sql`.

Nunca copie `.env.production` a Git ni exponga los puertos de PostgreSQL al público.
