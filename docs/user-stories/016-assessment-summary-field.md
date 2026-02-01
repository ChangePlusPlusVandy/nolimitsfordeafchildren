# Story: Add Assessment Summary Field

## User Story
As a teacher, I want to add a summary to an assessment so that important context (e.g., implant changes) is captured.

## Background
Stakeholders requested a summary section for assessments.

## Acceptance Criteria
- Assessment form includes a summary field.
- Summary is shown in assessment history.
- Admins can review summary entries.

## Technical Notes
- Add summary column to assessment entity.
- Update assessment create/update endpoints.

## Suggested Files
- apps/api/src/domains/assessments/models/entities/AssessmentTable.ts
- apps/api/src/domains/assessments/services/AssessmentsService.ts
- apps/web/src/domains/teachers/pages/TeacherStudentDetailsPage.tsx

## Dependencies
- Assessments domain must exist.
