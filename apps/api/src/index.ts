import "reflect-metadata";
import { createExpressServer, useContainer, type Action } from "routing-controllers";
import express, { type Request, type Response } from "express";
import Container from "typedi";
import { ShowUserEndpoint } from "./domains/users/endpoints/ShowUserEndpoint";
import { PostAuthLoginController, PostAuthLogoutController, PostAuthRefreshController } from "./domains/auth/endpoints/AuthController";
import { GetMeController, PatchMeController } from "./domains/me/endpoints/MeController";
import { DeleteBulletinController, GetBulletinsController, PatchBulletinController, PostBulletinsController } from "./domains/bulletins/endpoints/BulletinsController";
import { GetLocationController, GetLocationsController, PatchLocationController, PostLocationsController } from "./domains/locations/endpoints/LocationsController";
import { GetLocationNowNextController, GetLocationsSummaryMapController } from "./domains/locations/endpoints/LocationsMapController";
import { GetTeacherController, GetTeacherStudentsController, GetTeachersController, PatchTeacherController, PostTeachersController } from "./domains/teachers/endpoints/TeachersController";
import { GetTeachersMeDayController } from "./domains/teachers/endpoints/TeacherMyDayController";
import { PatchSchedulesController, PostTeacherSchedulesController } from "./domains/teachers/endpoints/TeacherSchedulesController";
import { DeleteStudentTeacherController, GetStudentController, GetStudentTeachersController, GetStudentsController, PatchStudentController, PostStudentTeachersController, PostStudentsController } from "./domains/students/endpoints/StudentsController";
import { GetParentsChildDetailController, GetParentsMeChildrenController } from "./domains/parents/endpoints/ParentsController";
import { GetEnrollmentsController, PatchEnrollmentController, PostEnrollmentsController } from "./domains/enrollments/endpoints/EnrollmentsController";
import { GetAttendanceController, PatchAttendanceController, PostAttendanceController } from "./domains/attendance/endpoints/AttendanceController";
import { GetUsersController, PostUsersInviteController, PatchUserController } from "./domains/users/endpoints/UsersController";
import { ProfilesController } from "./domains/profiles/endpoints/ProfilesController";
import { SchedulesController } from "./domains/schedules/endpoints/SchedulesController";
import { SitesController } from "./domains/sites/endpoints/SitesController";
import { StudentParentsAdminController } from "./domains/students/endpoints/StudentParentsAdminController";

useContainer(Container)

export function buildApplication() {
  const app = createExpressServer({
    cors: true,
    controllers: [
      ShowUserEndpoint,
      PostAuthLoginController,
      PostAuthRefreshController,
      PostAuthLogoutController,
      GetMeController,
      PatchMeController,
      GetBulletinsController,
      PostBulletinsController,
      PatchBulletinController,
      DeleteBulletinController,
      GetLocationsController,
      PostLocationsController,
      GetLocationController,
      PatchLocationController,
      GetLocationsSummaryMapController,
      GetLocationNowNextController,
      GetTeachersController,
      PostTeachersController,
      GetTeacherController,
      PatchTeacherController,
      GetTeacherStudentsController,
      GetTeachersMeDayController,
      PostTeacherSchedulesController,
      PatchSchedulesController,
      GetStudentsController,
      PostStudentsController,
      GetStudentController,
      PatchStudentController,
      GetStudentTeachersController,
      PostStudentTeachersController,
      DeleteStudentTeacherController,
      GetParentsMeChildrenController,
      GetParentsChildDetailController,
      GetEnrollmentsController,
      PostEnrollmentsController,
      PatchEnrollmentController,
      GetAttendanceController,
      PostAttendanceController,
      PatchAttendanceController,
      GetUsersController,
      PostUsersInviteController,
      PatchUserController,
      ProfilesController,
      SchedulesController,
      SitesController,
      StudentParentsAdminController
    ],
    middlewares: [],
    currentUserChecker: async (action: Action) => {
      const token = action.request.headers['Authorization'];
      //  const authService = Container.get(AuthService);

      return undefined
    },
    authorizationChecker: async (action: Action, roles: string[]) => {
      const token = action.request.headers['Authorization'];

      return false
    }
  })

  app.use(express.json())

  app.get("/health", (req: Request, res: Response) => {
    res.json({ status: "ok" })
  })

  return app
}