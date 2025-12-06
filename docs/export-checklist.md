# GitHub Export & Vercel Verification Checklist

Before you export or hand off the repository to GitHub/Vercel, go through this checklist.

## Local verification
- [ ] Run `pnpm install && pnpm dev` and ensure the site loads locally (with `.env.local` configured).
- [ ] Run `pnpm lint` and `pnpm type-check` locally.
- [ ] Run `pnpm db:push` to ensure the DB schema can apply to your database.

## Repository / Docs
- [ ] `docs/` folder exists and covers architecture, API, DB schema, persona system, deployment, and demos.
- [ ] `README.md` has updated badges and links to `docs/`.
- [ ] `.env.example` exists and documents all required and optional env variables.
- [ ] `CONTRIBUTING.md`, `SECURITY.md`, and `CHANGELOG.md` present.

## Vercel Setup
- [ ] All required `Environment Variables` set in Vercel.
- [ ] `vercel.json` has necessary `functions` configurations and cron set to `0 3 * * *`.
- [ ] `Image Domains` added to Vercel dashboard.
- [ ] `CRON_SECRET` configured and used to secure `/api/cron/aggregate`.
- [ ] `NOTION_WEBHOOK_SECRET` configured and Notion webhook points to `/api/notion/revalidate`.
- [ ] `UPLOADTHING_TOKEN` added and upload origin allowed.

## Security & Admin
- [ ] Admin username and password configured (or SSO implemented).
- [ ] Admin session rotation and secure cookie settings validated.

## Post-Deploy Verification
- [ ] Trigger `/api/health` to confirm integrations (Notion, DB, AI providers, UploadThing).
- [ ] Trigger `/api/notion/revalidate` webhook via Notion and verify page revalidation.
- [ ] Trigger `/api/cron/aggregate` manually with `CRON_SECRET` and ensure data aggregation & logs are written.
