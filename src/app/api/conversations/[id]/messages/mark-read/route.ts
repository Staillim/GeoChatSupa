import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await context.params;
    const { userId } = await request.json();

    // Mark all messages in this conversation from OTHER users as read
    await query(
      `UPDATE messages 
       SET read = true 
       WHERE conversation_id = $1 
       AND sender_id != $2 
       AND read = false`,
      [conversationId, userId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark messages as read' },
      { status: 500 }
    );
  }
}
