CREATE TABLE `assessment_focuses` (
	`id` text PRIMARY KEY NOT NULL,
	`assessment_id` text NOT NULL,
	`goal` text NOT NULL,
	`score` integer NOT NULL,
	`max_score` integer NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`assessment_id`) REFERENCES `assessments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `assessments` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`teacher_id` text NOT NULL,
	`cycle_start_date` text NOT NULL,
	`assessment_type` text NOT NULL,
	`teaching_focus` text NOT NULL,
	`summary` text,
	`score` integer NOT NULL,
	`notes` text,
	`assessed_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`teacher_id`) REFERENCES `teacher_profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `assessments_student_cycle_type_idx` ON `assessments` (`student_id`,`cycle_start_date`,`assessment_type`);--> statement-breakpoint
CREATE INDEX `assessments_student_cycle_idx` ON `assessments` (`student_id`,`cycle_start_date`);--> statement-breakpoint
CREATE TABLE `attendance_sibling_participants` (
	`id` text PRIMARY KEY NOT NULL,
	`attendance_id` text NOT NULL,
	`sibling_id` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`attendance_id`) REFERENCES `attendance`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`sibling_id`) REFERENCES `siblings`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `attendance_sibling_participants_attendance_id_sibling_id_idx` ON `attendance_sibling_participants` (`attendance_id`,`sibling_id`);--> statement-breakpoint
CREATE INDEX `attendance_sibling_participants_sibling_id_idx` ON `attendance_sibling_participants` (`sibling_id`);--> statement-breakpoint
CREATE TABLE `attendance` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`schedule_id` text NOT NULL,
	`session_date` text NOT NULL,
	`status` text NOT NULL,
	`late_minutes` integer,
	`reason` text,
	`reason_text` text,
	`marked_by` text NOT NULL,
	`marked_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`schedule_id`) REFERENCES `schedules`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`marked_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `auth_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `auth_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `auth_accounts_provider_account_unique` ON `auth_accounts` (`provider_id`,`account_id`);--> statement-breakpoint
CREATE TABLE `auth_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `auth_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `auth_sessions_token_unique` ON `auth_sessions` (`token`);--> statement-breakpoint
CREATE TABLE `auth_users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text collate nocase NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `auth_users_email_unique` ON `auth_users` (`email`);--> statement-breakpoint
CREATE TABLE `auth_verifications` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `bulletin_acknowledgements` (
	`id` text PRIMARY KEY NOT NULL,
	`bulletin_id` text NOT NULL,
	`user_id` text NOT NULL,
	`initials` text NOT NULL,
	`acknowledged_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`bulletin_id`) REFERENCES `bulletins`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bulletin_acknowledgements_bulletin_id_user_id_idx` ON `bulletin_acknowledgements` (`bulletin_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `bulletin_attachments` (
	`id` text PRIMARY KEY NOT NULL,
	`bulletin_id` text NOT NULL,
	`file_url` text NOT NULL,
	`file_name` text NOT NULL,
	`file_size` integer,
	`mime_type` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`bulletin_id`) REFERENCES `bulletins`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `bulletins` (
	`id` text PRIMARY KEY NOT NULL,
	`site_id` text,
	`scope` text DEFAULT 'global' NOT NULL,
	`role_target` text DEFAULT 'all' NOT NULL,
	`requires_approval` integer DEFAULT false NOT NULL,
	`approval_status` text DEFAULT 'approved' NOT NULL,
	`title` text NOT NULL,
	`body` text,
	`requires_initials` integer DEFAULT false NOT NULL,
	`publish_at` integer,
	`expire_at` integer,
	`reviewed_by` text,
	`reviewed_at` integer,
	`review_notes` text,
	`created_by` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`site_id`) REFERENCES `locations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `bulletins_approval_status_created_at_idx` ON `bulletins` (`approval_status`,`created_at`);--> statement-breakpoint
CREATE TABLE `bulletin_views` (
	`id` text PRIMARY KEY NOT NULL,
	`bulletin_id` text NOT NULL,
	`user_id` text NOT NULL,
	`viewed_at` integer NOT NULL,
	`last_viewed_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`bulletin_id`) REFERENCES `bulletins`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bulletin_views_bulletin_id_user_id_idx` ON `bulletin_views` (`bulletin_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `chat_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`channel` text DEFAULT 'community' NOT NULL,
	`message` text NOT NULL,
	`is_announcement` integer DEFAULT false NOT NULL,
	`created_by` text NOT NULL,
	`deleted_at` integer,
	`deleted_by` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`deleted_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` text PRIMARY KEY NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`document_type` text NOT NULL,
	`file_url` text NOT NULL,
	`file_name` text NOT NULL,
	`file_size` integer,
	`mime_type` text,
	`document_date` text,
	`next_due_date` text,
	`review_status` text DEFAULT 'approved' NOT NULL,
	`reviewed_by` text,
	`reviewed_at` integer,
	`review_notes` text,
	`session_date` text,
	`session_type` text,
	`uploaded_by` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `enrollments` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`schedule_id` text NOT NULL,
	`enrolled_at` integer NOT NULL,
	`ended_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`schedule_id`) REFERENCES `schedules`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `locations` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`address_line1` text NOT NULL,
	`address_line2` text,
	`city` text NOT NULL,
	`state` text NOT NULL,
	`postal_code` text NOT NULL,
	`country` text DEFAULT 'USA' NOT NULL,
	`latitude` real,
	`longitude` real,
	`timezone` text DEFAULT 'America/Los_Angeles' NOT NULL,
	`zoom_link` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `locations_active_name_idx` ON `locations` (`is_active`,`name`);--> statement-breakpoint
CREATE INDEX `locations_type_idx` ON `locations` (`type`);--> statement-breakpoint
CREATE INDEX `locations_created_at_idx` ON `locations` (`created_at`);--> statement-breakpoint
CREATE TABLE `makeup_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`original_session_date` text NOT NULL,
	`original_schedule_id` text NOT NULL,
	`reason` text NOT NULL,
	`reason_text` text,
	`preferred_dates` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`requested_by` text NOT NULL,
	`requested_at` integer NOT NULL,
	`reviewed_by` text,
	`reviewed_at` integer,
	`review_notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`original_schedule_id`) REFERENCES `schedules`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`requested_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `makeup_requests_status_requested_at_idx` ON `makeup_requests` (`status`,`requested_at`);--> statement-breakpoint
CREATE INDEX `makeup_requests_student_id_idx` ON `makeup_requests` (`student_id`);--> statement-breakpoint
CREATE INDEX `makeup_requests_original_schedule_id_idx` ON `makeup_requests` (`original_schedule_id`);--> statement-breakpoint
CREATE TABLE `makeup_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`makeup_request_id` text,
	`student_id` text NOT NULL,
	`teacher_id` text NOT NULL,
	`site_id` text NOT NULL,
	`scheduled_date` text NOT NULL,
	`scheduled_time` text NOT NULL,
	`attendance_status` text,
	`notes` text,
	`created_by` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`makeup_request_id`) REFERENCES `makeup_requests`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`teacher_id`) REFERENCES `teacher_profiles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`site_id`) REFERENCES `locations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `makeup_sessions_makeup_request_id_created_at_idx` ON `makeup_sessions` (`makeup_request_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `makeup_sessions_teacher_date_idx` ON `makeup_sessions` (`teacher_id`,`scheduled_date`);--> statement-breakpoint
CREATE TABLE `parent_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`address_line1` text,
	`address_line2` text,
	`city` text,
	`state` text,
	`postal_code` text,
	`household_notes` text,
	`preferred_contact_method` text DEFAULT 'email' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `parent_profiles_user_id_unique` ON `parent_profiles` (`user_id`);--> statement-breakpoint
CREATE TABLE `parent_student_link` (
	`id` text PRIMARY KEY NOT NULL,
	`parent_id` text NOT NULL,
	`student_id` text NOT NULL,
	`relationship` text,
	`is_primary` integer DEFAULT false NOT NULL,
	`linked_at` integer NOT NULL,
	`revoked_at` integer,
	FOREIGN KEY (`parent_id`) REFERENCES `parent_profiles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `photos` (
	`id` text PRIMARY KEY NOT NULL,
	`location_id` text NOT NULL,
	`student_id` text,
	`session_date` text NOT NULL,
	`caption` text,
	`file_url` text NOT NULL,
	`file_name` text NOT NULL,
	`file_size` integer,
	`mime_type` text,
	`uploaded_by` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `photos_location_session_created_idx` ON `photos` (`location_id`,`session_date`,`created_at`);--> statement-breakpoint
CREATE INDEX `photos_student_session_created_idx` ON `photos` (`student_id`,`session_date`,`created_at`);--> statement-breakpoint
CREATE TABLE `schedule_change_request_events` (
	`id` text PRIMARY KEY NOT NULL,
	`schedule_change_request_id` text NOT NULL,
	`event_type` text NOT NULL,
	`from_status` text,
	`to_status` text,
	`actor_user_id` text NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`schedule_change_request_id`) REFERENCES `schedule_change_requests`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `schedule_change_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`current_schedule_id` text NOT NULL,
	`requested_schedule_id` text,
	`preferred_times` text,
	`flexibility_notes` text,
	`reason` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`requested_by` text NOT NULL,
	`teacher_response_status` text,
	`teacher_response_notes` text,
	`teacher_responded_by` text,
	`teacher_responded_at` integer,
	`requested_at` integer NOT NULL,
	`reviewed_by` text,
	`reviewed_at` integer,
	`review_notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`current_schedule_id`) REFERENCES `schedules`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`requested_schedule_id`) REFERENCES `schedules`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`requested_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`teacher_responded_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `schedule_change_requests_status_requested_at_idx` ON `schedule_change_requests` (`status`,`requested_at`);--> statement-breakpoint
CREATE INDEX `schedule_change_requests_student_id_idx` ON `schedule_change_requests` (`student_id`);--> statement-breakpoint
CREATE INDEX `schedule_change_requests_current_schedule_id_idx` ON `schedule_change_requests` (`current_schedule_id`);--> statement-breakpoint
CREATE INDEX `schedule_change_requests_requested_schedule_id_idx` ON `schedule_change_requests` (`requested_schedule_id`);--> statement-breakpoint
CREATE TABLE `schedules` (
	`id` text PRIMARY KEY NOT NULL,
	`teacher_id` text NOT NULL,
	`site_id` text NOT NULL,
	`session_id` text,
	`day_of_week_mask` integer NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`cycle_start_date` text NOT NULL,
	`cycle_end_date` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`teacher_id`) REFERENCES `teacher_profiles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`site_id`) REFERENCES `locations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `session_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`teacher_id` text NOT NULL,
	`schedule_id` text,
	`session_date` text,
	`note` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`teacher_id`) REFERENCES `teacher_profiles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`schedule_id`) REFERENCES `schedules`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `session_notes_student_created_at_idx` ON `session_notes` (`student_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `session_notes_teacher_created_at_idx` ON `session_notes` (`teacher_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`is_archived` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `siblings` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`name` text NOT NULL,
	`age` integer,
	`relationship` text NOT NULL,
	`is_participant` integer DEFAULT true NOT NULL,
	`has_hearing_loss` integer DEFAULT false NOT NULL,
	`photo_url` text,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `students` (
	`id` text PRIMARY KEY NOT NULL,
	`site_id` text NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`initials` text NOT NULL,
	`photo_url` text,
	`dob` text NOT NULL,
	`current_school` text,
	`preferred_language` text DEFAULT 'English' NOT NULL,
	`hearing_devices` text DEFAULT '[]' NOT NULL,
	`hearing_loss_type` text,
	`guardian_summary` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`site_id`) REFERENCES `locations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `students_site_active_initials_idx` ON `students` (`site_id`,`is_active`,`initials`);--> statement-breakpoint
CREATE INDEX `students_created_at_idx` ON `students` (`created_at`);--> statement-breakpoint
CREATE TABLE `teacher_locations` (
	`id` text PRIMARY KEY NOT NULL,
	`teacher_profile_id` text NOT NULL,
	`location_id` text NOT NULL,
	`assigned_at` integer NOT NULL,
	FOREIGN KEY (`teacher_profile_id`) REFERENCES `teacher_profiles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `teacher_locations_teacher_profile_id_location_id_idx` ON `teacher_locations` (`teacher_profile_id`,`location_id`);--> statement-breakpoint
CREATE INDEX `teacher_locations_location_id_idx` ON `teacher_locations` (`location_id`);--> statement-breakpoint
CREATE TABLE `teacher_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`primary_site_id` text,
	`bio` text,
	`photo_url` text,
	`qualifications` text,
	`credentials` text,
	`age_group_specialty` text DEFAULT 'all_ages',
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`primary_site_id`) REFERENCES `locations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `teacher_profiles_user_id_unique` ON `teacher_profiles` (`user_id`);--> statement-breakpoint
CREATE TABLE `teacher_sick_day_notices` (
	`id` text PRIMARY KEY NOT NULL,
	`teacher_id` text NOT NULL,
	`site_id` text NOT NULL,
	`notice_date` text NOT NULL,
	`note` text,
	`bulletin_id` text,
	`created_by` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`teacher_id`) REFERENCES `teacher_profiles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`site_id`) REFERENCES `locations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`bulletin_id`) REFERENCES `bulletins`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `teacher_sick_day_notices_teacher_date_idx` ON `teacher_sick_day_notices` (`teacher_id`,`notice_date`);--> statement-breakpoint
CREATE INDEX `teacher_sick_day_notices_site_date_idx` ON `teacher_sick_day_notices` (`site_id`,`notice_date`);--> statement-breakpoint
CREATE TABLE `teacher_student` (
	`id` text PRIMARY KEY NOT NULL,
	`teacher_id` text NOT NULL,
	`student_id` text NOT NULL,
	`assigned_at` integer NOT NULL,
	`unassigned_at` integer,
	FOREIGN KEY (`teacher_id`) REFERENCES `teacher_profiles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`auth_user_id` text,
	`email` text collate nocase NOT NULL,
	`name` text NOT NULL,
	`phone` text,
	`photo_url` text,
	`locale` text DEFAULT 'en-US' NOT NULL,
	`role` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_auth_user_id_unique` ON `users` (`auth_user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);