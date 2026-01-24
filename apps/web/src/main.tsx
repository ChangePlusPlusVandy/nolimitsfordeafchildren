import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/index.css";
import { BrowserRouter, Route, Routes, Navigate } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./auth";

// Layouts & Guards
import DashboardLayout from "./domains/global/layouts/DashboardLayout.tsx";
import AuthGuard from "./domains/global/components/AuthGuard.tsx";

// Pages
import UserDetailsPage from "./domains/users/pages/UserDetailsPage.tsx";
import ManageUsersPage from "./domains/users/pages/ManageUsersPage.tsx";
import MyProfilePage from "./domains/users/pages/MyProfilePage.tsx";
import LocationDetailsPage from "./domains/locations/pages/LocationDetailsPage.tsx";
import MyDayPage from "./domains/teachers/pages/MyDayPage.tsx";
import TeacherDetailsPage from "./domains/teachers/pages/TeacherDetailsPage.tsx";
import StudentDetailsPage from "./domains/students/pages/StudentDetailsPage.tsx";
import MyStudentsPage from "./domains/parents/pages/MyStudentsPage.tsx";
import BulletinBoardPage from "./domains/bulletin/pages/BulletinBoardPage.tsx";
import LocationsIndexPage from "./domains/locations/pages/LocationsIndexPage.tsx";
import NewLocationPage from "./domains/locations/pages/NewLocationPage.tsx";
import EditLocationPage from "./domains/locations/pages/EditLocationPage.tsx";
import NewTeacherPage from "./domains/teachers/pages/NewTeacherPage.tsx";
import InviteUserModal from "./domains/users/pages/InviteUserModal.tsx";
import LinkTeacherModal from "./domains/students/pages/LinkTeacherModal.tsx";
import UploadDocumentModal from "./domains/students/pages/UploadDocumentModal.tsx";
import TeacherScheduleWizardPage from "./domains/teachers/pages/TeacherScheduleWizardPage.tsx";
import NewStudentPage from "./domains/students/pages/NewStudentPage.tsx";
import TeacherStudentDetailsPage from "./domains/teachers/pages/TeacherStudentDetailsPage.tsx";
import ChildDetailsPage from "./domains/parents/pages/ChildDetailsPage.tsx";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthGuard>
          <Routes>
            <Route element={<DashboardLayout />}>
              <Route path="/" element={<Navigate to="/my-day" replace />} />
              <Route path="/users" element={<ManageUsersPage />} />
              <Route path="/users/:id" element={<UserDetailsPage />} />
              <Route path="/my-profile" element={<MyProfilePage />} />
              <Route path="/users/invite" element={<InviteUserModal />} />
              <Route path="/locations" element={<LocationsIndexPage />} />
              <Route path="/locations/new" element={<NewLocationPage />} />
              <Route
                path="/locations/:siteId"
                element={<LocationDetailsPage />}
              />
              <Route
                path="/locations/:siteId/edit"
                element={<EditLocationPage />}
              />
              <Route
                path="/teachers"
                element={<Navigate to="/my-day" replace />}
              />
              <Route path="/teachers/new" element={<NewTeacherPage />} />
              <Route path="/my-day" element={<MyDayPage />} />
              <Route path="/teachers/:id" element={<TeacherDetailsPage />} />
              <Route
                path="/teachers/:id/schedules/new"
                element={<TeacherScheduleWizardPage />}
              />
              <Route
                path="/teachers/students/:id"
                element={<TeacherStudentDetailsPage />}
              />
              <Route path="/students/new" element={<NewStudentPage />} />
              <Route path="/students/:id" element={<StudentDetailsPage />} />
              <Route
                path="/students/:id/link-teacher"
                element={<LinkTeacherModal />}
              />
              <Route
                path="/students/:id/upload"
                element={<UploadDocumentModal />}
              />
              <Route
                path="/parents"
                element={<Navigate to="/my-students" replace />}
              />
              <Route path="/my-students" element={<MyStudentsPage />} />
              <Route
                path="/parents/children/:studentId"
                element={<ChildDetailsPage />}
              />
              <Route path="/bulletin" element={<BulletinBoardPage />} />
            </Route>
          </Routes>
        </AuthGuard>
      </BrowserRouter>
    </QueryClientProvider>
  </AuthProvider>
);
