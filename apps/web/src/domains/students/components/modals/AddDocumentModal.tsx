import { useState } from "react";
import Button from "../Button";

function AddDocumentModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (file: File) => void;
}) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "white",
          padding: 24,
          borderRadius: 8,
          width: 400,
          boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
        }}
      >
        <h3 style={{ marginBottom: 16 }}>Upload Document</h3>

        <div
          style={{
            border: "2px dashed #d1d5db",
            borderRadius: 8,
            padding: 24,
            textAlign: "center",
            marginBottom: 16,
            backgroundColor: "#f9fafb",
          }}
        >
          <input
            type="file"
            id="file-upload"
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            style={{ display: "none" }}
          />
          <label
            htmlFor="file-upload"
            style={{
              display: "inline-block",
              padding: "10px 20px",
              backgroundColor: "#2563eb",
              color: "white",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 500,
              marginBottom: 12,
            }}
          >
            Choose File
          </label>

          {selectedFile ? (
            <p
              style={{
                fontSize: 14,
                color: "#111827",
                margin: "12px 0 0 0",
                fontWeight: 500,
              }}
            >
              📄 {selectedFile.name}
            </p>
          ) : (
            <p style={{ fontSize: 14, color: "#6b7280", margin: "12px 0 0 0" }}>No file selected</p>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Button onClick={onClose} variant="outline" color="#374151">
            Cancel
          </Button>
          <Button onClick={() => selectedFile && onSave(selectedFile)} color="#2563eb">
            Upload
          </Button>
        </div>
      </div>
    </div>
  );
}

export default AddDocumentModal;
