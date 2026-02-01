import { useState } from "react";
import type { ScheduleItem } from "../pages/mockdata";

function Schedule({ schedule }: { schedule: ScheduleItem[] }) {
  const [selectedDay, setSelectedDay] = useState("Monday");
  const days = [...new Set(schedule.map((s) => s.day))];
  const daySchedule = schedule.filter((s) => s.day === selectedDay);

  return (
    <div>
      <div
        style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}
      >
        {days.map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: selectedDay === day ? "none" : "1px solid #d1d5db",
              backgroundColor: selectedDay === day ? "#2563eb" : "#f9fafb",
              color: selectedDay === day ? "white" : "#374151",
              fontWeight: 500,
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            {day}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {daySchedule.map((item, idx) => (
          <div
            key={idx}
            style={{
              padding: 16,
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              backgroundColor: "#f9fafb",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "start",
              }}
            >
              <div>
                <div
                  style={{ fontWeight: 600, color: "#111827", marginBottom: 4 }}
                >
                  {item.className}
                </div>
                <div style={{ fontSize: 14, color: "#6b7280" }}>
                  {item.teacher && `${item.teacher} • `}
                  {item.room && `Room ${item.room}`}
                </div>
              </div>
              <span style={{ fontSize: 14, fontWeight: 500, color: "#2563eb" }}>
                {item.time}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Schedule;
