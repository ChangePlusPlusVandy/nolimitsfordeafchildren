import Button from "../Button";

function AddTeacherModal({
  name,
  onChangeName,
  onClose,
  onSave,
}: {
  name: string;
  onChangeName: (val: string) => void;
  onClose: () => void;
  onSave: () => void;
}) {
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
        <h3 style={{ marginBottom: 16 }}>Add Teacher</h3>

        <input
          value={name}
          onChange={(e) => onChangeName(e.target.value)}
          placeholder="Teacher name"
          style={{
            width: "100%",
            padding: 10,
            border: "1px solid #d1d5db",
            borderRadius: 6,
            marginBottom: 16,
          }}
        />

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Button onClick={onClose} variant="outline" color="#374151">
            Cancel
          </Button>
          <Button onClick={onSave} color="#16a34a">
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}

export default AddTeacherModal;
