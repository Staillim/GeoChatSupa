# 🧹 Limpiar Caché de Firebase

## El problema:
Tu navegador todavía tiene credenciales de Firebase guardadas del sistema antiguo.

## Solución:

### Opción 1 - Consola del Navegador (Recomendado):
1. Abre tu navegador
2. Ve a: http://localhost:9002
3. Presiona `F12` para abrir DevTools
4. Ve a la pestaña **Console**
5. Pega este código y presiona Enter:

```javascript
// Limpiar todo el localStorage
localStorage.clear();

// Limpiar sessionStorage también
sessionStorage.clear();

// Recargar la página
location.reload();
```

### Opción 2 - Limpiar desde Application Tab:
1. Presiona `F12` en el navegador
2. Ve a la pestaña **Application** (o **Aplicación**)
3. En el menú lateral izquierdo:
   - Expande **Local Storage**
   - Click en `http://localhost:9002`
   - Click derecho → **Clear**
4. Haz lo mismo con **Session Storage**
5. Recarga la página (`Ctrl+R`)

### Opción 3 - Navegación Privada:
1. Abre una ventana de navegación privada/incógnito
2. Ve a: http://localhost:9002/signup
3. Crea una cuenta nueva
4. Prueba la aplicación

### Opción 4 - Limpiar Caché Completo:
1. `Ctrl + Shift + Delete` (Chrome/Edge)
2. Selecciona **Todo el tiempo**
3. Marca:
   - ✅ Cookies y otros datos del sitio
   - ✅ Imágenes y archivos en caché
4. Click en **Borrar datos**
5. Recarga: http://localhost:9002

---

## ¿Por qué sucede esto?

Firebase guardaba datos de autenticación en:
- `localStorage` → Credenciales de usuario
- `indexedDB` → Tokens y sesiones
- Cookies → Información de sesión

Ahora usamos un sistema nuevo de autenticación, pero el navegador todavía tiene los datos viejos.

---

## Verificar que está limpio:

En la consola del navegador (`F12` → Console), ejecuta:

```javascript
// Ver lo que hay en localStorage
console.log(localStorage);

// Ver específicamente auth_user
console.log(localStorage.getItem('auth_user'));

// Si ves datos de Firebase, límpialo:
Object.keys(localStorage).forEach(key => {
  if (key.startsWith('firebase:') || key.includes('authUser')) {
    localStorage.removeItem(key);
  }
});
```

---

## Después de limpiar:

1. **Recarga la página** → Deberías ir a `/login`
2. **Crea una cuenta nueva** en `/signup`
3. **Inicia sesión** con las credenciales nuevas
4. **Verás el mapa** con usuarios de PostgreSQL

---

## Si sigue sin funcionar:

Reinicia el servidor:

```bash
# En la terminal:
Ctrl+C  # Detener servidor
rm -r .next  # Limpiar caché de Next.js
npm run dev  # Reiniciar
```

Luego abre: http://localhost:9002/signup
