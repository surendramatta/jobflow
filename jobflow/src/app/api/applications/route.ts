import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { canSubmitDraft } from '@/lib/draft-policy';

// GET /api/applications - List user's applications
export async function GET(request: NextRequest) {
  try {
    const userId = (await getCurrentUser())?.id;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const applications = await db.applicationAttempt.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        match: {
          include: {
            job: true,
          },
        },
        receipt: true,
      },
    });

    return NextResponse.json(applications);
  } catch (error) {
    console.error('GET /api/applications error:', error);
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
  }
}

// POST /api/applications - Create application attempt
export async function POST(request: NextRequest) {
  try {
    const userId = (await getCurrentUser())?.id;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    const { matchId, draftId, method, payload } = body;

    if (typeof matchId !== 'string' || typeof draftId !== 'string') {
      return NextResponse.json({ error: 'Match and draft IDs required' }, { status: 400 });
    }
    if (method && method !== 'manual') {
      return NextResponse.json({ error: 'Only manual submission tracking is supported' }, { status: 400 });
    }
    const draft = await db.tailoringDraft.findFirst({ where: { id: draftId, userId, matchId } });
    if (!canSubmitDraft(draft, userId, matchId)) {
      return NextResponse.json({ error: 'Approve your own draft before recording a submission' }, { status: 409 });
    }

    const match = await db.match.findFirst({
      where: { id: matchId, userId },
      include: { job: true },
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // For MVP, we only support manual submission tracking
    // The actual submission happens via browser extension or user action
    const application = await db.$transaction(async (tx) => {
    const attempt = await tx.applicationAttempt.create({
      data: {
        matchId,
        userId,
        draftId,
        atsType: match.job.atsType || 'other',
        method: method || 'manual',
        payload: payload || {},
        status: 'submitted',
        submittedAt: new Date(),
      },
    });

    // Update match status
    await tx.match.update({
      where: { id: matchId },
      data: { status: 'submitted' },
    });

    // Create receipt
    await tx.receipt.create({
      data: {
        attemptId: attempt.id,
        fieldsSubmitted: payload || {},
        attachmentsUsed: [],
      },
    });

    return attempt;
    });

    return NextResponse.json(application, { status: 201 });
  } catch (error) {
    console.error('POST /api/applications error:', error);
    return NextResponse.json({ error: 'Failed to create application' }, { status: 500 });
  }
}
