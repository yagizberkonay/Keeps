import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "@/App";
import { useLang } from "@/lib/i18n";
import axios from "axios";
import { Plus, Repeat, Trash2, Play, Pause, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const frequencies = ["weekly", "monthly", "quarterly", "yearly"];
const currencies = ["USD", "EUR", "GBP", "TRY", "JPY", "CAD", "AUD", "CHF"];

export default function RecurringPage() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    client_name: "", client_email: "", currency: "USD",
    tax_rate: 0, frequency: "monthly", items: [{ description: "", quantity: 1, unit_price: 0 }],
    notes: ""
  });

  const set = (f, v) => setForm(prev => ({ ...prev, [f]: v }));

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/recurring`, { withCredentials: true });
      setTemplates(res.data);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const addItem = () => setForm(prev => ({ ...prev, items: [...prev.items, { description: "", quantity: 1, unit_price: 0 }] }));
  const updateItem = (i, field, val) => {
    setForm(prev => { const items = [...prev.items]; items[i] = { ...items[i], [field]: val }; return { ...prev, items }; });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.client_name) { toast.error("Client name required"); return; }
    setSaving(true);
    try {
      await axios.post(`${API}/recurring`, { ...form, tax_rate: parseFloat(form.tax_rate) || 0 }, { withCredentials: true });
      toast.success("Recurring template created");
      setShowForm(false);
      setForm({ client_name: "", client_email: "", currency: "USD", tax_rate: 0, frequency: "monthly", items: [{ description: "", quantity: 1, unit_price: 0 }], notes: "" });
      fetchTemplates();
    } catch { toast.error("Failed to create template"); }
    finally { setSaving(false); }
  };

  const generateInvoice = async (id) => {
    try {
      const res = await axios.post(`${API}/recurring/${id}/generate`, {}, { withCredentials: true });
      toast.success(`Invoice ${res.data.invoice_number} generated`);
      navigate(`/invoices/${res.data.id}`);
    } catch { toast.error("Failed to generate invoice"); }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      await axios.put(`${API}/recurring/${id}`, { status: currentStatus === "active" ? "paused" : "active" }, { withCredentials: true });
      toast.success("Status updated");
      fetchTemplates();
    } catch { toast.error("Failed to update"); }
  };

  const deleteTemplate = async (id) => {
    try {
      await axios.delete(`${API}/recurring/${id}`, { withCredentials: true });
      toast.success("Template deleted");
      fetchTemplates();
    } catch { toast.error("Failed to delete"); }
  };

  const calcTotal = (items, taxRate) => {
    const sub = items.reduce((s, it) => s + (it.quantity * it.unit_price), 0);
    return sub + sub * ((parseFloat(taxRate) || 0) / 100);
  };

  return (
    <div data-testid="recurring-page">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-fade-in">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-light tracking-tight text-white/90" style={{ fontFamily: 'Outfit' }}>{t("recurring_invoices")}</h1>
          <p className="text-zinc-500 text-sm mt-1">{t("manage_recurring")}</p>
        </div>
        <button data-testid="toggle-recurring-form" onClick={() => setShowForm(!showForm)} className="bg-zinc-100 text-zinc-900 hover:bg-white rounded-lg px-5 py-2.5 font-medium text-sm transition-colors shadow-[0_0_15px_rgba(255,255,255,0.1)] flex items-center gap-2 self-start sm:self-auto">
          <Plus className="w-4 h-4" strokeWidth={1.5} /> {t("create_recurring")}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 mb-8 animate-fade-in" data-testid="recurring-create-form">
          <h2 className="text-xs uppercase tracking-widest text-zinc-500 font-medium mb-5">{t("create_recurring")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-zinc-600">{t("client_name")} *</Label>
              <Input data-testid="recurring-client" className="bg-black/20 border-white/10 text-zinc-200 placeholder:text-zinc-600" placeholder="Client" value={form.client_name} onChange={(e) => set("client_name", e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-zinc-600">{t("email")}</Label>
              <Input data-testid="recurring-email" className="bg-black/20 border-white/10 text-zinc-200 placeholder:text-zinc-600" placeholder="Email" value={form.client_email} onChange={(e) => set("client_email", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-zinc-600">{t("frequency")}</Label>
              <Select value={form.frequency} onValueChange={(v) => set("frequency", v)}>
                <SelectTrigger data-testid="recurring-frequency" className="bg-black/20 border-white/10 text-zinc-200"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-zinc-900 border-white/10">
                  {frequencies.map(f => <SelectItem key={f} value={f} className="text-zinc-300 focus:bg-white/10 capitalize">{t(f)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-zinc-600">{t("currency")}</Label>
              <Select value={form.currency} onValueChange={(v) => set("currency", v)}>
                <SelectTrigger className="bg-black/20 border-white/10 text-zinc-200"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-zinc-900 border-white/10">{currencies.map(c => <SelectItem key={c} value={c} className="text-zinc-300 focus:bg-white/10">{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          {/* Items */}
          <div className="space-y-2 mb-5">
            <Label className="text-[10px] uppercase tracking-widest text-zinc-600">{t("line_items")}</Label>
            {form.items.map((item, i) => (
              <div key={i} className="grid grid-cols-3 gap-2">
                <Input className="bg-black/20 border-white/10 text-zinc-200 text-sm placeholder:text-zinc-600" placeholder={t("description")} value={item.description} onChange={(e) => updateItem(i, "description", e.target.value)} />
                <Input type="number" className="bg-black/20 border-white/10 text-zinc-200 text-sm" placeholder={t("quantity")} value={item.quantity} onChange={(e) => updateItem(i, "quantity", parseFloat(e.target.value) || 0)} />
                <Input type="number" className="bg-black/20 border-white/10 text-zinc-200 text-sm" placeholder={t("unit_price")} value={item.unit_price} onChange={(e) => updateItem(i, "unit_price", parseFloat(e.target.value) || 0)} />
              </div>
            ))}
            <button type="button" onClick={addItem} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">{t("add_item")}</button>
          </div>
          <button data-testid="submit-recurring" type="submit" disabled={saving} className="bg-zinc-100 text-zinc-900 hover:bg-white rounded-lg px-6 py-2.5 font-medium text-sm transition-colors disabled:opacity-50">
            {saving ? t("loading") : t("create")}
          </button>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white/80 rounded-full" /></div>
      ) : templates.length === 0 && !showForm ? (
        <div className="glass-card rounded-2xl p-12 sm:p-16 text-center animate-fade-in">
          <Repeat className="w-12 h-12 text-zinc-700 mx-auto mb-4" strokeWidth={1} />
          <p className="text-zinc-500 text-sm mb-4">{t("no_data")}</p>
        </div>
      ) : (
        <div className="space-y-3 animate-fade-in animate-fade-in-delay-1">
          {templates.map((tmpl) => (
            <div key={tmpl.id} className="glass-card rounded-xl p-5 group" data-testid={`recurring-row-${tmpl.id}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                    <Repeat className="w-5 h-5 text-zinc-400" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-200 font-medium">{tmpl.client_name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#3B5A70]/15 text-[#3B5A70] capitalize">{t(tmpl.frequency)}</span>
                      <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${tmpl.status === 'active' ? 'bg-[#4A6E59]/15 text-[#4A6E59]' : 'bg-white/5 text-zinc-500'}`}>{t(tmpl.status)}</span>
                      {tmpl.next_date && <span className="text-[10px] text-zinc-600 flex items-center gap-1"><Clock className="w-3 h-3" />{tmpl.next_date}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-white/80 tabular-nums mr-2">{tmpl.currency} {calcTotal(tmpl.items || [], tmpl.tax_rate).toFixed(2)}</p>
                  <button data-testid={`generate-${tmpl.id}`} onClick={() => generateInvoice(tmpl.id)} className="p-2 text-zinc-500 hover:text-[#4A6E59] hover:bg-white/5 rounded-lg transition-colors" title="Generate Invoice">
                    <Play className="w-4 h-4" strokeWidth={1.5} />
                  </button>
                  <button onClick={() => toggleStatus(tmpl.id, tmpl.status)} className="p-2 text-zinc-500 hover:text-[#A18252] hover:bg-white/5 rounded-lg transition-colors" title="Toggle Status">
                    {tmpl.status === "active" ? <Pause className="w-4 h-4" strokeWidth={1.5} /> : <Play className="w-4 h-4" strokeWidth={1.5} />}
                  </button>
                  <button onClick={() => deleteTemplate(tmpl.id)} className="p-2 text-zinc-500 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                    <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
