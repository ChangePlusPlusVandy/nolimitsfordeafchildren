import Button from "../Button";

interface AddNoteModalProps {
  noteText: string;
  onChangeText: (text: string) => void;
  onClose: () => void;
  onSave: () => void;
}

function AddNoteModal({ noteText, onChangeText, onClose, onSave }: AddNoteModalProps) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
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
          maxWidth: 500,
          width: "90%",
          boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
        }}
      >
        <h3 style={{ margin: "0 0 16px 0", fontSize: 20, fontWeight: 600 }}>Add Note</h3>
        <textarea
          value={noteText}
          onChange={(e) => onChangeText(e.target.value)}
          rows={5}
          placeholder="Enter your note or comment..."
          style={{
            width: "100%",
            padding: 12,
            border: "1px solid #d1d5db",
            borderRadius: 6,
            fontSize: 14,
            resize: "vertical",
            fontFamily: "inherit",
          }}
        />
        <div
          style={{
            display: "flex",
            gap: 8,
            justifyContent: "flex-end",
            marginTop: 16,
          }}
        >
          <Button onClick={onClose} color="#374151" variant="outline">
            Cancel
          </Button>
          <Button onClick={onSave}>Save Note</Button>
        </div>
      </div>
    </div>
  );
}

export default AddNoteModal;
