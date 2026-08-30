import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { aiService } from '@/lib/ai';

// POST /api/tailor/[matchId] - Generate tailored resume for a match
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await params;
  const userId = (await getCurrentUser())?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {

    // Fetch match with job and user profile
    const match = await db.match.findFirst({
      where: { id: matchId, userId },
      include: {
        job: true,
      },
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    const profile = await db.profile.findUnique({
      where: { userId },
    });

    if (!profile?.resumeText) {
      return NextResponse.json({ error: 'No resume uploaded' }, { status: 400 });
    }

    // Update match status
    await db.match.update({
      where: { id: matchId },
      data: { status: 'tailoring' },
    });

    // Extract job requirements
    const jobRequirements = await aiService.extractJobRequirements(match.job.description);

    // Calculate match score
    const matchScore = await aiService.calculateMatchScore(
      (profile.resumeFacts as any) || [],
      jobRequirements
    );

    // Update match with score
    await db.match.update({
      where: { id: matchId },
      data: {
        score: matchScore.score,
        matchReasons: matchScore.reasons as any,
        skillGaps: matchScore.skillGaps as any,
        seniorityMatch: matchScore.seniorityMatch,
        locationMatch: matchScore.locationMatch,
        workAuthMatch: matchScore.workAuthMatch,
      },
    });

    // Generate tailored documents
    const tailored = await aiService.generateTailoredDocuments(
      (profile.resumeFacts as any) || [],
      jobRequirements,
      profile.resumeText,
      profile.coverLetterTemplate || undefined
    );

    // Create tailoring draft
    const draft = await db.tailoringDraft.create({
      data: {
        matchId,
        userId,
        tailoredResume: tailored.tailoredResume,
        tailoredCoverLetter: tailored.tailoredCoverLetter,
        diffMetadata: tailored.diff as any,
        keywordCoverage: tailored.keywordCoverage as any,
        rationale: tailored.rationale,
        factsUsed: tailored.factsUsed as any,
        status: 'pending_approval',
      },
    });

    // Update match status
    await db.match.update({
      where: { id: matchId },
      data: { status: 'approval_needed' },
    });

    return NextResponse.json({
      success: true,
      draft,
      matchScore,
    });
  } catch (error) {
    console.error('POST /api/tailor/[matchId] error:', error);

    // Only update the signed-in user's match; preserve the original failure response.
    await db.match.updateMany({
      where: { id: matchId, userId },
      data: { status: 'failed' },
    }).catch(() => {});

    return NextResponse.json({ error: 'Failed to generate tailoring' }, { status: 500 });
  }
}
