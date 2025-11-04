# 🚀 Migración Completada: Firestore → PostgreSQL

## ✅ Archivos Migrados

### **1. Hooks Principales**
- ✅ `src/hooks/use-postgres-data.tsx` - Hooks de datos (reemplaza useCollection, useDoc)
- ✅ `src/hooks/use-postgres-user.tsx` - Hook de usuario autenticado
- ✅ `src/hooks/use-live-location-postgres.tsx` - Hooks de ubicación en tiempo real

### **2. Páginas Migradas**
- ✅ `src/app/(app)/map/page.tsx` - Página del mapa (usa PostgreSQL)

### **3. Componentes Migrados**
- ✅ `src/components/live-location-button.tsx` - Botón de ubicación en vivo

---

## 📊 Hooks Disponibles

### **Datos de Usuarios:**
```typescript
// Obtener usuario actual autenticado (Auth + PostgreSQL)
const { user, userProfile, isUserLoading } = useUser();

// Obtener datos de un usuario específico
const { user, isLoading } = useUserData(userId);

// Obtener todos los usuarios (con filtros opcionales)
const { users, total, isLoading } = useAllUsers({
  online: true,
  lat: 34.05,
  lng: -118.24,
  radius: 10
});
```

### **Conversaciones:**
```typescript
// Obtener conversaciones del usuario
const { conversations, count, isLoading } = useConversations(userId, 'active');
```

### **Mensajes:**
```typescript
// Obtener mensajes de una conversación
const { messages, total, isLoading } = useMessages(conversationId, {
  limit: 50,
  offset: 0
});
```

### **Ubicaciones en Vivo:**
```typescript
// Obtener ubicaciones en tiempo real
const { liveLocations, count, isLoading } = useLiveLocations(userId);

// Permisos de ubicación
const {
  hasPermission,
  hasSentRequest,
  hasReceivedRequest,
  sendRequest,
  acceptRequest,
  rejectRequest
} = useLocationSharingPermission(currentUserId, otherUserId);

// Compartir ubicación en tiempo real
const { isSharing, error, startSharing, stopSharing } = useLiveLocationSharing(
  currentUserId,
  recipientId,
  hasPermission
);
```

---

## 🔧 Funciones de Mutación

### **Usuarios:**
```typescript
// Crear usuario
await createUser({ id, name, email, avatar, ... });

// Actualizar usuario
await updateUser(userId, { lat, lng, is_online: true });

// Actualizar permisos de ubicación
await updateLocationSharingWith(userId, [otherUserId]);
await updateLocationSharingRequests(userId, [requesterId]);
```

### **Conversaciones:**
```typescript
// Crear conversación
await createConversation({
  id: 'conv-1',
  participants: [userId1, userId2],
  created_by: userId1,
  initialMessage: 'Hola!'
});
```

### **Mensajes:**
```typescript
// Enviar mensaje
await sendMessage(conversationId, {
  id: `msg_${Date.now()}`,
  sender_id: userId,
  text: 'Hola!',
  image_url: 'https://...'
});
```

### **Ubicación en Vivo:**
```typescript
// Iniciar compartir
await startLiveLocationSharing({
  user_id: userId,
  shared_with: otherUserId,
  latitude: 34.05,
  longitude: -118.24,
  accuracy: 10
});

// Actualizar ubicación
await updateLiveLocation({ ... });

// Detener compartir
await stopLiveLocationSharing(userId, otherUserId);
```

---

## 🔄 Diferencias vs Firestore

### **1. IDs:**
```typescript
// FIRESTORE
const docRef = doc(collection(db, 'messages'));
docRef.id // Auto-generado

// POSTGRESQL
const messageId = `msg_${Date.now()}`;
// o
import { v4 as uuidv4 } from 'uuid';
const messageId = uuidv4();
```

### **2. Timestamps:**
```typescript
// FIRESTORE
import { serverTimestamp } from 'firebase/firestore';
created_at: serverTimestamp()

// POSTGRESQL
// Se genera automáticamente en el servidor con DEFAULT CURRENT_TIMESTAMP
// No necesitas enviarlo desde el cliente
```

### **3. Real-time:**
```typescript
// FIRESTORE
const unsubscribe = onSnapshot(query, (snapshot) => {
  // Actualización en tiempo real
});

// POSTGRESQL (con SWR)
const { data } = useSWR('/api/endpoint', fetcher, {
  refreshInterval: 3000 // Polling cada 3 segundos
});
```

### **4. Arrays en JSONB:**
```typescript
// FIRESTORE
import { arrayUnion, arrayRemove } from 'firebase/firestore';
await updateDoc(docRef, {
  tags: arrayUnion('nuevo-tag')
});

// POSTGRESQL
const currentTags = user.tags || [];
await updateUser(userId, {
  tags: [...currentTags, 'nuevo-tag']
});
```

---

## ⏳ Pendiente de Migrar

### **Alta Prioridad:**
- ⏳ `src/app/(app)/chat/page.tsx` - Lista de conversaciones
- ⏳ `src/app/(app)/chat/[[...slug]]/page.tsx` - Vista de chat
- ⏳ `src/app/(app)/profile/page.tsx` - Perfil de usuario

### **Media Prioridad:**
- ⏳ `src/components/search-user-dialog.tsx`
- ⏳ `src/components/user-card.tsx`
- ⏳ `src/components/location-sharing-requests.tsx`

### **Baja Prioridad:**
- ⏳ `src/firebase/firestore/use-shared-locations.tsx` - Migrar a PostgreSQL
- ⏳ `src/firebase/firestore/use-chat-requests.tsx` - API de chat requests

---

## 🧪 Testing

### **1. Iniciar el servidor:**
```bash
npm run dev
```

### **2. Probar en navegador:**
- Abrir http://localhost:9002
- Iniciar sesión
- Ir a `/map` - Debería cargar usuarios desde PostgreSQL
- Verificar que se muestran usuarios en el mapa

### **3. Probar APIs directamente:**
```bash
# Listar usuarios
curl http://localhost:9002/api/users

# Obtener usuario específico
curl http://localhost:9002/api/users/user-1

# Obtener ubicaciones en vivo
curl "http://localhost:9002/api/live-locations?userId=current-user"
```

---

## 📝 Notas Importantes

1. **Firebase Auth se mantiene** - Solo migramos Firestore, no Firebase Auth
2. **Compatibilidad** - Los hooks mantienen la misma interfaz que Firestore
3. **Revalidación** - SWR maneja el cache automáticamente
4. **Real-time** - Actualmente usa polling (3-30 segundos)
5. **WebSockets** - Se pueden agregar después para real-time verdadero

---

## 🚀 Próximos Pasos

1. **Probar la página del mapa** - Verificar que carga usuarios
2. **Migrar páginas de chat** - Usar useConversations y useMessages
3. **Migrar perfil** - Actualizar datos del usuario
4. **Implementar WebSockets** - Para actualizaciones en tiempo real
5. **Eliminar hooks de Firestore** - Una vez todo migrado

---

## 💡 Tips de Desarrollo

- **Mantén ambos sistemas** mientras migras (Firestore y PostgreSQL)
- **Migra componente por componente** para detectar errores fácilmente
- **Usa feature flags** para cambiar entre backends
- **Revisa los logs** en consola del navegador
- **Prueba cada componente** después de migrarlo

---

¿Listo para migrar más componentes? 🎯
