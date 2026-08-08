import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/tailor/[matchId]/approve - Approve or reject a draft
export async function POST(
  request: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    const userId = request.headers.get('x-user-id') || 'demo-user';
    const { matchId } = params;
    const body = await request.json();
    const { draftId, decision, feedback } = body;

    if (!['approved', 'rejected'].includes(decision)) {
      return NextResponse.json({ error: 'Invalid decision' }, { status: 400 });
    }

    // Create approval event
    await db.approvalEvent.create({
      data: {
        draftId,
        userId,
        decision,
        feedback: feedback || null,
      },
    });

    // Update draft status
    await db.tailoringDraft.update({
      where: { id: draftId },
      data: { status: decision === 'approved' ? 'approved' : 'rejected' },
    });

    // Update match status
    await db.match.update({
      where: { id: matchId },
      data: { status: decision === 'approved' ? 'approved' : 'rejected' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /api/tailor/[matchId]/approve error:', error);
    return NextResponse.json({ error: 'Failed to process approval' }, { status: 500 });
  }
}
