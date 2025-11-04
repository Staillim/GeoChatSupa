/**
 * API Route: /api/chat-requests/[id]
 * GET - Get a specific chat request
 * PUT - Update a chat request (accept/reject)
 * DELETE - Delete a chat request
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET /api/chat-requests/[id]
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const { id } = params;

    const result = await query(
      'SELECT * FROM chat_requests WHERE id = $1',
      [id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Chat request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      request: {
        id: result.rows[0].id,
        fromUserId: result.rows[0].from_user_id,
        toUserId: result.rows[0].to_user_id,
        conversationId: result.rows[0].conversation_id,
        status: result.rows[0].status,
        createdAt: result.rows[0].created_at,
      },
    });
  } catch (error: any) {
    console.error('GET /api/chat-requests/[id] error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/chat-requests/[id] - Update status (accept/reject)
export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const { id } = params;
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { success: false, error: 'status is required' },
        { status: 400 }
      );
    }

    const result = await query(
      `UPDATE chat_requests 
       SET status = $1
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Chat request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      request: {
        id: result.rows[0].id,
        fromUserId: result.rows[0].from_user_id,
        toUserId: result.rows[0].to_user_id,
        conversationId: result.rows[0].conversation_id,
        status: result.rows[0].status,
        createdAt: result.rows[0].created_at,
      },
    });
  } catch (error: any) {
    console.error('PUT /api/chat-requests/[id] error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/chat-requests/[id]
export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const { id } = params;

    const result = await query(
      'DELETE FROM chat_requests WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Chat request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Chat request deleted successfully',
    });
  } catch (error: any) {
    console.error('DELETE /api/chat-requests/[id] error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
