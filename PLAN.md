# Plan de Implementación - GestorCuentas

## Resumen del Proyecto
Aplicación web de gestión de cuentas/carteras compartidas con Next.js 14+, TypeScript, Tailwind CSS, shadcn/ui, Prisma, PostgreSQL, Auth.js v5 (JWT), Zustand y Docker.

---

## Fase 0: Preparación del Entorno
**Objetivo**: Tener el esqueleto del proyecto listo para desarrollar.

- [x] Inicializar proyecto Next.js 14+ con App Router (`create-next-app`)
- [x] Configurar Tailwind CSS
- [x] Inicializar shadcn/ui
- [x] Crear estructura de carpetas (`app/(auth)`, `app/(dashboard)`, `components/ui`, `lib`, `prisma`)
- [x] Inicializar repositorio Git y crear `.gitignore`
- [x] Crear `.env.example` con variables vacías documentadas
- [x] Instalar dependencias base: `prisma`, `@prisma/client`, `next-auth` (v5/beta), `bcryptjs`, `zustand`, `recharts`, `sonner`, `lucide-react`
- [x] Configurar `package.json` con scripts (`dev`, `build`, `db:push`, `db:studio`)
- [x] Verificar que `docker-compose up` levanta al menos la base de datos (paso adelantado de Fase 8)

---

## Fase 1: Base de Datos y Modelado
**Objetivo**: Modelo de datos funcional y conectado.

- [x] Crear `prisma/schema.prisma` con modelos exactos (User, Wallet, WalletMember, Transaction)
- [x] Configurar `lib/prisma.ts` (singleton)
- [x] Crear `docker-compose.yml` con servicio PostgreSQL
- [x] Ejecutar migración / `db push` para crear tablas
- [x] Crear seed opcional para pruebas

---

## Fase 2: Autenticación Completa (Auth.js v5)
**Objetivo**: Login, registro y protección de rutas funcionando.

- [x] Configurar `lib/auth.ts` con Auth.js v5 (Credentials provider, JWT 30 días, callbacks)
- [x] Crear API Route `app/api/auth/[...nextauth]/route.ts`
- [x] Implementar `middleware.ts` para proteger rutas del dashboard
- [x] Crear página `app/(auth)/login/page.tsx` (con autocomplete móvil)
- [x] Crear página `app/(auth)/register/page.tsx` (validaciones, bcrypt)
- [x] Verificar que el autocompletado funcione en móviles (Chrome Android / Safari iOS)

---

## Fase 3: API de Carteras (Wallets)
**Objetivo**: Backend para crear, listar, compartir y gestionar carteras.

- [x] Crear `app/api/wallets/route.ts` (GET listar mis carteras, POST crear cartera)
- [x] Crear `app/api/wallets/[id]/route.ts` (GET detalle, PATCH editar, DELETE eliminar)
- [x] Crear `app/api/wallets/[id]/members/route.ts` (POST invitar por email, DELETE eliminar miembro)
- [x] Implementar lógica de roles (owner, admin, member)
- [x] Probar endpoints con autenticación

---

## Fase 4: Estado Global y Selector de Cartera
**Objetivo**: Persistencia de última cartera seleccionada.

- [x] Crear store Zustand (`lib/store.ts`) para última cartera seleccionada
- [x] Sincronizar con `localStorage` + cookie
- [x] Crear componente `WalletSelector` (dropdown en header)
- [x] Implementar redirección automática al login: si hay última cartera guardada, ir a `/wallets/[id]`
- [x] Página `app/(dashboard)/wallets/[id]/page.tsx` base

---

## Fase 5: Dashboard de Cartera
**Objetivo**: Vista principal funcional y visual.

- [x] Página `app/(dashboard)/wallets/[id]/page.tsx` completa
- [x] Mostrar saldo actual grande formateado (`Intl.NumberFormat` según moneda)
- [x] Selector de período (Este mes, Mes pasado, Últimos 3 meses)
- [x] Resumen: Total Ingresos vs Total Gastos
- [x] Gráfico de evolución del saldo con `recharts`
- [x] Lista de últimas 10 transacciones

---

## Fase 6: Transacciones
**Objetivo**: CRUD de transacciones con actualización de saldo.

- [x] Crear `app/api/transactions/route.ts` (GET, POST)
- [x] Crear `app/api/transactions/[id]/route.ts` (PATCH, DELETE)
- [x] Crear modal/formulario de transacción (tipo, monto, descripción, categoría, fecha)
- [x] Categorías predefinidas en UI (gastos e ingresos)
- [x] Lógica automática de actualización de saldo de la cartera al crear/editar/eliminar
- [x] Botón flotante (+) en dashboard para añadir rápido

---

## Fase 7: UI Responsive y Navegación
**Objetivo**: Mobile-first, navegación táctil y feedback.

- [x] Configurar layout responsive (`max-width: 430px` base en móvil)
- [x] Implementar `BottomNav` para móvil (Inicio, Transacciones, Perfil)
- [x] Asegurar touch targets mínimo 44px
- [x] Inputs con `font-size: 16px` para evitar zoom en iOS
- [x] Integrar `sonner` para toast notifications
- [x] Loading states en botones de submit
- [x] Página `app/(dashboard)/settings/page.tsx`
- [x] Manejo de errores amigable con try-catch

---

## Fase 8: Docker y Coolify
**Objetivo**: Listo para producción con contenedores.

- [x] Crear `Dockerfile` multi-stage optimizado para Next.js 14+
- [x] Actualizar `docker-compose.yml` con servicio de la app + PostgreSQL + healthchecks
- [x] Verificar build local con `docker-compose up --build`
- [x] Documentar variables de entorno necesarias para Coolify

---

## Fase 9: Finalización
**Objetivo**: Pulido y documentación.

- [x] Configurar `metadata` global (title, description) y favicon
- [x] Crear `README.md` completo (instalación, despliegue Coolify, uso, licencia MIT, autor)
- [x] Revisión general de tipos TypeScript
- [x] Revisar que no haya secretos hardcodeados
- [x] Commit final y limpieza

---

## Notas
- Cada fase se implementará en orden, validando que la anterior funcione antes de continuar.
- Se usarán componentes de shadcn/ui siempre que sea posible.
- El enfoque es **mobile-first** desde la Fase 5 en adelante.
