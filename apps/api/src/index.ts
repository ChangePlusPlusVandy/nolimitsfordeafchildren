import "reflect-metadata";
import { useExpressServer, useContainer, type Action } from "routing-controllers";
import express, { type Request, type Response } from "express";
import cors from "cors";
import Container from "@/container";
import {
  hasRole,
  createAuthMiddleware,
  errorHandler,
  notFoundHandler,
} from "./domains/auth/middleware";

// Auth Controllers
import {
  PostAuthLoginController,
  PostAuthLogoutController,
  PostAuthRefreshController,
  AuthCallbackController,
  GetAuthMeController,
} from "./domains/auth/endpoints/AuthController";

// User Controllers
import {
  GetUsersController,
  GetUserController,
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
  PostBulletinsController,
  PatchBulletinController,
  DeleteBulletinController,
  PostBulletinAttachmentController,
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
  GetAvailableSchedulesController,
  GetParentScheduleChangeRequestsController,
} from "./domains/schedule-changes/endpoints/ScheduleChangeController";

import { ProfilesController } from "./domains/profiles/endpoints/ProfilesController";
import { SchedulesController } from "./domains/schedules/endpoints/SchedulesController";
import { SitesController } from "./domains/sites/endpoints/SitesController";

// Set up typedi container for routing-controllers
useContainer({
  get: (someClass: any) => Container.get(someClass),
});

export function buildApplication() {
  const allowedOrigins = process.env.CORS_ORIGINS?.split(",") || ["http://localhost:5173"];
  const authDisabled = process.env.AUTH_DISABLED === "true";

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

  // Apply global auth middleware
  // This validates JWT tokens (if present) and loads the user from the database.
  // It does NOT reject unauthenticated requests - that's handled by @Authorized() decorator.
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
      PostAuthLoginController,
      PostAuthRefreshController,
      PostAuthLogoutController,
      AuthCallbackController,
      GetAuthMeController,

      // Me
      GetMeController,
      PatchMeController,

      // Bulletins
      GetBulletinsController,
      GetBulletinController,
      GetBulletinViewsController,
      PostBulletinsController,
      PatchBulletinController,
      DeleteBulletinController,
      PostBulletinAttachmentController,
      DeleteBulletinAttachmentController,

      // Locations (consolidated controller handles all routes with proper ordering)
      LocationsController,

      // Teachers
      GetTeachersController,
      PostTeachersController,
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

      // Enrollments & Attendance
      GetEnrollmentsController,
      PostEnrollmentsController,
      PatchEnrollmentController,
      GetAttendanceController,
      GetAttendanceShowController,
      PostAttendanceController,
      PatchAttendanceController,
      GetStudentAttendanceSummaryController,

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
      GetAvailableSchedulesController,
      GetParentScheduleChangeRequestsController,

      // Users
      GetUsersController,
      GetUserController,
      PostUsersInviteController,
      PatchUserController,
      DeleteUserController,
      PostEnableUserController,

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

      // If auth is disabled, return dev user as fallback
      if (authDisabled) {
        return {
          id: "00000000-0000-0000-0000-000000000000",
          auth0Id: "dev|00000000000000000000000000000000",
          email: "dev@example.com",
          name: "Dev User",
          phone: null,
          locale: "en-US",
          role: "administrator",
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        };
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

      // If auth is disabled, allow all
      if (authDisabled) {
        return true;
      }

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
