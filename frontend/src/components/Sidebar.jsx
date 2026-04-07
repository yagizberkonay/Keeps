import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/App";
import {
  LayoutDashboard, FileText, Calculator, FolderKanban,
  LogOut, ChevronLeft, ChevronRight, Vault
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const navItems = [
  { path: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { path: "/invoices", label: "Invoices", icon: FileText },
  { path: "/taxes", label: "Tax Center", icon: Calculator },
  { path: "/projects", label: "Projects", icon: FolderKanban },
];

export default function Sidebar({ isOpen, onToggle }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/auth");
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        data-testid="sidebar"
        className={`fixed left-0 top-0 h-screen z-40 glass-strong transition-all duration-300 flex flex-col ${isOpen ? 'w-[260px]' : 'w-[72px]'}`}
        style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}
      >
        {/* Logo */}
        <div className="p-5 flex items-center gap-3">
          <div className="shrink-0">
            <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
              <path d="M8 8L20 20L8 32" stroke="#A18252" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"/>
              <path d="M20 8L32 20L20 32" stroke="#D4D4D8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
            </svg>
          </div>
          {isOpen && <span className="text-lg font-light tracking-tight text-white/90" style={{ fontFamily: 'Outfit' }}>Keeps</span>}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 mt-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            const btn = (
              <button
                key={item.path}
                data-testid={`nav-${item.label.toLowerCase().replace(/\s/g, '-')}`}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 rounded-xl transition-all duration-200 ${
                  isOpen ? 'px-4 py-3' : 'px-0 py-3 justify-center'
                } ${isActive
                  ? 'bg-white/[0.07] text-white/90 shadow-[0_2px_10px_rgba(0,0,0,0.2)]'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03]'
                }`}
              >
                <Icon className="w-[18px] h-[18px] shrink-0" strokeWidth={1.5} />
                {isOpen && <span className="text-sm font-medium">{item.label}</span>}
              </button>
            );

            if (!isOpen) {
              return (
                <Tooltip key={item.path}>
                  <TooltipTrigger asChild>{btn}</TooltipTrigger>
                  <TooltipContent side="right" className="bg-zinc-800 text-zinc-200 border-white/10">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }
            return btn;
          })}
        </nav>

        {/* Tax Vault Quick Link */}
        <div className="px-3 mb-2">
          {isOpen ? (
            <div className="glass-card rounded-xl p-4 glow-amber">
              <div className="flex items-center gap-2 mb-2">
                <Vault className="w-4 h-4 text-[#A18252]" strokeWidth={1.5} />
                <span className="text-xs uppercase tracking-widest text-[#A18252] font-medium">Tax Vault</span>
              </div>
              <p className="text-[10px] text-zinc-500">Set aside funds for upcoming tax obligations</p>
            </div>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex justify-center py-2">
                  <Vault className="w-5 h-5 text-[#A18252]" strokeWidth={1.5} />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-zinc-800 text-zinc-200 border-white/10">Tax Vault</TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* User & Toggle */}
        <div className="px-3 pb-4 space-y-2">
          {isOpen && user && (
            <div className="flex items-center gap-3 px-4 py-2">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs text-zinc-300 font-medium">
                {user.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-300 truncate">{user.name}</p>
                <p className="text-[10px] text-zinc-600 truncate">{user.email}</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-1">
            <button
              data-testid="sidebar-toggle"
              onClick={onToggle}
              className="flex-1 flex items-center justify-center py-2 text-zinc-500 hover:text-zinc-300 hover:bg-white/5 rounded-lg transition-colors"
            >
              {isOpen ? <ChevronLeft className="w-4 h-4" strokeWidth={1.5} /> : <ChevronRight className="w-4 h-4" strokeWidth={1.5} />}
            </button>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  data-testid="logout-button"
                  onClick={handleLogout}
                  className="flex items-center justify-center py-2 px-3 text-zinc-500 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-zinc-800 text-zinc-200 border-white/10">Sign Out</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}
