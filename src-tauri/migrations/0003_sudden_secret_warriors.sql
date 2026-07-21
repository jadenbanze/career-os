CREATE TABLE `inbox_items` (
	`id` text PRIMARY KEY NOT NULL,
	`text` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`ai_state` text DEFAULT 'idle' NOT NULL,
	`category` text,
	`title` text,
	`details` text,
	`size` text,
	`tags` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `inbox_status_idx` ON `inbox_items` (`status`,`created_at`);--> statement-breakpoint
ALTER TABLE `brag_entries` ADD `size` text;