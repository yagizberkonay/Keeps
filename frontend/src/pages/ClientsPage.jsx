import { useState, useEffect, useCallback } from "react";
import { API } from "@/App";
import axios from "axios";
import { Plus, Users, Mail, Phone, Building2, Trash2, Globe, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", company: "", phone: "", address: "", website: "", notes: "" });
  const [saving, setSaving] = useState(false);

  const fetchClients = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/clients`, { withCredentials: true });
      setClients(res.data);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const set = (field, val) => setForm(prev => ({ ...prev, [field]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) { toast.error("Client name is required"); return; }
    setSaving(true);
    try {
      await axios.post(`${API}/clients`, form, { withCredentials: true });
      toast.success("Client added");
      setForm({ name: "", email: "", company: "", phone: "", address: "", website: "", notes: "" });
      setShowForm(false);
      fetchClients();
    } catch { toast.error("Failed to add client"); }
    finally { setSaving(false); }
  };

  const deleteClient = async (id) => {
    try {
      await axios.delete(`${API}/clients/${id}`, { withCredentials: true });
      toast.success("Client removed");
      fetchClients();
    } catch { toast.error("Failed to delete"); }
  };

  return (
    <div data-testid="clients-page">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-fade-in">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-light tracking-tight text-white/90" style={{ fontFamily: 'Outfit' }}>Clients</h1>
          <p className="text-zinc-500 text-sm mt-1">Manage your client directory</p>
        </div>
        <button data-testid="toggle-client-form" onClick={() => setShowForm(!showForm)} className="bg-zinc-100 text-zinc-900 hover:bg-white rounded-lg px-5 py-2.5 font-medium text-sm transition-colors shadow-[0_0_15px_rgba(255,255,255,0.1)] flex items-center gap-2 self-start sm:self-auto">
          <Plus className="w-4 h-4" strokeWidth={1.5} /> {showForm ? "Cancel" : "New Client"}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 mb-8 animate-fade-in" data-testid="client-create-form">
          <h2 className="text-xs uppercase tracking-widest text-zinc-500 font-medium mb-5">New Client</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-zinc-600">Name *</Label>
              <Input data-testid="client-name-input" className="bg-black/20 border-white/10 text-zinc-200 placeholder:text-zinc-600" placeholder="Full name" value={form.name} onChange={(e) => set("name", e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-zinc-600">Email</Label>
              <Input data-testid="client-email-input" type="email" className="bg-black/20 border-white/10 text-zinc-200 placeholder:text-zinc-600" placeholder="client@email.com" value={form.email} onChange={(e) => set("email", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-zinc-600">Company</Label>
              <Input data-testid="client-company-input" className="bg-black/20 border-white/10 text-zinc-200 placeholder:text-zinc-600" placeholder="Company name" value={form.company} onChange={(e) => set("company", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-zinc-600">Phone</Label>
              <Input data-testid="client-phone-input" className="bg-black/20 border-white/10 text-zinc-200 placeholder:text-zinc-600" placeholder="+1 234 567 890" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-zinc-600">Website</Label>
              <Input data-testid="client-website-input" className="bg-black/20 border-white/10 text-zinc-200 placeholder:text-zinc-600" placeholder="https://..." value={form.website} onChange={(e) => set("website", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-zinc-600">Address</Label>
              <Input data-testid="client-address-input" className="bg-black/20 border-white/10 text-zinc-200 placeholder:text-zinc-600" placeholder="Street, City, Country" value={form.address} onChange={(e) => set("address", e.target.value)} />
            </div>
            <div className="sm:col-span-2 lg:col-span-3 space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-zinc-600">Notes</Label>
              <Textarea data-testid="client-notes-input" className="bg-black/20 border-white/10 text-zinc-200 placeholder:text-zinc-600 min-h-[60px]" placeholder="Additional notes..." value={form.notes} onChange={(e) => set("notes", e.target.value)} />
            </div>
          </div>
          <button data-testid="submit-client" type="submit" disabled={saving} className="mt-5 bg-zinc-100 text-zinc-900 hover:bg-white rounded-lg px-6 py-2.5 font-medium text-sm transition-colors shadow-[0_0_15px_rgba(255,255,255,0.1)] disabled:opacity-50">
            {saving ? "Saving..." : "Add Client"}
          </button>
        </form>
      )}

      {/* Client List */}
      {loading ? (
        <div className="flex justify-center py-16"><div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white/80 rounded-full" /></div>
      ) : clients.length === 0 && !showForm ? (
        <div className="glass-card rounded-2xl p-16 text-center animate-fade-in">
          <Users className="w-12 h-12 text-zinc-700 mx-auto mb-4" strokeWidth={1} />
          <p className="text-zinc-500 text-sm">No clients yet. Add your first client.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in animate-fade-in-delay-1">
          {clients.map((c) => (
            <div key={c.id} className="glass-card rounded-2xl p-5 group" data-testid={`client-card-${c.id}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-sm text-zinc-400 font-medium">
                    {c.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm text-zinc-200 font-medium">{c.name}</p>
                    {c.company && <p className="text-[11px] text-zinc-500">{c.company}</p>}
                  </div>
                </div>
                <button data-testid={`delete-client-${c.id}`} onClick={() => deleteClient(c.id)} className="p-1.5 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-white/5 rounded-lg">
                  <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                </button>
              </div>
              <div className="space-y-1.5 text-xs">
                {c.email && <div className="flex items-center gap-2 text-zinc-500"><Mail className="w-3 h-3" strokeWidth={1.5} />{c.email}</div>}
                {c.phone && <div className="flex items-center gap-2 text-zinc-500"><Phone className="w-3 h-3" strokeWidth={1.5} />{c.phone}</div>}
                {c.address && <div className="flex items-center gap-2 text-zinc-500"><MapPin className="w-3 h-3" strokeWidth={1.5} />{c.address}</div>}
                {c.website && <div className="flex items-center gap-2 text-zinc-500"><Globe className="w-3 h-3" strokeWidth={1.5} />{c.website}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
