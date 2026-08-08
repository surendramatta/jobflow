import OpenAI from 'openai';
import { ResumeFact, JobRequirements, TailoringDiff, KeywordCoverage } from '@/types';

const getClient = () => {
  const aiApiKey = process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY;
  const useGroq = !process.env.OPENAI_API_KEY && !!process.env.GROQ_API_KEY;

  if (!aiApiKey) {
    throw new Error('Missing AI API key. Set OPENAI_API_KEY or GROQ_API_KEY in your .env file.');
  }

  return new OpenAI({
    apiKey: aiApiKey,
    ...(useGroq ? { baseURL: 'https://api.groq.com/openai/v1' } : {}),
  });
};

const getModel = (fallbackModel: 'gpt-4o-mini' | 'gpt-4o' = 'gpt-4o-mini') => {
  const useGroq = !process.env.OPENAI_API_KEY && !!process.env.GROQ_API_KEY;
  return useGroq ? 'llama-3.3-70b-versatile' : fallbackModel;
};

export class AIService {
  /**
   * Extract structured requirements from a job description
   */
  async extractJobRequirements(jobDescription: string): Promise<JobRequirements> {
    const prompt = `Extract structured requirements from this job description. Return ONLY valid JSON.

Job Description:
${jobDescription}

Return JSON in this exact format:
{
  "requiredSkills": ["skill1", "skill2"],
  "preferredSkills": ["skill3"],
  "seniority": "entry|mid|senior|staff|principal",
  "domain": ["domain1", "domain2"],
  "location": "city, state or Remote",
  "remote": "remote|hybrid|onsite|any",
  "workAuth": ["US Citizen", "Green Card", "H1B", etc] // only if mentioned
}`;

    const response = await getClient().chat.completions.create({
      model: getModel('gpt-4o-mini'),
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error('Empty response from AI');

    return JSON.parse(content) as JobRequirements;
  }

  /**
   * Parse resume text into structured facts
   */
  async parseResumeFacts(resumeText: string): Promise<ResumeFact[]> {
    const prompt = `Parse this resume into structured facts. Return ONLY valid JSON array.

Rules:
- Each fact must be truthful and based ONLY on the resume text
- Do not invent or hallucinate any information
- Extract dates, employers, titles where present
- Break experience into individual bullet points

Resume:
${resumeText}

Return JSON array of facts:
[
  {
    "id": "fact_1",
    "category": "experience|education|skills|projects|certifications",
    "content": "brief summary",
    "employer": "Company Name",
    "title": "Job Title",
    "startDate": "YYYY-MM",
    "endDate": "YYYY-MM or present",
    "bullets": ["achievement 1", "achievement 2"]
  }
]`;

    const response = await getClient().chat.completions.create({
      model: getModel('gpt-4o-mini'),
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error('Empty response from AI');

    const parsed = JSON.parse(content);
    return parsed.facts || parsed;
  }

  /**
   * Generate tailored resume and cover letter
   * HARD RULE: Only rephrase/organize existing facts. Never invent new facts.
   */
  async generateTailoredDocuments(
    resumeFacts: ResumeFact[],
    jobRequirements: JobRequirements,
    originalResume: string,
    coverLetterTemplate?: string
  ): Promise<{
    tailoredResume: string;
    tailoredCoverLetter?: string;
    diff: TailoringDiff[];
    keywordCoverage: KeywordCoverage[];
    rationale: string;
    factsUsed: string[];
  }> {
    const factsJson = JSON.stringify(resumeFacts, null, 2);
    const reqJson = JSON.stringify(jobRequirements, null, 2);

    const prompt = `You are a resume tailoring assistant. Your job is to adapt a resume to match a job description.

CRITICAL RULES:
1. You may ONLY rephrase, reorder, or restructure existing facts from the resume
2. You may NEVER invent new experience, skills, dates, employers, or achievements
3. If the job asks for a skill not in the resume, you may either omit it or use transferable phrasing that is still truthful
4. All dates, employers, and titles must remain exactly as they appear in the resume facts

Resume Facts (structured):
${factsJson}

Original Resume Text:
${originalResume}

Job Requirements:
${reqJson}

${coverLetterTemplate ? `Cover Letter Template:
${coverLetterTemplate}

` : ''}

Return ONLY valid JSON with this structure:
{
  "tailoredResume": "full markdown text of tailored resume",
  "tailoredCoverLetter": "full markdown text of cover letter (if template provided)",
  "diff": [
    {
      "originalBullet": "original text",
      "tailoredBullet": "new text",
      "reason": "why this change was made"
    }
  ],
  "keywordCoverage": [
    {
      "keyword": "React",
      "covered": true,
      "source": "experience bullet about frontend work"
    }
  ],
  "rationale": "summary of changes and strategy",
  "factsUsed": ["fact_1", "fact_3"] // IDs of facts used
}`;

    const response = await getClient().chat.completions.create({
      model: getModel('gpt-4o'),
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error('Empty response from AI');

    return JSON.parse(content);
  }

  /**
   * Calculate match score between resume and job
   */
  async calculateMatchScore(
    resumeFacts: ResumeFact[],
    jobRequirements: JobRequirements
  ): Promise<{
    score: number;
    reasons: string[];
    skillGaps: string[];
    seniorityMatch: boolean;
    locationMatch: boolean;
    workAuthMatch: boolean;
  }> {
    const prompt = `Compare these resume facts against job requirements and calculate a match score.

Resume Facts:
${JSON.stringify(resumeFacts, null, 2)}

Job Requirements:
${JSON.stringify(jobRequirements, null, 2)}

Return ONLY valid JSON:
{
  "score": 0.75, // 0.0 to 1.0
  "reasons": ["Strong match in React skills", "3 years experience aligns with seniority"],
  "skillGaps": ["GraphQL", "AWS Lambda"],
  "seniorityMatch": true,
  "locationMatch": true,
  "workAuthMatch": true
}`;

    const response = await getClient().chat.completions.create({
      model: getModel('gpt-4o-mini'),
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error('Empty response from AI');

    return JSON.parse(content);
  }

  /**
   * Parse email to determine application status update
   */
  async parseEmailStatus(emailSubject: string, emailBody: string): Promise<{
    status: string | null;
    action: string | null;
    confidence: number;
  }> {
    const prompt = `Analyze this email and determine if it's a job application status update.

Subject: ${emailSubject}
Body: ${emailBody.slice(0, 3000)}

Return ONLY valid JSON:
{
  "status": "interview_request|rejection|offer|follow_up|other|null",
  "action": "schedule_interview|send_thank_you|review_offer|no_action|null",
  "confidence": 0.95
}`;

    const response = await getClient().chat.completions.create({
      model: getModel('gpt-4o-mini'),
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0].message.content;
    if (!content) return { status: null, action: null, confidence: 0 };

    return JSON.parse(content);
  }
}

export const aiService = new AIService();
