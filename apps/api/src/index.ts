import "reflect-metadata";
import { useExpressServer, useContainer, type Action } from "routing-controllers";
import express, { type Request, type Response } from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import Container from "@/container";
import { auth } from "@/auth";
import {
  hasRole,
  createAuthMiddleware,
  errorHandler,
  notFoundHandler,
} from "./domains/auth/middleware";

// Auth Controllers
import { GetAuthMeController } from "./domains/auth/endpoints/AuthController";

// User Controllers
import {
  GetUsersController,
  GetUserController,
  PostUserLinkStudentController,
  DeleteUserLinkStudentController,
  PostUsersInviteController,
  PatchUserController,
  DeleteUserController,
  PostEnableUserController,
} from "./domains/users/endpoints/UsersController";

// Me Controllers
import { GetMeController, PatchMeController } from "./domains/me/endpoints/MeController";

// Bulletin Controllers
import {
  GetBulletinsController,
  GetBulletinController,
  GetBulletinViewsController,
  GetBulletinAcknowledgementsController,
  GetBulletinsPendingController,
  PostBulletinsController,
  PatchBulletinController,
  PatchBulletinReviewController,
  DeleteBulletinController,
  PostBulletinAttachmentController,
  PostBulletinAttachmentUploadUrlController,
  PostBulletinAcknowledgeController,
  DeleteBulletinAttachmentController,
} from "./domains/bulletins/endpoints/BulletinsController";

// Location Controllers
import { LocationsController } from "./domains/locations/endpoints/LocationsController";

// Teacher Controllers
import {
  DeleteTeacherLocationController,
  GetTeacherController,
  GetTeacherLocationsController,
  GetTeacherStudentsController,
  GetTeachersController,
  PatchTeacherController,
  PostTeacherLocationController,
  PostTeachersController,
} from "./domains/teachers/endpoints/TeachersController";
import { GetTeachersMeDayController } from "./domains/teachers/endpoints/TeacherMyDayController";
import {
  GetTeacherSickDayNoticesController,
  PostTeacherSickDayNoticeController,
} from "./domains/teachers/endpoints/TeacherSickDayController";
import {
  PatchSchedulesController,
  PostTeacherSchedulesController,
} from "./domains/teachers/endpoints/TeacherSchedulesController";

// Student Controllers
import {
  DeleteStudentTeacherController,
  GetStudentController,
  GetStudentTeachersController,
  GetStudentsController,
  PatchStudentGuardianSummaryController,
  PatchStudentController,
  PostStudentTeachersController,
  PostStudentsController,
  PostStudentSiblingsController,
  PatchSiblingController,
  DeleteSiblingController,
} from "./domains/students/endpoints/StudentsController";
import { StudentParentsAdminController } from "./domains/students/endpoints/StudentParentsAdminController";

// Parent Controllers
import {
  GetParentsChildDetailController,
  GetParentsDirectoryController,
  GetParentsMeChildrenController,
  GetParentsZipReportController,
} from "./domains/parents/endpoints/ParentsController";

// Other Controllers
import {
  GetEnrollmentsController,
  PatchEnrollmentController,
  PostEnrollmentsController,
} from "./domains/enrollments/endpoints/EnrollmentsController";
import {
  GetAttendanceController,
  PatchAttendanceController,
  PostAttendanceController,
  GetAttendanceShowController,
  GetStudentAttendanceSummaryController,
  GetAttendanceSiblingParticipationReportController,
} from "./domains/attendance/endpoints/AttendanceController";

// Document Controllers
import {
  PostDocumentsUploadUrlController,
  PostDocumentsController,
  PatchDocumentReviewController,
  GetDocumentsController,
  GetDocumentController,
  GetDocumentDownloadController,
  DeleteDocumentController,
  GetStudentDocumentsController,
  GetTeacherDocumentsController,
  GetOverdueAudiogramsController,
  GetAudiogramsDueSoonController,
} from "./domains/documents/endpoints/DocumentsController";

import {
  PostPhotoUploadUrlController,
  PostPhotosController,
  GetPhotosController,
  DeletePhotoController,
} from "./domains/photos/endpoints/PhotosController";

// Session Notes Controllers
import {
  GetStudentNotesController,
  PostStudentNotesController,
  GetNoteController,
  PatchNoteController,
  DeleteNoteController,
  GetTeacherNotesController,
} from "./domains/notes/endpoints/SessionNotesController";

// Assessments Controllers
import {
  GetStudentAssessmentsController,
  PostStudentAssessmentsController,
  GetAssessmentController,
  PatchAssessmentController,
  DeleteAssessmentController,
  PostAssessmentCloneController,
} from "./domains/assessments/endpoints/AssessmentsController";

// Makeup Controllers
import {
  PostMakeupRequestController,
  GetMakeupRequestsController,
  GetMakeupRequestController,
  PatchMakeupRequestController,
  PostMakeupSessionController,
  GetTeacherMakeupSessionsController,
  PatchMakeupSessionAttendanceController,
  GetParentMakeupRequestsController,
} from "./domains/makeups/endpoints/MakeupController";

// Schedule Change Controllers
import {
  PostScheduleChangeRequestController,
  GetScheduleChangeRequestsController,
  GetScheduleChangeRequestController,
  PatchScheduleChangeRequestController,
  PatchScheduleChangeTeacherResponseController,
  GetParentScheduleChangeRequestsController,
} from "./domains/schedule-changes/endpoints/ScheduleChangeController";

// Chat Controllers
import {
  GetChatMessagesController,
  PostChatMessageController,
  PatchChatMessageAnnouncementController,
  DeleteChatMessageController,
} from "./domains/chat/endpoints/ChatController";

import { ProfilesController } from "./domains/profiles/endpoints/ProfilesController";
import {
  GetSessionsController,
  GetCurrentSessionController,
  PostSessionsController,
  PatchSessionController,
} from "./domains/sessions/endpoints/SessionsController";
import { SchedulesController } from "./domains/schedules/endpoints/SchedulesController";
import { SitesController } from "./domains/sites/endpoints/SitesController";

// Set up typedi container for routing-controllers
useContainer({
  get: (someClass: any) => Container.get(someClass),
});

export function buildApplication() {
  const allowedOrigins = process.env.CORS_ORIGINS?.split(",") || ["http://localhost:5173"];

  // Create Express app first
  const app = express();

  // Apply CORS middleware
  app.use(
    cors({
      origin: allowedOrigins,
      credentials: true,
    }),
  );

  // Health check endpoint (no auth required)
  app.get("/health", (_req: Request, res: Response) => {
    res.json({ status: "ok" });
  });

  app.all("/api/auth/*splat", toNodeHandler(auth));

  const authMiddleware = createAuthMiddleware();
  app.use(authMiddleware);

  // Set up routing-controllers on the existing Express app
  useExpressServer(app, {
    // Disable class-transformer validation to allow interface types with @QueryParams/@Body
    // This prevents "Cannot read properties of undefined (reading 'prototype')" errors
    classTransformer: false,
    validation: false,
    controllers: [
      // Auth
      GetAuthMeController,

      // Me
      GetMeController,
      PatchMeController,

      // Bulletins
      GetBulletinsController,
      GetBulletinController,
      GetBulletinViewsController,
      GetBulletinAcknowledgementsController,
      GetBulletinsPendingController,
      PostBulletinsController,
      PatchBulletinController,
      PatchBulletinReviewController,
      DeleteBulletinController,
      PostBulletinAttachmentController,
      PostBulletinAttachmentUploadUrlController,
      PostBulletinAcknowledgeController,
      DeleteBulletinAttachmentController,

      // Locations (consolidated controller handles all routes with proper ordering)
      LocationsController,

      // Teachers
      GetTeachersController,
      PostTeachersController,
      GetTeacherSickDayNoticesController,
      PostTeacherSickDayNoticeController,
      GetTeacherController,
      PatchTeacherController,
      GetTeacherStudentsController,
      GetTeacherLocationsController,
      PostTeacherLocationController,
      DeleteTeacherLocationController,
      GetTeachersMeDayController,
      PostTeacherSchedulesController,
      PatchSchedulesController,

      // Students
      GetStudentsController,
      PostStudentsController,
      GetStudentController,
      PatchStudentController,
      PatchStudentGuardianSummaryController,
      GetStudentTeachersController,
      PostStudentTeachersController,
      DeleteStudentTeacherController,
      StudentParentsAdminController,
      PostStudentSiblingsController,
      PatchSiblingController,
      DeleteSiblingController,

      // Parents
      GetParentsMeChildrenController,
      GetParentsChildDetailController,
      GetParentsDirectoryController,
      GetParentsZipReportController,

      // Enrollments & Attendance
      GetEnrollmentsController,
      PostEnrollmentsController,
      PatchEnrollmentController,
      GetAttendanceController,
      GetAttendanceShowController,
      PostAttendanceController,
      PatchAttendanceController,
      GetStudentAttendanceSummaryController,
      GetAttendanceSiblingParticipationReportController,

      // Documents
      PostDocumentsUploadUrlController,
      PostDocumentsController,
      PatchDocumentReviewController,
      GetDocumentsController,
      GetDocumentController,
      GetDocumentDownloadController,
      DeleteDocumentController,
      GetStudentDocumentsController,
      GetTeacherDocumentsController,
      GetOverdueAudiogramsController,
      GetAudiogramsDueSoonController,

      // Photos
      PostPhotoUploadUrlController,
      PostPhotosController,
      GetPhotosController,
      DeletePhotoController,

      // Session Notes
      GetStudentNotesController,
      PostStudentNotesController,
      GetNoteController,
      PatchNoteController,
      DeleteNoteController,
      GetTeacherNotesController,

      // Assessments
      GetStudentAssessmentsController,
      PostStudentAssessmentsController,
      GetAssessmentController,
      PatchAssessmentController,
      DeleteAssessmentController,
      PostAssessmentCloneController,

      // Makeup Requests & Sessions
      PostMakeupRequestController,
      GetMakeupRequestsController,
      GetMakeupRequestController,
      PatchMakeupRequestController,
      PostMakeupSessionController,
      GetTeacherMakeupSessionsController,
      PatchMakeupSessionAttendanceController,
      GetParentMakeupRequestsController,

      // Schedule Change Requests
      PostScheduleChangeRequestController,
      GetScheduleChangeRequestsController,
      GetScheduleChangeRequestController,
      PatchScheduleChangeRequestController,
      PatchScheduleChangeTeacherResponseController,
      GetParentScheduleChangeRequestsController,

      // Chat
      GetChatMessagesController,
      PostChatMessageController,
      PatchChatMessageAnnouncementController,
      DeleteChatMessageController,

      // Users
      GetUsersController,
      GetUserController,
      PostUserLinkStudentController,
      DeleteUserLinkStudentController,
      PostUsersInviteController,
      PatchUserController,
      DeleteUserController,
      PostEnableUserController,

      // Sessions
      GetSessionsController,
      GetCurrentSessionController,
      PostSessionsController,
      PatchSessionController,

      // Other
      ProfilesController,
      SchedulesController,
      SitesController,
    ],
    middlewares: [],

    /**
     * Current user checker - returns the user loaded by global auth middleware.
     * This is called by routing-controllers when @CurrentUser() decorator is used.
     */
    currentUserChecker: async (action: Action) => {
      const req = action.request as Request;

      // User was loaded by global auth middleware
      if (req.currentUser) {
        return req.currentUser;
      }

      return undefined;
    },

    /**
     * Authorization checker - verifies user exists and has required role.
     * This is called by routing-controllers when @Authorized() decorator is used.
     * Returns detailed error info for proper HTTP error responses.
     */
    authorizationChecker: async (action: Action, roles: string[]) => {
      const req = action.request as Request;
      const res = action.response as Response;

      // Check if there was an auth error during middleware processing
      if (req.authError) {
        const { code, message } = req.authError;

        // Determine appropriate HTTP status code
        let statusCode: number;
        switch (code) {
          case "NO_TOKEN":
          case "INVALID_TOKEN":
            statusCode = 401;
            break;
          case "USER_NOT_FOUND":
            statusCode = 401;
            break;
          case "USER_DISABLED":
          case "USER_UNASSIGNED":
            statusCode = 403;
            break;
          default:
            statusCode = 401;
        }

        // Set response headers for error handling
        res.statusCode = statusCode;
        res.setHeader("X-Auth-Error-Code", code);
        res.setHeader("X-Auth-Error-Message", message);

        return false;
      }

      // Get current user
      const user = req.currentUser;

      if (!user) {
        res.statusCode = 401;
        res.setHeader("X-Auth-Error-Code", "NO_TOKEN");
        res.setHeader("X-Auth-Error-Message", "Authentication required");
        return false;
      }

      const isUnassigned = user.role === "unassigned";
      const requestPath = req.path || "";
      const requestMethod = req.method;
      const isAuthEndpoint = requestPath.startsWith("/api/auth");
      const isMeRead = requestMethod === "GET" && (requestPath === "/v1/auth/me" || requestPath === "/v1/me");

      if (isUnassigned && !isAuthEndpoint && !isMeRead) {
        res.statusCode = 403;
        res.setHeader("X-Auth-Error-Code", "USER_UNASSIGNED");
        res.setHeader(
          "X-Auth-Error-Message",
          "Account pending administrator approval before accessing the application",
        );
        return false;
      }

      // If no specific roles required, just check if user exists
      if (roles.length === 0) {
        return true;
      }

      // Check if user has one of the required roles
      const hasRequiredRole = hasRole(user, ...(roles as any));

      if (!hasRequiredRole) {
        res.statusCode = 403;
        res.setHeader("X-Auth-Error-Code", "INSUFFICIENT_ROLE");
        res.setHeader("X-Auth-Error-Message", `Required roles: ${roles.join(", ")}`);
      }

      return hasRequiredRole;
    },

    /**
     * Default error handler for routing-controllers
     */
    defaultErrorHandler: false,
  });

  // Custom error handling middleware (must be after routing-controllers)
  // This provides detailed JSON error responses for auth failures
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
