CREATE INDEX `brag_date_idx` ON `brag_entries` (`date`);--> statement-breakpoint
CREATE INDEX `career_created_idx` ON `career_goals` (`created_at`);--> statement-breakpoint
CREATE INDEX `feedback_date_idx` ON `feedback` (`date`);--> statement-breakpoint
CREATE INDEX `gh_events_created_idx` ON `github_events` (`created_at`);--> statement-breakpoint
CREATE INDEX `gh_prs_updated_idx` ON `github_prs` (`updated`);--> statement-breakpoint
CREATE INDEX `jira_updated_idx` ON `jira_issues` (`updated`);--> statement-breakpoint
CREATE INDEX `oneonone_date_idx` ON `one_on_ones` (`date`);--> statement-breakpoint
CREATE INDEX `promo_pos_idx` ON `promotion_milestones` (`position`,`created_at`);--> statement-breakpoint
CREATE INDEX `tasks_pos_idx` ON `tasks` (`position`,`created_at`);--> statement-breakpoint
CREATE INDEX `timeline_date_idx` ON `timeline_events` (`date`);--> statement-breakpoint
CREATE INDEX `vision_pos_idx` ON `vision_items` (`position`,`created_at`);