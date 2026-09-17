"use client";

import { useAuth } from "@/client/auth";
import SessionNotes from "@/client/components/students/SessionNotes";

interface NotesSectionProps {
  studentId: string;
  mode: "admin" | "teacher";
}

export default function NotesSection({ studentId, mode }: NotesSectionProps) {
  const { isTeacher } = useAuth();
  const canManage = mode === "teacher" || (mode === "admin" && isTeacher);

  return <SessionNotes studentId={studentId} canAdd={canManage} canEdit={canManage} />;
}
