import { Get, JsonController, QueryParam, CurrentUser, Authorized } from "routing-controllers";
import { Service } from "typedi";
import Container from "@/container";
import { TeachersService } from "../services/TeachersService";
import type { UserEntity } from "@/db/schema";
import { db } from "@/db";
import { TeacherProfileTable } from "@/db/schema";
import { eq } from "drizzle-orm";

@Service()
@JsonController("/v1")
export class GetTeachersMeDayController {
  private teachersService: TeachersService;
  constructor() {
    this.teachersService = Container.get(TeachersService);
  }

  /**
   * Get today's sessions for the current teacher
   * GET /v1/teachers/me/day
   */
  @Get("/teachers/me/day")
  @Authorized(["teacher"])
  async handle(
    @QueryParam("date") date: string | undefined,
    @CurrentUser({ required: true }) currentUser: UserEntity,
  ) {
    // Get teacher profile for current user
    const teacherProfile = await db
      .select()
      .from(TeacherProfileTable)
      .where(eq(TeacherProfileTable.user_id, currentUser.id))
      .limit(1);

    if (teacherProfile.length === 0) {
      throw new Error("Teacher profile not found for current user");
    }

    return await this.teachersService.myDay({
      date: date,
      teacher_id: teacherProfile[0]!.id,
    });
  }
}
