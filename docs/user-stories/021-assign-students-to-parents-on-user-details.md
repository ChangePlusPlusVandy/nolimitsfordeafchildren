# Story: Assign Students to Parents on User Details

## User Story
As an administrator, I want to link students to a parent from the user details page so that account management is centralized.

## Background
Stakeholders requested the ability to assign students to parents from Manage Users / User Details.

## Acceptance Criteria
- Admin can link/unlink students on the user details page.
- Changes reflect on parent and student views.
- Audit log of link changes.

## Technical Notes
- Extend UserDetails endpoint to include linked students.
- Add link/unlink endpoints.

## Suggested Files
- apps/api/src/domains/users/endpoints/ShowUserEndpoint.ts
- apps/api/src/domains/students/endpoints/StudentParentsAdminController.ts
- apps/web/src/domains/users/pages/UserDetailsPage.tsx

## Dependencies
- Parent/student linking must exist.
