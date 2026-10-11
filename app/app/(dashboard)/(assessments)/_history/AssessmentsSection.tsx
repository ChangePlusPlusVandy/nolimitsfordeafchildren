"use client";

import { useAuth } from "@/(auth)/_domain/client";

import AssessmentHistory from "./AssessmentHistory";

interface AssessmentsSectionProps {
  studentId: string;
  mode: "admin" | "teacher";
}

export default function AssessmentsSection({ studentId, mode }: AssessmentsSectionProps) {
  const { isTeacher } = useAuth();
  const canManage = mode === "teacher" || (mode === "admin" && isTeacher);

  return <AssessmentHistory studentId={studentId} canAdd={canManage} canEdit={canManage} />;
}
