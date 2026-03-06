// ============================================
// APP - Main Application Component
// ============================================

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "@/context/AppContext";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { Sidebar } from "./components/layout/Sidebar";
import { LoginView } from "./components/views/LoginView";
import { RegisterView } from "./components/views/RegisterView";
import { OverviewView } from "./components/views/OverviewView";
import { ContentCalendarView } from "./components/views/ContentCalendarView";
import { TemplatesView } from "./components/views/TemplatesView";
import { AIAssistantView } from "./components/views/AIAssistantView";
import { AnalyticsView } from "./components/views/AnalyticsView";
import { TeamView } from "./components/views/TeamView";
import { HelpView } from "./components/views/HelpView";
import { SettingsView } from "./components/views/SettingsView";
import { AdsView } from "./components/views/AdsView";
import { TrashView } from "./components/views/TrashView";
import { SchedulerView } from "./components/views/SchedulerView";
import { OAuthCallbackView } from "./components/views/OAuthCallbackView";
import { PrivacyPolicyView } from "./components/views/PrivacyPolicyView";
import { DataDeletionView } from "./components/views/DataDeletionView";
import { TermsView } from "./components/views/TermsView";

// ============================================
// PROTECTED ROUTE WRAPPER
// ============================================

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// ============================================
// APP LAYOUT
// ============================================

function AppLayout() {
  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Routes>
          <Route path="/" element={<Navigate to="/overview" replace />} />
          <Route path="/overview" element={<OverviewView />} />
          <Route path="/content-calendar" element={<ContentCalendarView />} />
          <Route path="/scheduler" element={<SchedulerView />} />
          <Route path="/analytics" element={<AnalyticsView />} />
          <Route path="/team" element={<TeamView />} />
          <Route path="/ai-assistant" element={<AIAssistantView />} />
          <Route path="/ads" element={<AdsView />} />
          <Route path="/templates" element={<TemplatesView />} />
          <Route path="/trash" element={<TrashView />} />
          <Route path="/settings" element={<SettingsView />} />
          <Route path="/help" element={<HelpView />} />
          <Route path="*" element={<Navigate to="/overview" replace />} />
        </Routes>
      </main>
    </div>
  );
}

// ============================================
// APP ROOT WITH PROVIDERS
// ============================================

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginView />} />
            <Route path="/register" element={<RegisterView />} />
            <Route path="/oauth/callback" element={<OAuthCallbackView />} />
            <Route path="/privacy" element={<PrivacyPolicyView />} />
            <Route path="/data-deletion" element={<DataDeletionView />} />
            <Route path="/terms" element={<TermsView />} />

            {/* Protected routes */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            />
          </Routes>
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
