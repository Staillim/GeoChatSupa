/**
 * API Route: /api/conversations/[id]/messages
 * GET - Get all messages in a conversation
 * POST - Send a new message
 */

import { NextRequest, NextResponse } from 'next/server';
import { query, transaction } from '@/lib/db';

// GET /api/conversations/[id]/messages - Get all messages in a conversation
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const { id } = params;
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get messages with sender info
    const result = await query(
      `SELECT m.*, u.name as sender_name, u.avatar as sender_avatar
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.conversation_id = $1
       ORDER BY m.created_at ASC
       LIMIT $2 OFFSET $3`,
      [id, limit, offset]
    );

    // Get total count
    const countResult = await query(
      'SELECT COUNT(*) as total FROM messages WHERE conversation_id = $1',
      [id]
    );

    return NextResponse.json({
      success: true,
      messages: result.rows,
      total: parseInt(countResult.rows[0].total),
      limit,
      offset
    });

  } catch (error: any) {
    console.error('GET /api/conversations/[id]/messages error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/conversations/[id]/messages - Send a new message
export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const { id: conversationId } = params;
    const body = await request.json();
    const { id, sender_id, text, image_url, location_lat, location_lng } = body;

    // Validation
    if (!id || !sender_id || !text) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: id, sender_id, text' },
        { status: 400 }
      );
    }

    // Use transaction to insert message and update conversation
    const result = await transaction(async (client) => {
      // Insert message
      const messageResult = await client.query(
        `INSERT INTO messages (id, conversation_id, sender_id, text, image_url, location_lat, location_lng)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [id, conversationId, sender_id, text, image_url || null, location_lat || null, location_lng || null]
      );

      // Update conversation's last_message and last_message_at
      await client.query(
        `UPDATE conversations
         SET last_message = $1, last_message_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [text, conversationId]
      );

      // Increment unread count for the recipient
      // Get participants first
      const convResult = await client.query(
        'SELECT participants, unread_count FROM conversations WHERE id = $1',
        [conversationId]
      );

      if (convResult.rows.length > 0) {
        const participants = convResult.rows[0].participants;
        const unreadCount = convResult.rows[0].unread_count || {};
        
        // Find the recipient (not the sender)
        const recipient = participants.find((p: string) => p !== sender_id);
        
        if (recipient) {
          unreadCount[recipient] = (unreadCount[recipient] || 0) + 1;
          
          await client.query(
            'UPDATE conversations SET unread_count = $1 WHERE id = $2',
            [JSON.stringify(unreadCount), conversationId]
          );
        }
      }

      return messageResult.rows[0];
    });

    return NextResponse.json({
      success: true,
      message: result
    }, { status: 201 });

  } catch (error: any) {
    console.error('POST /api/conversations/[id]/messages error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
