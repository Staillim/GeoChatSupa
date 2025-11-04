-- Ejecutar esto en pgAdmin para permitir imágenes base64
-- Base64 de imágenes es muy largo, VARCHAR(500) es insuficiente

ALTER TABLE messages ALTER COLUMN image_url TYPE TEXT;

-- Verificar el cambio
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'messages' AND column_name = 'image_url';
