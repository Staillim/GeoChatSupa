-- ============================================================================
-- GeoChat Database Schema - PostgreSQL Version
-- Generated from Firestore structure
-- Date: November 3, 2025
-- ============================================================================

-- Database: geochat
-- Description: Real-time location sharing and messaging application
-- This schema represents the Firestore NoSQL structure as relational PostgreSQL tables

-- ============================================================================
-- EXTENSIONS: Enable necessary PostgreSQL extensions
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; -- For UUID generation
CREATE EXTENSION IF NOT EXISTS "postgis"; -- For geospatial queries (optional but recommended)

-- ============================================================================
-- TABLE: users
-- Description: Main user accounts with profile information and location data
-- Firestore path: /users/{userId}
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    avatar VARCHAR(500), -- URL or path to avatar image
    bio TEXT,
    lat DECIMAL(10, 8), -- Latitude with 8 decimal precision
    lng DECIMAL(11, 8), -- Longitude with 8 decimal precision
    location_sharing_requests JSONB DEFAULT '[]'::jsonb, -- Array of user IDs who requested location sharing
    location_sharing_with JSONB DEFAULT '[]'::jsonb, -- Array of user IDs with whom location is shared (mutual permission)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMP,
    is_online BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_location ON users(lat, lng);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_online ON users(is_online) WHERE is_online = TRUE;

-- ============================================================================
-- TABLE: user_profiles
-- Description: Private user profile information (subcollection)
-- Firestore path: /users/{userId}/profile
-- ============================================================================
CREATE TABLE user_profiles (
    user_id VARCHAR(255) PRIMARY KEY,
    phone VARCHAR(50),
    birth_date DATE,
    gender ENUM('male', 'female', 'other', 'prefer_not_to_say'),
    preferences JSON, -- User preferences and settings
    privacy_settings JSON, -- Privacy configuration
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE: points_of_interest
-- Description: User-saved points of interest on the map
-- Firestore path: /users/{userId}/pointsOfInterest/{pointOfInterestId}
-- ============================================================================
CREATE TABLE points_of_interest (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    lat DECIMAL(10, 8) NOT NULL,
    lng DECIMAL(11, 8) NOT NULL,
    category VARCHAR(100), -- e.g., 'restaurant', 'park', 'favorite'
    icon VARCHAR(50),
    color VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_location (lat, lng),
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE: conversations
-- Description: Chat conversations between two users with status control
-- Firestore path: /conversations/{conversationId}
-- ============================================================================
CREATE TABLE conversations (
    id VARCHAR(255) PRIMARY KEY,
    participants JSON NOT NULL, -- Array of 2 user IDs [userId1, userId2]
    created_by VARCHAR(255) NOT NULL,
    status ENUM('pending', 'active', 'blocked') DEFAULT 'pending',
    last_message TEXT,
    last_message_at TIMESTAMP,
    unread_count JSON, -- Object: {userId1: count, userId2: count}
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_created_by (created_by),
    INDEX idx_status (status),
    INDEX idx_last_message_at (last_message_at),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE: messages
-- Description: Chat messages within conversations
-- Firestore path: /conversations/{conversationId}/messages/{messageId}
-- ============================================================================
CREATE TABLE messages (
    id VARCHAR(255) PRIMARY KEY,
    conversation_id VARCHAR(255) NOT NULL,
    sender_id VARCHAR(255) NOT NULL,
    text TEXT NOT NULL,
    image_url VARCHAR(500), -- URL for attached images
    location_lat DECIMAL(10, 8), -- If message contains location
    location_lng DECIMAL(11, 8), -- If message contains location
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_conversation_id (conversation_id),
    INDEX idx_sender_id (sender_id),
    INDEX idx_created_at (created_at),
    INDEX idx_read_status (conversation_id, read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE: chat_requests
-- Description: Friend/chat requests with approval workflow
-- Firestore path: /chatRequests/{requestId}
-- ============================================================================
CREATE TABLE chat_requests (
    id VARCHAR(255) PRIMARY KEY,
    from_user_id VARCHAR(255) NOT NULL,
    to_user_id VARCHAR(255) NOT NULL,
    conversation_id VARCHAR(255) NOT NULL,
    status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
    message TEXT, -- Optional message with the request
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    UNIQUE KEY unique_request (from_user_id, to_user_id, conversation_id),
    INDEX idx_from_user_id (from_user_id),
    INDEX idx_to_user_id (to_user_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE: live_locations
-- Description: Real-time location sharing between users (active sessions)
-- Firestore path: /liveLocations/{locationId}
-- Format: locationId = {userId}_{sharedWithUserId}
-- ============================================================================
CREATE TABLE live_locations (
    id VARCHAR(255) PRIMARY KEY, -- Format: userId_sharedWithUserId
    user_id VARCHAR(255) NOT NULL,
    shared_with VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    accuracy DECIMAL(10, 2), -- GPS accuracy in meters
    is_active BOOLEAN DEFAULT TRUE,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (shared_with) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_sharing (user_id, shared_with),
    INDEX idx_user_id (user_id),
    INDEX idx_shared_with (shared_with),
    INDEX idx_is_active (is_active),
    INDEX idx_last_updated (last_updated)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE: chat_rooms (Legacy)
-- Description: Legacy chat room structure (kept for backward compatibility)
-- Firestore path: /chatRooms/{chatRoomId}
-- ============================================================================
CREATE TABLE chat_rooms (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255),
    participant_ids JSON NOT NULL, -- Array of user IDs
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_created_by (created_by),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE: chat_room_messages (Legacy)
-- Description: Messages within legacy chat rooms
-- Firestore path: /chatRooms/{chatRoomId}/messages/{messageId}
-- ============================================================================
CREATE TABLE chat_room_messages (
    id VARCHAR(255) PRIMARY KEY,
    chat_room_id VARCHAR(255) NOT NULL,
    sender_id VARCHAR(255) NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chat_room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_chat_room_id (chat_room_id),
    INDEX idx_sender_id (sender_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE: notifications
-- Description: Push notifications and in-app notifications
-- Note: This table doesn't exist in Firestore yet but is useful for SQL
-- ============================================================================
CREATE TABLE notifications (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    type ENUM('message', 'chat_request', 'location_request', 'location_accepted', 'system') NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    data JSON, -- Additional notification data
    read BOOLEAN DEFAULT FALSE,
    action_url VARCHAR(500), -- Deep link for notification action
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_type (type),
    INDEX idx_read (user_id, read),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- VIEWS: Convenient queries for common operations
-- ============================================================================

-- View: Active conversations with latest message info
CREATE VIEW active_conversations_view AS
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

-- View: Active live location sessions
CREATE VIEW active_live_locations_view AS
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
    TIMESTAMPDIFF(MINUTE, ll.last_updated, NOW()) AS minutes_since_update
FROM live_locations ll
JOIN users u1 ON ll.user_id = u1.id
JOIN users u2 ON ll.shared_with = u2.id
WHERE ll.is_active = TRUE
ORDER BY ll.last_updated DESC;

-- View: Pending chat requests
CREATE VIEW pending_chat_requests_view AS
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
-- STORED PROCEDURES: Business logic helpers
-- ============================================================================

DELIMITER //

-- Procedure: Create a new conversation with initial message
CREATE PROCEDURE create_conversation_with_message(
    IN p_user1_id VARCHAR(255),
    IN p_user2_id VARCHAR(255),
    IN p_message_text TEXT,
    IN p_image_url VARCHAR(500),
    OUT p_conversation_id VARCHAR(255),
    OUT p_message_id VARCHAR(255)
)
BEGIN
    DECLARE v_conversation_id VARCHAR(255);
    DECLARE v_message_id VARCHAR(255);
    
    -- Generate IDs (in real implementation, use UUID or similar)
    SET v_conversation_id = CONCAT('conv_', UUID());
    SET v_message_id = CONCAT('msg_', UUID());
    
    -- Create conversation
    INSERT INTO conversations (id, participants, created_by, status, last_message, last_message_at)
    VALUES (
        v_conversation_id,
        JSON_ARRAY(p_user1_id, p_user2_id),
        p_user1_id,
        'pending',
        p_message_text,
        NOW()
    );
    
    -- Create initial message
    INSERT INTO messages (id, conversation_id, sender_id, text, image_url)
    VALUES (v_message_id, v_conversation_id, p_user1_id, p_message_text, p_image_url);
    
    -- Return IDs
    SET p_conversation_id = v_conversation_id;
    SET p_message_id = v_message_id;
END //

-- Procedure: Accept location sharing request (mutual permission)
CREATE PROCEDURE accept_location_sharing_request(
    IN p_requester_id VARCHAR(255),
    IN p_accepter_id VARCHAR(255)
)
BEGIN
    -- Remove request from accepter's requests array
    UPDATE users
    SET location_sharing_requests = JSON_REMOVE(
        location_sharing_requests,
        JSON_UNQUOTE(JSON_SEARCH(location_sharing_requests, 'one', p_requester_id))
    )
    WHERE id = p_accepter_id;
    
    -- Add mutual permissions (both users add each other)
    UPDATE users
    SET location_sharing_with = JSON_ARRAY_APPEND(
        COALESCE(location_sharing_with, JSON_ARRAY()),
        '$',
        p_accepter_id
    )
    WHERE id = p_requester_id;
    
    UPDATE users
    SET location_sharing_with = JSON_ARRAY_APPEND(
        COALESCE(location_sharing_with, JSON_ARRAY()),
        '$',
        p_requester_id
    )
    WHERE id = p_accepter_id;
END //

-- Procedure: Start live location sharing session
CREATE PROCEDURE start_live_location_sharing(
    IN p_user_id VARCHAR(255),
    IN p_shared_with VARCHAR(255),
    IN p_latitude DECIMAL(10, 8),
    IN p_longitude DECIMAL(11, 8),
    IN p_accuracy DECIMAL(10, 2)
)
BEGIN
    DECLARE v_location_id VARCHAR(255);
    SET v_location_id = CONCAT(p_user_id, '_', p_shared_with);
    
    -- Insert or update live location
    INSERT INTO live_locations (id, user_id, shared_with, latitude, longitude, accuracy, is_active)
    VALUES (v_location_id, p_user_id, p_shared_with, p_latitude, p_longitude, p_accuracy, TRUE)
    ON DUPLICATE KEY UPDATE
        latitude = p_latitude,
        longitude = p_longitude,
        accuracy = p_accuracy,
        is_active = TRUE,
        last_updated = NOW();
END //

-- Procedure: Update live location (called every minute)
CREATE PROCEDURE update_live_location(
    IN p_user_id VARCHAR(255),
    IN p_shared_with VARCHAR(255),
    IN p_latitude DECIMAL(10, 8),
    IN p_longitude DECIMAL(11, 8),
    IN p_accuracy DECIMAL(10, 2)
)
BEGIN
    UPDATE live_locations
    SET 
        latitude = p_latitude,
        longitude = p_longitude,
        accuracy = p_accuracy,
        last_updated = NOW()
    WHERE user_id = p_user_id 
      AND shared_with = p_shared_with 
      AND is_active = TRUE;
END //

-- Procedure: Stop live location sharing
CREATE PROCEDURE stop_live_location_sharing(
    IN p_user_id VARCHAR(255),
    IN p_shared_with VARCHAR(255)
)
BEGIN
    UPDATE live_locations
    SET is_active = FALSE
    WHERE user_id = p_user_id AND shared_with = p_shared_with;
END //

-- Procedure: Clean up stale live locations (older than 5 minutes)
CREATE PROCEDURE cleanup_stale_live_locations()
BEGIN
    UPDATE live_locations
    SET is_active = FALSE
    WHERE is_active = TRUE
      AND last_updated < DATE_SUB(NOW(), INTERVAL 5 MINUTE);
END //

DELIMITER ;

-- ============================================================================
-- TRIGGERS: Automatic data maintenance
-- ============================================================================

-- Trigger: Update conversation's last_message_at when new message arrives
DELIMITER //
CREATE TRIGGER update_conversation_on_new_message
AFTER INSERT ON messages
FOR EACH ROW
BEGIN
    UPDATE conversations
    SET 
        last_message = NEW.text,
        last_message_at = NEW.created_at
    WHERE id = NEW.conversation_id;
END //
DELIMITER ;

-- Trigger: Increment unread count when message is sent
DELIMITER //
CREATE TRIGGER increment_unread_count
AFTER INSERT ON messages
FOR EACH ROW
BEGIN
    -- This would need to be implemented based on your specific unread count logic
    -- Since unread_count is stored as JSON per user in conversations table
    UPDATE conversations
    SET updated_at = NOW()
    WHERE id = NEW.conversation_id;
END //
DELIMITER ;

-- ============================================================================
-- INDEXES: Performance optimization
-- ============================================================================

-- Additional composite indexes for common queries
CREATE INDEX idx_messages_conversation_created ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_users_location_online ON users(lat, lng, is_online);
CREATE INDEX idx_live_locations_active ON live_locations(is_active, last_updated);

-- ============================================================================
-- SAMPLE DATA: For testing purposes
-- ============================================================================

-- Insert sample users
INSERT INTO users (id, name, email, avatar, lat, lng, location_sharing_requests, location_sharing_with, is_online) VALUES
('user-1', 'Sara', 'sara@example.com', '/avatars/user-1.jpg', 34.0522, -118.2437, '[]', '[]', TRUE),
('user-2', 'Álex', 'alex@example.com', '/avatars/user-2.jpg', 34.0550, -118.2450, '[]', '[]', TRUE),
('user-3', 'María', 'maria@example.com', '/avatars/user-3.jpg', 34.0490, -118.2400, '[]', '[]', FALSE),
('user-4', 'David', 'david@example.com', '/avatars/user-4.jpg', 34.0580, -118.2500, '[]', '[]', TRUE),
('user-5', 'Sofía', 'sofia@example.com', '/avatars/user-5.jpg', 34.0510, -118.2380, '[]', '[]', FALSE),
('current-user', 'Tú', 'you@example.com', '/avatars/current-user.jpg', 34.0540, -118.2420, '[]', '[]', TRUE);

-- Insert sample conversations
INSERT INTO conversations (id, participants, created_by, status, last_message, last_message_at, unread_count) VALUES
('conv-1', '["user-1", "current-user"]', 'user-1', 'active', '¡Sí! Esta aplicación es genial para encontrar gente.', NOW(), '{"user-1": 0, "current-user": 2}'),
('conv-2', '["user-2", "current-user"]', 'current-user', 'active', '¡Hola! Encantado de conectar.', DATE_SUB(NOW(), INTERVAL 1 DAY), '{"user-2": 0, "current-user": 0}'),
('conv-3', '["user-3", "current-user"]', 'user-3', 'pending', '¡Me gusta tu foto de perfil!', DATE_SUB(NOW(), INTERVAL 3 DAY), '{"user-3": 0, "current-user": 1}');

-- Insert sample messages
INSERT INTO messages (id, conversation_id, sender_id, text, read, created_at) VALUES
('msg-1-1', 'conv-1', 'user-1', 'Hola, ¿cómo estás?', TRUE, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
('msg-1-2', 'conv-1', 'current-user', 'Estoy bien, ¡gracias! ¿Y tú?', TRUE, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
('msg-1-3', 'conv-1', 'user-1', 'Vi que estabas cerca en LocalConnect.', FALSE, DATE_SUB(NOW(), INTERVAL 1 HOUR)),
('msg-1-4', 'conv-1', 'current-user', '¡Sí! Esta aplicación es genial.', FALSE, DATE_SUB(NOW(), INTERVAL 30 MINUTE)),
('msg-2-1', 'conv-2', 'current-user', '¡Hola!', TRUE, DATE_SUB(NOW(), INTERVAL 1 DAY)),
('msg-2-2', 'conv-2', 'user-2', '¡Hola! Encantado de conectar.', TRUE, DATE_SUB(NOW(), INTERVAL 1 DAY)),
('msg-3-1', 'conv-3', 'user-3', '¡Me gusta tu foto de perfil!', FALSE, DATE_SUB(NOW(), INTERVAL 3 DAY));

-- ============================================================================
-- QUERIES: Common use cases
-- ============================================================================

-- Get all users within a radius (example: 10km from a point)
/*
SELECT id, name, avatar, lat, lng,
    (6371 * acos(
        cos(radians(34.0522)) * 
        cos(radians(lat)) * 
        cos(radians(lng) - radians(-118.2437)) + 
        sin(radians(34.0522)) * 
        sin(radians(lat))
    )) AS distance_km
FROM users
WHERE is_online = TRUE
HAVING distance_km < 10
ORDER BY distance_km;
*/

-- Get conversations for a user with unread count
/*
SELECT 
    c.id,
    c.participants,
    c.status,
    c.last_message,
    c.last_message_at,
    JSON_EXTRACT(c.unread_count, CONCAT('$."', 'current-user', '"')) as my_unread_count
FROM conversations c
WHERE JSON_CONTAINS(c.participants, '"current-user"')
ORDER BY c.last_message_at DESC;
*/

-- Get all messages in a conversation
/*
SELECT m.id, m.sender_id, u.name as sender_name, m.text, m.image_url, m.read, m.created_at
FROM messages m
JOIN users u ON m.sender_id = u.id
WHERE m.conversation_id = 'conv-1'
ORDER BY m.created_at ASC;
*/

-- Get all active live location sessions for a user
/*
SELECT ll.*, u.name as shared_user_name, u.avatar as shared_user_avatar
FROM live_locations ll
JOIN users u ON ll.shared_with = u.id
WHERE ll.user_id = 'current-user' AND ll.is_active = TRUE
UNION
SELECT ll.*, u.name as shared_user_name, u.avatar as shared_user_avatar
FROM live_locations ll
JOIN users u ON ll.user_id = u.id
WHERE ll.shared_with = 'current-user' AND ll.is_active = TRUE;
*/

-- ============================================================================
-- MIGRATION NOTES
-- ============================================================================

/*
IMPORTANT: This SQL schema is a REPRESENTATION of the Firestore structure.
It is NOT currently being used by the application.

To migrate from Firestore to MySQL/PostgreSQL:
1. Export data from Firestore using Firebase Admin SDK
2. Transform the data to match this schema
3. Import data using the INSERT statements
4. Update application code to use SQL instead of Firestore
5. Test thoroughly, especially real-time features

Key differences between Firestore and SQL:
- Firestore: Nested documents (subcollections)
- SQL: Separate tables with foreign keys

- Firestore: Real-time listeners (onSnapshot)
- SQL: Polling or WebSocket push notifications

- Firestore: Security rules on database
- SQL: Security in application layer

- Firestore: Automatic timestamps (serverTimestamp())
- SQL: Triggers or application-level timestamps

Performance considerations:
- Add indexes for frequently queried fields
- Consider partitioning for large tables (messages, notifications)
- Use read replicas for high-read scenarios
- Implement caching layer (Redis) for hot data

Current application uses:
- Firestore for data storage
- Firebase Auth for authentication
- Firebase Cloud Messaging for push notifications
- These would need equivalents in SQL-based architecture
*/
