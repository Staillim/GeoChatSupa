# GeoChat - PostgreSQL Migration Guide

## 🎯 Cambio de Base de Datos: Firestore → PostgreSQL

### 📋 Configuración Actual

**Base de datos:** PostgreSQL (pgAdmin)
- **Host:** localhost
- **Puerto:** 5432
- **Database:** geochat
- **Usuario:** postgres
- **Contraseña:** Staillim

---

## 🚀 Pasos para Migrar

### 1️⃣ Verificar PostgreSQL

Asegúrate de que PostgreSQL está corriendo y que la base de datos `geochat` existe:

```bash
# En pgAdmin, crear la base de datos si no existe:
# Right-click on "Databases" → Create → Database
# Name: geochat
# Owner: postgres
```

### 2️⃣ Probar la Conexión

```bash
npm run db:test
```

Este comando verificará:
- ✅ Conexión a PostgreSQL
- ✅ Versión de PostgreSQL
- ✅ Base de datos actual
- ✅ Tablas existentes

### 3️⃣ Crear las Tablas (Migración)

**Opción A: Usando npm script**
```bash
npm run db:migrate
```

**Opción B: Usando script de Windows**
```bash
setup-database.bat
```

**Opción C: Manualmente en pgAdmin**
1. Abrir pgAdmin
2. Conectar a la base de datos `geochat`
3. Abrir Query Tool (Tools → Query Tool)
4. Copiar el contenido de `database-schema-postgres.sql`
5. Ejecutar (F5)

### 4️⃣ Verificar las Tablas

```bash
npm run db:status
```

Deberías ver:
- ✅ users
- ✅ user_profiles
- ✅ points_of_interest
- ✅ conversations
- ✅ messages
- ✅ chat_requests
- ✅ live_locations
- ✅ notifications

---

## 📁 Archivos Importantes

### Configuración
- `.env.local` - Variables de entorno (credenciales de DB)
- `database-schema-postgres.sql` - Schema completo de PostgreSQL

### Código
- `src/lib/db.ts` - Pool de conexiones y funciones de query
- `src/lib/db-migrate.ts` - Script de migración
- `src/lib/db-test.ts` - Test de conexión

### Scripts
- `setup-database.bat` - Script de Windows para ejecutar SQL

---

## 🔧 Comandos Disponibles

```bash
npm run db:test      # Probar conexión a la base de datos
npm run db:migrate   # Crear todas las tablas y datos de ejemplo
npm run db:rollback  # ⚠️ ELIMINAR todas las tablas (cuidado!)
npm run db:status    # Ver estado de las tablas
```

---

## 📊 Estructura de la Base de Datos

### Tablas Principales

1. **users** - Usuarios con ubicación y permisos
   - `id`, `name`, `email`, `avatar`, `lat`, `lng`
   - `location_sharing_requests`, `location_sharing_with`

2. **conversations** - Conversaciones entre usuarios
   - `id`, `participants`, `status`, `last_message`

3. **messages** - Mensajes de chat
   - `id`, `conversation_id`, `sender_id`, `text`, `image_url`

4. **live_locations** - Ubicaciones en tiempo real
   - `id`, `user_id`, `shared_with`, `latitude`, `longitude`
   - Se actualiza cada 1 minuto

5. **chat_requests** - Solicitudes de amistad
   - `id`, `from_user_id`, `to_user_id`, `status`

### Vistas (Views)

- `active_conversations_view` - Conversaciones activas
- `active_live_locations_view` - Ubicaciones en vivo activas
- `pending_chat_requests_view` - Solicitudes pendientes

---

## 🔄 Siguiente Fase: Migrar el Código

Una vez que la base de datos esté lista, necesitarás:

### 1. Reemplazar hooks de Firestore con queries SQL

**Antes (Firestore):**
```typescript
import { collection, onSnapshot } from 'firebase/firestore';

const unsubscribe = onSnapshot(
  collection(db, 'users'),
  (snapshot) => {
    const users = snapshot.docs.map(doc => doc.data());
    setUsers(users);
  }
);
```

**Después (PostgreSQL):**
```typescript
import { query } from '@/lib/db';

// En API Route: /api/users
const result = await query('SELECT * FROM users WHERE is_online = TRUE');
return res.json(result.rows);

// En componente: usar fetch o SWR
const { data: users } = useSWR('/api/users', fetcher);
```

### 2. Crear API Routes para cada operación

- `app/api/users/route.ts` - CRUD de usuarios
- `app/api/conversations/route.ts` - CRUD de conversaciones
- `app/api/messages/route.ts` - CRUD de mensajes
- `app/api/live-locations/route.ts` - CRUD de ubicaciones en vivo

### 3. Implementar Real-time con WebSockets

Firestore tiene `onSnapshot` para actualizaciones en tiempo real. En PostgreSQL necesitas:

**Opciones:**
- **Socket.IO** - WebSockets para push de actualizaciones
- **PostgreSQL LISTEN/NOTIFY** - Notificaciones nativas de Postgres
- **Polling** - Consultas periódicas cada X segundos
- **Server-Sent Events (SSE)** - Streaming de eventos

---

## ⚠️ Consideraciones Importantes

### Datos de Ejemplo
El schema incluye datos de prueba:
- 6 usuarios (user-1 a user-5 + current-user)
- 3 conversaciones
- 7 mensajes

### Transacción y Consistencia
PostgreSQL es ACID compliant, así que puedes usar transacciones:

```typescript
import { transaction } from '@/lib/db';

await transaction(async (client) => {
  await client.query('INSERT INTO users ...');
  await client.query('INSERT INTO user_profiles ...');
  // Si cualquiera falla, se hace ROLLBACK automático
});
```

### Seguridad
- ✅ Usa prepared statements (ya incluido en `query()`)
- ✅ Valida datos en el servidor (Zod schemas)
- ✅ Implementa autenticación en API routes
- ✅ No expongas credenciales en el cliente

---

## 🐛 Troubleshooting

### Error: "ECONNREFUSED"
- PostgreSQL no está corriendo
- Verificar en Services o pgAdmin

### Error: "password authentication failed"
- Usuario o contraseña incorrectos
- Revisar `.env.local`

### Error: "database does not exist"
- Crear la base de datos `geochat` en pgAdmin

### Error: "relation does not exist"
- Las tablas no están creadas
- Ejecutar `npm run db:migrate`

---

## 📞 Estado Actual

✅ PostgreSQL configurado
✅ Schema SQL creado
✅ Scripts de migración listos
✅ Pool de conexiones implementado
⏳ **Pendiente:** Migrar hooks de Firestore a API routes
⏳ **Pendiente:** Implementar real-time updates
⏳ **Pendiente:** Migrar autenticación

---

## 🎯 Próximos Pasos

1. **Ejecutar migración:** `npm run db:migrate`
2. **Verificar tablas:** `npm run db:status`
3. **Crear API routes** para reemplazar Firestore
4. **Actualizar componentes** para usar las nuevas APIs
5. **Implementar WebSockets** para real-time
6. **Migrar autenticación** de Firebase Auth

¿Quieres que empiece a crear los API routes? 🚀
