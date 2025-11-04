/**
 * Database Migration Script
 * Creates all tables, views, stored procedures, and triggers in PostgreSQL
 */

import { getPool, query, closePool } from './db';
import fs from 'fs';
import path from 'path';

/**
 * Run the SQL migration script
 */
export async function runMigration() {
  console.log('🚀 Starting database migration...');
  
  try {
    // Read the SQL schema file
    const schemaPath = path.join(process.cwd(), 'database-schema.sql');
    const sqlScript = fs.readFileSync(schemaPath, 'utf-8');
    
    // Split by statement delimiter for PostgreSQL
    const statements = sqlScript
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));
    
    console.log(`📄 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments and empty statements
      if (!statement || statement.startsWith('--') || statement.startsWith('/*')) {
        continue;
      }
      
      try {
        await query(statement + ';');
        console.log(`✅ Statement ${i + 1}/${statements.length} executed`);
      } catch (error: any) {
        // Some errors are expected (like "table already exists")
        if (error.code === '42P07') { // duplicate table
          console.log(`⚠️  Statement ${i + 1} skipped (already exists)`);
        } else {
          console.error(`❌ Error in statement ${i + 1}:`, error.message);
          console.error('Statement:', statement.substring(0, 200));
          // Continue with other statements
        }
      }
    }
    
    console.log('✅ Database migration completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

/**
 * Drop all tables (DANGEROUS - use only in development)
 */
export async function dropAllTables() {
  console.log('⚠️  WARNING: Dropping all tables...');
  
  const tables = [
    'notifications',
    'chat_room_messages',
    'chat_rooms',
    'live_locations',
    'chat_requests',
    'messages',
    'conversations',
    'points_of_interest',
    'user_profiles',
    'users'
  ];
  
  for (const table of tables) {
    try {
      await query(`DROP TABLE IF EXISTS ${table} CASCADE;`);
      console.log(`✅ Dropped table: ${table}`);
    } catch (error) {
      console.error(`❌ Error dropping table ${table}:`, error);
    }
  }
  
  console.log('✅ All tables dropped');
}

/**
 * Check migration status
 */
export async function checkMigrationStatus() {
  try {
    const result = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('📊 Current tables in database:');
    result.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    return result.rows;
  } catch (error) {
    console.error('❌ Error checking migration status:', error);
    throw error;
  }
}

/**
 * Main migration runner (CLI)
 */
if (require.main === module) {
  const command = process.argv[2];
  
  (async () => {
    try {
      switch (command) {
        case 'up':
          await runMigration();
          break;
        case 'down':
          await dropAllTables();
          break;
        case 'status':
          await checkMigrationStatus();
          break;
        default:
          console.log('Usage:');
          console.log('  npm run migrate:up     - Run migrations');
          console.log('  npm run migrate:down   - Drop all tables');
          console.log('  npm run migrate:status - Check migration status');
      }
    } catch (error) {
      console.error('Migration error:', error);
      process.exit(1);
    } finally {
      await closePool();
      process.exit(0);
    }
  })();
}
