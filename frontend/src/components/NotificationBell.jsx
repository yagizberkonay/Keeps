import { useState, useEffect, useRef } from "react";
import { API } from "@/App";
import { useLang } from "@/lib/i18n";
import axios from "axios";
import { Bell, Check, FileText, X } from "lucide-react";

export default function NotificationBell() {
  const { t } = useLang();
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get(`${API}/notifications`, { withCredentials: true });
        setNotifications(res.data);
      } catch {}
    };
    fetch();
    const interval = setInterval(fetch, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markAllRead = async () => {
    try {
      await axios.post(`${API}/notifications/read`, {}, { withCredentials: true });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch {}
  };

  const unread = notifications.filter(n => !n.read).length;

  return (
    <div ref={ref} className="relative">
      <button
        data-testid="notification-bell"
        onClick={() => setOpen(!open)}
        className="relative text-zinc-400 hover:text-zinc-200 p-1.5 hover:bg-white/5 rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5" strokeWidth={1.5} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#A18252] rounded-full text-[9px] text-white flex items-center justify-center font-medium">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-[320px] glass-strong rounded-xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.5)] z-50 overflow-hidden" data-testid="notification-dropdown">
          <div className="flex items-center justify-between p-3 border-b border-white/5">
            <span className="text-xs font-medium text-zinc-300">{t("notifications")}</span>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors">
                {t("mark_all_read")}
              </button>
            )}
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center">
                <Bell className="w-8 h-8 text-zinc-700 mx-auto mb-2" strokeWidth={1} />
                <p className="text-xs text-zinc-600">{t("no_notifications")}</p>
              </div>
            ) : (
              notifications.slice(0, 20).map((n) => (
                <div key={n.id} className={`flex items-start gap-3 p-3 hover:bg-white/[0.02] transition-colors ${!n.read ? 'bg-white/[0.01]' : ''}`}>
                  <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                    <FileText className="w-3.5 h-3.5 text-zinc-400" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-zinc-300 leading-relaxed">{n.message}</p>
                    <p className="text-[10px] text-zinc-600 mt-0.5">{n.created_at?.slice(0, 16).replace("T", " ")}</p>
                  </div>
                  {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-[#A18252] shrink-0 mt-2" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
