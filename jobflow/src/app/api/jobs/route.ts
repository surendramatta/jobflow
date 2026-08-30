import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { jobScraper } from '@/lib/scraper';
import { aiService } from '@/lib/ai';
import { z } from 'zod';

const createJobSchema = z.object({
  url: z.string().url(),
  company: z.string().optional(),
  title: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
});

// GET /api/jobs - List user's jobs
export async function GET(request: NextRequest) {
  try {
    const userId = (await getCurrentUser())?.id;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const jobs = await db.jobPosting.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        matches: {
          include: {
            tailoringDrafts: {
              where: { status: { not: 'rejected' } },
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    return NextResponse.json(jobs);
  } catch (error) {
    console.error('GET /api/jobs error:', error);
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}

// POST /api/jobs - Add a new job (with optional scraping)
export async function POST(request: NextRequest) {
  try {
    const userId = (await getCurrentUser())?.id;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    const data = createJobSchema.parse(body);

    let jobData: {
      company: string;
      title: string;
      location: string;
      description: string;
      descriptionHtml?: string;
      atsType: string;
      atsJobId?: string;
    };

    // If only URL provided, try to scrape
    if (!data.company || !data.title || !data.description) {
      const scraped = await jobScraper.scrapeJob(data.url);
      jobData = {
        company: data.company || scraped.company,
        title: data.title || scraped.title,
        location: data.location || scraped.location,
        description: data.description || scraped.description,
        descriptionHtml: scraped.descriptionHtml,
        atsType: scraped.atsType,
        atsJobId: scraped.atsJobId,
      };
    } else {
      jobData = {
        company: data.company!,
        title: data.title!,
        location: data.location || 'Unknown',
        description: data.description!,
        atsType: jobScraper.detectAtsType(data.url),
      };
    }

    // Extract requirements using AI
    let extractedSkills = null;
    let requiredSkills = null;
    let preferredSkills = null;
    let seniority = null;
    let employmentType = null;
    let remoteStatus = null;

    try {
      const requirements = await aiService.extractJobRequirements(jobData.description);
      extractedSkills = [...requirements.requiredSkills, ...requirements.preferredSkills];
      requiredSkills = requirements.requiredSkills;
      preferredSkills = requirements.preferredSkills;
      seniority = requirements.seniority;
      remoteStatus = requirements.remote;
    } catch (aiError) {
      console.error('AI extraction failed:', aiError);
      // Continue without AI extraction
    }

    const job = await db.jobPosting.create({
      data: {
        userId,
        url: data.url,
        company: jobData.company,
        title: jobData.title,
        location: jobData.location,
        description: jobData.description,
        descriptionHtml: jobData.descriptionHtml,
        atsType: jobData.atsType,
        atsJobId: jobData.atsJobId,
        extractedSkills: extractedSkills as any,
        requiredSkills: requiredSkills as any,
        preferredSkills: preferredSkills as any,
        seniority,
        employmentType,
        remoteStatus,
        source: 'manual',
      },
    });

    // Auto-create a match entry
    await db.match.create({
      data: {
        userId,
        jobId: job.id,
        score: 0,
        status: 'pending',
      },
    });

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    console.error('POST /api/jobs error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create job' }, { status: 500 });
  }
}
