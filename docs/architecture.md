# Architecture Overview

This document describes the core architecture of the Adaptive Developer portfolio and the high-level interactions between the client, the server, external services, and major components.

# Solution Architecture

## High-Level Approach

```mermaid
graph TD
    subgraph Client [Client-Side]
        A[BEHAVIOR COLLECTION] -->|Scroll depth, click targets,<br>hover patterns, time, navigation| B{GDPR Consent?}
        B -->|Yes| C[Event Wrapper]
    end

    subgraph Edge [Edge Runtime]
        C -->|POST /api/track| D[API Route]
        D -->|Payload: sessionId,<br>event type, data| E[(PostgreSQL<br>behavior_logs)]
    end

    subgraph Backend [Backend / Vercel]
        E -->|Raw events<br>TTL: 7 days| F[Daily Cron: /api/cron/aggregate<br>3am UTC]
        
        F -->|1. Vectorize behaviors| G[Processing]
        G -->|2. Run K-means classifier| H[Classification]
        H -->|3. Upsert aggregated_behaviors| I[(Database)]
        H -->|4. Delete raw logs| J[Cleanup]
    end

    subgraph Persona_Logic [Persona Logic]
        I -->|Input: aggregated behavior| K[POST /api/persona/classify]
        K -->|Output: persona + confidence| L[usePersona Hook]
    end

    L -->|Stores persona in localStorage| M[Client Context]
    M -->|Updates section order| N[UI Adaptation]
    M -->|Adapts styling, CTAs| N
```

## System Architecture Diagram

```mermaid
graph TB
    subgraph Client ["Client (Browser)"]
        UI["UI Components<br/>(React 19)"]
        BT["BehaviorTracker<br/>(Events)"]
        PersonaHook["usePersona Hook<br/>(Context)"]
        Chat["ChatWidget"]
        UI -->|events| BT
        UI -->|persona| PersonaHook
        UI -->|questions| Chat
    end

    subgraph API ["Edge & Server APIs"]
        TrackEdge["🌐 /api/track<br/>(Edge Runtime)"]
        PersonaAPI["⚙️ /api/persona/classify"]
        ChatAPI["🤖 /api/chat"]
        CronAPI["⏰ /api/cron/aggregate"]
        NotionHook["🔗 /api/notion/revalidate"]
    end

    subgraph DB ["Database Layer"]
        BehaviorLogs["behavior_logs<br/>(Raw, TTL: 7d)"]
        AggBehaviors["aggregated_behaviors<br/>(Vectors, TTL: 30d)"]
        CMS["CMS Tables<br/>(Profile, Skills, Certs)"]
        Sessions["sessions<br/>(Persona, Confidence)"]
    end

    subgraph AI ["External AI Services"]
        Groq["🧠 Groq<br/>(Llama 3.1 8B)"]
        OpenRouter["🤖 OpenRouter<br/>(GPT fallback)"]
    end

    subgraph External ["External Services"]
        Notion["📝 Notion<br/>(CMS)"]
        UploadThing["☁️ UploadThing<br/>(File Storage)"]
        GitHub["🐙 GitHub API<br/>(Skills Extraction)"]
    end

    Client -->|POST behavior| TrackEdge
    TrackEdge -->|store| BehaviorLogs
    CronAPI -->|aggregate| BehaviorLogs
    CronAPI -->|vectorize + classify| PersonaAPI
    PersonaAPI -->|K-means + LLM| Groq
    PersonaAPI -->|fallback| OpenRouter
    PersonaAPI -->|store result| Sessions
    PersonaAPI -->|response| PersonaHook
    
    Chat -->|POST message| ChatAPI
    ChatAPI -->|with persona context| Groq
    ChatAPI -->|fallback| OpenRouter
    
    NotionHook -->|webhook| TrackEdge
    NotionHook -->|revalidate| CMS
    
    External -->|sync| CMS
    Client -->|query| CMS
```

## Component Hierarchy

```mermaid
graph TD
    Root[app/layout.tsx] --> Provider[PersonaProvider]
    
    Provider --> Consent[ConsentBanner]
    Provider --> Tracker[BehaviorTracker]
    Provider --> Chat[ChatWidget]
    Provider --> Observer[Observer (Dev Mode)]
    Provider --> Mobile[MobilePrompt]
    Provider --> Dev[DevTools]
    
    Provider --> Main[main / HomeClient]
    
    Main --> Hero
    Main --> About
    Main --> Projects
    Main --> Skills
    Main --> Certificates
    Main --> CaseStudies
    Main --> Architecture
    Main --> Contact
    Main --> Footer
```

## Data Flow Sequence

```mermaid
sequenceDiagram
    participant U as Visitor
    participant C as Browser Client
    participant Track as /api/track (Edge)
    participant DB as PostgreSQL
    participant Cron as /api/cron/aggregate
    participant Classify as /api/persona/classify
    participant Groq as Groq API
    participant Hook as usePersona Hook

    U->>C: Lands on homepage
    activate C
    C->>C: usePersona Hook initializes
    C->>C: BehaviorTracker attaches listeners
    C->>C: Shows ConsentBanner
    
    U->>C: Accepts consent
    
    C->>Track: POST event: {type: 'pageview', ...}
    Track->>DB: Insert into behavior_logs
    C->>Track: POST event: {type: 'scroll', depth: 45}
    Track->>DB: Insert into behavior_logs
    C->>Track: POST event: {type: 'click', target: 'projects'}
    Track->>DB: Insert into behavior_logs
    deactivate C
    
    Note over Cron: Daily 3am UTC
    activate Cron
    Cron->>DB: SELECT behavior_logs WHERE age < 1 day
    Cron->>Cron: FOR EACH session: vectorize() → 12D vector
    Cron->>Classify: POST /api/persona/classify
    activate Classify
    Classify->>Classify: computeSimilarity(vector, CENTROIDS)
    Classify->>Classify: IF confidence > 0.5: return persona
    Classify->>Classify: ELSE: callLLM(vector)
    Classify->>Groq: POST behavior summary
    Groq->>Classify: Return persona classification
    Classify->>DB: Upsert aggregated_behaviors
    deactivate Classify
    Cron->>DB: DELETE behavior_logs WHERE age > 7 days
    Cron->>DB: DELETE aggregated_behaviors WHERE age > 30 days
    deactivate Cron
    
    C->>Classify: GET /api/persona/classify
    Classify->>DB: Query aggregated_behaviors
    Classify->>Hook: {persona: 'engineer', confidence: 0.82}
    Hook->>Hook: Update Context + localStorage
    Hook->>C: Re-render with new section order
    C->>U: UI adapts (projects first, architecture visible)
```

## Database Schema (ER Diagram)

```mermaid
erDiagram
    SESSIONS ||--o{ BEHAVIOR_LOGS : has
    SESSIONS ||--o{ AGGREGATED_BEHAVIORS : has
    PROFILE ||--o{ HERO_CONTENT : "has per-persona"
    PROFILE ||--o{ SKILLS : contains
    PROFILE ||--o{ CERTIFICATES : holds
    PROFILE ||--o{ CASE_STUDIES : publishes
    PROFILE ||--o{ ARCHITECTURE_DOCS : publishes
    CASE_STUDIES ||--o{ ARCHITECTURE_DOCS : "related_to"

    SESSIONS {
        uuid id PK
        string fingerprintHash "Session ID"
        bool consentGiven "GDPR"
        string persona
        real confidence
        timestamp createdAt
    }

    BEHAVIOR_LOGS {
        uuid id PK
        uuid sessionId FK
        string eventType "scroll, click, hover"
        jsonb data
        timestamp timestamp
        varchar TTL "7 days"
    }

    AGGREGATED_BEHAVIORS {
        uuid id PK
        uuid sessionId FK
        real timeOnHomepage
        real scrollDepth
        boolean clickedResume
        integer openedCodeSamplesCount
        jsonb behaviorVector "12 dimensions"
        jsonb navigationPath
        timestamp updatedAt
        varchar TTL "30 days"
    }

    PROFILE {
        uuid id PK
        string name
        string email
        text bio
        string location
        bool available
    }

    HERO_CONTENT {
        uuid id PK
        uuid profileId FK
        string persona
        text headline
        text subheadline
        string ctaText
        string ctaLink
    }

    SKILLS {
        uuid id PK
        string name
        integer level
        string category
        jsonb personas
        string source
    }

    CERTIFICATES {
        uuid id PK
        string name
        string issuer
        date issueDate
        string credentialId
        bool featured
    }

    CASE_STUDIES {
        uuid id PK
        string slug
        string title
        string type
        bool featured
    }

    ARCHITECTURE_DOCS {
        uuid id PK
        string slug
        string diagramUrl
        jsonb technologies
    }
```

## System Overview

```mermaid
flowchart LR
  subgraph Client
    C[Browser Client] -->|Behaviors| BT[BehaviorTracker]
    C -->|Requests| ChatWidget[ChatWidget]
  end

  %% Added quotes to the label below
  BT -->|Edge POST| TrackAPI[/"/api/track (Edge)"/]
  TrackAPI --> DB[(Neon PostgreSQL)]

  %% Added quotes to the label below
  C -->|Chat| ChatAPI[/"/api/chat (30s)"/]
  ChatAPI --> AI[Groq/OpenRouter]
  ChatAPI --> DB

  %% Added quotes to the label below
  CronJob[/"Daily Cron - /api/cron/aggregate"/] -->|Aggregate| DB
  CronJob -->|Upsert| Aggregated[aggregated_behaviors]

  %% Added quotes to the labels below
  NotionWebhook[/"Notion Webhook -> /api/notion/revalidate"/] -->|Revalidate| RevalidateAPI[/"/api/notion/revalidate"/]
  RevalidateAPI --> NextCache[Next.js revalidate endpoints]

  UploadThing --> UploadAPI[/"/api/uploadthing"/]
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

# Database Schema
```mermaid
erDiagram
    PROFILE ||--o{ HERO_CONTENT : has
    PROFILE ||--o{ SKILLS : lists
    PROFILE ||--o{ CERTIFICATES : holds
    PROFILE ||--o{ ABOUT_SECTION : contains
    PROFILE ||--o{ CASE_STUDIES : publishes
    PROFILE ||--o{ ARCHITECTURE_DOCS : publishes

    SESSIONS ||--o{ BEHAVIOR_LOGS : has
    SESSIONS ||--o{ AGGREGATED_BEHAVIORS : has
    ADMIN_SESSIONS ||--o{ SYNC_LOG : tracks

    CASE_STUDIES ||--o{ ARCHITECTURE_DOCS : related_to

    PROFILE {
      uuid id PK
      text name
      text email
      text bio
      text shortBio
      text profileImageUrl
    }

    SESSIONS {
      uuid id PK
      string fingerprintHash
      bool consentGiven
      string persona
      real confidence
      timestamp createdAt
    }

    BEHAVIOR_LOGS {
      uuid id PK
      uuid sessionId FK
      text eventType
      jsonb data
      timestamp timestamp
    }

    AGGREGATED_BEHAVIORS {
      uuid id PK
      uuid sessionId FK
      real timeOnHomepage
      real scrollDepth
      boolean clickedResume
      integer openedCodeSamplesCount
      integer visitedProjectsCount
      jsonb behaviorVector
      jsonb navigationPath
      timestamp updatedAt
    }

    SKILLS {
      uuid id PK
      text name
      integer level
      text category
      timestamp createdAt
    }

    CERTIFICATES {
      uuid id PK
      text name
      text issuer
      text imageUrl
    }

    CASE_STUDIES {
      uuid id PK
      text slug
      text title
      text description
      jsonb tags
    }
```

## UML: Behavior Types

```mermaid
classDiagram
		class BehaviorEvent {
			+string sessionId
			+number timestamp
			+BehaviorEventType type
			+BehaviorEventData data
		}
		class BehaviorVector {
			+number resumeFocus
			+number codeFocus
			+number designFocus
			+number leadershipFocus
			+number gameFocus
			+number explorationBreadth
			+number engagementDepth
			+number interactionRate
			+number technicalInterest
			+number visualInterest
			+number navigationSpeed
			+number intentClarity
		}
		BehaviorEvent --> BehaviorVector : vectorize
```


## Security & Privacy

- GDPR compliance via consent banner; data retained 7 days for raw logs and 30 days for aggregated data.
- Admin endpoints are protected with a session cookie (`admin_session`) and token-based routes use `CRON_SECRET` or `REVALIDATION_SECRET`.

----

Links:
- Database schema: `docs/database-schema.md`
- API Reference: `docs/api-reference.md`
- Persona flow: `docs/persona-system.md`

