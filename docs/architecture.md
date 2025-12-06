# Architecture Overview

This document describes the core architecture of the Adaptive Developer portfolio and the high-level interactions between the client, the server, external services, and major components.

## System Overview

```mermaid
flowchart LR
  subgraph Client
    C[Browser Client] -->|Behaviors| BT[BehaviorTracker]
    C -->|Requests| ChatWidget[ChatWidget]
  end

  BT -->|Edge POST| TrackAPI[/api/track (Edge)/]
  TrackAPI --> DB[(Neon PostgreSQL)]

  C -->|Chat| ChatAPI[/api/chat (30s)/]
  ChatAPI --> AI[Groq/OpenRouter]
  ChatAPI --> DB

  CronJob[/Daily Cron - /api/cron/aggregate/] -->|Aggregate| DB
  CronJob -->|Upsert| Aggregated[aggregated_behaviors]

  NotionWebhook[/Notion Webhook -> /api/notion/revalidate/] -->|Revalidate| RevalidateAPI[/api/notion/revalidate/]
  RevalidateAPI --> NextCache[Next.js revalidate endpoints]

  UploadThing --> UploadAPI[/api/uploadthing/]
  UploadAPI --> DB
  UploadAPI --> UploadStorage[(UploadThing/Cdn)]

  DB -->|CMS data| NextSSR[Next.js Server]
  NextSSR --> Client
```

## Component Hierarchy

```mermaid
graph TD
  ROOT[layout.tsx] --> PersonaProvider
  PersonaProvider --> ConsentBanner
  PersonaProvider --> BehaviorTracker
  PersonaProvider --> ChatWidget
  PersonaProvider --> MainContent
  MainContent --> Sections[Hero, Projects, Case Studies, Architecture, Skills, Footer]
```

## Data Flow (Simplified)

1. Client loads page -> BehaviorTracker starts capturing events
2. Behavior events are batched and sent to `/api/track` using the Edge runtime
3. Raw logs are stored in `behavior_logs` and `sessions`
4. Cron job runs daily (3:00 UTC) to create `aggregated_behaviors` vectors
5. `usePersona` queries `/api/persona/classify` to identify persona and store it in session/localStorage
6. Chat UI uses both persona context and CMS content to produce responses and optionally calls tools like `fetch_project_code`

### Chat Tool Calling Sequence

```mermaid
sequenceDiagram
  participant U as User
  participant C as Client (ChatWidget)
  participant S as /api/chat
  participant T as Tool (fetch_project_code)
  participant AI as Groq/OpenRouter

  U->>C: Send message
  C->>S: POST /api/chat (with persona context)
  S->>AI: Generate response (may request tool)
  AI->>S: ToolCall -> fetch_project_code(repo)
  S->>T: fetch_project_code(repo)
  T->>S: returns code summary
  S->>AI: provide tool result & ask for final response
  AI->>S: final message (stream)
  S->>C: stream response to client
  C->>U: display message
```

### Intake Flow (Multi-turn)

```mermaid
sequenceDiagram
  participant U as User
  participant C as Client (Form)
  participant S as /api/intake
  participant AI as OpenRouter

  U->>C: Submit initial form
  C->>S: POST /api/intake
  S->>AI: Ask follow-up questions
  AI->>S: returns {type: 'questions', questions: []}
  S->>C: return questions to user
  C->>U: asks follow-ups
  U->>C: answers follow-ups
  C->>S: POST additional answers
  S->>AI: generate final analysis/response
  AI->>S: {type: 'response', message: '...'}
  S->>DB: save intake result and persona
  S->>C: return the final response
```


## Security & Privacy

- GDPR compliance via consent banner; data retained 7 days for raw logs and 30 days for aggregated data.
- Admin endpoints are protected with a session cookie (`admin_session`) and token-based routes use `CRON_SECRET` or `REVALIDATION_SECRET`.

----

Links:
- Database schema: `docs/database-schema.md`
- API Reference: `docs/api-reference.md`
- Persona flow: `docs/persona-system.md`

