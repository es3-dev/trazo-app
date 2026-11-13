# TRAZO

TRAZO es una plataforma de control diario de obra. Digitaliza la información que normalmente se registra en papel: partes de jornada, personal, equipos, documentos, evidencias fotográficas, planificación e inspecciones. Está pensada para que el equipo de campo registre lo que sucede en la obra y para que supervisión, dirección y administración tengan trazabilidad y una lectura clara del estado operativo.

La solución se compone de React/Vite, una API Express/TypeScript, Prisma y PostgreSQL; todos los servicios se levantan mediante Docker Compose.

## Qué puede hacer

- Consultar un panel operativo con alertas, métricas y salud de cada obra.
- Gestionar obras, empresas, personal, roles, cargos y asignaciones.
- Registrar partes diarios con clima, asistencia, maquinaria, tareas, incidencias, suministros y observaciones.
- Adjuntar evidencias fotográficas, previsualizarlas y retirar una imagen antes de confirmar el parte.
- Gestionar documentos, planificación de actividades e inspecciones de calidad, seguridad y ambiente.

## Requisitos

- Docker Engine con Docker Compose Plugin.
- Navegador web moderno.

No necesita instalar Node.js ni PostgreSQL para probar el proyecto con Docker.

## Inicio rápido

1. Copie `.env.example` como `.env` y asigne valores seguros a `POSTGRES_PASSWORD` y `JWT_SECRET` (mínimo 32 caracteres). Asegúrese de que `DATABASE_URL` use la misma contraseña definida en `POSTGRES_PASSWORD`.
2. Ejecute `docker compose up -d --build` desde esta carpeta.
3. Abra `http://localhost:5173`. API: `http://localhost:3000/health`.

La primera ejecución aplica las migraciones. El conjunto de capacitación se carga de forma explícita, para evitar que un reinicio del contenedor duplique o altere información. Tras una base nueva ejecute `docker compose run --rm api npx prisma db seed`. El dataset es exclusivamente para inicialización local y nunca debe considerarse dato de producción.

## Accesos del dataset de capacitación

Todos los accesos autorizados usan la contraseña temporal `Trazo2026!`; los correos terminan en `@trazo.com`. Para probar todas las capacidades, inicie sesión con `valentina.rojas@trazo.com` (ADMINISTRADOR). El resto del personal existe para asignación y trazabilidad, pero **no tiene cuenta ni puede iniciar sesión**.

| Correo | Rol | Acceso |
| --- | --- | --- |
| valentina.rojas@trazo.com | ADMINISTRADOR | Administración total |
| mateo.herrera@trazo.com | DIRECTOR | Dirección y aprobación |
| sofia.londono@trazo.com | SUPERVISOR | Supervisión de campo |
| daniel.castro@trazo.com | RESIDENTE | Registro y seguimiento |
| paula.vega@trazo.com | HSE | Seguridad y salud |
| camilo.torres@trazo.com | CALIDAD | Control de calidad |
| mariana.silva@trazo.com | DOCUMENTAL | Gestión documental |
| juan.pineda@trazo.com | OPERADOR_CAMPO | Registro de jornada |
| laura.cardenas@trazo.com | SUPERVISOR | Supervisión / topografía |
| andres.mora@trazo.com | LECTOR | Consulta operativa |

Personal registrado sin cuenta de acceso (se usa para cuadrillas, asistencia, asignaciones y trazabilidad):

| Correo | Rol de referencia | Acceso |
| --- | --- | --- |
| felipe.ruiz@trazo.com | LECTOR / Oficial de obra | Sin acceso |
| natalia.gil@trazo.com | LECTOR / Ayudante de obra | Sin acceso |
| diego.pardo@trazo.com | LECTOR / Oficial de obra | Sin acceso |
| carolina.leon@trazo.com | LECTOR / Ayudante de obra | Sin acceso |
| sergio.navas@trazo.com | LECTOR / Operador de maquinaria | Sin acceso |
| gabriela.pena@trazo.com | LECTOR / Almacenista | Sin acceso |
| ricardo.melo@trazo.com | LECTOR / Oficial de obra | Sin acceso |
| elena.suarez@trazo.com | LECTOR / Ayudante de obra | Sin acceso |
| oscar.rincon@trazo.com | LECTOR / Topógrafo | Sin acceso |
| diana.acosta@trazo.com | LECTOR / Documentalista | Sin acceso |

## Arquitectura

```
frontend/       React, Router, Zustand y Tailwind
backend/src/    API REST: rutas, middleware y servicios de datos
backend/prisma/ modelo, migraciones y dataset de capacitación
documents_data  volumen Docker de archivos (no se guardan BLOB en PostgreSQL)
postgres_data   volumen Docker persistente de PostgreSQL
```

La API requiere JWT en `Authorization: Bearer <token>`. Roles incluidos: `ADMINISTRADOR`, `DIRECTOR`, `SUPERVISOR` y `LECTOR`. Los endpoints de escritura se restringen por rol. La carga documental admite PDF, JPG, PNG y XLSX (máximo configurable con `MAX_FILE_SIZE`).

## Endpoints principales

- `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/forgot-password`
- `GET|POST /api/obras`, `GET|PATCH|DELETE /api/obras/:id`, `POST /api/obras/:id/asignaciones`
- `GET|POST|PATCH /api/personas`; `GET|POST /api/catalogos/:type` (`empresas`, `roles`, `ocupaciones`, `equipos`, `categorias`)
- `GET|POST /api/partes`, `GET|PATCH /api/partes/:id`
- `GET|POST /api/documentos`, `GET /api/dashboard`
- `GET|POST /api/planificacion`, `PATCH|DELETE /api/planificacion/:id`
- `GET|POST /api/inspecciones`, `PATCH /api/inspecciones/:id`

`POST /api/partes` acepta las colecciones `climas`, `asistencias`, `maquinarias`, `tareas`, `incidencias`, `suministros` y `observaciones` dentro de la misma transacción de Prisma.

La planificación permite controlar actividad, zona, responsable, fechas, avance y estado. El módulo de inspecciones registra controles de calidad, seguridad y ambiente, así como hallazgos, acciones correctivas, plazos y cierre.

## Modelo y decisiones de migración

Se conservan los nombres de las tablas del SQL recibido mediante `@@map`. La migración corrige sin cambiar el propósito funcional: documentos y teléfonos pasan a texto (preserva ceros y formatos); campos esenciales se marcan `NOT NULL`; se añaden unicidad para expediente, correo, documento y catálogos; se incorpora `TBL_USUARIOS` para hashes de contraseña fuera de `TBL_PERSONAS`; y se almacenan metadatos/rutas de archivos en la BD, no contenido binario. `TBL_PERSONA_EMPRESA` conserva su clave compuesta inicial; para múltiples períodos de la misma persona en una empresa, la siguiente migración debe añadir un identificador de vinculación.

## Servicios y operación local

| Servicio | Dirección | Uso |
| --- | --- | --- |
| Web | `http://localhost:5173` | Interfaz de TRAZO. |
| API | `http://localhost:3000` | API REST y archivos cargados. |
| Base de datos | Red interna Docker | PostgreSQL; no se expone al equipo anfitrión. |

Verifique que todos los servicios estén activos:

```bash
docker compose ps
```

Si alguno no inicia, consulte sus registros:

```bash
docker compose logs -f api
docker compose logs -f web
```

Para reconstruir los servicios después de modificar el código:

```bash
docker compose up -d --build
```

## Datos, copias y reinicio

Migraciones: `docker compose exec api npx prisma migrate deploy`. Para cargar el dataset en una base vacía: `docker compose run --rm api npx prisma db seed`. Para borrar y reconstruir por completo la base local: `docker compose run --rm api npx prisma migrate reset --force` (operación destructiva).

Respaldo: `docker compose exec -T db pg_dump -U trazo trazo_db > trazo_backup.sql`.

Restauración: `docker compose exec -T db psql -U trazo -d trazo_db < trazo_backup.sql`.

Para detener sin borrar datos: `docker compose down`. No use `down -v` salvo que quiera eliminar intencionalmente la base y los documentos.

Para un despliegue gratuito separado en Vercel, Render y Supabase, consulte [deploy/free-hosting.md](deploy/free-hosting.md). Los adjuntos en esa configuración usan un bucket público de Supabase Storage.
