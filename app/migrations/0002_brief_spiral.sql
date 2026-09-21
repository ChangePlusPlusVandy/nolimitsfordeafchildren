CREATE UNIQUE INDEX `attendance_student_schedule_date_unique` ON `attendance` (`student_id`,`schedule_id`,`session_date`);--> statement-breakpoint
CREATE INDEX `attendance_schedule_date_idx` ON `attendance` (`schedule_id`,`session_date`);--> statement-breakpoint
CREATE INDEX `attendance_student_date_idx` ON `attendance` (`student_id`,`session_date`);--> statement-breakpoint
CREATE INDEX `chat_messages_channel_created_at_idx` ON `chat_messages` (`channel`,`created_at`);--> statement-breakpoint
CREATE INDEX `documents_entity_idx` ON `documents` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE INDEX `documents_review_status_idx` ON `documents` (`review_status`);--> statement-breakpoint
CREATE INDEX `documents_type_due_date_idx` ON `documents` (`document_type`,`next_due_date`);--> statement-breakpoint
CREATE INDEX `enrollments_student_id_idx` ON `enrollments` (`student_id`);--> statement-breakpoint
CREATE INDEX `enrollments_schedule_id_idx` ON `enrollments` (`schedule_id`);--> statement-breakpoint
CREATE INDEX `parent_student_link_parent_id_idx` ON `parent_student_link` (`parent_id`);--> statement-breakpoint
CREATE INDEX `parent_student_link_student_id_idx` ON `parent_student_link` (`student_id`);--> statement-breakpoint
CREATE INDEX `schedules_teacher_active_idx` ON `schedules` (`teacher_id`,`is_active`);--> statement-breakpoint
CREATE INDEX `schedules_site_id_idx` ON `schedules` (`site_id`);--> statement-breakpoint
CREATE INDEX `schedules_session_id_idx` ON `schedules` (`session_id`);--> statement-breakpoint
CREATE INDEX `sessions_active_start_date_idx` ON `sessions` (`is_active`,`start_date`);--> statement-breakpoint
CREATE INDEX `siblings_student_id_idx` ON `siblings` (`student_id`);--> statement-breakpoint
CREATE INDEX `teacher_student_teacher_id_idx` ON `teacher_student` (`teacher_id`);--> statement-breakpoint
CREATE INDEX `teacher_student_student_id_idx` ON `teacher_student` (`student_id`);