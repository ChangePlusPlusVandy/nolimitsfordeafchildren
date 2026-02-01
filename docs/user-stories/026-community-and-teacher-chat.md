# Story: Add Community and Teacher Chat Channels

## User Story
As a teacher, I want a community chat channel so that staff can share announcements and updates quickly.

## Background
Stakeholders suggested a community/teacher chat with announcement toggles.

## Acceptance Criteria
- Teachers can post messages in a shared channel.
- Messages can be promoted to announcements.
- Admins can moderate or delete messages.

## Technical Notes
- Consider using a simple message table with role-scoped access.
- Avoid realtime complexity initially; polling or query refresh.

## Suggested Files
- apps/api/src/domains/chat/models/entities/MessageTable.ts
- apps/api/src/domains/chat/services/ChatService.ts
- apps/api/src/domains/chat/endpoints/ChatController.ts
- apps/web/src/domains/teachers/pages/TeacherChatPage.tsx

## Dependencies
- Auth + role permissions.
