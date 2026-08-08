import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/applications - List user's applications
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || 'demo-user';

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
    const userId = request.headers.get('x-user-id') || 'demo-user';
    const body = await request.json();
    const { matchId, draftId, method, payload } = body;

    const match = await db.match.findFirst({
      where: { id: matchId, userId },
      include: { job: true },
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // For MVP, we only support manual submission tracking
    // The actual submission happens via browser extension or user action
    const application = await db.applicationAttempt.create({
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
    await db.match.update({
      where: { id: matchId },
      data: { status: 'submitted' },
    });

    // Create receipt
    await db.receipt.create({
      data: {
        attemptId: application.id,
        fieldsSubmitted: payload || {},
        attachmentsUsed: [],
      },
    });

    return NextResponse.json(application, { status: 201 });
  } catch (error) {
    console.error('POST /api/applications error:', error);
    return NextResponse.json({ error: 'Failed to create application' }, { status: 500 });
  }
}
