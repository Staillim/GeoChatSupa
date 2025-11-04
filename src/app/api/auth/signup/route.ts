import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/geochat'
});

// Función para generar un PIN único de 6 dígitos
async function generateUniquePIN(): Promise<string> {
  let attempts = 0;
  const maxAttempts = 100;

  while (attempts < maxAttempts) {
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Verificar si el PIN ya existe
    const result = await pool.query('SELECT id FROM users WHERE pin = $1', [pin]);
    
    if (result.rows.length === 0) {
      return pin;
    }
    
    attempts++;
  }

  throw new Error('No se pudo generar un PIN único');
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, contraseña y nombre son requeridos' },
        { status: 400 }
      );
    }

    // Verificar si el usuario ya existe
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: 'El usuario ya existe' },
        { status: 409 }
      );
    }

    // Generar PIN único
    const pin = await generateUniquePIN();

    // Por ahora, contraseña sin hash (solo para desarrollo)
    // TODO: Implementar bcrypt para producción
    const result = await pool.query(
      `INSERT INTO users (id, email, name, pin, is_online, created_at, updated_at, last_seen) 
       VALUES (gen_random_uuid(), $1, $2, $3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
       RETURNING id, email, name, avatar, bio, pin`,
      [email, name, pin]
    );

    const user = result.rows[0];

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        bio: user.bio,
        pin: user.pin
      }
    }, { status: 201 });
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Error al registrar usuario' },
      { status: 500 }
    );
  }
}
