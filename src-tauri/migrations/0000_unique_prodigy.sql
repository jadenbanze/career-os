CREATE TABLE `app_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `brag_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`impact` text,
	`date` integer NOT NULL,
	`tags` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `career_goals` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`category` text,
	`status` text DEFAULT 'active' NOT NULL,
	`target_date` integer,
	`progress` integer DEFAULT 0 NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `jira_issues` (
	`key` text PRIMARY KEY NOT NULL,
	`summary` text NOT NULL,
	`status` text,
	`status_category` text,
	`priority` text,
	`issue_type` text,
	`assignee` text,
	`project` text,
	`url` text,
	`updated` integer,
	`raw` text,
	`synced_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `promotion_milestones` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`target_level` text,
	`status` text DEFAULT 'not_started' NOT NULL,
	`due_date` integer,
	`notes` text,
	`position` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'todo' NOT NULL,
	`priority` text DEFAULT 'medium' NOT NULL,
	`owner` text,
	`due_date` integer,
	`jira_key` text,
	`position` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `timeline_events` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`date` integer NOT NULL,
	`category` text DEFAULT 'personal' NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `vision_items` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`note` text,
	`image_path` text,
	`category` text,
	`position` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL
);
