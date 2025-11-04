// Test de conexión a Supabase
const { Pool } = require('pg');

const pool = new Pool({
  host: 'aws-1-us-east-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.nrepmsfoypvzezxgjate',
  password: 'Staillim',
  ssl: {
    rejectUnauthorized: false
  }
});

async function testConnection() {
  try {
    console.log('🔄 Intentando conectar a Supabase Session Pooler...');
    console.log('Host: aws-1-us-east-1.pooler.supabase.com');
    console.log('Puerto: 6543');
    console.log('Base de datos: postgres');
    console.log('Usuario: postgres.nrepmsfoypvzezxgjate');
    
    const client = await pool.connect();
    console.log('✅ Conexión exitosa a Supabase!');
    
    // Probar una query simple
    const result = await client.query('SELECT version();');
    console.log('📊 PostgreSQL version:', result.rows[0].version);
    
    // Verificar si existen las tablas y en qué schema
    const tables = await client.query(`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_name IN ('users', 'conversations', 'messages')
      ORDER BY table_schema, table_name;
    `);
    
    console.log('\n📋 Tablas encontradas:', tables.rows.length);
    if (tables.rows.length > 0) {
      tables.rows.forEach(row => {
        console.log(`  - ${row.table_schema}.${row.table_name}`);
      });
    } else {
      console.log('⚠️  No hay tablas creadas. Necesitas ejecutar el schema SQL en Supabase.');
    }
    
    // Verificar el search_path actual
    const searchPath = await client.query('SHOW search_path;');
    console.log('\n🔍 Search path actual:', searchPath.rows[0].search_path);
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.error('❌ Error al conectar a Supabase:');
    console.error('Código:', error.code);
    console.error('Mensaje:', error.message);
    console.error('\nDetalles completos:', error);
    process.exit(1);
  }
}

testConnection();
