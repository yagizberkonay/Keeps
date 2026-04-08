import { useState, useEffect, useCallback } from "react";
import { API } from "@/App";
import axios from "axios";
import { Plus, Receipt, Trash2, Upload, Camera, X, TrendingDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from "recharts";
import { toast } from "sonner";

const CATEGORIES = [
  { value: "office", label: "Office" }, { value: "travel", label: "Travel" },
  { value: "equipment", label: "Equipment" }, { value: "software", label: "Software" },
  { value: "marketing", label: "Marketing" }, { value: "food", label: "Food & Meals" },
  { value: "utilities", label: "Utilities" }, { value: "insurance", label: "Insurance" },
  { value: "professional_services", label: "Professional Services" }, { value: "rent", label: "Rent" },
  { value: "subscriptions", label: "Subscriptions" }, { value: "transportation", label: "Transportation" },
  { value: "communication", label: "Communication" }, { value: "other", label: "Other" },
];

const CAT_COLORS = ["#4A6E59", "#A18252", "#3B5A70", "#7C6E9B", "#C4785B", "#5A8E6F", "#8B7355", "#5B7A8F", "#9B8EC4", "#B89060", "#6B9B7A", "#A68B5B", "#6B8FA5", "#888"];

const CategoryTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    return (
      <div className="glass-strong rounded-lg p-3 text-xs">
        <p className="text-zinc-300 capitalize">{payload[0].name}</p>
        <p className="text-white/80">${payload[0].value?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
      </div>
    );
  }
  return null;
};

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [form, setForm] = useState({ amount: "", currency: "USD", category: "other", description: "", vendor: "", date: "", receipt_data: "" });

  const set = (f, v) => setForm(prev => ({ ...prev, [f]: v }));

  const fetchData = useCallback(async () => {
    try {
      const [expRes, sumRes] = await Promise.all([
        axios.get(`${API}/expenses`, { withCredentials: true }),
        axios.get(`${API}/expenses/summary`, { withCredentials: true })
      ]);
      setExpenses(expRes.data);
      setSummary(sumRes.data);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount) { toast.error("Amount is required"); return; }
    setSaving(true);
    try {
      await axios.post(`${API}/expenses`, { ...form, amount: parseFloat(form.amount) || 0 }, { withCredentials: true });
      toast.success("Expense added");
      setForm({ amount: "", currency: "USD", category: "other", description: "", vendor: "", date: "", receipt_data: "" });
      setShowForm(false);
      fetchData();
    } catch { toast.error("Failed to add expense"); }
    finally { setSaving(false); }
  };

  const deleteExpense = async (id) => {
    try {
      await axios.delete(`${API}/expenses/${id}`, { withCredentials: true });
      toast.success("Expense deleted");
      fetchData();
    } catch { toast.error("Failed to delete"); }
  };

  const handleReceiptScan = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanning(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target.result;
      set("receipt_data", base64);
      try {
        const res = await axios.post(`${API}/receipts/scan`, { image_base64: base64 }, { withCredentials: true });
        if (res.data.success && res.data.data) {
          const d = res.data.data;
          setForm(prev => ({
            ...prev,
            amount: d.amount?.toString() || prev.amount,
            vendor: d.vendor || prev.vendor,
            category: d.category || prev.category,
            description: d.description || prev.description,
            date: d.date || prev.date,
            currency: d.currency || prev.currency,
            receipt_data: base64
          }));
          toast.success("Receipt scanned successfully!");
        } else {
          toast.error("Could not parse receipt. Please fill in details manually.");
        }
      } catch { toast.error("Receipt scan failed"); }
      finally { setScanning(false); }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div data-testid="expenses-page">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-fade-in">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-light tracking-tight text-white/90" style={{ fontFamily: 'Outfit' }}>Expenses</h1>
          <p className="text-zinc-500 text-sm mt-1">Track and categorize your business expenses</p>
        </div>
        <button data-testid="toggle-expense-form" onClick={() => setShowForm(!showForm)} className="bg-zinc-100 text-zinc-900 hover:bg-white rounded-lg px-5 py-2.5 font-medium text-sm transition-colors shadow-[0_0_15px_rgba(255,255,255,0.1)] flex items-center gap-2 self-start sm:self-auto">
          <Plus className="w-4 h-4" strokeWidth={1.5} /> {showForm ? "Cancel" : "New Expense"}
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8 animate-fade-in animate-fade-in-delay-1">
          <div className="glass-card rounded-2xl p-5">
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Total Expenses</p>
            <p className="text-xl font-light text-white/90 tabular-nums" style={{ fontFamily: 'Outfit' }}>${summary.total?.toLocaleString()}</p>
          </div>
          <div className="glass-card rounded-2xl p-5">
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Transactions</p>
            <p className="text-xl font-light text-white/90 tabular-nums" style={{ fontFamily: 'Outfit' }}>{summary.count}</p>
          </div>
          <div className="glass-card rounded-2xl p-5">
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Top Category</p>
            <p className="text-xl font-light text-white/90 capitalize" style={{ fontFamily: 'Outfit' }}>
              {summary.by_category?.[0]?.category?.replace("_", " ") || "N/A"}
            </p>
          </div>
        </div>
      )}

      {/* Charts */}
      {summary && (summary.by_category?.length > 0 || summary.by_month?.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 animate-fade-in animate-fade-in-delay-2">
          {summary.by_category?.length > 0 && (
            <div className="glass-card rounded-2xl p-6" data-testid="expense-category-chart">
              <h3 className="text-xs uppercase tracking-widest text-zinc-500 font-medium mb-4">By Category</h3>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={summary.by_category} dataKey="amount" nameKey="category" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
                      {summary.by_category.map((_, i) => <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<CategoryTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-3 mt-4 justify-center">
                {summary.by_category.slice(0, 5).map((c, i) => (
                  <div key={c.category} className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CAT_COLORS[i] }} />
                    <span className="capitalize">{c.category.replace("_", " ")}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {summary.by_month?.length > 0 && (
            <div className="glass-card rounded-2xl p-6" data-testid="expense-monthly-chart">
              <h3 className="text-xs uppercase tracking-widest text-zinc-500 font-medium mb-4">Monthly Trend</h3>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summary.by_month}>
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#80808A', fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#80808A', fontSize: 11 }} tickFormatter={v => `$${v >= 1000 ? (v/1000).toFixed(1) + 'k' : v}`} />
                    <Tooltip content={<CategoryTooltip />} />
                    <Bar dataKey="amount" fill="#A18252" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Form */}
      {showForm && (
        <div className="glass-card rounded-2xl p-6 mb-8 animate-fade-in" data-testid="expense-create-form">
          <h2 className="text-xs uppercase tracking-widest text-zinc-500 font-medium mb-5">New Expense</h2>

          {/* Receipt Scanner */}
          <div className="mb-6 p-4 border border-dashed border-white/10 rounded-xl bg-white/[0.01] text-center">
            <label className="cursor-pointer block" data-testid="receipt-upload-zone">
              <input type="file" accept="image/*" className="hidden" onChange={handleReceiptScan} />
              {scanning ? (
                <div className="flex items-center justify-center gap-3 py-4">
                  <div className="animate-spin w-5 h-5 border-2 border-white/20 border-t-[#4A6E59] rounded-full" />
                  <span className="text-sm text-zinc-400">Scanning receipt...</span>
                </div>
              ) : form.receipt_data ? (
                <div className="flex items-center justify-center gap-3 py-2">
                  <Camera className="w-5 h-5 text-[#4A6E59]" strokeWidth={1.5} />
                  <span className="text-sm text-[#4A6E59]">Receipt scanned! Click to scan another</span>
                </div>
              ) : (
                <div className="py-4">
                  <Upload className="w-8 h-8 text-zinc-600 mx-auto mb-2" strokeWidth={1} />
                  <p className="text-sm text-zinc-500">Upload a receipt for automatic scanning</p>
                  <p className="text-[10px] text-zinc-600 mt-1">AI-powered OCR will extract vendor, amount, and category</p>
                </div>
              )}
            </label>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-widest text-zinc-600">Amount *</Label>
                <Input data-testid="expense-amount" type="number" step="0.01" className="bg-black/20 border-white/10 text-zinc-200 placeholder:text-zinc-600" placeholder="0.00" value={form.amount} onChange={(e) => set("amount", e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-widest text-zinc-600">Currency</Label>
                <Select value={form.currency} onValueChange={(v) => set("currency", v)}>
                  <SelectTrigger className="bg-black/20 border-white/10 text-zinc-200"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-white/10">
                    {["USD", "EUR", "GBP", "TRY", "JPY", "CAD"].map(c => <SelectItem key={c} value={c} className="text-zinc-300 focus:bg-white/10">{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-widest text-zinc-600">Category</Label>
                <Select value={form.category} onValueChange={(v) => set("category", v)}>
                  <SelectTrigger data-testid="expense-category" className="bg-black/20 border-white/10 text-zinc-200"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-white/10 max-h-[200px]">
                    {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value} className="text-zinc-300 focus:bg-white/10">{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-widest text-zinc-600">Vendor</Label>
                <Input data-testid="expense-vendor" className="bg-black/20 border-white/10 text-zinc-200 placeholder:text-zinc-600" placeholder="Store or vendor name" value={form.vendor} onChange={(e) => set("vendor", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-widest text-zinc-600">Date</Label>
                <Input data-testid="expense-date" type="date" className="bg-black/20 border-white/10 text-zinc-200" value={form.date} onChange={(e) => set("date", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-widest text-zinc-600">Description</Label>
                <Input data-testid="expense-description" className="bg-black/20 border-white/10 text-zinc-200 placeholder:text-zinc-600" placeholder="Brief note" value={form.description} onChange={(e) => set("description", e.target.value)} />
              </div>
            </div>
            <button data-testid="submit-expense" type="submit" disabled={saving} className="bg-zinc-100 text-zinc-900 hover:bg-white rounded-lg px-6 py-2.5 font-medium text-sm transition-colors disabled:opacity-50">
              {saving ? "Adding..." : "Add Expense"}
            </button>
          </form>
        </div>
      )}

      {/* Expense List */}
      {loading ? (
        <div className="flex justify-center py-16"><div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white/80 rounded-full" /></div>
      ) : expenses.length === 0 && !showForm ? (
        <div className="glass-card rounded-2xl p-12 sm:p-16 text-center animate-fade-in">
          <TrendingDown className="w-12 h-12 text-zinc-700 mx-auto mb-4" strokeWidth={1} />
          <p className="text-zinc-500 text-sm mb-4">No expenses tracked yet.</p>
          <button onClick={() => setShowForm(true)} className="bg-white/5 text-zinc-300 border border-white/10 hover:bg-white/10 rounded-lg px-5 py-2 text-sm transition-colors">Add First Expense</button>
        </div>
      ) : (
        <div className="space-y-2 animate-fade-in">
          {expenses.map((exp) => (
            <div key={exp.id} className="glass-card rounded-xl p-4 flex items-center justify-between group" data-testid={`expense-row-${exp.id}`}>
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                  <Receipt className="w-4 h-4 text-zinc-400" strokeWidth={1.5} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-zinc-200 truncate">{exp.vendor || exp.description || "Expense"}</p>
                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 text-zinc-500 capitalize shrink-0">{exp.category?.replace("_", " ")}</span>
                  </div>
                  <p className="text-[11px] text-zinc-600">{exp.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <p className="text-sm font-medium text-white/80 tabular-nums">{exp.currency} {exp.amount?.toFixed(2)}</p>
                <button data-testid={`delete-expense-${exp.id}`} onClick={() => deleteExpense(exp.id)} className="p-1.5 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-white/5 rounded-lg">
                  <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
