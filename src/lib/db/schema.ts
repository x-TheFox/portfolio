import { pgTable, text, timestamp, jsonb, real, uuid, boolean, integer, varchar } from 'drizzle-orm/pg-core';

// ============================================
// CMS TABLES
// ============================================

// Profile - single row for site owner info
export const profile = pgTable('profile', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().default('Your Name'),
  email: text('email'),
  bio: text('bio'),
  shortBio: text('short_bio'), // For hero section
  profileImageUrl: text('profile_image_url'),
  resumeUrl: text('resume_url'),
  socialLinks: jsonb('social_links').default({}), // { github, linkedin, twitter, etc. }
  location: text('location'),
  available: boolean('available').default(true),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Hero content - per-persona customization
export const heroContent = pgTable('hero_content', {
  id: uuid('id').defaultRandom().primaryKey(),
  persona: varchar('persona', { length: 50 }).notNull().unique(), // 'recruiter' | 'engineer' | etc.
  headline: text('headline').notNull(),
  subheadline: text('subheadline').notNull(),
  ctaText: text('cta_text'),
  ctaHref: text('cta_href'),
  secondaryCtaText: text('secondary_cta_text'),
  secondaryCtaHref: text('secondary_cta_href'),
  accentColor: text('accent_color'), // Tailwind gradient class
  showStats: boolean('show_stats').default(false),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Skills - local additions (Notion skills come from projects)
export const skills = pgTable('skills', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  level: integer('level').default(50), // 0-100
  category: varchar('category', { length: 50 }).notNull(), // 'frontend' | 'backend' | etc.
  years: integer('years'),
  icon: text('icon'), // Lucide icon name
  sortOrder: integer('sort_order').default(0),
  source: varchar('source', { length: 20 }).default('local').notNull(), // 'local' | 'notion'
  notionId: text('notion_id'), // For synced items
  personas: jsonb('personas').default(['global']), // PersonaType[] | ['global'] - which personas see this skill
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Certificates - local additions
export const certificates = pgTable('certificates', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  issuer: text('issuer').notNull(),
  issueDate: text('issue_date'),
  expiryDate: text('expiry_date'),
  credentialId: text('credential_id'),
  credentialUrl: text('credential_url'),
  imageUrl: text('image_url'),
  skills: jsonb('skills').default([]), // string[]
  featured: boolean('featured').default(false),
  sortOrder: integer('sort_order').default(0),
  source: varchar('source', { length: 20 }).default('local').notNull(),
  notionId: text('notion_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// About section content
export const aboutSection = pgTable('about_section', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').default('About Me'),
  content: text('content'), // Markdown supported
  highlights: jsonb('highlights').default([]), // { label, value, icon }[]
  showTimeline: boolean('show_timeline').default(false),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Case Studies - local additions
export const caseStudies = pgTable('case_studies', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  description: text('description'),
  client: text('client'),
  industry: varchar('industry', { length: 50 }).default('tech').notNull(), // 'tech' | 'finance' | 'healthcare' | 'retail' | 'gaming' | 'other'
  type: varchar('type', { length: 50 }).default('full-project').notNull(), // 'product-design' | 'system-design' | 'ux-research' | 'branding' | 'full-project'
  featured: boolean('featured').default(false),
  coverImage: text('cover_image'),
  pdfUrl: text('pdf_url'),
  relatedProjectId: text('related_project_id'),
  tags: jsonb('tags').default([]), // string[]
  date: text('date'),
  content: text('content'), // Markdown supported
  sortOrder: integer('sort_order').default(0),
  source: varchar('source', { length: 20 }).default('local').notNull(),
  notionId: text('notion_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Architecture Docs - local additions
export const architectureDocs = pgTable('architecture_docs', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  description: text('description'),
  type: varchar('type', { length: 50 }).default('system-design').notNull(), // 'system-design' | 'infrastructure' | 'api-design' | 'data-model' | 'methodology'
  featured: boolean('featured').default(false),
  coverImage: text('cover_image'),
  diagramUrl: text('diagram_url'),
  techStack: jsonb('tech_stack').default([]), // string[]
  relatedProjectId: text('related_project_id'),
  content: text('content'), // Markdown supported
  sortOrder: integer('sort_order').default(0),
  source: varchar('source', { length: 20 }).default('local').notNull(),
  notionId: text('notion_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Admin sessions for authentication
export const adminSessions = pgTable('admin_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Sync log for Notion webhook tracking
export const syncLog = pgTable('sync_log', {
  id: uuid('id').defaultRandom().primaryKey(),
  source: varchar('source', { length: 50 }).notNull(), // 'notion-webhook' | 'manual' | 'cron'
  status: varchar('status', { length: 20 }).notNull(), // 'success' | 'error'
  itemsUpdated: integer('items_updated').default(0),
  details: jsonb('details').default({}),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

// CMS Types
export type Profile = typeof profile.$inferSelect;
export type NewProfile = typeof profile.$inferInsert;
export type HeroContent = typeof heroContent.$inferSelect;
export type NewHeroContent = typeof heroContent.$inferInsert;
export type Skill = typeof skills.$inferSelect;
export type NewSkill = typeof skills.$inferInsert;
export type Certificate = typeof certificates.$inferSelect;
export type NewCertificate = typeof certificates.$inferInsert;
export type AboutSection = typeof aboutSection.$inferSelect;
export type NewAboutSection = typeof aboutSection.$inferInsert;
export type CaseStudyRecord = typeof caseStudies.$inferSelect;
export type NewCaseStudyRecord = typeof caseStudies.$inferInsert;
export type ArchitectureDocRecord = typeof architectureDocs.$inferSelect;
export type NewArchitectureDocRecord = typeof architectureDocs.$inferInsert;
export type AdminSession = typeof adminSessions.$inferSelect;
export type NewAdminSession = typeof adminSessions.$inferInsert;
export type SyncLogEntry = typeof syncLog.$inferSelect;
export type NewSyncLogEntry = typeof syncLog.$inferInsert;

// ============================================
// BEHAVIOR TRACKING TABLES
// ============================================

// Sessions table - tracks anonymous visitors
export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  fingerprintHash: text('fingerprint_hash').notNull().unique(),
  persona: text('persona'),
  confidence: real('confidence'),
  mood: text('mood'),
  deviceType: text('device_type'), // 'desktop' | 'mobile' | 'tablet'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastSeen: timestamp('last_seen').defaultNow().notNull(),
  consentGiven: boolean('consent_given').default(false),
});

// Behavior logs - raw event data (TTL: 7 days via cron)
export const behaviorLogs = pgTable('behavior_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id').references(() => sessions.id).notNull(),
  eventType: text('event_type').notNull(), // 'pageview' | 'scroll' | 'click' | 'hover' | 'time' | 'navigation'
  data: jsonb('data').notNull(), // flexible event data
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

// Aggregated behaviors - compressed vector representation
export const aggregatedBehaviors = pgTable('aggregated_behaviors', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id').references(() => sessions.id).notNull().unique(),
  
  // Behavior metrics (normalized 0-1)
  timeOnHomepage: real('time_on_homepage').default(0),
  scrollDepth: real('scroll_depth').default(0),
  clickedResume: boolean('clicked_resume').default(false),
  openedCodeSamplesCount: integer('opened_code_samples_count').default(0),
  visitedProjectsCount: integer('visited_projects_count').default(0),
  openedDesignShowcase: boolean('opened_design_showcase').default(false),
  playedDemosCount: integer('played_demos_count').default(0),
  openedAiIntakeForm: boolean('opened_ai_intake_form').default(false),
  mouseHeatmapDensity: real('mouse_heatmap_density').default(0),
  navigationSpeed: real('navigation_speed').default(0),
  hoveredKeywords: jsonb('hovered_keywords').default([]),
  interactedWithAnimations: boolean('interacted_with_animations').default(false),
  idleTime: real('idle_time').default(0),
  
  // Computed vector for clustering (12 dimensions)
  behaviorVector: jsonb('behavior_vector').default([]),
  
  // Navigation path
  navigationPath: jsonb('navigation_path').default([]),
  
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Types for TypeScript
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type BehaviorLog = typeof behaviorLogs.$inferSelect;
export type NewBehaviorLog = typeof behaviorLogs.$inferInsert;
export type AggregatedBehavior = typeof aggregatedBehaviors.$inferSelect;
export type NewAggregatedBehavior = typeof aggregatedBehaviors.$inferInsert;
