import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { resumeParser } from '@/lib/resume-parser';
import { aiService } from '@/lib/ai';

// GET /api/resumes - Get user's profile/resume
export async function GET(request: NextRequest) {
  try {
    const userId = (await getCurrentUser())?.id;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const profile = await db.profile.findUnique({
      where: { userId },
    });

    return NextResponse.json(profile || null);
  } catch (error) {
    console.error('GET /api/resumes error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

// POST /api/resumes - Upload and parse resume
export async function POST(request: NextRequest) {
  try {
    const userId = (await getCurrentUser())?.id;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const formData = await request.formData();
    const file = formData.get('resume') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Parse resume text
    const resumeText = await resumeParser.parseText(file);

    // Extract structured facts using AI
    let resumeFacts = null;
    try {
      resumeFacts = await aiService.parseResumeFacts(resumeText);
    } catch (aiError) {
      console.error('AI fact extraction failed:', aiError);
    }

    // Upsert profile
    const profile = await db.profile.upsert({
      where: { userId },
      update: {
        resumeText,
        resumeFacts: resumeFacts as any,
      },
      create: {
        userId,
        resumeText,
        resumeFacts: resumeFacts as any,
      },
    });

    return NextResponse.json({ 
      success: true, 
      profile,
      factsExtracted: resumeFacts?.length || 0,
    });
  } catch (error) {
    console.error('POST /api/resumes error:', error);
    return NextResponse.json({ error: 'Failed to process resume' }, { status: 500 });
  }
}

// PATCH /api/resumes - Update profile settings
export async function PATCH(request: NextRequest) {
  try {
    const userId = (await getCurrentUser())?.id;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();

    const profile = await db.profile.upsert({
      where: { userId },
      update: {
        workAuthorization: body.workAuthorization,
        locationPreference: body.locationPreference,
        remotePreference: body.remotePreference,
        coverLetterTemplate: body.coverLetterTemplate,
      },
      create: {
        userId,
        workAuthorization: body.workAuthorization,
        locationPreference: body.locationPreference,
        remotePreference: body.remotePreference,
        coverLetterTemplate: body.coverLetterTemplate,
      },
    });

    return NextResponse.json(profile);
  } catch (error) {
    console.error('PATCH /api/resumes error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
