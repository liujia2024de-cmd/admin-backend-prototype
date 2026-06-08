import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
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

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/users/:id" element={<UserDetailPage />} />
          <Route path="/devices" element={<DevicesPage />} />
          <Route path="/devices/camera/:id" element={<CameraDevicePage />} />
          <Route path="/devices/central/:id" element={<CentralDevicePage />} />
          <Route path="/ota" element={<OtaPage />} />
          <Route path="/logs" element={<LogsPage />} />
          <Route path="/tickets" element={<TicketsPage />} />
          <Route path="/tickets/:id" element={<TicketDetailPage />} />
          <Route path="/operations" element={<OperationsPage />} />
          <Route path="/infra" element={<InfraOpsPage />} />
          <Route path="/cms/faq" element={<FaqPage />} />
          <Route path="/cms/knowledge" element={<KnowledgePage />} />
          <Route path="/cms/preset" element={<PresetConfigsPage />} />
          <Route path="/cms/preset/edit/:id" element={<PresetEditPage />} />
          <Route path="/operations/popup" element={<OperationsPage />} />
          <Route path="/operations/banner" element={<OperationsPage />} />
          <Route path="/ai-feedback/videos" element={<AiFeedbackPage />} />
          <Route path="/subscriptions" element={<Navigate to="/dashboard" replace />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/roles" element={<RolesPage />} />
          <Route path="/403" element={<NoAccessPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  );
}
