/**
 * API Route: /api/conversations
 * GET - List conversations for a user
 * POST - Create a new conversation
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET /api/conversations?userId=xxx - List conversations for a user
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const status = searchParams.get('status'); // 'active', 'pending', 'blocked'

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId parameter is required' },
        { status: 400 }
      );
    }

    let sqlQuery = `
      SELECT c.*
      FROM conversations c
      WHERE c.participants @> $1::jsonb
    `;
    const params: any[] = [JSON.stringify([userId])];

    if (status) {
      sqlQuery += ' AND c.status = $2';
      params.push(status);
    }

    sqlQuery += ' ORDER BY c.last_message_at DESC NULLS LAST';

    const result = await query(sqlQuery, params);

    // For each conversation, get participant data
    const conversationsWithParticipants = await Promise.all(
      result.rows.map(async (conv) => {
        // participants is JSONB in PostgreSQL
        let participants: string[] = [];
        
        if (typeof conv.participants === 'string') {
          try {
            participants = JSON.parse(conv.participants);
          } catch {
            participants = [];
          }
        } else if (Array.isArray(conv.participants)) {
          participants = conv.participants;
        } else if (conv.participants && typeof conv.participants === 'object') {
          // Already parsed as object
          participants = conv.participants;
        }
        
        // Get data for all participants
        const participantsData = await Promise.all(
          participants.map(async (participantId: string) => {
            const userResult = await query(
              'SELECT id, name, email, avatar, is_online FROM users WHERE id = $1',
              [participantId]
            );
            return userResult.rows[0] || null;
          })
        );

        return {
          ...conv,
          participants: participants, // Keep original array
          participantsData: participantsData.filter(Boolean) // Add detailed data
        };
      })
    );

    return NextResponse.json({
      success: true,
      conversations: conversationsWithParticipants,
      count: conversationsWithParticipants.length
    });

  } catch (error: any) {
    console.error('GET /api/conversations error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/conversations - Create a new conversation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, participants, created_by, status, message } = body;

    // Validation
    if (!id || !participants || !created_by) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: id, participants, created_by' },
        { status: 400 }
      );
    }

    if (!Array.isArray(participants) || participants.length !== 2) {
      return NextResponse.json(
        { success: false, error: 'participants must be an array of 2 user IDs' },
        { status: 400 }
      );
    }

    // Create conversation
    const conversationResult = await query(
      `INSERT INTO conversations (id, participants, created_by, status, last_message, unread_count)
       VALUES ($1, $2::jsonb, $3, $4, $5, $6::jsonb)
       RETURNING *`,
      [
        id,
        JSON.stringify(participants), // Send as JSON string
        created_by,
        status || 'pending',
        message || null,
        JSON.stringify({ [participants[0]]: 0, [participants[1]]: message ? 1 : 0 })
      ]
    );

    const conversation = conversationResult.rows[0];

    // If there's an initial message, create it
    if (message) {
      const messageId = `msg_${Date.now()}`;
      await query(
        `INSERT INTO messages (id, conversation_id, sender_id, text)
         VALUES ($1, $2, $3, $4)`,
        [messageId, id, created_by, message]
      );
    }

    return NextResponse.json({
      success: true,
      conversation
    }, { status: 201 });

  } catch (error: any) {
    console.error('POST /api/conversations error:', error);
    
    if (error.code === '23505') {
      return NextResponse.json(
        { success: false, error: 'Conversation already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
