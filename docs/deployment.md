# Deployment Guide (Vercel)

This guide walks through the steps required to deploy the project to Vercel and configure all external services.

## Vercel Setup

1. Create a new project on Vercel and link your GitHub repository.
2. Set environment variables in the Vercel project settings using `docs/environment-variables.md` and `.env.example` as references.
3. Add the following Image Domains to the Vercel Dashboard:
   - `utfs.io`
   - `*.ufs.sh`
   - `*.public.blob.vercel-storage.com`
   - `images.unsplash.com`
   - `*.notion.so`
   - `s3.us-west-2.amazonaws.com`

## Cron Jobs

- Daily aggregate job: schedule `0 3 * * *` to call `/api/cron/aggregate`.
  - Header: `Authorization: Bearer $CRON_SECRET`

## Secrets & Webhooks

- `NOTION_WEBHOOK_SECRET` - HMAC secret used to validate Notion webhook events. Configure Notion webhook to call `/api/notion/revalidate` and include the HMAC signature.
- `REVALIDATION_SECRET` - Optional secret for manual revalidation endpoints; include as Bearer token when called.

## Function Configuration

Edit `vercel.json` if you need to update runtime or timeouts. The project includes recommended configs:

- `/api/track` -> `runtime: edge`
- `/api/chat` -> `maxDuration: 30`
- `/api/persona/classify` -> `maxDuration: 15`
- `/api/intake` -> `maxDuration: 60`

## UploadThing Setup

1. Obtain `UPLOADTHING_TOKEN` and add to Vercel env variables.
2. Ensure allowed origins include your Vercel domain.
3. Confirm file size limits across routers (see `src/app/api/uploadthing/core.ts`).

## Notion Integration

1. Add `NOTION_API_KEY` in Vercel env variables.
2. Set the required Notion DB IDs (Projects, Case-Studies, Architecture, Intake) in env vars.
3. Configure Notion webhook to POST to `/api/notion/revalidate` and include `NOTION_WEBHOOK_SECRET` in a header for validation.

## Database (Neon)

1. Setup Neon project and create a DB; set `DATABASE_URL` in Vercel env variables.
2. To apply schema locally: `pnpm db:push`
3. Migration generation: `pnpm db:generate`

## Verify & Post-deploy Checks

1. Visit the website and confirm the homepage loads.
2. Confirm `/api/health` returns good status.
3. Manually call `/api/cron/aggregate` with `CRON_SECRET` to validate it runs correctly.
4. Trigger a Notion change and confirm the webhook revalidation fires and updates pages / cache.

## Troubleshooting

- If the Edge route `/api/track` returns 4xx/5xx: check the request origin and CORS headers in `vercel.json`.
- When AI endpoints time out: increase `maxDuration` in `vercel.json` or optimize request usage.
