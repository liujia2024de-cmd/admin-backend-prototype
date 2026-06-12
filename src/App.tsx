import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import AdminUsersPage from "@/pages/AdminUsersPage";
import AiFeedbackPage from "@/pages/AiFeedbackPage";
import CameraDevicePage from "@/pages/CameraDevicePage";
import CentralDevicePage from "@/pages/CentralDevicePage";
import DashboardPage from "@/pages/DashboardPage";
import DevicesPage from "@/pages/DevicesPage";
import FaqPage from "@/pages/FaqPage";
import InfraOpsPage from "@/pages/InfraOpsPage";
import KnowledgePage from "@/pages/KnowledgePage";
import LoginPage from "@/pages/LoginPage";
import LogsPage from "@/pages/LogsPage";
import NoAccessPage from "@/pages/NoAccessPage";
import NotFoundPage from "@/pages/NotFoundPage";
import OtaPage from "@/pages/OtaPage";
import OperationsPage from "@/pages/OperationsPage";
import PresetConfigsPage from "@/pages/PresetConfigsPage";
import PresetEditPage from "@/pages/PresetEditPage";
import RolesPage from "@/pages/RolesPage";
import TicketDetailPage from "@/pages/TicketDetailPage";
import TicketsPage from "@/pages/TicketsPage";
import UserDetailPage from "@/pages/UserDetailPage";
import UsersPage from "@/pages/UsersPage";
import { ToastProvider } from "@/components/ui/Toast";
import { canAccessPath, getDefaultHomePath, readSession } from "@/lib/auth";

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const session = readSession();

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function PermissionRoute({ children }: { children: JSX.Element }) {
  const location = useLocation();
  const session = readSession();

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (!canAccessPath(session.role, location.pathname)) {
    return <Navigate to="/403" replace />;
  }

  return children;
}

function HomeRedirect() {
  const session = readSession();
  return <Navigate to={session ? getDefaultHomePath(session.role) : "/login"} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<PermissionRoute><DashboardPage /></PermissionRoute>} />
          <Route path="/users" element={<PermissionRoute><UsersPage /></PermissionRoute>} />
          <Route path="/users/:id" element={<PermissionRoute><UserDetailPage /></PermissionRoute>} />
          <Route path="/devices" element={<PermissionRoute><DevicesPage /></PermissionRoute>} />
          <Route path="/devices/camera/:id" element={<PermissionRoute><CameraDevicePage /></PermissionRoute>} />
          <Route path="/devices/central/:id" element={<PermissionRoute><CentralDevicePage /></PermissionRoute>} />
          <Route path="/ota" element={<PermissionRoute><OtaPage /></PermissionRoute>} />
          <Route path="/logs" element={<PermissionRoute><LogsPage /></PermissionRoute>} />
          <Route path="/tickets" element={<PermissionRoute><TicketsPage /></PermissionRoute>} />
          <Route path="/tickets/:id" element={<PermissionRoute><TicketDetailPage /></PermissionRoute>} />
          <Route path="/operations" element={<PermissionRoute><OperationsPage /></PermissionRoute>} />
          <Route path="/infra" element={<PermissionRoute><InfraOpsPage /></PermissionRoute>} />
          <Route path="/cms/faq" element={<PermissionRoute><FaqPage /></PermissionRoute>} />
          <Route path="/cms/knowledge" element={<PermissionRoute><KnowledgePage /></PermissionRoute>} />
          <Route path="/cms/preset" element={<PermissionRoute><PresetConfigsPage /></PermissionRoute>} />
          <Route path="/cms/preset/edit/:id" element={<PermissionRoute><PresetEditPage /></PermissionRoute>} />
          <Route path="/operations/popup" element={<PermissionRoute><OperationsPage /></PermissionRoute>} />
          <Route path="/operations/banner" element={<PermissionRoute><OperationsPage /></PermissionRoute>} />
          <Route path="/ai-feedback/videos" element={<PermissionRoute><AiFeedbackPage /></PermissionRoute>} />
          <Route path="/subscriptions" element={<HomeRedirect />} />
          <Route path="/admin/users" element={<PermissionRoute><AdminUsersPage /></PermissionRoute>} />
          <Route path="/admin/roles" element={<PermissionRoute><RolesPage /></PermissionRoute>} />
          <Route path="/403" element={<ProtectedRoute><NoAccessPage /></ProtectedRoute>} />
          <Route path="*" element={<ProtectedRoute><NotFoundPage /></ProtectedRoute>} />
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  );
}
