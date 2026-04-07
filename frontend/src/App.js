import { useState, useEffect, useCallback, createContext, useContext } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import AuthPage from "@/pages/AuthPage";
import DashboardPage from "@/pages/DashboardPage";
import InvoicesPage from "@/pages/InvoicesPage";
import TaxPage from "@/pages/TaxPage";
import ProjectsPage from "@/pages/ProjectsPage";
import Sidebar from "@/components/Sidebar";
import AIAdvisor from "@/components/AIAdvisor";
import { Toaster } from "@/components/ui/sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth Context
const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);
export { API, BACKEND_URL };

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/auth/me`, { withCredentials: true });
      setUser(res.data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // CRITICAL: If returning from OAuth callback, skip the /me check.
    // AuthCallback will exchange the session_id and establish the session first.
    if (window.location.hash?.includes('session_id=')) {
      setLoading(false);
      return;
    }
    checkAuth();
  }, [checkAuth]);

  const login = (userData) => setUser(userData);
  const logout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
    } catch {}
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

function AuthCallback() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [processed, setProcessed] = useState(false);

  useEffect(() => {
    if (processed) return;
    setProcessed(true);
    const hash = window.location.hash;
    const sessionId = new URLSearchParams(hash.substring(1)).get("session_id");
    if (!sessionId) { navigate("/auth"); return; }

    (async () => {
      try {
        const res = await axios.post(`${API}/auth/session`, { session_id: sessionId }, { withCredentials: true });
        login(res.data);
        navigate("/dashboard", { replace: true, state: { user: res.data } });
      } catch {
        navigate("/auth", { replace: true });
      }
    })();
  }, [processed, navigate, login]);

  return (
    <div className="min-h-screen page-gradient flex items-center justify-center">
      <div className="glass-card p-8 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white/80 rounded-full mx-auto mb-4" />
        <p className="text-zinc-400 text-sm">Authenticating...</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen page-gradient flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white/80 rounded-full" />
      </div>
    );
  }

  if (!user && !location.state?.user) {
    return <Navigate to="/auth" replace />;
  }

  return children;
}

function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen page-gradient flex">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-[260px]' : 'ml-[72px]'}`}>
        <div className="p-6 lg:p-8 max-w-[1400px]">
          {children}
        </div>
      </main>
      <AIAdvisor />
    </div>
  );
}

function AppRouter() {
  const location = useLocation();

  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardLayout><DashboardPage /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/invoices" element={
        <ProtectedRoute>
          <DashboardLayout><InvoicesPage /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/taxes" element={
        <ProtectedRoute>
          <DashboardLayout><TaxPage /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/projects" element={
        <ProtectedRoute>
          <DashboardLayout><ProjectsPage /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
        <Toaster position="top-right" theme="dark" />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
