import {
  Authorized,
  BadRequestError,
  Body,
  CurrentUser,
  Get,
  JsonController,
  Post,
  QueryParam,
} from "routing-controllers";
import { Service } from "typedi";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import {
  BulletinTable,
  LocationTable,
  TeacherLocationTable,
  TeacherProfileTable,
  TeacherSickDayNoticeTable,
  UserTable,
  type UserEntity,
} from "@/db/schema";
import Container from "@/container";
import { BulletinsService } from "@/domains/bulletins/services/BulletinsService";

@Service()
@JsonController("/v1/teachers/me/sick-day")
export class PostTeacherSickDayNoticeController {
  private readonly bulletinsService: BulletinsService;

  constructor() {
    this.bulletinsService = Container.get(BulletinsService);
  }

  @Post("")
  @Authorized(["teacher"])
  async handle(
    @Body() body: { notice_date?: string; note?: string; site_id?: string },
    @CurrentUser({ required: true }) currentUser: UserEntity,
  ) {
    const teacherProfile = await db
      .select({ id: TeacherProfileTable.id, site_id: TeacherProfileTable.primary_site_id })
      .from(TeacherProfileTable)
      .where(eq(TeacherProfileTable.user_id, currentUser.id))
      .limit(1);

    if (teacherProfile.length === 0) {
      throw new BadRequestError("Teacher profile not found");
    }

    const noticeDate = body.notice_date || new Date().toISOString().split("T")[0]!;
    let siteId = body.site_id || teacherProfile[0]!.site_id;
    if (!siteId) {
      throw new BadRequestError("Teacher must have a primary site to create a sick-day notice");
    }

    if (body.site_id) {
      const assignedSite = await db
        .select({ id: TeacherLocationTable.id })
        .from(TeacherLocationTable)
        .where(
          and(
            eq(TeacherLocationTable.teacher_profile_id, teacherProfile[0]!.id),
            eq(TeacherLocationTable.location_id, body.site_id),
          ),
        )
        .limit(1);

      if (assignedSite.length === 0 && teacherProfile[0]!.site_id !== body.site_id) {
        throw new BadRequestError("Teacher is not assigned to the selected site");
      }

      siteId = body.site_id;
    }

    const existingNotice = await db
      .select({ id: TeacherSickDayNoticeTable.id })
      .from(TeacherSickDayNoticeTable)
      .where(
        and(
          eq(TeacherSickDayNoticeTable.teacher_id, teacherProfile[0]!.id),
          eq(TeacherSickDayNoticeTable.notice_date, noticeDate),
        ),
      )
      .limit(1);

    if (existingNotice.length > 0) {
      throw new BadRequestError("Sick-day notice already exists for this date");
    }

    const teacherUser = await db
      .select({ name: UserTable.name })
      .from(UserTable)
      .where(eq(UserTable.id, currentUser.id))
      .limit(1);

    const title = `Teacher sick-day notice: ${teacherUser[0]?.name ?? "Teacher"} (${noticeDate})`;
    const bulletin = await this.bulletinsService.create(
      {
        title,
        body:
          body.note?.trim() ||
          `Teacher is out sick on ${noticeDate}. Please watch for updates about session changes.`,
        scope: "site",
        site_id: siteId,
        role_target: "parent",
        requires_approval: false,
      },
      currentUser.id,
      "teacher",
    );

    const [notice] = await db
      .insert(TeacherSickDayNoticeTable)
      .values({
        teacher_id: teacherProfile[0]!.id,
        site_id: siteId,
        notice_date: noticeDate,
        note: body.note?.trim() || null,
        bulletin_id: bulletin.id,
        created_by: currentUser.id,
      })
      .returning();

    return notice;
  }
}

@Service()
@JsonController("/v1/admin/teacher-sick-day-notices")
export class GetTeacherSickDayNoticesController {
  @Get("")
  @Authorized(["administrator"])
  async handle(@QueryParam("from") from?: string, @QueryParam("to") to?: string) {
    const conditions = [];
    if (from) {
      conditions.push(gte(TeacherSickDayNoticeTable.notice_date, from));
    }
    if (to) {
      conditions.push(lte(TeacherSickDayNoticeTable.notice_date, to));
    }

    const rows = await db
      .select({
        id: TeacherSickDayNoticeTable.id,
        notice_date: TeacherSickDayNoticeTable.notice_date,
        note: TeacherSickDayNoticeTable.note,
        bulletin_id: TeacherSickDayNoticeTable.bulletin_id,
        created_at: TeacherSickDayNoticeTable.created_at,
        teacher_id: TeacherProfileTable.id,
        teacher_name: UserTable.name,
        site_id: TeacherSickDayNoticeTable.site_id,
        site_name: LocationTable.name,
        bulletin_title: BulletinTable.title,
      })
      .from(TeacherSickDayNoticeTable)
      .innerJoin(TeacherProfileTable, eq(TeacherSickDayNoticeTable.teacher_id, TeacherProfileTable.id))
      .innerJoin(UserTable, eq(TeacherProfileTable.user_id, UserTable.id))
      .innerJoin(LocationTable, eq(TeacherSickDayNoticeTable.site_id, LocationTable.id))
      .leftJoin(BulletinTable, eq(TeacherSickDayNoticeTable.bulletin_id, BulletinTable.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(TeacherSickDayNoticeTable.notice_date), desc(TeacherSickDayNoticeTable.created_at));

    return {
      items: rows,
    };
  }
}
