# Story: Add Parent/Guardian Role to Invite User

## User Story
As an administrator, I want to invite a Parent/Guardian user so that families can access the platform.

## Background
Stakeholders requested a Parent/Guardian role in the invite user flow.

## Acceptance Criteria
- Invite user modal includes Parent/Guardian role.
- Invited user receives correct role assignment.
- Role displayed consistently across user lists.

## Technical Notes
- Ensure role enums include parent/guardian.
- Update Auth0 role mapping if necessary.

## Suggested Files
- apps/api/src/domains/users/models/entities/UserTable.ts
- apps/api/src/domains/users/services/UsersService.ts
- apps/web/src/domains/users/pages/InviteUserModal.tsx

## Dependencies
- Auth0 role configuration.
