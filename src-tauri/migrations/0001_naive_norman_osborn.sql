CREATE TABLE `feedback` (
	`id` text PRIMARY KEY NOT NULL,
	`source` text,
	`date` integer NOT NULL,
	`content` text NOT NULL,
	`kind` text DEFAULT 'praise' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `github_activity` (
	`date` text PRIMARY KEY NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	`synced_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `github_events` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`repo` text,
	`title` text,
	`url` text,
	`created_at` integer,
	`raw` text
);
--> statement-breakpoint
CREATE TABLE `github_prs` (
	`id` text PRIMARY KEY NOT NULL,
	`number` integer NOT NULL,
	`repo` text NOT NULL,
	`title` text NOT NULL,
	`state` text,
	`role` text NOT NULL,
	`url` text,
	`author_login` text,
	`updated` integer,
	`raw` text,
	`synced_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `one_on_ones` (
	`id` text PRIMARY KEY NOT NULL,
	`person` text,
	`date` integer NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `brag_entries` ADD `links` text;