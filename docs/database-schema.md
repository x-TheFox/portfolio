# Database Schema

This is a simplified ER diagram of the database schema defined in `src/lib/db/schema.ts`.

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

## Notes
- TTLs: `behavior_logs` -> 7 days (cron cleanup). `aggregated_behaviors` -> 30 days cleanup.
- All CMS tables support `notionId` for syncing from Notion.
