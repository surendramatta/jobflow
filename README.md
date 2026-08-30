# JobFlow
### Review-first AI application preparation and tracking

[![CI](https://github.com/surendramatta/jobflow/actions/workflows/ci.yml/badge.svg)](https://github.com/surendramatta/jobflow/actions/workflows/ci.yml)

JobFlow is a Next.js and PostgreSQL application for turning job descriptions and resume facts into reviewable drafts, then recording applications you have submitted yourself.

The maintained application is in [jobflow/](jobflow/). The root ZIP is a historical snapshot, not the current release or a recommended installation source.

## Workflow

**Import a job → upload your resume → generate a draft → review and approve → submit externally → record the submission**

| Component | Responsibility |
| --- | --- |
| Next.js 16 / React 19 | Dashboard, login and API routes |
| Auth.js + GitHub OAuth | Signed-in account identity |
| PostgreSQL + Prisma 6 | Profiles, jobs, drafts, approval events and receipts |
| AI provider | Optional OpenAI/Groq document generation |
| Approval gate | Draft ownership, match association and approval checks |

The API uses the authenticated session, not a browser-supplied user ID. Email-only demo login has been removed. Application tracking requires an approved draft owned by the signed-in user.

## Local setup

Requires Node.js 22.12+, npm, Docker (or your own PostgreSQL server), and a GitHub OAuth application.

```bash
git clone https://github.com/surendramatta/jobflow.git
cd jobflow/jobflow
npm ci
cp .env.example .env
docker compose up -d
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

Configure these values in the ignored `.env` file:

- `DATABASE_URL`: your PostgreSQL connection.
- `AUTH_SECRET`: generate with `openssl rand -hex 32`.
- `AUTH_URL`: `http://localhost:3000` for local development.
- `AUTH_GITHUB_ID` and `AUTH_GITHUB_SECRET`: your GitHub OAuth app credentials.
- GitHub OAuth callback: `http://localhost:3000/api/auth/callback/github`.
- AI provider variables: use the placeholders in `.env.example`; never commit real values.

Open http://localhost:3000/login. Existing demo-user records are not automatically assigned to a real account; migrate only after verifying ownership. Production database migrations should be reviewed, committed and applied with `prisma migrate deploy`, not created against live data.

## Verification

From the nested application directory:

```bash
npm run check
python ../.github/scripts/check-secrets.py
```

CI generates Prisma Client and runs ownership/approval-policy tests, type checks, a build, production dependency auditing and credential-pattern scanning. Builds do not require a running database.

## Honest project status

Implemented: job ingestion, resume parsing, draft generation, approval records, manual submission tracking and dashboard views. Authentication now requires real OAuth setup.

Not verified by unit tests: live OAuth callbacks, PostgreSQL transactions, AI-provider responses and employer-site behavior. Email synchronization and an autofill extension are not complete integrations. Job URL fetching still needs a dedicated SSRF review before untrusted users are admitted. Public deployments also need rate limiting, operational monitoring and a broader security review.

AI prompts reduce some errors; they do not guarantee factual output. Human review is required. A manually recorded submission is not an independently verified employer receipt.

[Security guidance](SECURITY.md) · [Kite](https://github.com/surendramatta/kite-job-agent) · [HireFlow](https://github.com/surendramatta/HireFlow)
