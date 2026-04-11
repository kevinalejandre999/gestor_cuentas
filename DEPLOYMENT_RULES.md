# Reglas de Despliegue - GestorCuentas

> **ADVERTENCIA**: Este archivo contiene reglas CRÍTICAS aprendidas de forma dolorosa. 
> **NO MODIFICAR** sin leer completamente.

---

## 1. Dockerfile - NO TOCAR

El Dockerfile actual usa **multi-stage build** y funciona perfectamente. 

### ❌ NUNCA HACER:
- Mover `npx prisma generate` del stage `builder` al entrypoint
- Cambiar a single-stage build
- Agregar comandos de debug como `ls -la` que rompen la cache
- Modificar el orden de las capas

### ✅ Dockerfile funcional (resumen):
```dockerfile
# STAGE 1: deps - npm ci
# STAGE 2: builder - COPIAR TODO -> prisma generate -> npm run build  
# STAGE 3: runner - copiar solo lo necesario
```

**Regla de oro**: Si el Dockerfile funciona, **NO LO TOQUES**.

---

## 2. Prisma - Ubicación Correcta

`prisma` debe estar en **`devDependencies`** (NO en dependencies).

### ❌ NUNCA HACER:
```json
// MAL - No mover prisma a dependencies
"dependencies": {
  "prisma": "^5.x.x"  // <-- NO!
}
```

### ✅ Correcto:
```json
"devDependencies": {
  "prisma": "^5.x.x"  // <-- SI
}
```

**Por qué**: Durante el build de Docker, `prisma generate` se ejecuta en el stage builder donde se instalan TODAS las dependencias (incluyendo dev). En runtime no se necesita el CLI de Prisma, solo el cliente generado.

---

## 3. Schema de Prisma - Cambios

Al modificar `prisma/schema.prisma`:

### Pasos obligatorios:
1. ✅ Modificar el schema
2. ✅ Commitear y pushear
3. ✅ El contenedor se redeploya automáticamente
4. ✅ **Esperar a que el entrypoint ejecute `prisma db push`**
5. ✅ Verificar en logs: "Database already initialized"

### ❌ NUNCA:
- Hacer `db push` manual en la VPS (el entrypoint lo hace solo)
- Modificar el schema sin probar en local primero

---

## 4. Git - Procedimiento Seguro

### Flujo correcto:
```bash
# 1. Hacer cambios
# 2. Probar en local (npm run build)
# 3. Si funciona: git add + commit + push
# 4. Esperar redeploy de Coolify
# 5. Verificar logs en Coolify
```

### ❌ NUNCA USAR:
```bash
git push --force  # Solo si estamos seguros de resetear historia
```

---

## 5. Errores Comunes y Soluciones

### Error: "failed to solve: process '/bin/sh -c npx prisma generate'"
**Causa**: El schema.prisma no está disponible cuando se ejecuta el comando.
**Solución**: No mover el COPY de prisma antes de npm ci.

### Error: "failed to solve: process '/bin/sh -c npm run build'"
**Causa**: El cliente de Prisma no está generado.
**Solución**: Verificar que `npx prisma generate` está ANTES de `npm run build`.

### Error: "Cannot find module '@prisma/client'"
**Causa**: El cliente de Prisma no se generó.
**Solución**: Verificar que el Dockerfile ejecuta `prisma generate`.

---

## 6. Estructura de Archivos Críticos

Estos archivos NO deben modificarse sin razón válida:
- `Dockerfile` - Multi-stage build probado
- `docker-compose.yaml` - Configuración de servicios
- `docker-entrypoint.sh` - Inicialización del contenedor
- `package.json` - Ubicación de prisma en devDependencies

---

## 7. Checklist Pre-Deploy

Antes de hacer push a main:

- [ ] ¿Modifiqué Dockerfile? → **REVERTIR** a menos que sea necesario
- [ ] ¿Modifiqué package.json? → Verificar que prisma sigue en devDependencies
- [ ] ¿Modifiqué schema.prisma? → Prepararse para posible db push
- [ ] ¿Probé en local? → `npm run build` debe funcionar
- [ ] ¿Los cambios son solo de código/frontend? → Safe to push

---

## 8. Rollback de Emergencia

Si todo falla y necesitamos volver al último estado funcional:

```bash
# En local
git log --oneline -5  # Encontrar el último commit funcional
git reset --hard <commit-hash>
git push --force
```

**Nota**: El `--force` solo debe usarse en emergencias.

---

## 9. Variables de Entorno en Coolify

Asegurarse de que estén configuradas:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - JWT secret
- `NEXTAUTH_URL` - URL de la app
- `AUTH_SECRET` - Para Auth.js v5
- `AUTH_TRUST_HOST` - true (para proxy)

---

## 10. Lección Principal

> **"Si funciona, no lo arregles"**

El commit `8862c7e` tenía un Dockerfile que funcionaba perfectamente.
Los problemas surgieron al intentar "mejorarlo".

**Regla #1**: Solo modificar infraestructura cuando sea absolutamente necesario.

---

## Historial de Problemas

| Fecha | Problema | Causa | Solución |
|-------|----------|-------|----------|
| 2026-04-11 | Build falla en prisma generate | Mover prisma de devDeps a deps | Revertir package.json |
| 2026-04-11 | Dockerfile no encuentra schema | Modificar orden de COPY | Revertir Dockerfile |
| 2026-04-11 | Multi-stage build roto | Intentar single-stage | Revertir a multi-stage |

---

**Última actualización**: 2026-04-11
**Autor**: Development Team
**Estado**: CRÍTICO - NO MODIFICAR SIN AUTORIZACIÓN
