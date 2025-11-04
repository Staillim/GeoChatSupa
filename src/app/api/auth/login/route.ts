import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/geochat'
});

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    // Por ahora, autenticación simple (sin hash de contraseña)
    // TODO: Implementar bcrypt para producción
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 LIMIT 1',
      [email]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const user = result.rows[0];

    // Actualizar last_seen y is_online
    await pool.query(
      'UPDATE users SET is_online = true, last_seen = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        bio: user.bio,
        pin: user.pin
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Error al iniciar sesión' },
      { status: 500 }
    );
  }
}
