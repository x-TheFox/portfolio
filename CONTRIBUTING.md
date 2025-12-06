# Contributing

Thanks for your interest in contributing! Here are some helpful guidelines and commands to get started.

## Development Setup

1. Clone: `git clone https://github.com/yourusername/adaptive-developer.git`
2. Install dependencies: `pnpm install`
3. Setup environment variables: `cp .env.example .env.local` and fill them in
4. Initialize your database (Neon): `pnpm db:push`
5. Start dev server: `pnpm dev`

## Scripts
- `pnpm dev` - Start Next.js in development
- `pnpm build` - Build production
- `pnpm start` - Run the built app
- `pnpm lint` - Run ESLint
- `pnpm db:push` - Apply Drizzle schema to DB
- `pnpm db:generate` - Generate migrations
- `pnpm type-check` - Run TypeScript checks

## PR Guidelines
1. Fork the repo and create a feature branch with a descriptive name.
2. Keep changes small and focused.
3. Add tests where necessary and ensure `pnpm lint` and `pnpm type-check` succeed.
4. Write a clear PR description and include screenshots for visual changes.

## Style
- Use TypeScript types where possible.
- Keep UI changes consistent with Tailwind v4 utilities.
- Use `cn` helper for class merging when needed.
