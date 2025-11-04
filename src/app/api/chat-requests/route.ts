/**
 * API Route: /api/chat-requests
 * GET - Get chat requests for a user
 * POST - Create a new chat request
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET /api/chat-requests?userId=xxx - Get chat requests for a user
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const status = searchParams.get('status') || 'pending';

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    const result = await query(
      `SELECT * FROM chat_requests 
       WHERE to_user_id = $1 AND status = $2
       ORDER BY created_at DESC`,
      [userId, status]
    );

    return NextResponse.json({
      success: true,
      requests: result.rows.map((row) => ({
        id: row.id,
        fromUserId: row.from_user_id,
        toUserId: row.to_user_id,
        conversationId: row.conversation_id,
        status: row.status,
        createdAt: row.created_at,
      })),
    });
  } catch (error: any) {
    console.error('GET /api/chat-requests error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/chat-requests - Create a new chat request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, fromUserId, toUserId, conversationId, status = 'pending' } = body;

    if (!id || !fromUserId || !toUserId || !conversationId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: id, fromUserId, toUserId, conversationId',
        },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO chat_requests (id, from_user_id, to_user_id, conversation_id, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, fromUserId, toUserId, conversationId, status]
    );

    return NextResponse.json(
      {
        success: true,
        request: {
          id: result.rows[0].id,
          fromUserId: result.rows[0].from_user_id,
          toUserId: result.rows[0].to_user_id,
          conversationId: result.rows[0].conversation_id,
          status: result.rows[0].status,
          createdAt: result.rows[0].created_at,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('POST /api/chat-requests error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
