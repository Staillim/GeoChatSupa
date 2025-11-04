# 🔄 Guía de Migración: Firestore → PostgreSQL

## ✅ Estado Actual

### **Completado:**
- ✅ Base de datos PostgreSQL creada y configurada
- ✅ 8 tablas + 3 vistas + triggers
- ✅ Pool de conexiones (`src/lib/db.ts`)
- ✅ 6 API Routes creados
- ✅ Hooks personalizados con SWR
- ✅ Datos de ejemplo cargados

### **API Routes Disponibles:**

```
✅ GET    /api/users                          - Listar usuarios
✅ POST   /api/users                          - Crear usuario
✅ GET    /api/users/[id]                     - Obtener usuario
✅ PUT    /api/users/[id]                     - Actualizar usuario
✅ DELETE /api/users/[id]                     - Eliminar usuario

✅ GET    /api/conversations?userId=xxx       - Listar conversaciones
✅ POST   /api/conversations                  - Crear conversación
✅ GET    /api/conversations/[id]             - Obtener conversación
✅ PUT    /api/conversations/[id]             - Actualizar conversación
✅ DELETE /api/conversations/[id]             - Eliminar conversación

✅ GET    /api/conversations/[id]/messages    - Listar mensajes
✅ POST   /api/conversations/[id]/messages    - Enviar mensaje

✅ GET    /api/live-locations?userId=xxx      - Obtener ubicaciones en vivo
✅ POST   /api/live-locations                 - Iniciar compartir ubicación
✅ PUT    /api/live-locations                 - Actualizar ubicación
✅ DELETE /api/live-locations                 - Detener compartir ubicación
```

---

## 🔄 Cómo Migrar Componentes

### **Paso 1: Reemplazar imports de Firestore**

**ANTES (Firestore):**
```typescript
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, onSnapshot } from 'firebase/firestore';
```

**DESPUÉS (PostgreSQL):**
```typescript
import { useUsers, useConversations, useLiveLocations } from '@/hooks/use-postgres-data';
```

---

### **Paso 2: Reemplazar hooks**

#### **Ejemplo 1: Obtener todos los usuarios**

**ANTES:**
```typescript
const { data: users } = useCollection('users');
```

**DESPUÉS:**
```typescript
const { users, isLoading, isError } = useUsers();

// Con filtros:
const { users } = useUsers({ online: true, lat: 34.0522, lng: -118.2437, radius: 10 });
```

---

#### **Ejemplo 2: Obtener conversaciones**

**ANTES:**
```typescript
const conversationsRef = collection(db, 'conversations');
const q = query(conversationsRef, where('participants', 'array-contains', currentUserId));
const { data: conversations } = useCollection(q);
```

**DESPUÉS:**
```typescript
const { conversations, isLoading } = useConversations(currentUserId);

// Solo activas:
const { conversations } = useConversations(currentUserId, 'active');
```

---

#### **Ejemplo 3: Obtener mensajes**

**ANTES:**
```typescript
const messagesRef = collection(db, 'conversations', conversationId, 'messages');
const q = query(messagesRef, orderBy('created_at', 'asc'));
const { data: messages } = useCollection(q);
```

**DESPUÉS:**
```typescript
const { messages, total, isLoading } = useMessages(conversationId);

// Con paginación:
const { messages } = useMessages(conversationId, { limit: 50, offset: 0 });
```

---

#### **Ejemplo 4: Ubicaciones en vivo**

**ANTES:**
```typescript
const liveLocationsRef = collection(db, 'liveLocations');
const q = query(
  liveLocationsRef,
  where('userId', '==', currentUserId),
  where('isActive', '==', true)
);
const { data: liveLocations } = useCollection(q);
```

**DESPUÉS:**
```typescript
const { liveLocations, count, isLoading } = useLiveLocations(currentUserId);
```

---

### **Paso 3: Reemplazar mutaciones (crear, actualizar, eliminar)**

#### **Crear usuario:**

**ANTES:**
```typescript
import { doc, setDoc } from 'firebase/firestore';

await setDoc(doc(db, 'users', userId), {
  name: 'John',
  email: 'john@example.com',
  // ...
});
```

**DESPUÉS:**
```typescript
import { createUser } from '@/hooks/use-postgres-data';

const result = await createUser({
  id: userId,
  name: 'John',
  email: 'john@example.com',
  // ...
});

if (result.success) {
  console.log('Usuario creado:', result.user);
}
```

---

#### **Actualizar usuario:**

**ANTES:**
```typescript
import { doc, updateDoc } from 'firebase/firestore';

await updateDoc(doc(db, 'users', userId), {
  lat: 34.0522,
  lng: -118.2437,
  is_online: true
});
```

**DESPUÉS:**
```typescript
import { updateUser } from '@/hooks/use-postgres-data';

const result = await updateUser(userId, {
  lat: 34.0522,
  lng: -118.2437,
  is_online: true
});
```

---

#### **Enviar mensaje:**

**ANTES:**
```typescript
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
  text: 'Hola!',
  senderId: currentUserId,
  timestamp: serverTimestamp()
});
```

**DESPUÉS:**
```typescript
import { sendMessage } from '@/hooks/use-postgres-data';

const result = await sendMessage(conversationId, {
  id: `msg_${Date.now()}`,
  sender_id: currentUserId,
  text: 'Hola!'
});
```

---

#### **Iniciar ubicación en vivo:**

**ANTES:**
```typescript
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

await setDoc(doc(db, 'liveLocations', `${userId}_${sharedWith}`), {
  userId,
  sharedWith,
  latitude: position.coords.latitude,
  longitude: position.coords.longitude,
  isActive: true,
  lastUpdated: serverTimestamp()
});
```

**DESPUÉS:**
```typescript
import { startLiveLocationSharing } from '@/hooks/use-postgres-data';

const result = await startLiveLocationSharing({
  user_id: userId,
  shared_with: sharedWith,
  latitude: position.coords.latitude,
  longitude: position.coords.longitude,
  accuracy: position.coords.accuracy
});
```

---

## 📋 Lista de Archivos a Migrar

### **Archivos Firestore actuales:**

```
src/firebase/firestore/
  ├── use-collection.tsx              → Reemplazar con useUsers, useConversations, etc.
  ├── use-user.tsx                     → Reemplazar con useUser
  ├── use-all-live-locations.tsx      → Reemplazar con useLiveLocations
  ├── use-live-location-sharing.tsx   → Reemplazar con start/update/stopLiveLocationSharing
  ├── use-location-sharing-permission.tsx
  ├── use-chat-requests.tsx
  └── ...otros hooks...
```

### **Componentes a actualizar:**

```
src/components/
  ├── map-component.tsx               - Usar useLiveLocations
  ├── live-location-button.tsx        - Usar start/stop functions
  ├── user-card.tsx                   - Usar useUser
  └── ...otros componentes...

src/app/(app)/
  ├── map/page.tsx                    - Usar useUsers, useLiveLocations
  ├── chat/page.tsx                   - Usar useConversations
  └── profile/page.tsx                - Usar useUser
```

---

## 🎯 Migración por Prioridad

### **Prioridad 1: Usuarios y Mapa** ⭐⭐⭐
1. `src/app/(app)/map/page.tsx` - Usar `useUsers()`
2. `src/components/map-component.tsx` - Usar `useLiveLocations()`
3. `src/components/user-card.tsx` - Usar `useUser()`

### **Prioridad 2: Chat y Mensajes** ⭐⭐
4. `src/app/(app)/chat/page.tsx` - Usar `useConversations()`
5. Componentes de mensajes - Usar `useMessages()`, `sendMessage()`

### **Prioridad 3: Ubicación en Vivo** ⭐
6. `src/components/live-location-button.tsx` - Usar funciones de live location
7. `src/firebase/firestore/use-live-location-sharing.tsx` - Migrar lógica

---

## 🔄 Real-time Updates

### **Firestore vs PostgreSQL:**

**Firestore:**
- `onSnapshot()` - Actualizaciones en tiempo real automáticas

**PostgreSQL (con SWR):**
- Polling cada X segundos (configurable)
- `refreshInterval` en hooks de SWR
- Revalidación manual con `mutate()`

### **Configuración actual:**

```typescript
// Usuarios: cada 30 segundos
useUsers() → refreshInterval: 30000

// Conversaciones: cada 5 segundos
useConversations() → refreshInterval: 5000

// Mensajes: cada 3 segundos
useMessages() → refreshInterval: 3000

// Ubicaciones en vivo: cada 60 segundos
useLiveLocations() → refreshInterval: 60000
```

---

## 🧪 Testing

### **Probar APIs manualmente:**

```bash
# Listar usuarios
curl http://localhost:9002/api/users

# Obtener usuario específico
curl http://localhost:9002/api/users/user-1

# Listar conversaciones
curl "http://localhost:9002/api/conversations?userId=current-user"

# Obtener mensajes
curl http://localhost:9002/api/conversations/conv-1/messages

# Obtener ubicaciones en vivo
curl "http://localhost:9002/api/live-locations?userId=current-user"
```

---

## ⚠️ Diferencias Importantes

### **1. IDs:**
- **Firestore:** Auto-generados con `doc().id`
- **PostgreSQL:** Debes generar IDs manualmente: `msg_${Date.now()}` o usar UUID

### **2. Timestamps:**
- **Firestore:** `serverTimestamp()`
- **PostgreSQL:** `CURRENT_TIMESTAMP` (automático en INSERT)

### **3. Arrays en JSONB:**
- **Firestore:** `arrayUnion()`, `arrayRemove()`
- **PostgreSQL:** Necesitas manejar el array manualmente en el código

### **4. Real-time:**
- **Firestore:** `onSnapshot()` - push automático
- **PostgreSQL:** Polling con SWR o WebSockets (próximo paso)

---

## 📝 Ejemplo Completo: Migrar MapComponent

**ANTES:**
```typescript
// src/app/(app)/map/page.tsx
import { useCollection } from '@/firebase/firestore/use-collection';
import { useAllLiveLocations } from '@/firebase/firestore/use-all-live-locations';

export default function MapPage() {
  const { data: users } = useCollection('users');
  const liveLocations = useAllLiveLocations(currentUser?.uid);
  
  return <MapComponent users={users} liveLocations={liveLocations} />;
}
```

**DESPUÉS:**
```typescript
// src/app/(app)/map/page.tsx
import { useUsers, useLiveLocations } from '@/hooks/use-postgres-data';

export default function MapPage() {
  const { users, isLoading: usersLoading } = useUsers();
  const { liveLocations, isLoading: locationsLoading } = useLiveLocations(currentUser?.uid);
  
  if (usersLoading || locationsLoading) {
    return <div>Loading...</div>;
  }
  
  return <MapComponent users={users} liveLocations={liveLocations} />;
}
```

---

## 🚀 Próximos Pasos

1. ✅ **APIs creadas** - Listo
2. ✅ **Hooks personalizados** - Listo
3. ⏳ **Migrar componentes** - En progreso
4. ⏳ **Testing end-to-end**
5. ⏳ **Implementar WebSockets** (opcional, para real-time mejor)
6. ⏳ **Eliminar dependencias de Firebase**

---

## 💡 Tips

- **No migres todo de una vez** - Hazlo por componentes
- **Mantén Firestore funcionando** mientras migras
- **Usa feature flags** para cambiar entre Firestore y PostgreSQL
- **Prueba cada componente** después de migrarlo
- **Los datos de ejemplo** ya están en PostgreSQL para testing

---

¿Quieres que empiece a migrar algún componente específico? Por ejemplo, el `map/page.tsx` o `live-location-button.tsx`? 🚀
