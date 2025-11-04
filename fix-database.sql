-- Agregar columna PIN si no existe
ALTER TABLE users ADD COLUMN IF NOT EXISTS pin VARCHAR(6) UNIQUE;

-- Generar PINs únicos para usuarios sin PIN
UPDATE users SET pin = LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0') WHERE pin IS NULL;

-- Ver usuarios
SELECT id, email, pin FROM users;
