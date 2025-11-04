/**
 * API Route: /api/conversations/[id]
 * GET - Get a specific conversation
 * PUT - Update a conversation (e.g., change status, update unread count)
 * DELETE - Delete a conversation
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET /api/conversations/[id] - Get a specific conversation
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const { id } = params;

    const result = await query(
      'SELECT * FROM conversations WHERE id = $1',
      [id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    const conversation = result.rows[0];

    // Parse participants if needed
    let participants = [];
    if (typeof conversation.participants === 'string') {
      participants = JSON.parse(conversation.participants);
    } else if (Array.isArray(conversation.participants)) {
      participants = conversation.participants;
    } else if (conversation.participants && typeof conversation.participants === 'object') {
      participants = conversation.participants;
    }

    // Parse unread_count if needed
    let unreadCount = {};
    if (conversation.unread_count) {
      if (typeof conversation.unread_count === 'string') {
        unreadCount = JSON.parse(conversation.unread_count);
      } else if (typeof conversation.unread_count === 'object') {
        unreadCount = conversation.unread_count;
      }
    }

    return NextResponse.json({
      id: conversation.id,
      participants,
      created_at: conversation.created_at,
      last_message: conversation.last_message,
      last_message_time: conversation.last_message_time,
      created_by: conversation.created_by,
      unread_count: unreadCount,
    });

  } catch (error: any) {
    console.error('GET /api/conversations/[id] error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/conversations/[id] - Update a conversation
export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const { id } = params;
    const body = await request.json();

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const allowedFields = ['status', 'last_message', 'last_message_at'];
    
    for (const field of allowedFields) {
      if (field in body) {
        updates.push(`${field} = $${paramIndex}`);
        values.push(body[field]);
        paramIndex++;
      }
    }

    // Handle unread_count as JSONB
    if (body.unread_count !== undefined) {
      updates.push(`unread_count = $${paramIndex}`);
      values.push(JSON.stringify(body.unread_count));
      paramIndex++;
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    values.push(id);

    const result = await query(
      `UPDATE conversations 
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      conversation: result.rows[0]
    });

  } catch (error: any) {
    console.error('PUT /api/conversations/[id] error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/conversations/[id] - Delete a conversation
export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const { id } = params;

    const result = await query(
      'DELETE FROM conversations WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Conversation deleted successfully'
    });

  } catch (error: any) {
    console.error('DELETE /api/conversations/[id] error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
