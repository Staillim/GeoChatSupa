# 🚀 PASOS PARA COMPLETAR LA MIGRACIÓN A POSTGRESQL

## ✅ Lo que ya está hecho:

1. **PostgreSQL instalado y corriendo** ✅
   - Base de datos: `geochat` creada
   - Usuario: `postgres`
   - Contraseña: `Staillim`
   - Puerto: `5432`

2. **Código de conexión listo** ✅
   - Archivo: `src/lib/db.ts` - Pool de conexiones
   - Archivo: `.env.local` - Credenciales configuradas
   - Test de conexión funcionando ✅

3. **Schema SQL PostgreSQL creado** ✅
   - Archivo: `database-schema-postgres.sql` (294 líneas)
   - 8 tablas principales
   - 3 vistas
   - Triggers automáticos
   - Datos de ejemplo incluidos

## 📝 SIGUIENTE PASO IMPORTANTE:

### **Ejecutar el SQL en pgAdmin para crear las tablas**

#### Opción 1: Usar pgAdmin (RECOMENDADO) 👈

1. **Abrir pgAdmin 4**
2. **Conectar al servidor PostgreSQL**
   - Expandir "Servers" → "PostgreSQL 17"
   - Ingresar contraseña si se solicita: `Staillim`

3. **Seleccionar la base de datos**
   - Expandir "Databases" → "geochat"

4. **Abrir Query Tool**
   - Click derecho en "geochat" → "Query Tool"
   - O presionar `Alt + Shift + Q`

5. **Copiar y pegar el SQL**
   - Abrir el archivo: `database-schema-postgres.sql`
   - Copiar TODO el contenido (Ctrl+A, Ctrl+C)
   - Pegar en Query Tool de pgAdmin (Ctrl+V)

6. **Ejecutar el script**
   - Presionar F5 o click en el botón "▶ Execute"
   - Esperar a que termine (debería tomar ~2 segundos)

7. **Verificar que se crearon las tablas**
   - En el navegador lateral, expandir:
     - geochat → Schemas → public → Tables
   - Deberías ver 8 tablas:
     ```
     ✅ users
     ✅ user_profiles
     ✅ points_of_interest
     ✅ conversations
     ✅ messages
     ✅ chat_requests
     ✅ live_locations
     ✅ notifications
     ```

#### Opción 2: Usar la terminal (si psql está en PATH)

```bash
psql -h localhost -p 5432 -U postgres -d geochat -f database-schema-postgres.sql
```

Si psql no está en PATH, agregarlo:
```powershell
$env:Path += ";C:\Program Files\PostgreSQL\17\bin"
```

---

## ✅ Verificación

Después de ejecutar el SQL, verifica con npm:

```bash
npm run db:status
```

Deberías ver:
```
📊 Current tables in database:
  ✅ chat_requests
  ✅ conversations
  ✅ live_locations
  ✅ messages
  ✅ notifications
  ✅ points_of_interest
  ✅ user_profiles
  ✅ users
```

---

## 📊 Datos de Ejemplo

El schema incluye automáticamente:
- ✅ **6 usuarios** (Sara, Álex, María, David, Sofía, Tú)
- ✅ **3 conversaciones**
- ✅ **7 mensajes**

Puedes verificarlos con:

```sql
-- Ver usuarios
SELECT id, name, email, lat, lng FROM users;

-- Ver conversaciones
SELECT * FROM conversations;

-- Ver mensajes
SELECT * FROM messages;
```

---

## 🎯 Próximos Pasos (DESPUÉS de crear las tablas)

### 1. Crear API Routes para reemplazar Firestore

Necesitarás crear rutas API en Next.js:

```
src/app/api/
  ├── users/
  │   └── route.ts          # GET, POST, PUT usuarios
  ├── conversations/
  │   └── route.ts          # CRUD conversaciones
  ├── messages/
  │   └── route.ts          # CRUD mensajes
  └── live-locations/
      └── route.ts          # CRUD ubicaciones en vivo
```

### 2. Reemplazar Hooks de Firestore

**Antes (Firestore):**
```typescript
import { useCollection } from '@/firebase/firestore/use-collection';
const users = useCollection('users');
```

**Después (PostgreSQL + API):**
```typescript
import useSWR from 'swr';
const { data: users } = useSWR('/api/users', fetcher);
```

### 3. Implementar Real-time Updates

Opciones:
- **WebSockets** (Socket.IO) - Para actualizaciones en tiempo real
- **PostgreSQL LISTEN/NOTIFY** - Notificaciones nativas
- **Polling** - Consultas cada X segundos
- **Server-Sent Events** - Streaming de actualizaciones

### 4. Migrar Autenticación

Firebase Auth → NextAuth.js o Lucia Auth

---

## 🆘 Troubleshooting

### Error: "No se puede conectar a PostgreSQL"
- Verificar que PostgreSQL está corriendo (Services → postgresql-x64-17)
- Verificar puerto 5432 disponible
- Revisar firewall

### Error: "Database does not exist"
- Crear la base de datos en pgAdmin:
  - Right-click "Databases" → Create → Database
  - Name: `geochat`
  - Owner: `postgres`

### Error: "Password authentication failed"
- Revisar `.env.local`
- Verificar contraseña en pgAdmin
- Reiniciar PostgreSQL service

---

## 📚 Archivos de Referencia

- `database-schema-postgres.sql` - Schema completo (¡este es el que debes ejecutar!)
- `DATABASE_MIGRATION.md` - Guía completa de migración
- `.env.local` - Credenciales de conexión
- `src/lib/db.ts` - Pool de conexiones

---

## ✨ ¿Listo?

**EJECUTA EL SQL EN PGADMIN AHORA** y luego corre:

```bash
npm run db:status
```

¡Deberías ver todas las tablas creadas! 🎉
