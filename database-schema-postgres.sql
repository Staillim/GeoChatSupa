-- ============================================================================
-- GeoChat Database Schema - PostgreSQL Version
-- Compatible with: PostgreSQL 12+ and Supabase
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE: users
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    pin VARCHAR(6) NOT NULL,
    avatar TEXT,  -- Changed to TEXT to support base64 images
    bio TEXT,
    lat DECIMAL(10, 8),
    lng DECIMAL(11, 8),
    location_sharing_requests JSONB DEFAULT '[]'::jsonb,
    location_sharing_with JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMP,
    is_online BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_location ON users(lat, lng);

-- ============================================================================
-- TABLE: user_profiles
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_profiles (
    user_id VARCHAR(255) PRIMARY KEY,
    phone VARCHAR(50),
    birth_date DATE,
    gender VARCHAR(50),
    preferences JSONB DEFAULT '{}'::jsonb,
    privacy_settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================================
-- TABLE: points_of_interest
-- ============================================================================
CREATE TABLE IF NOT EXISTS points_of_interest (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    lat DECIMAL(10, 8) NOT NULL,
    lng DECIMAL(11, 8) NOT NULL,
    category VARCHAR(100),
    icon VARCHAR(50),
    color VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_poi_user_id ON points_of_interest(user_id);
CREATE INDEX IF NOT EXISTS idx_poi_location ON points_of_interest(lat, lng);

-- ============================================================================
-- TABLE: conversations
-- ============================================================================
CREATE TABLE IF NOT EXISTS conversations (
    id VARCHAR(255) PRIMARY KEY,
    participants JSONB NOT NULL,
    created_by VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    last_message TEXT,
    last_message_at TIMESTAMP,
    unread_count JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT check_status CHECK (status IN ('pending', 'active', 'blocked'))
);

CREATE INDEX IF NOT EXISTS idx_conversations_created_by ON conversations(created_by);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at);

-- ============================================================================
-- TABLE: messages
-- ============================================================================
CREATE TABLE IF NOT EXISTS messages (
    id VARCHAR(255) PRIMARY KEY,
    conversation_id VARCHAR(255) NOT NULL,
    sender_id VARCHAR(255) NOT NULL,
    text TEXT NOT NULL,
    image_url TEXT,  -- Changed to TEXT to support base64 images
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(conversation_id, created_at DESC);

-- ============================================================================
-- TABLE: chat_requests
-- ============================================================================
CREATE TABLE IF NOT EXISTS chat_requests (
    id VARCHAR(255) PRIMARY KEY,
    from_user_id VARCHAR(255) NOT NULL,
    to_user_id VARCHAR(255) NOT NULL,
    conversation_id VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    CONSTRAINT check_request_status CHECK (status IN ('pending', 'accepted', 'rejected')),
    CONSTRAINT unique_request UNIQUE (from_user_id, to_user_id, conversation_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_requests_from_user ON chat_requests(from_user_id);
CREATE INDEX IF NOT EXISTS idx_chat_requests_to_user ON chat_requests(to_user_id);
CREATE INDEX IF NOT EXISTS idx_chat_requests_status ON chat_requests(status);

-- ============================================================================
-- TABLE: live_locations
-- ============================================================================
CREATE TABLE IF NOT EXISTS live_locations (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    shared_with VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    accuracy DECIMAL(10, 2),
    is_active BOOLEAN DEFAULT TRUE,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (shared_with) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT unique_sharing UNIQUE (user_id, shared_with)
);

CREATE INDEX IF NOT EXISTS idx_live_locations_user_id ON live_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_live_locations_shared_with ON live_locations(shared_with);
CREATE INDEX IF NOT EXISTS idx_live_locations_active ON live_locations(is_active, last_updated);

-- ============================================================================
-- TABLE: notifications
-- ============================================================================
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    data JSONB DEFAULT '{}'::jsonb,
    read BOOLEAN DEFAULT FALSE,
    action_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT check_notification_type CHECK (type IN ('message', 'chat_request', 'location_request', 'location_accepted', 'system'))
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- ============================================================================
-- FUNCTIONS: Update timestamp trigger
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS: Auto-update timestamps
-- ============================================================================
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_poi_updated_at ON points_of_interest;
CREATE TRIGGER update_poi_updated_at
    BEFORE UPDATE ON points_of_interest
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_chat_requests_updated_at ON chat_requests;
CREATE TRIGGER update_chat_requests_updated_at
    BEFORE UPDATE ON chat_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_live_locations_updated_at ON live_locations;
CREATE TRIGGER update_live_locations_updated_at
    BEFORE UPDATE ON live_locations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SAMPLE DATA: Test users with base64 placeholder avatars
-- ============================================================================
-- Gray placeholder image (1x1 pixel transparent PNG in base64)
INSERT INTO users (id, name, email, password_hash, pin, avatar, lat, lng, location_sharing_requests, location_sharing_with, is_online) 
VALUES
    ('user-1', 'Sara', 'sara@example.com', 'hashed_password_1', '123456', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 34.0522, -118.2437, '[]'::jsonb, '[]'::jsonb, TRUE),
    ('user-2', 'Álex', 'alex@example.com', 'hashed_password_2', '234567', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 34.0550, -118.2450, '[]'::jsonb, '[]'::jsonb, TRUE),
    ('user-3', 'María', 'maria@example.com', 'hashed_password_3', '345678', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 34.0490, -118.2400, '[]'::jsonb, '[]'::jsonb, FALSE),
    ('user-4', 'David', 'david@example.com', 'hashed_password_4', '456789', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 34.0580, -118.2500, '[]'::jsonb, '[]'::jsonb, TRUE),
    ('user-5', 'Sofía', 'sofia@example.com', 'hashed_password_5', '567890', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 34.0510, -118.2380, '[]'::jsonb, '[]'::jsonb, FALSE),
    ('current-user', 'Tú', 'you@example.com', 'hashed_password_6', '678901', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 34.0540, -118.2420, '[]'::jsonb, '[]'::jsonb, TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO conversations (id, participants, created_by, status, last_message, last_message_at, unread_count) 
VALUES
    ('conv-1', '["user-1", "current-user"]'::jsonb, 'user-1', 'active', '¡Sí! Esta aplicación es genial para encontrar gente.', CURRENT_TIMESTAMP, '{"user-1": 0, "current-user": 2}'::jsonb),
    ('conv-2', '["user-2", "current-user"]'::jsonb, 'current-user', 'active', '¡Hola! Encantado de conectar.', CURRENT_TIMESTAMP - INTERVAL '1 day', '{"user-2": 0, "current-user": 0}'::jsonb),
    ('conv-3', '["user-3", "current-user"]'::jsonb, 'user-3', 'pending', '¡Me gusta tu foto de perfil!', CURRENT_TIMESTAMP - INTERVAL '3 days', '{"user-3": 0, "current-user": 1}'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO messages (id, conversation_id, sender_id, text, read, created_at) 
VALUES
    ('msg-1-1', 'conv-1', 'user-1', 'Hola, ¿cómo estás?', TRUE, CURRENT_TIMESTAMP - INTERVAL '2 hours'),
    ('msg-1-2', 'conv-1', 'current-user', 'Estoy bien, ¡gracias! ¿Y tú?', TRUE, CURRENT_TIMESTAMP - INTERVAL '2 hours'),
    ('msg-1-3', 'conv-1', 'user-1', 'Vi que estabas cerca en LocalConnect.', FALSE, CURRENT_TIMESTAMP - INTERVAL '1 hour'),
    ('msg-1-4', 'conv-1', 'current-user', '¡Sí! Esta aplicación es genial.', FALSE, CURRENT_TIMESTAMP - INTERVAL '30 minutes'),
    ('msg-2-1', 'conv-2', 'current-user', '¡Hola!', TRUE, CURRENT_TIMESTAMP - INTERVAL '1 day'),
    ('msg-2-2', 'conv-2', 'user-2', '¡Hola! Encantado de conectar.', TRUE, CURRENT_TIMESTAMP - INTERVAL '1 day'),
    ('msg-3-1', 'conv-3', 'user-3', '¡Me gusta tu foto de perfil!', FALSE, CURRENT_TIMESTAMP - INTERVAL '3 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- VIEWS: Convenient queries
-- ============================================================================
CREATE OR REPLACE VIEW active_conversations_view AS
SELECT 
    c.id AS conversation_id,
    c.participants,
    c.created_by,
    c.status,
    c.last_message,
    c.last_message_at,
    c.unread_count,
    c.created_at,
    c.updated_at
FROM conversations c
WHERE c.status = 'active'
ORDER BY c.last_message_at DESC;

CREATE OR REPLACE VIEW active_live_locations_view AS
SELECT 
    ll.id,
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
    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - ll.last_updated))/60 AS minutes_since_update
FROM live_locations ll
JOIN users u1 ON ll.user_id = u1.id
JOIN users u2 ON ll.shared_with = u2.id
WHERE ll.is_active = TRUE
ORDER BY ll.last_updated DESC;

CREATE OR REPLACE VIEW pending_chat_requests_view AS
SELECT 
    cr.id,
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
JOIN users u1 ON cr.from_user_id = u1.id
JOIN users u2 ON cr.to_user_id = u2.id
WHERE cr.status = 'pending'
ORDER BY cr.created_at DESC;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$ 
BEGIN 
    RAISE NOTICE '✅ GeoChat PostgreSQL database schema created successfully!';
    RAISE NOTICE '📊 Tables: users, user_profiles, points_of_interest, conversations, messages, chat_requests, live_locations, notifications';
    RAISE NOTICE '🔍 Views: active_conversations_view, active_live_locations_view, pending_chat_requests_view';
    RAISE NOTICE '⏰ Triggers: Auto-update timestamps on all tables';
    RAISE NOTICE '📝 Sample data: 6 users, 3 conversations, 7 messages';
    RAISE NOTICE '🎯 Ready for Supabase deployment!';
    RAISE NOTICE '💡 Note: avatar and image_url columns use TEXT type for base64 images';
END $$;
