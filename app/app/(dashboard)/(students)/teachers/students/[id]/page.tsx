"use client";

import { use } from "react";

import StudentDetailView from "../../../_detail/StudentDetailView";

export default function TeacherStudentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return <StudentDetailView studentId={id} mode="teacher" backHref="/my-day" />;
}
