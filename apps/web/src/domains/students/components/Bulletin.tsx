import React from "react";
import type { Bulletin } from "../pages/mockdata";

const Bulletins = ({ bulletins }: { bulletins: Bulletin[] }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
    {bulletins.map((b) => (
      <div
        key={b.id}
        style={{
          padding: 16,
          backgroundColor: "#eff6ff",
          borderLeft: "4px solid #2563eb",
          borderRadius: 4,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 600,
              color: "#111827",
            }}
          >
            {b.title}
          </h3>
          <span style={{ fontSize: 12, color: "#6b7280" }}>{b.date}</span>
        </div>
        <p style={{ margin: 0, fontSize: 14, color: "#374151" }}>{b.message}</p>
      </div>
    ))}
  </div>
);

export default Bulletins;
