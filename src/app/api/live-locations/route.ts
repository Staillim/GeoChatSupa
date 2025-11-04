/**
 * API Route: /api/live-locations
 * GET - Get active live locations for a user
 * POST - Start sharing live location
 * PUT - Update live location
 * DELETE - Stop sharing live location
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET /api/live-locations?userId=xxx - Get live locations for a user
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId parameter is required' },
        { status: 400 }
      );
    }

    // Get live locations where user is sharing OR locations shared with user
    const result = await query(
      `SELECT ll.*, 
              u1.name as user_name, u1.avatar as user_avatar,
              u2.name as shared_with_name, u2.avatar as shared_with_avatar
       FROM live_locations ll
       JOIN users u1 ON ll.user_id = u1.id
       JOIN users u2 ON ll.shared_with = u2.id
       WHERE (ll.user_id = $1 OR ll.shared_with = $1) 
         AND ll.is_active = TRUE
       ORDER BY ll.last_updated DESC`,
      [userId]
    );

    return NextResponse.json({
      success: true,
      liveLocations: result.rows,
      count: result.rowCount
    });

  } catch (error: any) {
    console.error('GET /api/live-locations error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/live-locations - Start sharing live location
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, shared_with, latitude, longitude, accuracy } = body;

    // Validation
    if (!user_id || !shared_with || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: user_id, shared_with, latitude, longitude' },
        { status: 400 }
      );
    }

    // Check mutual permission
    const permissionCheck = await query(
      `SELECT 
        u1.location_sharing_with as user1_sharing,
        u2.location_sharing_with as user2_sharing
       FROM users u1, users u2
       WHERE u1.id = $1 AND u2.id = $2`,
      [user_id, shared_with]
    );

    if (permissionCheck.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'One or both users not found' },
        { status: 404 }
      );
    }

    const { user1_sharing, user2_sharing } = permissionCheck.rows[0];
    const hasMutualPermission = 
      user1_sharing.includes(shared_with) && 
      user2_sharing.includes(user_id);

    if (!hasMutualPermission) {
      return NextResponse.json(
        { success: false, error: 'Mutual location sharing permission required' },
        { status: 403 }
      );
    }

    // Create or update live location
    const id = `${user_id}_${shared_with}`;
    const result = await query(
      `INSERT INTO live_locations (id, user_id, shared_with, latitude, longitude, accuracy, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, TRUE)
       ON CONFLICT (user_id, shared_with)
       DO UPDATE SET 
         latitude = EXCLUDED.latitude,
         longitude = EXCLUDED.longitude,
         accuracy = EXCLUDED.accuracy,
         is_active = TRUE,
         last_updated = CURRENT_TIMESTAMP
       RETURNING *`,
      [id, user_id, shared_with, latitude, longitude, accuracy || null]
    );

    return NextResponse.json({
      success: true,
      liveLocation: result.rows[0]
    }, { status: 201 });

  } catch (error: any) {
    console.error('POST /api/live-locations error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/live-locations - Update live location (called every minute)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, shared_with, latitude, longitude, accuracy } = body;

    if (!user_id || !shared_with || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: user_id, shared_with, latitude, longitude' },
        { status: 400 }
      );
    }

    const result = await query(
      `UPDATE live_locations
       SET latitude = $1, longitude = $2, accuracy = $3, last_updated = CURRENT_TIMESTAMP
       WHERE user_id = $4 AND shared_with = $5 AND is_active = TRUE
       RETURNING *`,
      [latitude, longitude, accuracy || null, user_id, shared_with]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Active live location not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      liveLocation: result.rows[0]
    });

  } catch (error: any) {
    console.error('PUT /api/live-locations error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/live-locations - Stop sharing live location
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const sharedWith = searchParams.get('sharedWith');

    if (!userId || !sharedWith) {
      return NextResponse.json(
        { success: false, error: 'userId and sharedWith parameters are required' },
        { status: 400 }
      );
    }

    const result = await query(
      `UPDATE live_locations
       SET is_active = FALSE
       WHERE user_id = $1 AND shared_with = $2
       RETURNING *`,
      [userId, sharedWith]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Live location not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Live location sharing stopped'
    });

  } catch (error: any) {
    console.error('DELETE /api/live-locations error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
