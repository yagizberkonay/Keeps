import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/App";
import { useLang } from "@/lib/i18n";
import {
  LayoutDashboard, FileText, Calculator, FolderKanban, Users,
  Settings, LogOut, ChevronLeft, ChevronRight, Vault, X,
  Receipt, Globe, Repeat, Languages
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function Sidebar({ isOpen, onToggle, isMobile, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t, lang, setLang, langs } = useLang();

  const navItems = [
    { path: "/dashboard", label: t("overview"), icon: LayoutDashboard },
    { path: "/invoices", label: t("invoices"), icon: FileText },
    { path: "/recurring", label: t("recurring"), icon: Repeat },
    { path: "/expenses", label: t("expenses"), icon: Receipt },
    { path: "/taxes", label: t("tax_center"), icon: Calculator },
    { path: "/projects", label: t("projects"), icon: FolderKanban },
    { path: "/clients", label: t("clients"), icon: Users },
    { path: "/compliance", label: t("compliance"), icon: Globe },
    { path: "/settings", label: t("settings"), icon: Settings },
  ];

  const handleLogout = async () => { await logout(); navigate("/auth"); };
  const handleNav = (path) => { navigate(path); if (isMobile && onClose) onClose(); };
  if (!isOpen && isMobile) return null;

  const showLabel = isOpen || isMobile;

  return (
    <TooltipProvider delayDuration={0}>
      <aside data-testid="sidebar" className={`fixed left-0 top-0 h-screen z-50 glass-strong transition-all duration-300 flex flex-col ${isMobile ? 'w-[280px]' : (isOpen ? 'w-[260px]' : 'w-[72px]')}`} style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg width="32" height="32" viewBox="0 0 40 40" fill="none" className="shrink-0"><path d="M8 8L20 20L8 32" stroke="#A18252" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"/><path d="M20 8L32 20L20 32" stroke="#D4D4D8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/></svg>
            {showLabel && <span className="text-lg font-light tracking-tight text-white/90" style={{ fontFamily: 'Outfit' }}>Keeps</span>}
          </div>
          {isMobile && <button data-testid="close-sidebar" onClick={onClose} className="text-zinc-500 hover:text-zinc-300 p-1.5 hover:bg-white/5 rounded-lg transition-colors"><X className="w-5 h-5" strokeWidth={1.5} /></button>}
        </div>

        <nav className="flex-1 px-3 mt-2 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== "/dashboard" && location.pathname.startsWith(item.path));
            const Icon = item.icon;
            const btn = (
              <button key={item.path} data-testid={`nav-${item.label.toLowerCase().replace(/\s/g, '-')}`} onClick={() => handleNav(item.path)}
                className={`w-full flex items-center gap-3 rounded-xl transition-all duration-200 ${showLabel ? 'px-4 py-2.5' : 'px-0 py-2.5 justify-center'} ${isActive ? 'bg-white/[0.07] text-white/90 shadow-[0_2px_10px_rgba(0,0,0,0.2)]' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03]'}`}>
                <Icon className="w-[18px] h-[18px] shrink-0" strokeWidth={1.5} />
                {showLabel && <span className="text-sm">{item.label}</span>}
              </button>
            );
            if (!showLabel) return <Tooltip key={item.path}><TooltipTrigger asChild>{btn}</TooltipTrigger><TooltipContent side="right" className="bg-zinc-800 text-zinc-200 border-white/10">{item.label}</TooltipContent></Tooltip>;
            return btn;
          })}
        </nav>

        {/* Language Selector */}
        {showLabel && (
          <div className="px-3 mb-2">
            <div className="glass-card rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <Languages className="w-3.5 h-3.5 text-zinc-500" strokeWidth={1.5} />
                <span className="text-[10px] uppercase tracking-widest text-zinc-500">{t("language")}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {Object.entries(langs).map(([code, label]) => (
                  <button key={code} data-testid={`lang-${code}`} onClick={() => setLang(code)}
                    className={`text-[10px] px-2 py-1 rounded-md transition-colors ${lang === code ? 'bg-white/10 text-zinc-200' : 'text-zinc-600 hover:text-zinc-400 hover:bg-white/5'}`}>
                    {code.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tax Vault */}
        <div className="px-3 mb-2">
          {showLabel ? (
            <div className="glass-card rounded-xl p-3 glow-amber cursor-pointer" onClick={() => handleNav("/taxes")}>
              <div className="flex items-center gap-2 mb-1">
                <Vault className="w-3.5 h-3.5 text-[#A18252]" strokeWidth={1.5} />
                <span className="text-[10px] uppercase tracking-widest text-[#A18252] font-medium">{t("tax_vault")}</span>
              </div>
            </div>
          ) : (
            <Tooltip><TooltipTrigger asChild><div className="flex justify-center py-2 cursor-pointer" onClick={() => handleNav("/taxes")}><Vault className="w-5 h-5 text-[#A18252]" strokeWidth={1.5} /></div></TooltipTrigger><TooltipContent side="right" className="bg-zinc-800 text-zinc-200 border-white/10">{t("tax_vault")}</TooltipContent></Tooltip>
          )}
        </div>

        {/* User & Controls */}
        <div className="px-3 pb-4 space-y-2">
          {showLabel && user && (
            <div className="flex items-center gap-3 px-4 py-2">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs text-zinc-300 font-medium">{user.name?.charAt(0)?.toUpperCase() || "U"}</div>
              <div className="flex-1 min-w-0"><p className="text-sm text-zinc-300 truncate">{user.name}</p><p className="text-[10px] text-zinc-600 truncate">{user.email}</p></div>
            </div>
          )}
          <div className="flex items-center gap-1">
            {!isMobile && <button data-testid="sidebar-toggle" onClick={onToggle} className="flex-1 flex items-center justify-center py-2 text-zinc-500 hover:text-zinc-300 hover:bg-white/5 rounded-lg transition-colors">{isOpen ? <ChevronLeft className="w-4 h-4" strokeWidth={1.5} /> : <ChevronRight className="w-4 h-4" strokeWidth={1.5} />}</button>}
            <Tooltip>
              <TooltipTrigger asChild>
                <button data-testid="logout-button" onClick={handleLogout} className={`flex items-center justify-center py-2 px-3 text-zinc-500 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors ${isMobile ? 'flex-1' : ''}`}>
                  <LogOut className="w-4 h-4" strokeWidth={1.5} />{isMobile && <span className="ml-2 text-sm">{t("sign_out")}</span>}
                </button>
              </TooltipTrigger>
              {!isMobile && <TooltipContent side="right" className="bg-zinc-800 text-zinc-200 border-white/10">{t("sign_out")}</TooltipContent>}
            </Tooltip>
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}
