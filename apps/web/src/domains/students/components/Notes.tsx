import type { Note } from "../pages/mockdata";

const Notes = ({ notes }: { notes: Note[] }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
    {notes.map((note) => (
      <div key={note.id} style={{ padding: 16, border: "1px solid #e5e7eb", borderRadius: 8 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <strong style={{ color: "#111827" }}>{note.author}</strong>
          <span style={{ fontSize: 12, color: "#6b7280" }}>{note.date}</span>
        </div>
        <p style={{ margin: 0, fontSize: 14, color: "#374151" }}>{note.text}</p>
      </div>
    ))}
  </div>
);

export default Notes;
