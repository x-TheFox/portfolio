# Security Policy

If you believe you have found a security issue, please report it via GitHub Security Advisories or by opening an issue marked as `security`. For private disclosures, reach out to the repository owner.

Supported versions:
- Node.js 18+
- Next.js v16

Data retention & privacy:
- Raw tracking logs retained for 7 days.
- Aggregated behavior vectors retained up to 30 days.
- Admin sessions expire automatically; rotate `ADMIN_SECRET` regularly.

Notes:
- Never commit secrets or `.env.local` file.
- Use Vercel Environment Variables and rotate API keys when needed.
