import { useMutation } from "@tanstack/react-query";
import { useStudentHttpService } from "../services/StudentHttpService";
import { useState } from "react";
import { mockStudent } from "./mockdata";
import type { UserRole, Student, Note, Teacher, Document } from "./mockdata";
import Card from "../components/Card";
import CardHeader from "../components/CardHeader";
import Button from "../components/Button";
import TwoColumnLayout from "../components/TwoColumnLayout";
import Schedule from "../components/Schedule";
import Attendance from "../components/Attendance";
import Bulletins from "../components/Bulletin";
import Notes from "../components/Notes";
import TeacherAssignments from "../components/TeacherAssignments";
import Documents from "../components/Documents";
import AddNoteModal from "../components/modals/AddNoteModal";
import AddTeacherModal from "../components/modals/AddTeacherModal";
import AddDocumentModal from "../components/modals/AddDocumentModal";

export default function StudentDetailsPage() {
  const studentHttpService = useStudentHttpService();
  useMutation({
    mutationKey: [studentHttpService.key, "show"],
    mutationFn: studentHttpService.mutations.show,
    onSuccess: (data) => console.log(data),
    onError: (error) => console.error(error),
  });

  const currentUserRole: UserRole = "admin";
  const [showModal, setShowModal] = useState(false);
  const [newNoteText, setNewNoteText] = useState("");
  const [notes, setNotes] = useState(mockStudent.notes);
  const [teachers, setTeachers] = useState(mockStudent.teachers);
  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false);
  const [newTeacherName, setNewTeacherName] = useState("");
  const [documents, setDocuments] = useState(mockStudent.documents);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const student: Student = mockStudent;

  const handleUploadDocument = (file: File) => {
    setDocuments([
      ...documents,
      {
        id: `d${Date.now()}`,
        name: file.name,
        uploadedBy: "Current User",
        uploadedDate: new Date().toISOString().split("T")[0],
      },
    ]);
    setShowUploadModal(false);
  };

  const handleSaveNote = () => {
    if (newNoteText.trim()) {
      setNotes([
        {
          id: `n${Date.now()}`,
          author: "Current Teacher",
          text: newNoteText,
          date: new Date().toISOString().split("T")[0],
        },
        ...notes,
      ]);
      setNewNoteText("");
      setShowModal(false);
    }
  };
  const handleAddTeacher = (name: string) => {
    if (!name.trim()) return;
    setTeachers([...teachers, { id: `t${Date.now()}`, name }]);
  };

  const handleRemoveTeacher = (teacherId: string) =>
    setTeachers(teachers.filter((t) => t.id !== teacherId));

  return (
    <div>
      <Card style={{ marginBottom: 32 }}>
        <h1
          style={{ margin: 0, fontSize: 32, fontWeight: 700, color: "#111827" }}
        >
          {student.name}
        </h1>
        <p style={{ margin: "8px 0 0 0", fontSize: 16, color: "#6b7280" }}>
          {student.grade}
        </p>
        {currentUserRole === "admin" && (
          <p style={{ margin: "4px 0 0 0", fontSize: 14, color: "#6b7280" }}>
            📍 {student.location}
          </p>
        )}
      </Card>

      {currentUserRole === "parent" && <ParentView student={student} />}
      {currentUserRole === "teacher" && (
        <TeacherView
          student={student}
          notes={notes}
          onAddNote={() => setShowModal(true)}
        />
      )}
      {currentUserRole === "admin" && (
        <AdminView
          student={student}
          teachers={teachers}
          documents={documents}
          onRemoveTeacher={handleRemoveTeacher}
          onOpenAddTeacherModal={() => setShowAddTeacherModal(true)}
          onOpenUploadModal={() => setShowUploadModal(true)}
        />
      )}
      {showUploadModal && (
        <AddDocumentModal
          onClose={() => setShowUploadModal(false)}
          onSave={handleUploadDocument}
        />
      )}
      {showAddTeacherModal && (
        <AddTeacherModal
          name={newTeacherName}
          onChangeName={setNewTeacherName}
          onClose={() => {
            setShowAddTeacherModal(false);
            setNewTeacherName("");
          }}
          onSave={() => {
            handleAddTeacher(newTeacherName);
            setShowAddTeacherModal(false);
            setNewTeacherName("");
          }}
        />
      )}

      {showModal && (
        <AddNoteModal
          noteText={newNoteText}
          onChangeText={setNewNoteText}
          onClose={() => {
            setShowModal(false);
            setNewNoteText("");
          }}
          onSave={handleSaveNote}
        />
      )}
    </div>
  );
}

function ParentView({ student }: { student: Student }) {
  return (
    <TwoColumnLayout
      left={
        <>
          <Card>
            <CardHeader>📅 Weekly Schedule</CardHeader>
            <Schedule schedule={student.schedule} />
          </Card>
          <Card>
            <CardHeader>📢 Bulletins</CardHeader>
            <Bulletins bulletins={student.bulletins} />
          </Card>
        </>
      }
      right={
        <Card>
          <CardHeader>📊 Attendance Summary</CardHeader>
          <Attendance summary={student.attendanceSummary} />
        </Card>
      }
    />
  );
}

function TeacherView({
  student,
  notes,
  onAddNote,
}: {
  student: Student;
  notes: Note[];
  onAddNote: () => void;
}) {
  return (
    <TwoColumnLayout
      left={
        <>
          <Card>
            <CardHeader>📅 Weekly Schedule</CardHeader>
            <Schedule schedule={student.schedule} />
          </Card>
          <Card>
            <CardHeader action={<Button onClick={onAddNote}>Add Note</Button>}>
              📝 Notes & Comments
            </CardHeader>
            <Notes notes={notes} />
          </Card>
        </>
      }
      right={
        <Card>
          <CardHeader>📊 Attendance Summary</CardHeader>
          <Attendance summary={student.attendanceSummary} />
        </Card>
      }
    />
  );
}

function AdminView({
  student,
  teachers,
  documents,
  onRemoveTeacher,
  onOpenAddTeacherModal,
  onOpenUploadModal,
}: {
  student: Student;
  teachers: Teacher[];
  documents: Document[];
  onRemoveTeacher: (id: string) => void;
  onOpenAddTeacherModal: () => void;
  onOpenUploadModal: () => void;
}) {
  return (
    <TwoColumnLayout
      left={
        <>
          <Card>
            <CardHeader>📅 Weekly Schedule</CardHeader>
            <Schedule schedule={student.schedule} />
          </Card>
          <Card>
            <CardHeader
              action={
                <>
                  <Button color="#16a34a" onClick={onOpenAddTeacherModal}>
                    Add Teacher
                  </Button>
                </>
              }
            >
              👥 Assigned Teachers
            </CardHeader>

            <TeacherAssignments
              teachers={teachers}
              onRemove={onRemoveTeacher}
            />
          </Card>
          <Card>
            <CardHeader
              action={<Button onClick={onOpenUploadModal}>Upload</Button>}
            >
              📄 Documents
            </CardHeader>
            <Documents documents={documents} />
          </Card>
        </>
      }
      right={
        <Card>
          <CardHeader>📊 Attendance Summary</CardHeader>
          <Attendance summary={student.attendanceSummary} />
        </Card>
      }
    />
  );
}
