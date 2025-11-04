-- ============================================
-- FIX: Cambiar columna avatar de VARCHAR a TEXT
-- ============================================
-- Este script cambia la columna avatar a TEXT para soportar imágenes base64

-- MÉTODO 1: Cambio directo con USING
-- Si este método falla, usa el MÉTODO 2
ALTER TABLE users ALTER COLUMN avatar TYPE TEXT USING avatar::TEXT;

-- Verificar el cambio
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'avatar';
-- Debe mostrar: data_type = 'text', character_maximum_length = NULL

-- ============================================
-- MÉTODO 2: Si el método 1 no funciona
-- ============================================
-- Descomenta estas líneas (quita los --) y ejecuta en lugar del método 1:

-- -- Paso 1: Crear columna temporal
-- ALTER TABLE users ADD COLUMN avatar_temp TEXT;

-- -- Paso 2: Copiar datos
-- UPDATE users SET avatar_temp = avatar;

-- -- Paso 3: Eliminar columna antigua
-- ALTER TABLE users DROP COLUMN avatar CASCADE;

-- -- Paso 4: Renombrar columna nueva
-- ALTER TABLE users RENAME COLUMN avatar_temp TO avatar;

-- -- Verificar
-- SELECT column_name, data_type, character_maximum_length 
-- FROM information_schema.columns 
-- WHERE table_name = 'users' AND column_name = 'avatar';

-- ============================================
-- VERIFICAR DATOS
-- ============================================
-- Confirmar que los datos se mantuvieron
SELECT id, name, LEFT(avatar, 50) as avatar_preview 
FROM users 
LIMIT 5;
