# 🍎 Frutería El Principiante — Sistema POS SaaS

Sistema completo de punto de venta estilo eleventa para fruterías y minimarkets, construido con Next.js 16, TypeScript, Prisma y PostgreSQL.

## ✨ Funcionalidades

- 🛒 **POS estilo eleventa** — grid de productos, carrito, búsqueda por código de barras, atajos de teclado
- 💳 **5 métodos de pago** — Efectivo (con vuelto), Débito, Crédito, Transferencia, Crédito cliente
- 🏪 **2 bodegas** — stock por bodega, traspasos, mermas, alertas de stock bajo
- 📦 **Inventario** — productos por kg/unidad/pack/manojo, código de barras, SKU, mayoreo
- 👥 **Clientes con crédito** — "hoy sí se fía", abonos, límite de crédito
- 💰 **Cierre de caja** — apertura/cierre con cuadre, desglose por método de pago
- 🧾 **Tickets imprimibles** — formato 80mm para impresora térmica + PDF
- 📊 **Reportes con gráficos** — ventas por período, top productos, ganancias, valorización
- 🏢 **Compras y proveedores** — órdenes de compra, recepción automática
- 👤 **Gestión de usuarios** — 4 roles (Admin, Supervisor, Cajero, Bodeguero)
- ⚙️ **Configuración** — datos empresa, RUT, IVA, moneda, ticket
- 📜 **Auditoría** — log de operaciones

## 🚀 Deploy en Netlify

### Requisitos previos
- Cuenta en [GitHub](https://github.com)
- Cuenta en [Netlify](https://app.netlify.com)
- Cuenta en [Neon](https://neon.tech) (PostgreSQL gratis)
- Node.js 20+ instalado

### Paso 1: Crear base de datos en Neon

1. Ir a [neon.tech](https://neon.tech) y crear cuenta
2. Crear nuevo proyecto (ej: `fruteria-db`)
3. Copiar el **Connection String** (se ve así):
   ```
   postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/fruteria?sslmode=require
   ```

### Paso 2: Subir código a GitHub

```bash
git init
git add .
git commit -m "Sistema POS Frutería El Principiante"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/fruteria-el-principiante.git
git push -u origin main
```

### Paso 3: Deploy en Netlify

#### Opción A: Desde la web (más fácil)

1. Ir a [app.netlify.com](https://app.netlify.com)
2. **Add new site** → **Import an existing project**
3. Conectar con GitHub → seleccionar el repo
4. Configurar:
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
   - **Environment variables** (importante):
     - `DATABASE_URL` = tu connection string de Neon
     - `SESSION_SECRET` = una cadena random larga (genera con `openssl rand -base64 32`)
5. Click **Deploy**

#### Opción B: Desde CLI

```bash
npm install -g netlify-cli
netlify login
netlify init       # Conectar repo
netlify env:set DATABASE_URL "postgresql://..."
netlify env:set SESSION_SECRET "tu-secreto-aqui"
netlify deploy --prod
```

### Paso 4: Inicializar base de datos en producción

Una vez deployado, en tu terminal local con la DATABASE_URL apuntando a Neon:

```bash
# Aplicar schema a la DB
npx prisma db push

# Cargar datos iniciales (admin, productos de ejemplo)
npm run db:seed
```

## 💻 Desarrollo local

### Opción 1: Con PostgreSQL (recomendado)

```bash
# Instalar Docker Desktop
docker run --name postgres-fruteria -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres

# O usar Postgres.app para Mac, o instalar nativo en Windows

# Crear DB
createdb fruteria

# Configurar .env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fruteria"

# Instalar deps
npm install

# Inicializar
npx prisma db push
npm run db:seed

# Iniciar dev server
npm run dev
```

### Opción 2: Solo para probar (sin DB)

Si solo quieres ver la UI, edita `prisma/schema.prisma` temporalmente a `provider = "sqlite"` y usa el adapter de better-sqlite3 (ya instalado). 

## 👤 Credenciales iniciales

| Email | Contraseña | Rol |
|-------|-----------|-----|
| `admin@fruteria.cl` | `admin123` | Administrador |
| `cajero@fruteria.cl` | `cajero123` | Cajero |

## 📂 Estructura del proyecto

```
src/
  app/
    (dashboard)/          # Rutas protegidas con sidebar
      pos/                # Punto de venta
      ventas/             # Historial de ventas
      inventario/         # Productos
      bodegas/            # Stock por bodega
      clientes/           # Clientes con crédito
      cierre-caja/        # Apertura/cierre de turno
      compras/            # Órdenes de compra
      proveedores/        # Proveedores
      reportes/           # Gráficos
      usuarios/           # Gestión usuarios (admin)
      configuracion/      # Config del sistema (admin)
      auditoria/         # Log de operaciones (admin)
    ticket/[ticketNumber] → Ticket imprimible
    login/                # Login
  lib/
    actions/              # Server actions
    store/                # Zustand (carrito)
    prisma.ts             # Cliente Prisma + adapter
    session.ts            # Auth con jose
  components/
    ui/                   # shadcn/ui
    layout/               # Sidebar, Header
prisma/
  schema.prisma           # 17 modelos
  seed.mts                # Datos iniciales
```

## 🛠️ Scripts

```bash
npm run dev              # Dev server
npm run build            # Build producción
npm run start            # Iniciar producción
npm run db:push          # Aplicar schema a DB
npm run db:seed          # Cargar datos iniciales
npm run db:studio        # Prisma Studio (UI para DB)
npm run db:migrate:deploy # Aplicar migraciones (producción)
```

## 💰 Costos

- **Netlify Free**: 100 GB bandwidth, 300 build minutes/mes
- **Neon Free**: 0.5 GB storage, 190 horas compute/mes
- **Total: $0/mes** para una frutería pequeña

## 📞 Soporte

Sistema construido como SaaS para **Frutería El Principiante**.
Para consultas sobre el código, revisar la documentación de:
- [Next.js 16](https://nextjs.org/docs)
- [Prisma](https://www.prisma.io/docs)
- [Netlify Next.js](https://docs.netlify.com/frameworks/next-js/)
- [Neon Postgres](https://neon.tech/docs)
