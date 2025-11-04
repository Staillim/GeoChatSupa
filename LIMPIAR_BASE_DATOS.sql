-- Script para limpiar datos de prueba y preparar para login real
-- EJECUTAR ESTO EN pgAdmin

-- 1. Agregar columna PIN si no existe
ALTER TABLE users ADD COLUMN IF NOT EXISTS pin VARCHAR(6) UNIQUE;

-- 2. Borrar usuario de prueba "current-user"
DELETE FROM messages WHERE sender_id = 'current-user';
DELETE FROM conversations WHERE created_by = 'current-user' OR participants::text LIKE '%current-user%';
DELETE FROM chat_requests WHERE from_user_id = 'current-user' OR to_user_id = 'current-user';
DELETE FROM live_locations WHERE user_id = 'current-user' OR shared_with = 'current-user';
DELETE FROM users WHERE id = 'current-user';

-- 3. Generar PINs únicos para usuarios existentes
UPDATE users SET pin = LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0') WHERE pin IS NULL;

-- 4. Ver estado final
SELECT id, email, pin FROM users ORDER BY created_at;
