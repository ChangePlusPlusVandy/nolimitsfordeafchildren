# Story: Clone Assessment for Pre/Post and Recurring Use

## User Story
As a teacher, I want to duplicate an assessment so that I can reuse the same structure for pre/post and recurring assessments.

## Background
Stakeholders requested duplication of assessments to quickly copy pre/post structure.

## Acceptance Criteria
- Assessment list includes a "Clone" action.
- Cloned assessment copies focuses and goals.
- Teacher can edit cloned assessment before saving.

## Technical Notes
- Add clone endpoint on assessments service.
- UI action on assessment history table.

## Suggested Files
- apps/api/src/domains/assessments/services/AssessmentsService.ts
- apps/api/src/domains/assessments/endpoints/AssessmentsController.ts
- apps/web/src/domains/teachers/pages/TeacherStudentDetailsPage.tsx

## Dependencies
- Teaching focus model.
