CREATE TABLE `daily_notes` (
	`date` text PRIMARY KEY NOT NULL,
	`notes` text,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `links` (
	`id` text PRIMARY KEY NOT NULL,
	`source_type` text NOT NULL,
	`source_id` text NOT NULL,
	`target_type` text NOT NULL,
	`target_id` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `links_source_idx` ON `links` (`source_type`,`source_id`);--> statement-breakpoint
CREATE INDEX `links_target_idx` ON `links` (`target_type`,`target_id`);--> statement-breakpoint
ALTER TABLE `career_goals` ADD `tags` text;--> statement-breakpoint
ALTER TABLE `promotion_milestones` ADD `tags` text;--> statement-breakpoint
ALTER TABLE `timeline_events` ADD `tags` text;