export interface ResumeFact {
  id: string;
  category: string; // "experience", "education", "skills", "projects", "certifications"
  content: string;
  employer?: string;
  title?: string;
  startDate?: string;
  endDate?: string;
  bullets?: string[];
}

export interface JobRequirements {
  requiredSkills: string[];
  preferredSkills: string[];
  seniority: string;
  domain: string[];
  location: string;
  remote: string;
  workAuth?: string[];
}

export interface TailoringDiff {
  originalBullet: string;
  tailoredBullet: string;
  reason: string;
}

export interface KeywordCoverage {
  keyword: string;
  covered: boolean;
  source: string; // which resume fact covers it
}

export type ApplicationStatus = 
  | 'pending'
  | 'submitted'
  | 'confirmed'
  | 'failed'
  | 'interview'
  | 'rejected'
  | 'offer';

export type MatchStatus =
  | 'pending'
  | 'queued'
  | 'tailoring'
  | 'approval_needed'
  | 'approved'
  | 'submitted'
  | 'rejected'
  | 'failed';
