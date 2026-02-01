import type { Document } from "../pages/mockdata";
import Button from "./Button";

const Documents = ({ documents }: { documents: Document[] }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
    {documents.map((doc) => (
      <div
        key={doc.id}
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
          <div style={{ fontWeight: 600, color: "#111827" }}>{doc.name}</div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>
            By {doc.uploadedBy} on {doc.uploadedDate}
          </div>
        </div>
        <Button color="#2563eb" variant="outline" onClick={() => {}}>
          Download
        </Button>
      </div>
    ))}
  </div>
);

export default Documents;
