"use client";

import { use } from "react";

import StudentDetailView from "@/client/components/students/StudentDetailView";

export default function StudentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return <StudentDetailView studentId={id} mode="admin" backHref="/students" />;
}
