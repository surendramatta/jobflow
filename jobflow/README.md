# JobFlow

AI-powered job application assistant. Tailor your resume and cover letter for every job — with full transparency and your approval at every step.

## Features

- **Job Ingestion**: Paste any job URL (Greenhouse, Lever, Workday, LinkedIn) or enter manually
- **AI Tailoring**: GPT-4o rephrases and reorganizes your existing experience to match each job description
- **Safety First**: Hard guardrails prevent hallucination — only your real facts are used
- **Approval Gate**: Review every change with structured diffs before any submission
- **Application Tracking**: Full audit log of what was submitted, when, and to which ATS
- **Analytics**: Pipeline funnel, match scores, and activity tracking

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL + Prisma ORM
- **Styling**: Tailwind CSS
- **AI**: OpenAI GPT-4o / GPT-4o-mini
- **Auth**: NextAuth v5 (Credentials for demo, easily swap to OAuth)
- **Infrastructure**: Docker Compose (Postgres + Redis)

## Quick Start

### 1. Start Infrastructure

```bash
docker-compose up -d
```

This starts PostgreSQL on port 5432 and Redis on port 6379.

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

```bash
cp .env.example .env
```

Edit `.env` and add your OpenAI API key:
```
OPENAI_API_KEY=sk-...
```

### 4. Database Setup

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 5. Run Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Usage Flow

1. **Upload Resume** → Go to `/dashboard/resumes` and upload your PDF. AI extracts structured facts.
2. **Add Jobs** → Go to `/dashboard/jobs` and paste job URLs. The system auto-scrapes and extracts requirements.
3. **Generate Tailoring** → Click "Tailor" on any job. AI generates a customized resume + cover letter.
4. **Review & Approve** → View the diff, keyword coverage, and rationale. Approve or reject.
5. **Submit** → Copy the tailored documents to the ATS form, then click "Mark as Submitted" to track.
6. **Track** → View all applications in `/dashboard/applications` with status and receipts.

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   User      │────▶│  Dashboard  │────▶│   Prisma    │
│  (Browser)  │     │  (Next.js)  │     │  (Postgres) │
└─────────────┘     └──────┬──────┘     └─────────────┘
                           │
                    ┌──────┴──────┐
                    │  AI Service │
                    │  (OpenAI)   │
                    └─────────────┘
```

### Data Model

- **User** → Auth identity
- **Profile** → Resume text, structured facts, work auth, preferences
- **JobPosting** → Scraped job data with extracted requirements
- **Match** → Score + status linking user to job
- **TailoringDraft** → Generated documents with diff metadata
- **ApprovalEvent** → User approval/rejection audit trail
- **ApplicationAttempt** → Submission tracking with receipt
- **Receipt** → Exact fields submitted, confirmation numbers
- **InboxEvent** → Email parsing for status updates (v1)

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/jobs` | GET | List user's jobs |
| `/api/jobs` | POST | Add new job (auto-scrapes URL) |
| `/api/jobs/[id]` | GET | Get job detail with matches |
| `/api/jobs/[id]` | DELETE | Delete job |
| `/api/resumes` | GET | Get profile |
| `/api/resumes` | POST | Upload & parse resume PDF |
| `/api/resumes` | PATCH | Update profile settings |
| `/api/tailor/[matchId]` | POST | Generate tailored documents |
| `/api/tailor/[matchId]/approve` | POST | Approve/reject draft |
| `/api/applications` | GET | List applications |
| `/api/applications` | POST | Track submission |

## Safety & Compliance

- **No Hallucination**: AI prompt explicitly forbids inventing facts. Only rephrases existing resume data.
- **User Approval**: Every tailored document requires explicit user approval before any submission tracking.
- **Audit Trail**: All approvals, submissions, and changes are logged in `ApprovalEvent` and `AuditLog` tables.
- **Semi-Automated**: MVP uses manual submission tracking. Browser extension (v1) will provide autofill with user-clicked submit.

## Roadmap

### MVP (Complete)
- [x] Job ingestion (URL + manual)
- [x] Resume upload & fact extraction
- [x] AI tailoring with diff view
- [x] Approval gate
- [x] Application tracking
- [x] Dashboard & analytics

### v1 (Next)
- [ ] Browser extension for autofill
- [ ] Gmail/Outlook inbox parsing
- [ ] Workday/Greenhouse API adapters (where permitted)
- [ ] Multi-agent pipeline with retry logic
- [ ] Email notifications

## License

MIT
