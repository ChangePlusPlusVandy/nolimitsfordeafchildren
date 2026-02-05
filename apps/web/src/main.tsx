import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/index.css";
import { BrowserRouter, Route, Routes, Navigate } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./auth";

// Layouts & Guards
import DashboardLayout from "./domains/global/layouts/DashboardLayout.tsx";
import AuthGuard from "./domains/global/components/AuthGuard.tsx";
import RoleBasedRedirect from "./domains/global/components/RoleBasedRedirect.tsx";
import RoleGuard from "./domains/global/components/RoleGuard.tsx";
import ErrorBoundary from "./domains/global/components/ErrorBoundary.tsx";
import { ToastProvider } from "./domains/global/components/ToastProvider.tsx";

// Pages
import UserDetailsPage from "./domains/users/pages/UserDetailsPage.tsx";
import ManageUsersPage from "./domains/users/pages/ManageUsersPage.tsx";
import MyProfilePage from "./domains/users/pages/MyProfilePage.tsx";
import LocationDetailsPage from "./domains/locations/pages/LocationDetailsPage.tsx";
import MyDayPage from "./domains/teachers/pages/MyDayPage.tsx";
import TeacherDetailsPage from "./domains/teachers/pages/TeacherDetailsPage.tsx";
import StudentDetailsPage from "./domains/students/pages/StudentDetailsPage.tsx";
import StudentsIndexPage from "./domains/students/pages/StudentsIndexPage.tsx";
import MyStudentsPage from "./domains/parents/pages/MyStudentsPage.tsx";
import BulletinBoardPage from "./domains/bulletin/pages/BulletinBoardPage.tsx";
import LocationsIndexPage from "./domains/locations/pages/LocationsIndexPage.tsx";
import NewLocationPage from "./domains/locations/pages/NewLocationPage.tsx";
import EditLocationPage from "./domains/locations/pages/EditLocationPage.tsx";
import NewTeacherPage from "./domains/teachers/pages/NewTeacherPage.tsx";
import EditTeacherPage from "./domains/teachers/pages/EditTeacherPage.tsx";
import TeacherScheduleWizardPage from "./domains/teachers/pages/TeacherScheduleWizardPage.tsx";
import TeacherStudentDetailsPage from "./domains/teachers/pages/TeacherStudentDetailsPage.tsx";
import EditStudentPage from "./domains/students/pages/EditStudentPage.tsx";
import ChildDetailsPage from "./domains/parents/pages/ChildDetailsPage.tsx";
import BrowseSchedulesPage from "./domains/parents/pages/BrowseSchedulesPage.tsx";
import MyRequestsPage from "./domains/parents/pages/MyRequestsPage.tsx";
import MakeupRequestsPage from "./domains/admin/pages/MakeupRequestsPage.tsx";
import ScheduleChangeRequestsPage from "./domains/admin/pages/ScheduleChangeRequestsPage.tsx";
import MakeupSessionsPage from "./domains/teachers/pages/MakeupSessionsPage.tsx";

import { ThemeProvider, CssBaseline } from "@mui/material";
import { theme } from "./theme";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <BrowserRouter>
              <AuthGuard>
                <ThemeProvider theme={theme}>
                  <CssBaseline />
                  <Routes>
                    <Route element={<DashboardLayout />}>
                      <Route path="/" element={<RoleBasedRedirect />} />
                      <Route path="/users" element={<ManageUsersPage />} />
                      <Route path="/users/:id" element={<UserDetailsPage />} />
                      <Route path="/my-profile" element={<MyProfilePage />} />
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
                      <Route
                        path="/my-day"
                        element={
                          <RoleGuard allowedRoles={["teacher", "administrator"]}>
                            <MyDayPage />
                          </RoleGuard>
                        }
                      />
                      <Route path="/teachers/:id" element={<TeacherDetailsPage />} />
                      <Route
                        path="/teachers/:id/edit"
                        element={<EditTeacherPage />}
                      />
                      <Route
                        path="/teachers/:id/schedules/new"
                        element={<TeacherScheduleWizardPage />}
                      />
                      <Route
                        path="/teachers/students/:id"
                        element={<TeacherStudentDetailsPage />}
                      />
                      <Route path="/students" element={<StudentsIndexPage />} />
                      <Route path="/students/:id" element={<StudentDetailsPage />} />
                      <Route
                        path="/students/:id/edit"
                        element={<EditStudentPage />}
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
                      <Route
                        path="/parents/schedule-change"
                        element={<BrowseSchedulesPage />}
                      />
                      <Route
                        path="/parents/my-requests"
                        element={<MyRequestsPage />}
                      />
                      <Route path="/bulletin" element={<BulletinBoardPage />} />

                      {/* Teacher Pages */}
                      <Route
                        path="/teachers/makeup-sessions"
                        element={<MakeupSessionsPage />}
                      />

                      {/* Admin Request Pages */}
                      <Route
                        path="/admin/makeup-requests"
                        element={<MakeupRequestsPage />}
                      />
                      <Route
                        path="/admin/schedule-change-requests"
                        element={<ScheduleChangeRequestsPage />}
                      />
                    </Route>
                  </Routes>
                </ThemeProvider>
              </AuthGuard>
            </BrowserRouter>
          </ToastProvider>
        </QueryClientProvider>
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>
);
