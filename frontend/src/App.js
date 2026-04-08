import { useState, useEffect, useCallback, createContext, useContext } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import AuthPage from "@/pages/AuthPage";
import DashboardPage from "@/pages/DashboardPage";
import InvoicesPage from "@/pages/InvoicesPage";
import InvoiceCreatePage from "@/pages/InvoiceCreatePage";
import InvoiceDetailPage from "@/pages/InvoiceDetailPage";
import TaxPage from "@/pages/TaxPage";
import ProjectsPage from "@/pages/ProjectsPage";
import ProjectCreatePage from "@/pages/ProjectCreatePage";
import ClientsPage from "@/pages/ClientsPage";
import SettingsPage from "@/pages/SettingsPage";
import ExpensesPage from "@/pages/ExpensesPage";
import CompliancePage from "@/pages/CompliancePage";
import Sidebar from "@/components/Sidebar";
import AIAdvisor from "@/components/AIAdvisor";
import { Toaster } from "@/components/ui/sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

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
    } catch { setUser(null); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (window.location.hash?.includes('session_id=')) { setLoading(false); return; }
    checkAuth();
  }, [checkAuth]);

  const login = (userData) => setUser(userData);
  const logout = async () => {
    try { await axios.post(`${API}/auth/logout`, {}, { withCredentials: true }); } catch {}
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
      } catch { navigate("/auth", { replace: true }); }
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
  if (loading) return <div className="min-h-screen page-gradient flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white/80 rounded-full" /></div>;
  if (!user && !location.state?.user) return <Navigate to="/auth" replace />;
  return children;
}

function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(true);
      else setSidebarOpen(false);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <div className="min-h-screen page-gradient">
      {/* Mobile header */}
      {isMobile && (
        <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 glass-strong" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <button data-testid="mobile-menu-btn" onClick={() => setSidebarOpen(true)} className="text-zinc-400 hover:text-zinc-200 p-1.5 hover:bg-white/5 rounded-lg transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <div className="flex items-center gap-2">
            <svg width="24" height="24" viewBox="0 0 40 40" fill="none"><path d="M8 8L20 20L8 32" stroke="#A18252" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"/><path d="M20 8L32 20L20 32" stroke="#D4D4D8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/></svg>
            <span className="text-sm font-light text-white/90" style={{ fontFamily: 'Outfit' }}>Keeps</span>
          </div>
          <div className="w-8" />
        </header>
      )}

      <div className="flex">
        {/* Overlay for mobile */}
        {isMobile && sidebarOpen && (
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setSidebarOpen(false)} data-testid="sidebar-overlay" />
        )}
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} isMobile={isMobile} onClose={() => setSidebarOpen(false)} />
        <main className={`flex-1 transition-all duration-300 min-h-screen ${!isMobile ? (sidebarOpen ? 'ml-[260px]' : 'ml-[72px]') : 'ml-0'}`}>
          <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px]">
            {children}
          </div>
        </main>
      </div>
      <AIAdvisor />
    </div>
  );
}

function AppRouter() {
  const location = useLocation();
  if (location.hash?.includes('session_id=')) return <AuthCallback />;

  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout><DashboardPage /></DashboardLayout></ProtectedRoute>} />
      <Route path="/invoices" element={<ProtectedRoute><DashboardLayout><InvoicesPage /></DashboardLayout></ProtectedRoute>} />
      <Route path="/invoices/new" element={<ProtectedRoute><DashboardLayout><InvoiceCreatePage /></DashboardLayout></ProtectedRoute>} />
      <Route path="/invoices/:id" element={<ProtectedRoute><DashboardLayout><InvoiceDetailPage /></DashboardLayout></ProtectedRoute>} />
      <Route path="/taxes" element={<ProtectedRoute><DashboardLayout><TaxPage /></DashboardLayout></ProtectedRoute>} />
      <Route path="/projects" element={<ProtectedRoute><DashboardLayout><ProjectsPage /></DashboardLayout></ProtectedRoute>} />
      <Route path="/projects/new" element={<ProtectedRoute><DashboardLayout><ProjectCreatePage /></DashboardLayout></ProtectedRoute>} />
      <Route path="/clients" element={<ProtectedRoute><DashboardLayout><ClientsPage /></DashboardLayout></ProtectedRoute>} />
      <Route path="/expenses" element={<ProtectedRoute><DashboardLayout><ExpensesPage /></DashboardLayout></ProtectedRoute>} />
      <Route path="/compliance" element={<ProtectedRoute><DashboardLayout><CompliancePage /></DashboardLayout></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><DashboardLayout><SettingsPage /></DashboardLayout></ProtectedRoute>} />
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
