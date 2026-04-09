# Plan de Implementación - GestorCuentas

## Resumen del Proyecto
Aplicación web de gestión de cuentas/carteras compartidas con Next.js 14+, TypeScript, Tailwind CSS, shadcn/ui, Prisma, PostgreSQL, Auth.js v5 (JWT), Zustand y Docker.

---

## Fase 0: Preparación del Entorno
**Objetivo**: Tener el esqueleto del proyecto listo para desarrollar.

- [ ] Inicializar proyecto Next.js 14+ con App Router (`create-next-app`)
- [ ] Configurar Tailwind CSS
- [ ] Inicializar shadcn/ui
- [ ] Crear estructura de carpetas (`app/(auth)`, `app/(dashboard)`, `components/ui`, `lib`, `prisma`)
- [ ] Inicializar repositorio Git y crear `.gitignore`
- [ ] Crear `.env.example` con variables vacías documentadas
- [ ] Instalar dependencias base: `prisma`, `@prisma/client`, `next-auth` (v5/beta), `bcryptjs`, `zustand`, `recharts`, `sonner`, `lucide-react`
- [ ] Configurar `package.json` con scripts (`dev`, `build`, `db:push`, `db:studio`)
- [ ] Verificar que `docker-compose up` levanta al menos la base de datos (paso adelantado de Fase 8)

---

## Fase 1: Base de Datos y Modelado
**Objetivo**: Modelo de datos funcional y conectado.

- [ ] Crear `prisma/schema.prisma` con modelos exactos (User, Wallet, WalletMember, Transaction)
- [ ] Configurar `lib/prisma.ts` (singleton)
- [ ] Crear `docker-compose.yml` con servicio PostgreSQL
- [ ] Ejecutar migración / `db push` para crear tablas
- [ ] Crear seed opcional para pruebas

---

## Fase 2: Autenticación Completa (Auth.js v5)
**Objetivo**: Login, registro y protección de rutas funcionando.

- [ ] Configurar `lib/auth.ts` con Auth.js v5 (Credentials provider, JWT 30 días, callbacks)
- [ ] Crear API Route `app/api/auth/[...nextauth]/route.ts`
- [ ] Implementar `middleware.ts` para proteger rutas del dashboard
- [ ] Crear página `app/(auth)/login/page.tsx` (con autocomplete móvil)
- [ ] Crear página `app/(auth)/register/page.tsx` (validaciones, bcrypt)
- [ ] Verificar que el autocompletado funcione en móviles (Chrome Android / Safari iOS)

---

## Fase 3: API de Carteras (Wallets)
**Objetivo**: Backend para crear, listar, compartir y gestionar carteras.

- [ ] Crear `app/api/wallets/route.ts` (GET listar mis carteras, POST crear cartera)
- [ ] Crear `app/api/wallets/[id]/route.ts` (GET detalle, PATCH editar, DELETE eliminar)
- [ ] Crear `app/api/wallets/[id]/members/route.ts` (POST invitar por email, DELETE eliminar miembro)
- [ ] Implementar lógica de roles (owner, admin, member)
- [ ] Probar endpoints con autenticación

---

## Fase 4: Estado Global y Selector de Cartera
**Objetivo**: Persistencia de última cartera seleccionada.

- [ ] Crear store Zustand (`lib/store.ts`) para última cartera seleccionada
- [ ] Sincronizar con `localStorage` + cookie
- [ ] Crear componente `WalletSelector` (dropdown en header)
- [ ] Implementar redirección automática al login: si hay última cartera guardada, ir a `/wallets/[id]`
- [ ] Página `app/(dashboard)/wallets/[id]/page.tsx` base

---

## Fase 5: Dashboard de Cartera
**Objetivo**: Vista principal funcional y visual.

- [ ] Página `app/(dashboard)/wallets/[id]/page.tsx` completa
- [ ] Mostrar saldo actual grande formateado (`Intl.NumberFormat` según moneda)
- [ ] Selector de período (Este mes, Mes pasado, Últimos 3 meses)
- [ ] Resumen: Total Ingresos vs Total Gastos
- [ ] Gráfico de evolución del saldo con `recharts`
- [ ] Lista de últimas 10 transacciones

---

## Fase 6: Transacciones
**Objetivo**: CRUD de transacciones con actualización de saldo.

- [ ] Crear `app/api/transactions/route.ts` (GET, POST)
- [ ] Crear `app/api/transactions/[id]/route.ts` (PATCH, DELETE)
- [ ] Crear modal/formulario de transacción (tipo, monto, descripción, categoría, fecha)
- [ ] Categorías predefinidas en UI (gastos e ingresos)
- [ ] Lógica automática de actualización de saldo de la cartera al crear/editar/eliminar
- [ ] Botón flotante (+) en dashboard para añadir rápido

---

## Fase 7: UI Responsive y Navegación
**Objetivo**: Mobile-first, navegación táctil y feedback.

- [ ] Configurar layout responsive (`max-width: 430px` base en móvil)
- [ ] Implementar `BottomNav` para móvil (Inicio, Transacciones, Perfil)
- [ ] Asegurar touch targets mínimo 44px
- [ ] Inputs con `font-size: 16px` para evitar zoom en iOS
- [ ] Integrar `sonner` para toast notifications
- [ ] Loading states en botones de submit
- [ ] Página `app/(dashboard)/settings/page.tsx`
- [ ] Manejo de errores amigable con try-catch

---

## Fase 8: Docker y Coolify
**Objetivo**: Listo para producción con contenedores.

- [ ] Crear `Dockerfile` multi-stage optimizado para Next.js 14+
- [ ] Actualizar `docker-compose.yml` con servicio de la app + PostgreSQL + healthchecks
- [ ] Verificar build local con `docker-compose up --build`
- [ ] Documentar variables de entorno necesarias para Coolify

---

## Fase 9: Finalización
**Objetivo**: Pulido y documentación.

- [ ] Configurar `metadata` global (title, description) y favicon
- [ ] Crear `README.md` completo (instalación, despliegue Coolify, uso, licencia MIT, autor)
- [ ] Revisión general de tipos TypeScript
- [ ] Revisar que no haya secretos hardcodeados
- [ ] Commit final y limpieza

---

## Notas
- Cada fase se implementará en orden, validando que la anterior funcione antes de continuar.
- Se usarán componentes de shadcn/ui siempre que sea posible.
- El enfoque es **mobile-first** desde la Fase 5 en adelante.
