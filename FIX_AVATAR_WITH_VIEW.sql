-- ============================================
-- FIX: Cambiar columna avatar a TEXT
-- Problema: La vista active_live_locations_view depende de avatar
-- ============================================

-- Paso 1: Guardar la definición de la vista (para recrearla después)
-- Ejecuta esto primero para ver la definición:
SELECT pg_get_viewdef('active_live_locations_view', true);

-- Paso 2: Eliminar TODAS las vistas que dependen de avatar
DROP VIEW IF EXISTS active_live_locations_view CASCADE;
DROP VIEW IF EXISTS pending_chat_requests_view CASCADE;

-- Paso 3: Cambiar el tipo de columna avatar a TEXT
ALTER TABLE users ALTER COLUMN avatar TYPE TEXT;

-- Paso 4: Recrear AMBAS vistas con las definiciones originales

-- Vista 1: active_live_locations_view
CREATE OR REPLACE VIEW active_live_locations_view AS
SELECT ll.id,
    ll.user_id,
    u1.name AS user_name,
    u1.avatar AS user_avatar,
    ll.shared_with,
    u2.name AS shared_with_name,
    u2.avatar AS shared_with_avatar,
    ll.latitude,
    ll.longitude,
    ll.accuracy,
    ll.started_at,
    ll.last_updated,
    EXTRACT(epoch FROM CURRENT_TIMESTAMP - ll.last_updated::timestamp with time zone) / 60::numeric AS minutes_since_update
FROM live_locations ll
JOIN users u1 ON ll.user_id::text = u1.id::text
JOIN users u2 ON ll.shared_with::text = u2.id::text
WHERE ll.is_active = true
ORDER BY ll.last_updated DESC;

-- Vista 2: pending_chat_requests_view
CREATE OR REPLACE VIEW pending_chat_requests_view AS
SELECT cr.id,
    cr.from_user_id,
    u1.name AS from_user_name,
    u1.avatar AS from_user_avatar,
    cr.to_user_id,
    u2.name AS to_user_name,
    u2.avatar AS to_user_avatar,
    cr.conversation_id,
    cr.message,
    cr.created_at
FROM chat_requests cr
JOIN users u1 ON cr.from_user_id::text = u1.id::text
JOIN users u2 ON cr.to_user_id::text = u2.id::text
WHERE cr.status::text = 'pending'::text
ORDER BY cr.created_at DESC;

-- Paso 5: Verificar que todo quedó bien
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'avatar';
-- Debe mostrar: data_type = 'text', character_maximum_length = NULL

-- Paso 6: Verificar que la vista existe
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_name = 'active_live_locations_view';

-- Paso 7: Probar la vista
SELECT * FROM active_live_locations_view LIMIT 5;
