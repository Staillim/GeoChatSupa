import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/geochat'
});

/**
 * API temporal para ejecutar el script de limpieza
 * USAR SOLO UNA VEZ PARA ARREGLAR LA BASE DE DATOS
 * ELIMINAR DESPUÉS
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔧 Iniciando reparación de base de datos...');

    // 1. Agregar columna PIN si no existe
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS pin VARCHAR(6) UNIQUE;
    `);
    console.log('✅ Columna PIN agregada/verificada');

    // 2. BORRAR TODAS LAS CONVERSACIONES Y MENSAJES (datos de prueba corruptos)
    await pool.query(`DELETE FROM messages`);
    await pool.query(`DELETE FROM conversations`);
    await pool.query(`DELETE FROM chat_requests`);
    console.log('✅ Todas las conversaciones, mensajes y requests eliminados');

    // 3. Borrar usuario de prueba "current-user"
    await pool.query(`DELETE FROM live_locations WHERE user_id = 'current-user' OR shared_with = 'current-user'`);
    await pool.query(`DELETE FROM users WHERE id = 'current-user'`);
    console.log('✅ Usuario "current-user" eliminado');

    // 4. Generar PINs únicos para usuarios existentes
    const updateResult = await pool.query(`
      UPDATE users SET pin = LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0') 
      WHERE pin IS NULL
    `);
    console.log(`✅ PINs generados para ${updateResult.rowCount} usuarios`);

    // 5. Ver estado final
    const usersResult = await pool.query(`
      SELECT id, email, pin FROM users ORDER BY created_at
    `);
    
    const conversationsResult = await pool.query(`
      SELECT COUNT(*) as count FROM conversations
    `);

    return NextResponse.json({
      success: true,
      message: '✅ Base de datos reparada exitosamente - TODAS las conversaciones eliminadas',
      users: usersResult.rows,
      stats: {
        pinColumnAdded: true,
        currentUserDeleted: true,
        allConversationsDeleted: true,
        pinsGenerated: updateResult.rowCount,
        totalUsers: usersResult.rows.length,
        totalConversations: conversationsResult.rows[0].count
      }
    });
  } catch (error: any) {
    console.error('❌ Error reparando base de datos:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message,
        details: error.stack
      },
      { status: 500 }
    );
  }
}
