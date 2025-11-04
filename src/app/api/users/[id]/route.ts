/**
 * API Route: /api/users/[id]
 * GET - Get a specific user
 * PUT - Update a user
 * DELETE - Delete a user
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET /api/users/[id] - Get a specific user
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const { id } = params;

    const result = await query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: result.rows[0]
    });

  } catch (error: any) {
    console.error('GET /api/users/[id] error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/users/[id] - Update a user
export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const { id } = params;
    const body = await request.json();

    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const allowedFields = ['name', 'email', 'avatar', 'bio', 'lat', 'lng', 'is_online', 'last_seen'];
    
    for (const field of allowedFields) {
      if (field in body) {
        updates.push(`${field} = $${paramIndex}`);
        values.push(body[field]);
        paramIndex++;
      }
    }

    // Handle JSONB fields
    if (body.location_sharing_requests !== undefined) {
      updates.push(`location_sharing_requests = $${paramIndex}`);
      values.push(JSON.stringify(body.location_sharing_requests));
      paramIndex++;
    }

    if (body.location_sharing_with !== undefined) {
      updates.push(`location_sharing_with = $${paramIndex}`);
      values.push(JSON.stringify(body.location_sharing_with));
      paramIndex++;
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    values.push(id); // Add id as the last parameter

    const result = await query(
      `UPDATE users 
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: result.rows[0]
    });

  } catch (error: any) {
    console.error('PUT /api/users/[id] error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Delete a user
export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const { id } = params;

    const result = await query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error: any) {
    console.error('DELETE /api/users/[id] error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
