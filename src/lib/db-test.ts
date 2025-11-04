/**
 * Database Connection Test
 * Tests the PostgreSQL connection and displays database info
 */

import { healthCheck, query, closePool } from './db';

async function testDatabase() {
  console.log('🔍 Testing PostgreSQL connection...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    // Test basic connection
    const isHealthy = await healthCheck();
    
    if (!isHealthy) {
      throw new Error('Database health check failed');
    }
    
    // Get PostgreSQL version
    const versionResult = await query('SELECT version();');
    console.log('\n📦 PostgreSQL Version:');
    console.log(versionResult.rows[0].version);
    
    // Get current database name
    const dbResult = await query('SELECT current_database();');
    console.log('\n🗄️  Current Database:', dbResult.rows[0].current_database);
    
    // Get current user
    const userResult = await query('SELECT current_user;');
    console.log('👤 Current User:', userResult.rows[0].current_user);
    
    // List all tables
    const tablesResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('\n📊 Tables in database:');
    if (tablesResult.rows.length === 0) {
      console.log('  ⚠️  No tables found. Run "npm run db:migrate" to create tables.');
    } else {
      tablesResult.rows.forEach(row => {
        console.log(`  ✅ ${row.table_name}`);
      });
    }
    
    // Count records in key tables (if they exist)
    if (tablesResult.rows.length > 0) {
      console.log('\n📈 Record counts:');
      
      for (const { table_name } of tablesResult.rows) {
        try {
          const countResult = await query(`SELECT COUNT(*) as count FROM ${table_name};`);
          console.log(`  ${table_name}: ${countResult.rows[0].count} records`);
        } catch (error) {
          // Skip if table doesn't exist or query fails
        }
      }
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Database connection test completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('  1. Run "npm run db:migrate" to create database schema');
    console.log('  2. Check tables with "npm run db:status"');
    console.log('  3. Start the app with "npm run dev"');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
  } catch (error: any) {
    console.error('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ Database connection test failed!');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('\nError details:', error.message);
    
    console.error('\n🔧 Troubleshooting:');
    console.error('  1. Make sure PostgreSQL is running');
    console.error('  2. Check your .env.local file has correct credentials:');
    console.error('     - POSTGRES_HOST=localhost');
    console.error('     - POSTGRES_PORT=5432');
    console.error('     - POSTGRES_DB=geochat');
    console.error('     - POSTGRES_USER=postgres');
    console.error('     - POSTGRES_PASSWORD=Staillim');
    console.error('  3. Verify the database "geochat" exists in pgAdmin');
    console.error('  4. Check if user "postgres" has access to the database');
    console.error('\n');
    
    process.exit(1);
  } finally {
    await closePool();
  }
}

// Run the test
testDatabase();
