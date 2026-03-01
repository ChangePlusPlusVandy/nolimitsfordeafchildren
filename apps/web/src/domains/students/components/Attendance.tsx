import type { AttendanceSummary } from "../pages/mockdata";

function Attendance({ summary }: { summary: AttendanceSummary }) {
  return (
    <div>
      <div
        style={{
          padding: 16,
          backgroundColor: "#dcfce7",
          border: "1px solid #86efac",
          borderRadius: 8,
          marginBottom: 16,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 28, fontWeight: 700, color: "#15803d" }}>{summary.percentage}</div>
        <div style={{ fontSize: 14, color: "#15803d" }}>Attendance Rate</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        {[
          { val: summary.present, label: "Present", color: "#111827" },
          { val: summary.absent, label: "Absent", color: "#dc2626" },
          { val: summary.late, label: "Late", color: "#ca8a04" },
        ].map(({ val, label, color }) => (
          <div
            key={label}
            style={{
              padding: 12,
              backgroundColor: "#f9fafb",
              borderRadius: 8,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 24, fontWeight: 700, color }}>{val}</div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Attendance;
