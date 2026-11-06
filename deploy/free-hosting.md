# Despliegue gratuito con Vercel, Render y Supabase

Esta alternativa aloja el frontend en Vercel, la API en Render y PostgreSQL junto con los archivos en Supabase. Los servicios gratuitos pueden suspenderse por inactividad y no ofrecen disponibilidad garantizada. En Supabase, el bucket de archivos debe ser público para conservar el comportamiento actual de los adjuntos.

## 1. Crear el proyecto Supabase

1. Crea un proyecto y guarda la contraseña de PostgreSQL.
2. En **Project Settings → Database**, copia la cadena de conexión del **Session pooler**. Reemplaza la contraseña de ejemplo y conserva `sslmode=require`.
3. En **Storage**, crea un bucket público llamado `trazo-files`.
4. En **Project Settings → API**, copia el **Project URL** y la **service_role key**. La service role key solo se configura como secreto en Render; nunca la pongas en Vercel ni en el código.

Los documentos y fotos podrán leerse mediante enlaces públicos, igual que con la configuración de archivos local existente. No uses este bucket para archivos que deban mantenerse privados.

## 2. Subir el código a GitHub

Crea un repositorio **privado** para `trazo-app`. En VS Code, abre esa carpeta, usa **Source Control → Initialize Repository** y luego **Publish to GitHub**. Antes de publicar, confirma que `.env`, `.env.production` y `node_modules` no aparezcan entre los archivos a subir; `.gitignore` ya los excluye. Vercel y Render se conectarán a este repositorio.

## 3. Crear la API en Render

Crea un **Web Service** conectado al repositorio, con estos valores:

- **Root Directory:** `backend`
- **Build Command:** `npm ci && npx prisma generate && npm run build`
- **Start Command:** `npx prisma migrate deploy && npm start`
- **Health Check Path:** `/health`

Configura estas variables de entorno:

| Variable | Valor |
| --- | --- |
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Cadena de conexión Session pooler de Supabase |
| `JWT_SECRET` | Secreto generado con `openssl rand -hex 32` |
| `FILE_STORAGE` | `supabase` |
| `SUPABASE_URL` | Project URL de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key de Supabase |
| `SUPABASE_STORAGE_BUCKET` | `trazo-files` |
| `FRONTEND_ORIGIN` | Dominio de Vercel, por ejemplo `https://trazo-app.vercel.app` |
| `MAX_FILE_SIZE` | `10485760` |

Render asignará una URL al servicio, por ejemplo `https://trazo-api.onrender.com`.
Para generar el secreto, ejecuta `openssl rand -hex 32` en una terminal local.

## 4. Crear el frontend en Vercel

Crea un proyecto importando el mismo repositorio:

- **Root Directory:** `frontend`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

Agrega esta variable de entorno y vuelve a desplegar:

| Variable | Valor |
| --- | --- |
| `VITE_API_URL` | URL de Render seguida de `/api`, por ejemplo `https://trazo-api.onrender.com/api` |

## 5. Conectar los dominios y verificar

Usa el dominio asignado por Vercel como `FRONTEND_ORIGIN` en Render y vuelve a desplegar la API. Comprueba que `https://trazo-api.onrender.com/health` responda `{"status":"ok"}` y prueba iniciar sesión y cargar un documento/foto.

## 6. Crear el primer administrador

La app no tiene registro público. Después de que Render haya aplicado las migraciones, ejecuta el bootstrap una sola vez desde una terminal local:

1. En `backend/.env` (ignorado por Git), coloca la conexión de Supabase en `DATABASE_URL` y define `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_FIRST_NAME`, `BOOTSTRAP_ADMIN_LAST_NAME` y `BOOTSTRAP_ADMIN_PASSWORD`. Usa una contraseña única de 12 a 72 bytes.
2. Desde `backend`, ejecuta:

   ```bash
   npm ci
   npx prisma generate
   npm run db:bootstrap-admin
   ```

3. Borra `backend/.env`. El script solo crea el primer administrador y se niega a ejecutarse si ya existe uno.

No ejecutes `npm run db:seed` en producción: ese dataset contiene cuentas y datos de demostración. Guarda las claves solo en variables locales ignoradas o en los paneles de cada plataforma.
