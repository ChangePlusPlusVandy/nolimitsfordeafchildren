# Story: Capture Parent Address and Zip Codes for Grant Reporting

## User Story
As an administrator, I want to view parents by zip code so that I can provide accurate grant reporting by location.

## Background
Stakeholders asked for parent zip codes and addresses for grant purposes and reporting.

## Acceptance Criteria
- Parent profile includes address fields and zip code.
- Admin can view a list/report grouped by zip codes.
- Parents can update their own address details.

## Technical Notes
- Extend parent profile schema to include address fields.
- Add admin reporting endpoint and UI list or summary.

## Suggested Files
- apps/api/src/domains/parents/models/entities/ParentTable.ts
- apps/api/src/domains/parents/services/ParentsService.ts
- apps/api/src/domains/parents/endpoints/ParentsController.ts
- apps/web/src/domains/users/pages/MyProfilePage.tsx
- apps/web/src/domains/parents/pages/MyStudentsPage.tsx

## Dependencies
- Auth and role permissions.
