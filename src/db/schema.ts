import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

const uuid = () => crypto.randomUUID();
const now = () => new Date();

/**
 * Locally-owned, editable work tasks. JIRA issues live in `jiraIssues` and are
 * read-only; a local task may optionally reference a JIRA key.
 */
export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey().$defaultFn(uuid),
  title: text("title").notNull(),
  description: text("description"),
  // todo | in_progress | blocked | done
  status: text("status").notNull().default("todo"),
  // low | medium | high | urgent
  priority: text("priority").notNull().default("medium"),
  owner: text("owner"),
  dueDate: integer("due_date", { mode: "timestamp_ms" }),
  jiraKey: text("jira_key"),
  position: integer("position").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
}, (t) => [index("tasks_pos_idx").on(t.position, t.createdAt)]);

/**
 * Read-only cache of JIRA issues assigned to the user. Refreshed on sync.
 */
export const jiraIssues = sqliteTable("jira_issues", {
  key: text("key").primaryKey(),
  summary: text("summary").notNull(),
  status: text("status"),
  statusCategory: text("status_category"),
  priority: text("priority"),
  issueType: text("issue_type"),
  assignee: text("assignee"),
  project: text("project"),
  url: text("url"),
  updated: integer("updated", { mode: "timestamp_ms" }),
  raw: text("raw"),
  syncedAt: integer("synced_at", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
}, (t) => [index("jira_updated_idx").on(t.updated)]);

/**
 * Brag sheet — accomplishments worth remembering at review time.
 */
export const bragEntries = sqliteTable("brag_entries", {
  id: text("id").primaryKey().$defaultFn(uuid),
  title: text("title").notNull(),
  description: text("description"),
  impact: text("impact"),
  // small | medium | large
  size: text("size"),
  date: integer("date", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
  // JSON-encoded string array
  tags: text("tags"),
  // JSON-encoded array of { type: 'task'|'jira'|'milestone', id: string, label: string }
  links: text("links"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
}, (t) => [index("brag_date_idx").on(t.date)]);

/**
 * Milestones on the path toward a promotion / next level.
 */
export const promotionMilestones = sqliteTable("promotion_milestones", {
  id: text("id").primaryKey().$defaultFn(uuid),
  title: text("title").notNull(),
  targetLevel: text("target_level"),
  // not_started | in_progress | complete
  status: text("status").notNull().default("not_started"),
  dueDate: integer("due_date", { mode: "timestamp_ms" }),
  notes: text("notes"),
  tags: text("tags"),
  position: integer("position").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
}, (t) => [index("promo_pos_idx").on(t.position, t.createdAt)]);

/**
 * Longer-term career development goals (skills, certs, networking, etc.).
 */
export const careerGoals = sqliteTable("career_goals", {
  id: text("id").primaryKey().$defaultFn(uuid),
  title: text("title").notNull(),
  category: text("category"),
  // active | done | paused
  status: text("status").notNull().default("active"),
  targetDate: integer("target_date", { mode: "timestamp_ms" }),
  progress: integer("progress").notNull().default(0),
  notes: text("notes"),
  tags: text("tags"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
}, (t) => [index("career_created_idx").on(t.createdAt)]);

/**
 * Vision board cards (aspirations, with optional imagery).
 */
export const visionItems = sqliteTable("vision_items", {
  id: text("id").primaryKey().$defaultFn(uuid),
  title: text("title").notNull(),
  note: text("note"),
  imagePath: text("image_path"),
  category: text("category"),
  position: integer("position").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
}, (t) => [index("vision_pos_idx").on(t.position, t.createdAt)]);

/**
 * Important dated events — work or personal.
 */
export const timelineEvents = sqliteTable("timeline_events", {
  id: text("id").primaryKey().$defaultFn(uuid),
  title: text("title").notNull(),
  date: integer("date", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
  // work | personal | milestone
  category: text("category").notNull().default("personal"),
  notes: text("notes"),
  tags: text("tags"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
}, (t) => [index("timeline_date_idx").on(t.date)]);

/**
 * Simple key/value store for non-secret app settings (JIRA site/email, theme, ...).
 * Secrets like the JIRA API token are stored in the OS keychain, never here.
 */
export const appSettings = sqliteTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value"),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

/**
 * Read-only cache of your GitHub pull requests, by role (authored / reviewed /
 * commented). A single PR can appear under multiple roles.
 */
export const githubPrs = sqliteTable("github_prs", {
  id: text("id").primaryKey(), // `${role}:${repo}#${number}`
  number: integer("number").notNull(),
  repo: text("repo").notNull(),
  title: text("title").notNull(),
  state: text("state"), // open | closed | merged
  role: text("role").notNull(), // author | reviewer | commenter
  url: text("url"),
  authorLogin: text("author_login"),
  updated: integer("updated", { mode: "timestamp_ms" }),
  raw: text("raw"),
  syncedAt: integer("synced_at", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
}, (t) => [index("gh_prs_updated_idx").on(t.updated)]);

/**
 * Daily GitHub contribution totals (combined) — powers the activity/velocity
 * graph. Per-type period totals are stored separately in app_settings.
 */
export const githubActivity = sqliteTable("github_activity", {
  date: text("date").primaryKey(), // YYYY-MM-DD
  count: integer("count").notNull().default(0),
  syncedAt: integer("synced_at", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
});

/**
 * Recent GitHub events (pushes, PR actions) — a rolling activity feed.
 */
export const githubEvents = sqliteTable("github_events", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  repo: text("repo"),
  title: text("title"),
  url: text("url"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }),
  raw: text("raw"),
}, (t) => [index("gh_events_created_idx").on(t.createdAt)]);

/**
 * 1:1 meeting notes (e.g. with your manager).
 */
export const oneOnOnes = sqliteTable("one_on_ones", {
  id: text("id").primaryKey().$defaultFn(uuid),
  person: text("person"),
  date: integer("date", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
}, (t) => [index("oneonone_date_idx").on(t.date)]);

/**
 * Feedback / kudos received — can be promoted into a brag-sheet entry.
 */
export const feedback = sqliteTable("feedback", {
  id: text("id").primaryKey().$defaultFn(uuid),
  source: text("source"),
  date: integer("date", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
  content: text("content").notNull(),
  // praise | constructive | other
  kind: text("kind").notNull().default("praise"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
}, (t) => [index("feedback_date_idx").on(t.date)]);

/**
 * Quick-capture inbox: raw notes dropped in with one keystroke, categorized and
 * enriched by AI, then reviewed and filed into the right section later.
 */
export const inboxItems = sqliteTable(
  "inbox_items",
  {
    id: text("id").primaryKey().$defaultFn(uuid),
    text: text("text").notNull(),
    // pending | filed | dismissed
    status: text("status").notNull().default("pending"),
    // AI enrichment state: idle | loading | done | error
    aiState: text("ai_state").notNull().default("idle"),
    // suggested target: win | task | event | goal | feedback | milestone
    category: text("category"),
    title: text("title"),
    details: text("details"),
    // small | medium | large (wins only)
    size: text("size"),
    tags: text("tags"), // JSON string array
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(now),
  },
  (t) => [index("inbox_status_idx").on(t.status, t.createdAt)],
);

/**
 * Generic bidirectional links between any two items (Obsidian-style backlinks).
 * A single row represents one edge; backlinks are found by querying either end.
 */
export const links = sqliteTable(
  "links",
  {
    id: text("id").primaryKey().$defaultFn(uuid),
    sourceType: text("source_type").notNull(),
    sourceId: text("source_id").notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(now),
  },
  (t) => [
    index("links_source_idx").on(t.sourceType, t.sourceId),
    index("links_target_idx").on(t.targetType, t.targetId),
  ],
);

/**
 * One journal entry per calendar day (the Obsidian-style "daily note").
 */
export const dailyNotes = sqliteTable("daily_notes", {
  date: text("date").primaryKey(), // YYYY-MM-DD
  notes: text("notes"),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(now),
});

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type InboxItem = typeof inboxItems.$inferSelect;
export type NewInboxItem = typeof inboxItems.$inferInsert;
export type Link = typeof links.$inferSelect;
export type DailyNote = typeof dailyNotes.$inferSelect;
export type GithubPr = typeof githubPrs.$inferSelect;
export type GithubActivity = typeof githubActivity.$inferSelect;
export type GithubEvent = typeof githubEvents.$inferSelect;
export type OneOnOne = typeof oneOnOnes.$inferSelect;
export type NewOneOnOne = typeof oneOnOnes.$inferInsert;
export type Feedback = typeof feedback.$inferSelect;
export type NewFeedback = typeof feedback.$inferInsert;
export type JiraIssue = typeof jiraIssues.$inferSelect;
export type BragEntry = typeof bragEntries.$inferSelect;
export type NewBragEntry = typeof bragEntries.$inferInsert;
export type PromotionMilestone = typeof promotionMilestones.$inferSelect;
export type NewPromotionMilestone = typeof promotionMilestones.$inferInsert;
export type CareerGoal = typeof careerGoals.$inferSelect;
export type NewCareerGoal = typeof careerGoals.$inferInsert;
export type VisionItem = typeof visionItems.$inferSelect;
export type NewVisionItem = typeof visionItems.$inferInsert;
export type TimelineEvent = typeof timelineEvents.$inferSelect;
export type NewTimelineEvent = typeof timelineEvents.$inferInsert;
export type AppSetting = typeof appSettings.$inferSelect;
