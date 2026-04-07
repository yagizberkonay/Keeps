import { useState, useEffect } from "react";
import { useAuth, API } from "@/App";
import axios from "axios";
import { TrendingUp, FileText, Calculator, FolderKanban, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import TaxVault from "@/components/TaxVault";

const formatCurrency = (val) => {
  if (val >= 1000) return `$${(val / 1000).toFixed(1)}k`;
  return `$${val.toFixed(0)}`;
};

function StatCard({ title, value, icon: Icon, trend, color, delay }) {
  return (
    <div className={`glass-card rounded-2xl p-6 animate-fade-in ${delay}`} data-testid={`stat-${title.toLowerCase().replace(/\s/g, '-')}`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" strokeWidth={1.5} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs ${trend > 0 ? 'text-[#4A6E59]' : 'text-red-400/70'}`}>
            {trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-xs uppercase tracking-widest text-zinc-500 font-medium mb-1">{title}</p>
      <p className="text-2xl font-light tracking-tight text-white/90" style={{ fontFamily: 'Outfit' }}>{value}</p>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="glass-strong rounded-lg p-3 text-xs">
        <p className="text-zinc-400 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="text-white/80">{p.name}: ${p.value?.toLocaleString()}</p>
        ))}
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${API}/dashboard/summary`, { withCredentials: true });
        setData(res.data);
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white/80 rounded-full" />
      </div>
    );
  }

  const d = data || {};

  return (
    <div data-testid="dashboard-page">
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-white/90 mb-2" style={{ fontFamily: 'Outfit' }}>
          Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
        </h1>
        <p className="text-zinc-500 text-sm">Here's your financial overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard title="Revenue" value={formatCurrency(d.total_revenue || 0)} icon={TrendingUp} trend={12} color="bg-[#4A6E59]/20 text-[#4A6E59]" delay="animate-fade-in-delay-1" />
        <StatCard title="Pending" value={formatCurrency(d.total_pending || 0)} icon={FileText} color="bg-[#A18252]/20 text-[#A18252]" delay="animate-fade-in-delay-2" />
        <StatCard title="Tax Collected" value={formatCurrency(d.total_tax || 0)} icon={Calculator} color="bg-[#3B5A70]/20 text-[#3B5A70]" delay="animate-fade-in-delay-3" />
        <StatCard title="Active Projects" value={d.active_projects || 0} icon={FolderKanban} color="bg-white/10 text-zinc-300" delay="animate-fade-in-delay-4" />
      </div>

      {/* Chart & Vault */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6 animate-fade-in animate-fade-in-delay-2" data-testid="revenue-chart">
          <h3 className="text-xs uppercase tracking-widest text-zinc-500 font-medium mb-6">Revenue & Tax Overview</h3>
          <div className="h-[280px]">
            {d.monthly_data?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={d.monthly_data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4A6E59" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#4A6E59" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="gradTax" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#A18252" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#A18252" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#80808A', fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#80808A', fontSize: 11 }} tickFormatter={formatCurrency} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="revenue" stroke="#4A6E59" fill="url(#gradRevenue)" strokeWidth={2} name="Revenue" />
                  <Area type="monotone" dataKey="tax" stroke="#A18252" fill="url(#gradTax)" strokeWidth={2} name="Tax" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-zinc-600 text-sm">
                Create invoices to see revenue data here
              </div>
            )}
          </div>
        </div>

        {/* Tax Vault Widget */}
        <div className="animate-fade-in animate-fade-in-delay-3">
          <TaxVault />
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="glass-card rounded-2xl p-6 animate-fade-in animate-fade-in-delay-4" data-testid="recent-invoices">
        <h3 className="text-xs uppercase tracking-widest text-zinc-500 font-medium mb-5">Recent Invoices</h3>
        {d.recent_invoices?.length > 0 ? (
          <div className="space-y-3">
            {d.recent_invoices.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-zinc-400" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-300">{inv.client_name}</p>
                    <p className="text-[11px] text-zinc-600">{inv.invoice_number}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-white/80 tabular-nums">${inv.total?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                  <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    inv.status === 'paid' ? 'bg-[#4A6E59]/15 text-[#4A6E59]' :
                    inv.status === 'sent' ? 'bg-[#3B5A70]/15 text-[#3B5A70]' :
                    'bg-white/5 text-zinc-500'
                  }`}>{inv.status}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-zinc-600 text-sm py-4">No invoices yet. Create your first invoice to get started.</p>
        )}
      </div>
    </div>
  );
}
