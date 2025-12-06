# Environment Variables

This file covers the environment variables required to run the project locally and in production (Vercel). Variables listed as "Required" should be set in your Vercel project or `.env.local` file.

## Required
- `DATABASE_URL` - Neon or Postgres connection string (e.g., `postgresql://user:pass@host/db?sslmode=require`)
- `NOTION_API_KEY` - Notion integration token
- `NOTION_PROJECTS_DATABASE_ID` - Notion database ID for Projects
- `GROQ_API_KEY` or `OPENROUTER_API_KEY` - At least one AI provider key
- `UPLOADTHING_TOKEN` - UploadThing API token
- `CRON_SECRET` - Secret token used in cron job requests and code to authorize scheduled operations
- `REVALIDATION_SECRET` - Secret for manual revalidation endpoints

The code expects the following Notion DB env vars (set them if you use those features):
- `NOTION_NOW_DATABASE_ID` - Notion database ID for Now page
- `NOTION_CASE_STUDIES_DATABASE_ID` - Notion case studies
- `NOTION_ARCHITECTURE_DATABASE_ID` - Notion architecture docs
- `NOTION_INTAKE_DATABASE_ID` - Notion intake form submissions

## Admin & Authentication
- `ADMIN_USERNAME` - Admin login username
- `ADMIN_PASSWORD` - Admin login password
- `ADMIN_SECRET` - Optional admin secret used for signing session tokens

## Optional / Recommended
- `NOTION_CASE_STUDIES_DATABASE_ID` - Notion Case Studies DB
- `NOTION_ARCHITECTURE_DATABASE_ID` - Notion Architecture DB
- `NOTION_INTAKE_DATABASE_ID` - Notion Intake DB
- `NOTION_WEBHOOK_SECRET` - HMAC secret for Notion Webhook validation (recommended)
- `GITHUB_ACCESS_TOKEN` - Optional token used by `/api/github/skills` for fetching repo metadata
- `NEXT_PUBLIC_SITE_URL` - The production site URL for absolute links and OpenRouter headers

System/runtime envs you may use:
- `NODE_ENV` - `production` | `development`

## Best Practices
- Store secrets in Vercel's Environment Variables dashboard (never commit to source control).
- For local development, use `.env.local` (not committed). Use `.env.example` as a template.
- When rotating keys, make sure to re-deploy on Vercel and update any webhook signatures.
