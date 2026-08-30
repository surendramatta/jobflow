import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { ownsDraft } from '@/lib/draft-policy';

// POST /api/tailor/[matchId]/approve - Approve or reject a draft
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const userId = (await getCurrentUser())?.id;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { matchId } = await params;
    const body = await request.json();
    const { draftId, decision, feedback } = body;

    if (typeof draftId !== 'string') {
      return NextResponse.json({ error: 'Draft ID required' }, { status: 400 });
    }
    const draft = await db.tailoringDraft.findFirst({ where: { id: draftId, userId, matchId } });
    if (!ownsDraft(draft, userId, matchId)) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    if (!['approved', 'rejected'].includes(decision)) {
      return NextResponse.json({ error: 'Invalid decision' }, { status: 400 });
    }

    // Keep the approval record and both statuses atomic.
    await db.$transaction([db.approvalEvent.create({
      data: {
        draftId,
        userId,
        decision,
        feedback: feedback || null,
      },
    }),

    // Update draft status
    db.tailoringDraft.update({
      where: { id: draftId },
      data: { status: decision === 'approved' ? 'approved' : 'rejected' },
    }),

    // Update match status
    db.match.update({
      where: { id: matchId },
      data: { status: decision === 'approved' ? 'approved' : 'rejected' },
    })]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /api/tailor/[matchId]/approve error:', error);
    return NextResponse.json({ error: 'Failed to process approval' }, { status: 500 });
  }
}
