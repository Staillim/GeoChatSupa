/**
 * Query Examples - Test PostgreSQL Data
 * Run with: tsx src/lib/test-queries.ts
 */

import { query, closePool } from './db';

async function testQueries() {
  console.log('🔍 Testing PostgreSQL queries...\n');
  
  try {
    // 1. Count users
    console.log('1️⃣  Users:');
    const usersResult = await query('SELECT id, name, email, is_online FROM users ORDER BY name;');
    console.table(usersResult.rows);
    console.log(`Total users: ${usersResult.rowCount}\n`);
    
    // 2. Count conversations
    console.log('2️⃣  Conversations:');
    const convsResult = await query('SELECT id, status, last_message, last_message_at FROM conversations;');
    console.table(convsResult.rows);
    console.log(`Total conversations: ${convsResult.rowCount}\n`);
    
    // 3. Count messages
    console.log('3️⃣  Messages:');
    const msgsResult = await query(`
      SELECT m.id, m.sender_id, u.name as sender_name, m.text, m.read 
      FROM messages m 
      JOIN users u ON m.sender_id = u.id 
      ORDER BY m.created_at;
    `);
    console.table(msgsResult.rows);
    console.log(`Total messages: ${msgsResult.rowCount}\n`);
    
    // 4. Active conversations view
    console.log('4️⃣  Active Conversations View:');
    const activeConvsResult = await query('SELECT * FROM active_conversations_view;');
    console.table(activeConvsResult.rows);
    console.log(`Active conversations: ${activeConvsResult.rowCount}\n`);
    
    // 5. Test users near a location (within 10km of LA)
    console.log('5️⃣  Users near Los Angeles (within 10km):');
    const nearbyResult = await query(`
      SELECT 
        id, 
        name, 
        lat, 
        lng,
        (6371 * acos(
          cos(radians(34.0522)) * 
          cos(radians(lat)) * 
          cos(radians(lng) - radians(-118.2437)) + 
          sin(radians(34.0522)) * 
          sin(radians(lat))
        ))::numeric(10,2) AS distance_km
      FROM users
      WHERE lat IS NOT NULL 
        AND lng IS NOT NULL
        AND (6371 * acos(
          cos(radians(34.0522)) * 
          cos(radians(lat)) * 
          cos(radians(lng) - radians(-118.2437)) + 
          sin(radians(34.0522)) * 
          sin(radians(lat))
        )) < 10
      ORDER BY distance_km;
    `);
    console.table(nearbyResult.rows);
    console.log(`Users nearby: ${nearbyResult.rowCount}\n`);
    
    console.log('✅ All queries executed successfully!');
    
  } catch (error) {
    console.error('❌ Query error:', error);
  } finally {
    await closePool();
  }
}

testQueries();
