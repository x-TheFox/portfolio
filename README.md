# The Adaptive Developer 🧠

An AI-augmented portfolio website that learns from visitor behavior, classifies personas using machine learning + GPT, and dynamically adapts the entire user experience.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?style=flat-square&logo=tailwind-css)
![Neon](https://img.shields.io/badge/Neon-Postgres-green?style=flat-square)
![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)
![Vercel](https://img.shields.io/badge/Vercel-Deployed-black?style=flat-square)
![CI](https://img.shields.io/github/actions/workflow/status/x-TheFox/portfolio/ci.yml?style=flat-square)

## ✨ Features

### 🎭 Persona Detection & Adaptation
- **6 Visitor Personas**: Recruiter, Engineer, Designer, Gamer, CTO, Curious Visitor
- **Behavior Clustering**: Real-time analysis of scroll patterns, click targets, time spent, navigation paths
- **ML + GPT Hybrid**: K-means clustering for speed + OpenRouter for nuanced classification
- **Full UI Adaptation**: Headlines, CTAs, content order, color accents, and animations all adapt per persona

### 📝 Notion CMS Integration
- **Projects**: Pulled from Notion database with rich content blocks
- **Now Page**: Live updates from `/now` database - what you're working on right now
- **Intake Submissions**: AI-processed intake forms saved directly to Notion

### 🤖 AI Features
- **Persona-Aware Chatbot**: Groq-powered (Llama 3.1 8B) with 840 tokens/sec streaming
- **AI Interviewer**: Smart intake form at `/intake` that processes responses with OpenRouter
- **Context-Aware Responses**: Chat adapts tone and content based on detected persona

### 🔒 Privacy First
- **GDPR Consent Banner**: Tracking only after explicit consent
- **7-Day Log Retention**: Automatic aggregation and cleanup via daily cron
- **Session-Based**: No personal data stored, only behavioral patterns

### 📱 Mobile Experience
- **Full Detection**: All behavior tracking works on mobile
- **Simplified UI**: Streamlined experience for smaller screens
- **Desktop Prompt**: Subtle suggestion to visit on desktop for full experience

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm (recommended) or npm
- Accounts: Neon, Groq, OpenRouter, Notion

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/adaptive-developer.git
cd adaptive-developer

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Run database migrations
pnpm db:push

# Start development server
pnpm dev

## 📘 Documentation

Detailed architecture, API, database schema, and deployment instructions are available in the `docs/` folder. See `docs/architecture.md` to start.

## 🤝 Contributing & Security

See `CONTRIBUTING.md` for how to contribute. For security disclosures and policies, see `SECURITY.md`.
```

### Environment Variables

```env
# Database (Neon)
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require

# AI APIs
GROQ_API_KEY=gsk_xxx
OPENROUTER_API_KEY=sk-or-xxx

# Notion CMS
NOTION_API_KEY=secret_xxx
NOTION_PROJECTS_DATABASE_ID=xxx
NOTION_NOW_DATABASE_ID=xxx
NOTION_INTAKE_DATABASE_ID=xxx

# Security
CRON_SECRET=your-random-secret
NOTION_REVALIDATE_SECRET=your-webhook-secret
```

## 📊 Notion Database Setup

### Projects Database
Required properties:
| Property | Type | Description |
|----------|------|-------------|
| Title | Title | Project name |
| Slug | Text | URL slug (e.g., "my-project") |
| Description | Text | Short description |
| Tags | Multi-select | Technology tags |
| Featured | Checkbox | Show on homepage |
| Cover | Files | Cover image |
| Published | Checkbox | Is published |

### Now Database
Required properties:
| Property | Type | Description |
|----------|------|-------------|
| Title | Title | Page title |
| Slug | Text | Should be "now" |
| LastUpdated | Date | Last update time |

### Intake Database
Required properties:
| Property | Type | Description |
|----------|------|-------------|
| Name | Title | Visitor name |
| Email | Email | Contact email |
| Company | Text | Company name |
| Role | Select | Visitor role |
| Message | Text | Original message |
| AIAnalysis | Text | AI-processed analysis |
| Persona | Select | Detected persona |
| SessionId | Text | Session identifier |

## 🏗️ Architecture

```
src/
├── app/
│   ├── api/
│   │   ├── chat/          # Streaming chatbot endpoint
│   │   ├── cron/          # Daily aggregation job
│   │   ├── intake/        # AI interview processing
│   │   ├── notion/        # Revalidation webhook
│   │   ├── persona/       # Classification endpoint
│   │   └── track/         # Behavior logging (Edge)
│   ├── intake/            # AI interviewer page
│   ├── now/               # Notion "Now" page
│   ├── projects/          # Projects listing & detail
│   ├── layout.tsx         # Root layout with providers
│   └── page.tsx           # Adaptive homepage
├── components/
│   ├── chat/              # ChatWidget
│   ├── notion/            # NotionRenderer
│   ├── sections/          # Hero, Projects, Skills, etc.
│   ├── tracking/          # ConsentBanner, BehaviorTracker
│   └── ui/                # Observer, MobilePrompt
├── hooks/
│   └── usePersona.tsx     # Persona context & classification
├── lib/
│   ├── ai/                # Groq, OpenRouter, prompts
│   ├── clustering/        # K-means centroids, vectorization
│   ├── db/                # Drizzle schema & client
│   ├── notion/            # API client, block parser
│   └── utils.ts           # Helpers (cn, throttle, etc.)
└── types/
    ├── behavior.ts        # Event types
    └── persona.ts         # Persona definitions
```

## 🎯 Persona Detection Algorithm

1. **Behavior Collection** (client-side)
   - Scroll depth & speed
   - Click targets (sections, links, code blocks)
   - Hover patterns
   - Time on page
   - Navigation flow

2. **Vectorization** (12-dimensional)
   - Converts raw behaviors into normalized feature vector
   - Features: scroll metrics, interaction ratios, time patterns

3. **K-Means Classification** (fast, local)
   - Pre-computed centroids for each persona
   - Cosine similarity matching
   - ~1ms classification time

4. **GPT Refinement** (optional, accurate)
   - OpenRouter call with behavior summary
   - Used for edge cases or low confidence
   - Fallback when local classification < 70% confident

## 🔄 Data Lifecycle

```
Day 0-1:   Raw behavior logs collected
Day 1+:    Logs aggregated into session vectors
Day 7+:    Raw logs deleted (GDPR compliance)
Day 30+:   Aggregated data cleaned up
```

## 🚢 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
pnpm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel Dashboard
# Enable cron jobs (requires Pro plan for custom schedules)
```

### Configuration

The `vercel.json` configures:
- Daily cron job at 3am UTC
- Edge runtime for tracking endpoint
- Extended timeouts for AI endpoints

## 🛠️ Development

```bash
# Run development server
pnpm dev

# Run database migrations
pnpm db:push

# Generate Drizzle migrations
pnpm db:generate

# Type checking
pnpm type-check

# Linting
pnpm lint
```

## 📈 Analytics

The site tracks:
- Persona distribution
- Conversion by persona
- Engagement metrics
- AI chat interactions

Access via Vercel Analytics or custom dashboard (coming soon).

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines first.

## 📄 License

MIT © The Adaptive Developer

---

Built with 🧠 and ❤️ by an AI-augmented developer
