export type UserRole = "parent" | "teacher" | "admin";

export type ScheduleItem = {
  day: string;
  className: string;
  time: string;
  teacher?: string;
  room?: string;
};

export type AttendanceSummary = {
  present: number;
  absent: number;
  late: number;
  totalDays: number;
  percentage: string;
};

export type Teacher = { id: string; name: string };
export type Note = { id: string; author: string; text: string; date: string };
export type Bulletin = {
  id: string;
  title: string;
  message: string;
  date: string;
};
export type Document = {
  id: string;
  name: string;
  uploadedBy: string;
  uploadedDate: string;
};

export type Student = {
  id: string;
  name: string;
  grade: string;
  location: string;
  schedule: ScheduleItem[];
  attendanceSummary: AttendanceSummary;
  bulletins: Bulletin[];
  teachers: Teacher[];
  notes: Note[];
  documents: Document[];
};

/* =======================
   Mock Data
======================= */
export const mockStudent: Student = {
  id: "123",
  name: "Jane Doe",
  grade: "5th Grade",
  location: "Room 203, Building A",
  schedule: [
    {
      day: "Monday",
      className: "Math",
      time: "9:00–10:00",
      teacher: "Mr. Smith",
      room: "101",
    },
    {
      day: "Monday",
      className: "Science",
      time: "10:00–11:00",
      teacher: "Ms. Johnson",
      room: "205",
    },
    {
      day: "Monday",
      className: "English",
      time: "11:00–12:00",
      teacher: "Mrs. Davis",
      room: "150",
    },
    {
      day: "Tuesday",
      className: "Math",
      time: "9:00–10:00",
      teacher: "Mr. Smith",
      room: "101",
    },
    {
      day: "Tuesday",
      className: "Art",
      time: "10:00–11:00",
      teacher: "Ms. Chen",
      room: "Studio",
    },
    {
      day: "Wednesday",
      className: "Science",
      time: "9:00–10:00",
      teacher: "Ms. Johnson",
      room: "205",
    },
    {
      day: "Wednesday",
      className: "PE",
      time: "11:00–12:00",
      teacher: "Coach Taylor",
      room: "Gym",
    },
    {
      day: "Thursday",
      className: "Math",
      time: "9:00–10:00",
      teacher: "Mr. Smith",
      room: "101",
    },
    {
      day: "Thursday",
      className: "Music",
      time: "10:00–11:00",
      teacher: "Mr. Wilson",
      room: "Band Room",
    },
    {
      day: "Friday",
      className: "English",
      time: "9:00–10:00",
      teacher: "Mrs. Davis",
      room: "150",
    },
    {
      day: "Friday",
      className: "Assembly",
      time: "11:00–12:00",
      room: "Auditorium",
    },
  ],
  attendanceSummary: {
    present: 45,
    absent: 3,
    late: 2,
    totalDays: 50,
    percentage: "90%",
  },
  bulletins: [
    {
      id: "b1",
      title: "Field Trip Reminder",
      message: "Science museum trip on Friday - permission slip due",
      date: "2026-01-09",
    },
    {
      id: "b2",
      title: "Parent-Teacher Conference",
      message: "Scheduled for January 15th at 3:00 PM",
      date: "2026-01-08",
    },
    {
      id: "b3",
      title: "Homework Reminder",
      message: "Math workbook pages 45-50 due Monday",
      date: "2026-01-07",
    },
  ],
  teachers: [
    { id: "t1", name: "Mr. Smith", subject: "Math" },
    { id: "t2", name: "Ms. Johnson", subject: "Science" },
    { id: "t3", name: "Mrs. Davis", subject: "English" },
    { id: "t4", name: "Ms. Chen", subject: "Art" },
  ],
  notes: [
    {
      id: "n1",
      author: "Mr. Smith",
      text: "Great participation this week in class discussions",
      date: "2026-01-08",
    },
    {
      id: "n2",
      author: "Ms. Johnson",
      text: "Excellent work on the science project presentation",
      date: "2026-01-05",
    },
    {
      id: "n3",
      author: "Mrs. Davis",
      text: "Needs to work on completing reading assignments on time",
      date: "2026-01-03",
    },
  ],
  documents: [
    {
      id: "d1",
      name: "Enrollment_Form.pdf",
      uploadedBy: "Admin Office",
      uploadedDate: "2025-09-01",
    },
    {
      id: "d2",
      name: "Medical_Records.pdf",
      uploadedBy: "School Nurse",
      uploadedDate: "2025-09-05",
    },
    {
      id: "d3",
      name: "Permission_Slip_Field_Trip.pdf",
      uploadedBy: "Ms. Johnson",
      uploadedDate: "2026-01-05",
    },
  ],
};
