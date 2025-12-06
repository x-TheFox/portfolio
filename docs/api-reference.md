# API Reference

This doc lists major endpoints under `src/app/api/` with method, purpose, authentication, and sample payloads where applicable.

## Public Endpoints

- POST `/api/track` (Edge runtime)
  - Purpose: Collects behavior events from the client (pageview, scroll, click, hover, time, navigation, interaction, idle).
  - Auth: None; uses consent and client fingerprint.
  - Body Example:
    ```json
    {
      "sessionId": "fp_abc123",
      "timestamp": 1672531200000,
      "type": "scroll",
      "data": { "depth": 73, "maxDepth": 86 }
    }
    ```

- POST `/api/chat` (maxDuration: 30)
  - Purpose: Persona-aware chatbot endpoint; supports streaming and tool calling (project code fetches).
  - Auth: Optional (rate-limited for guest usage in production)
  - Body: standard chat messages and system prompt context

- POST `/api/intake` (maxDuration: 60)
  - Purpose: Multi-turn AI intake / interviewer flow. Returns JSON responses with `type: questions` or `type: response`.
  - Auth: None
  - Body Example:
    ```json
    { "name": "Jane Doe", "email": "jane@example.com", "message": "I'm interested in a collaboration." }
    ```

- GET `/api/health` and `/api/health/chat`
  - Purpose: Health checks for the API & Chat AI providers.
  - Auth: None

## Persona & Behavior

- POST `/api/persona/classify` (maxDuration: 15)
  - Purpose: Classify persona using aggregated behaviors or a behavior vector.
  - Body Example:
    ```json
    { "behaviorVector": [0.3, 0.2, 0.8, ...] }
    ```
  - Response: `{ persona: "engineer", confidence: 0.82 }

## CMS & Admin (Requires Admin Session Cookie)

- GET/POST/PUT/DELETE: `/api/cms/*`
  - Purpose: CRUD for Profile, Hero, Skills, Case Studies, Architecture Docs, Certificates, About
  - Auth: `admin_session` cookie that maps to `admin_sessions` table

- POST `/api/cms/auth` (login)
  - Purpose: Admin login; returns session cookie
  - Body: `{ username, password }`

## Notion & Sync

- POST `/api/notion/revalidate` (Webhook)
  - Purpose: Notion webhook receiver that triggers `res.revalidate()` for cached pages
  - Auth: HMAC via `NOTION_WEBHOOK_SECRET` or Bearer token with `REVALIDATION_SECRET`
  - Actions: Revalidate homepage and any updated pages or caches

- GET/POST `/api/cms/sync`
  - Purpose: Manual trigger for Notion content sync and cache revalidation
  - Auth: Admin or `REVALIDATION_SECRET`

## Upload (UploadThing)

- `src/app/api/uploadthing/route.ts` & `core.ts`
  - Purpose: Handles uploads for profile images, certificates, PDF resumes, case study PDFs
  - Auth: Admin session cookie for protected uploads

## GitHub Integration

- GET `/api/github/skills` - Scans repositories for skills and returns aggregated results.

## Cron & Aggregation

- GET `/api/cron/aggregate` - Daily aggregation of behavior logs into `aggregated_behaviors`. Requires `CRON_SECRET` header.
  - Authentication: Add header `Authorization: Bearer <CRON_SECRET>` to authorize cron calls in production.
  - Example curl:
    ```bash
    curl -X GET "https://your-site.com/api/cron/aggregate" \
      -H "Authorization: Bearer $CRON_SECRET"
    ```

## Notes
- All `/api/*` endpoints include default CORS headers (see `vercel.json`).
- Edge runtime is used for real-time tracking to reduce latency.

## Complete list of API route files (for reference)

| Path | File | Purpose |
|---|---|---|
| `/api/track` | `src/app/api/track/route.ts` | Behavior events ingestion (Edge runtime)
| `/api/chat` | `src/app/api/chat/route.ts` | Chat endpoint (Groq/OpenRouter + tool calling)
| `/api/intake` | `src/app/api/intake/route.ts` | Intake / multi-turn conversations
| `/api/persona/classify` | `src/app/api/persona/classify/route.ts` | Persona classification
| `/api/notion/revalidate` | `src/app/api/notion/revalidate/route.ts` | Notion webhook revalidation
| `/api/cron/aggregate` | `src/app/api/cron/aggregate/route.ts` | Daily aggregation of behavior logs
| `/api/cms/sync` | `src/app/api/cms/sync/route.ts` | Manual sync from Notion
| `/api/health` | `src/app/api/health/route.ts` | Health checks
| `/api/health/chat` | `src/app/api/health/chat/route.ts` | Chat provider checks
| `/api/github/skills` | `src/app/api/github/skills/route.ts` | GitHub skills extraction
| `/api/cms/skills` | `src/app/api/cms/skills/route.ts` | Skills CRUD
| `/api/cms/hero` | `src/app/api/cms/hero/route.ts` | Hero per-persona CRUD
| `/api/cms/profile` | `src/app/api/cms/profile/route.ts` | Profile CRUD
| `/api/uploadthing` | `src/app/api/uploadthing/route.ts` | Upload endpoints (UploadThing)
| `/api/uploadthing/core` | `src/app/api/uploadthing/core.ts` | File router & routers
| `/api/cms/certificates` | `src/app/api/cms/certificates/route.ts` | Certificates CRUD
| `/api/cms/auth` | `src/app/api/cms/auth/route.ts` | Admin auth
| `/api/cms/about` | `src/app/api/cms/about/route.ts` | About page CRUD
| `/api/cms/case-studies` | `src/app/api/cms/case-studies/route.ts` | Case Studies CRUD
| `/api/cms/architecture` | `src/app/api/cms/architecture/route.ts` | Architecture docs CRUD

