import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/geochat'
});

export async function GET(request: NextRequest) {
  try {
    // Ver el tipo de dato de la columna participants
    const schemaResult = await pool.query(`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE table_name = 'conversations' AND column_name = 'participants'
    `);

    // Ver una conversación de ejemplo
    const sampleResult = await pool.query(`
      SELECT id, participants, pg_typeof(participants) as type
      FROM conversations
      LIMIT 1
    `);

    return NextResponse.json({
      success: true,
      schema: schemaResult.rows[0],
      sample: sampleResult.rows[0],
      sampleParticipants: sampleResult.rows[0]?.participants
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
