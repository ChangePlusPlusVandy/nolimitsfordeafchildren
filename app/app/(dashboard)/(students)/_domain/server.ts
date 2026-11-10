import { CreateStudentService } from "../_create/service";
import { StudentDetailsService } from "../_detail/service";
import { UpdateStudentService } from "../_edit/service";
import * as guardianSummary from "../_guardian-summary/service";
import * as parents from "../_links/parents/service";
import * as teachers from "../_links/teachers/service";
import * as listing from "../_list/service";
import * as siblings from "../_siblings/service";
import type { LinkParentInput } from "./types";

export type * from "./types";

// Compatibility facade; each use case owns its implementation.
export class StudentsService {
  async index(...args: Parameters<typeof listing.index>) {
    return listing.index(...args);
  }

  async show(...args: Parameters<StudentDetailsService["show"]>) {
    return new StudentDetailsService().show(...args);
  }

  async create(...args: Parameters<CreateStudentService["create"]>) {
    return new CreateStudentService().create(...args);
  }

  async update(...args: Parameters<UpdateStudentService["update"]>) {
    return new UpdateStudentService().update(...args);
  }

  async updateGuardianSummary(...args: Parameters<typeof guardianSummary.updateGuardianSummary>) {
    return guardianSummary.updateGuardianSummary(...args);
  }

  async addSibling(...args: Parameters<typeof siblings.addSibling>) {
    return siblings.addSibling(...args);
  }

  async updateSibling(...args: Parameters<typeof siblings.updateSibling>) {
    return siblings.updateSibling(...args);
  }

  async removeSibling(...args: Parameters<typeof siblings.removeSibling>) {
    return siblings.removeSibling(...args);
  }

  async teachers(...args: Parameters<typeof teachers.teachers>) {
    return teachers.teachers(...args);
  }

  async listLinkableTeachers(...args: Parameters<typeof teachers.listLinkableTeachers>) {
    return teachers.listLinkableTeachers(...args);
  }

  async linkTeacher(...args: Parameters<typeof teachers.linkTeacher>) {
    return teachers.linkTeacher(...args);
  }

  async unlinkTeacher(...args: Parameters<typeof teachers.unlinkTeacher>) {
    return teachers.unlinkTeacher(...args);
  }

  async parents(...args: Parameters<typeof parents.parents>) {
    return parents.parents(...args);
  }

  async linkParent(...args: Parameters<typeof parents.linkParent>) {
    return parents.linkParent(...args);
  }

  async unlinkParent(...args: Parameters<typeof parents.unlinkParent>) {
    return parents.unlinkParent(...args);
  }

  async assignTeacher(
    studentId: string,
    body: { teacher_id: string },
  ): Promise<{ ok: boolean; link_id: string }> {
    return this.linkTeacher(studentId, body.teacher_id);
  }

  async unassignTeacher(studentId: string, teacherId: string): Promise<{ ok: boolean }> {
    return this.unlinkTeacher(studentId, teacherId);
  }

  async addParent(
    studentId: string,
    body: LinkParentInput,
  ): Promise<{ ok: boolean; link_id: string }> {
    return this.linkParent(studentId, body.parent_id, body.relationship, body.is_primary);
  }

  async removeParent(studentId: string, parentId: string): Promise<{ ok: boolean }> {
    return this.unlinkParent(studentId, parentId);
  }
}
