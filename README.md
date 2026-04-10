# GestorCuentas

Aplicación web de gestión de cuentas y carteras compartidas. Permite crear carteras en diferentes monedas, registrar ingresos y gastos, compartir el acceso con otros usuarios mediante roles, y visualizar la evolución del saldo en tiempo real.

---

## Características principales

- [x] Autenticación segura con JWT (30 días de sesión)
- [x] Registro de usuarios con validaciones
- [x] Creación de carteras con soporte multi-moneda (USD, EUR, MXN, CLP, ARS, COP, etc.)
- [x] Cálculo automático del saldo actual
- [x] Compartir carteras por email con roles: Owner, Admin, Member
- [x] Registro de transacciones (Ingresos/Gastos) con categorías predefinidas
- [x] Gráfico de evolución del saldo con Recharts
- [x] Selector de período (Este mes, Mes pasado, Últimos 3 meses)
- [x] Persistencia de última cartera seleccionada
- [x] Diseño mobile-first con navegación inferior
- [x] Notificaciones toast con Sonner
- [x] Formato de monedas según la cartera (Intl.NumberFormat)
- [x] Preparado para despliegue con Docker y Coolify

---

## Tech Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 14+ (App Router), TypeScript, Tailwind CSS |
| UI Components | shadcn/ui (manual) |
| Backend | Next.js API Routes |
| ORM | Prisma 5 |
| Base de datos | PostgreSQL 16 |
| Autenticación | Auth.js v5 (NextAuth) — JWT Strategy |
| Estado global | Zustand + persistencia localStorage |
| Gráficos | Recharts |
| Notificaciones | Sonner |
| Iconos | Lucide React |
| Contenedores | Docker + Docker Compose |

---

## Variables de entorno

Crea un archivo `.env` basado en `.env.example`:

```bash
# Base de datos PostgreSQL
DATABASE_URL=postgresql://user:password@localhost:5432/gestor_cuentas

# NextAuth.js / Auth.js
NEXTAUTH_SECRET=tu_secreto_super_seguro_de_al_menos_32_caracteres
NEXTAUTH_URL=http://localhost:3000
```

### Descripción de variables

| Variable | Descripción | Obligatoria |
|----------|-------------|-------------|
| `DATABASE_URL` | URL de conexión a PostgreSQL | Sí |
| `NEXTAUTH_SECRET` | Secreto para firmar tokens JWT | Sí (producción) |
| `NEXTAUTH_URL` | URL pública de la aplicación | Sí (producción) |

> Genera un `NEXTAUTH_SECRET` seguro con: `openssl rand -base64 32`

---

## Instalación local

### Requisitos

- Node.js 20+
- PostgreSQL 14+ (o Docker)

### Pasos

1. Clona el repositorio:
```bash
git clone https://github.com/kevinalejandre999/gestor_cuentas.git
cd gestor_cuentas
```

2. Instala dependencias:
```bash
npm install
```

3. Configura las variables de entorno:
```bash
cp .env.example .env
# Edita .env con tus credenciales
```

4. Levanta PostgreSQL (con Docker):
```bash
docker-compose up -d db
```

5. Genera el cliente de Prisma y sincroniza la base de datos:
```bash
npx prisma generate
npm run db:push
```

6. (Opcional) Crea datos de prueba:
```bash
npx prisma db seed
```

7. Inicia el servidor de desarrollo:
```bash
npm run dev
```

8. Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## Despliegue en Coolify

1. Crea un nuevo proyecto en Coolify
2. Selecciona **Docker Compose** como tipo de despliegue
3. Conecta tu repositorio de GitHub: `kevinalejandre999/gestor_cuentas`
4. Configura las variables de entorno en Coolify:
   - `DATABASE_URL` (usa la URL interna que Coolify asigna al servicio PostgreSQL)
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` (dominio asignado por Coolify)
5. Asegúrate de que el servicio `db` esté saludable antes de iniciar `app` (el `docker-compose.yml` ya incluye `depends_on` con `condition: service_healthy`)
6. Despliega

> El `Dockerfile` usa multi-stage build con `output: 'standalone'` de Next.js para una imagen final ligera y optimizada.

---

## Uso de la aplicación

### Compartir una cartera

1. Entra a una cartera
2. Usa la API o la interfaz (futura) para invitar miembros enviando el email del usuario registrado
3. El sistema verifica que el usuario exista y lo añade con rol `member`
4. Los roles disponibles son:
   - **Owner**: puede eliminar la cartera y gestionar miembros
   - **Admin**: puede editar la cartera y gestionar miembros
   - **Member**: puede ver y añadir transacciones

### Añadir transacciones

- Desde el dashboard de cartera, pulsa el botón flotante **(+)**
- Selecciona si es Ingreso o Gasto
- Elige una categoría predefinida o deja "Otros"
- El saldo de la cartera se actualiza automáticamente

---

## Scripts disponibles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Inicia el servidor de desarrollo |
| `npm run build` | Compila la aplicación para producción |
| `npm run start` | Inicia el servidor de producción |
| `npm run db:push` | Sincroniza el schema de Prisma con la base de datos |
| `npm run db:studio` | Abre Prisma Studio |
| `npm run db:generate` | Genera el cliente de Prisma |
| `npm run db:migrate` | Crea una migración de Prisma |

---

## Licencia

MIT © [kevinalejandre999](https://github.com/kevinalejandre999)
