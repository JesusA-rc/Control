# Control

App de control con pantalla de finanzas, frontend React/Vite y backend Node.js conectado a MySQL/MariaDB con Prisma ORM. La base de datos se puede administrar desde phpMyAdmin y las tablas se crean con migraciones.

## Requisitos

- Node.js
- pnpm
- MySQL o MariaDB, por ejemplo desde XAMPP/WAMP
- phpMyAdmin para ver y administrar la base de datos

## Configuracion

1. Copia `.env.example` a `.env`.
2. Ajusta los datos de conexion:

```env
PORT=3001
FRONTEND_ORIGIN=http://localhost:5173
VITE_API_URL=http://localhost:3001

DATABASE_URL="mysql://root:@localhost:3306/control"
```

3. Asegurate de que MySQL/MariaDB este activo.
4. Ejecuta la migracion inicial:

```bash
pnpm db:migrate
```

Prisma crea la base de datos `control` si el usuario de `DATABASE_URL` tiene permisos. Si tu MySQL no permite crear bases desde Prisma, crea primero la base `control` vacia en phpMyAdmin y vuelve a correr `pnpm db:migrate`.

## Desarrollo

Instala dependencias:

```bash
pnpm install
```

Arranca el backend:

```bash
pnpm dev:backend
```

Arranca el frontend en otra terminal:

```bash
pnpm dev
```

## API de finanzas

- `GET /api/health`
- `GET /api/finanzas`
- `GET /api/finanzas/resumen`
- `POST /api/finanzas` con `{ "tipo": "ingreso", "monto": 100 }` o `{ "tipo": "gasto", "monto": 50 }`

## Prisma

- Modelo: `prisma/schema.prisma`
- Migracion inicial: `prisma/migrations/20260724170000_create_finanzas/migration.sql`
- Generar cliente: `pnpm db:generate`
- Aplicar migraciones en produccion: `pnpm db:deploy`
