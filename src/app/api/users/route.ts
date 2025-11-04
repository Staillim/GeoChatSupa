/**
 * API Route: /api/users
 * GET - List all users (for map display)
 * POST - Create a new user
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET /api/users - List all users (optionally filter by online status or location)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const onlineOnly = searchParams.get('online') === 'true';
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const radius = searchParams.get('radius') || '10'; // default 10km
    const pin = searchParams.get('pin'); // Search by PIN

    let sqlQuery = 'SELECT id, name, email, avatar, bio, lat, lng, is_online, created_at, last_seen FROM users';
    const conditions: string[] = [];
    const params: any[] = [];

    // Filter by PIN (exact match)
    if (pin) {
      conditions.push(`pin = $${params.length + 1}`);
      params.push(pin);
    }

    if (onlineOnly) {
      conditions.push('is_online = TRUE');
    }

    // Filter by location radius if lat/lng provided
    if (lat && lng) {
      conditions.push(`
        (6371 * acos(
          cos(radians($${params.length + 1})) * 
          cos(radians(lat)) * 
          cos(radians(lng) - radians($${params.length + 2})) + 
          sin(radians($${params.length + 1})) * 
          sin(radians(lat))
        )) < $${params.length + 3}
      `);
      params.push(parseFloat(lat), parseFloat(lng), parseFloat(radius));
    }

    if (conditions.length > 0) {
      sqlQuery += ' WHERE ' + conditions.join(' AND ');
    }

    sqlQuery += ' ORDER BY name';

    const result = await query(sqlQuery, params.length > 0 ? params : undefined);

    return NextResponse.json({
      success: true,
      users: result.rows,
      count: result.rowCount
    });

  } catch (error: any) {
    console.error('GET /api/users error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/users - Create a new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, email, avatar, bio, lat, lng } = body;

    // Validation
    if (!id || !name || !email) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: id, name, email' },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO users (id, name, email, avatar, bio, lat, lng, is_online)
       VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
       RETURNING *`,
      [id, name, email, avatar || null, bio || null, lat || null, lng || null]
    );

    return NextResponse.json({
      success: true,
      user: result.rows[0]
    }, { status: 201 });

  } catch (error: any) {
    console.error('POST /api/users error:', error);
    
    // Handle unique constraint violation (duplicate email)
    if (error.code === '23505') {
      return NextResponse.json(
        { success: false, error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
