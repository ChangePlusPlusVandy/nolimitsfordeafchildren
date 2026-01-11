import React from "react";
import type { Teacher } from "../pages/mockdata";
import Button from "./Button";

const TeacherAssignments = ({
  teachers,
  onRemove,
}: {
  teachers: Teacher[];
  onRemove: (id: string) => void;
}) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
    {teachers.map((teacher) => (
      <div
        key={teacher.id}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: 12,
          border: "1px solid #e5e7eb",
          borderRadius: 8,
        }}
      >
        <div>
          <div style={{ fontWeight: 600, color: "#111827" }}>
            {teacher.name}
          </div>
        </div>
        <Button
          onClick={() => onRemove(teacher.id)}
          color="#dc2626"
          variant="outline"
        >
          Remove
        </Button>
      </div>
    ))}
  </div>
);

export default TeacherAssignments;
