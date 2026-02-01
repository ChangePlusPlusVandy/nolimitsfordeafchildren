# Story: Support Multiple Teaching Focuses per Assessment

## User Story
As a teacher, I want to record multiple teaching focuses with goals and scores so that assessment results are more detailed.

## Background
Stakeholders want 3–4 teaching focuses per assessment, each with goal text and score/maximum.

## Acceptance Criteria
- Assessment form allows multiple teaching focus entries.
- Each focus captures goal text, score earned, and maximum score.
- Assessment table shows focus summaries.

## Technical Notes
- Add TeachingFocus child entity (assessment_id, goal, score, max_score).
- Allow admin-configured focus templates (optional).

## Suggested Files
- apps/api/src/domains/assessments/models/entities/TeachingFocusTable.ts
- apps/api/src/domains/assessments/services/AssessmentsService.ts
- apps/web/src/domains/teachers/pages/TeacherStudentDetailsPage.tsx

## Dependencies
- Assessment summary field (story 016).
