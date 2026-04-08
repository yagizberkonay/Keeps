import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "@/App";
import axios from "axios";
import { ArrowLeft, Plus, X, Calendar, DollarSign, Tag, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function ProjectCreatePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState({
    name: "", client_name: "", budget: "", description: "",
    start_date: "", end_date: "", category: "development", priority: "medium"
  });
  const [milestones, setMilestones] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${API}/clients`, { withCredentials: true });
        setClients(res.data);
      } catch {}
    })();
  }, []);

  const set = (field, val) => setForm(prev => ({ ...prev, [field]: val }));
  const addMilestone = () => setMilestones(prev => [...prev, { name: "", amount: "", due_date: "" }]);
  const removeMilestone = (i) => setMilestones(prev => prev.filter((_, idx) => idx !== i));
  const updateMilestone = (i, field, val) => {
    setMilestones(prev => { const u = [...prev]; u[i] = { ...u[i], [field]: val }; return u; });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.client_name) { toast.error("Project name and client are required"); return; }
    setLoading(true);
    try {
      const res = await axios.post(`${API}/projects`, {
        ...form, budget: parseFloat(form.budget) || 0
      }, { withCredentials: true });
      // Add milestones
      for (const ms of milestones.filter(m => m.name)) {
        await axios.post(`${API}/projects/${res.data.id}/milestones`, {
          name: ms.name, amount: parseFloat(ms.amount) || 0, due_date: ms.due_date
        }, { withCredentials: true });
      }
      toast.success("Project created successfully");
      navigate("/projects");
    } catch { toast.error("Failed to create project"); }
    finally { setLoading(false); }
  };

  return (
    <div data-testid="project-create-page">
      <div className="flex items-center gap-4 mb-8 animate-fade-in">
        <button data-testid="back-to-projects" onClick={() => navigate("/projects")} className="text-zinc-500 hover:text-zinc-300 p-2 hover:bg-white/5 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
        </button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-white/90" style={{ fontFamily: 'Outfit' }}>New Project</h1>
          <p className="text-zinc-500 text-sm mt-0.5">Set up a new project with milestones and budget</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl space-y-8 animate-fade-in animate-fade-in-delay-1">
        {/* Project Info */}
        <section className="glass-card rounded-2xl p-6">
          <h2 className="text-xs uppercase tracking-widest text-zinc-500 font-medium mb-5 flex items-center gap-2">
            <Tag className="w-4 h-4" strokeWidth={1.5} /> Project Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-zinc-600">Project Name *</Label>
              <Input data-testid="project-name-input" className="bg-black/20 border-white/10 text-zinc-200 placeholder:text-zinc-600" placeholder="e.g., Website Redesign" value={form.name} onChange={(e) => set("name", e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-zinc-600">Category</Label>
              <Select value={form.category} onValueChange={(v) => set("category", v)}>
                <SelectTrigger data-testid="project-category" className="bg-black/20 border-white/10 text-zinc-200"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-zinc-900 border-white/10">
                  {["development", "design", "marketing", "consulting", "content", "other"].map(c => (
                    <SelectItem key={c} value={c} className="text-zinc-300 focus:bg-white/10 capitalize">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-zinc-600">Priority</Label>
              <Select value={form.priority} onValueChange={(v) => set("priority", v)}>
                <SelectTrigger data-testid="project-priority" className="bg-black/20 border-white/10 text-zinc-200"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-zinc-900 border-white/10">
                  {["low", "medium", "high", "urgent"].map(p => (
                    <SelectItem key={p} value={p} className="text-zinc-300 focus:bg-white/10 capitalize">{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-zinc-600">Description</Label>
              <Textarea data-testid="project-desc-input" className="bg-black/20 border-white/10 text-zinc-200 placeholder:text-zinc-600 min-h-[80px]" placeholder="Project scope and objectives..." value={form.description} onChange={(e) => set("description", e.target.value)} />
            </div>
          </div>
        </section>

        {/* Client */}
        <section className="glass-card rounded-2xl p-6">
          <h2 className="text-xs uppercase tracking-widest text-zinc-500 font-medium mb-5 flex items-center gap-2">
            <Users className="w-4 h-4" strokeWidth={1.5} /> Client
          </h2>
          {clients.length > 0 && (
            <div className="mb-4">
              <Label className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1.5 block">Select Existing Client</Label>
              <Select onValueChange={(v) => { const c = clients.find(cl => cl.id === v); if (c) set("client_name", c.name); }}>
                <SelectTrigger data-testid="select-project-client" className="bg-black/20 border-white/10 text-zinc-200"><SelectValue placeholder="Choose a client..." /></SelectTrigger>
                <SelectContent className="bg-zinc-900 border-white/10">{clients.map(c => <SelectItem key={c.id} value={c.id} className="text-zinc-300 focus:bg-white/10">{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-widest text-zinc-600">Client Name *</Label>
            <Input data-testid="project-client-input" className="bg-black/20 border-white/10 text-zinc-200 placeholder:text-zinc-600" placeholder="Client name" value={form.client_name} onChange={(e) => set("client_name", e.target.value)} required />
          </div>
        </section>

        {/* Budget & Timeline */}
        <section className="glass-card rounded-2xl p-6">
          <h2 className="text-xs uppercase tracking-widest text-zinc-500 font-medium mb-5 flex items-center gap-2">
            <DollarSign className="w-4 h-4" strokeWidth={1.5} /> Budget & Timeline
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-zinc-600">Budget (USD)</Label>
              <Input data-testid="project-budget-input" type="number" min="0" className="bg-black/20 border-white/10 text-zinc-200 placeholder:text-zinc-600" placeholder="0" value={form.budget} onChange={(e) => set("budget", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-zinc-600">Start Date</Label>
              <Input data-testid="project-start-date" type="date" className="bg-black/20 border-white/10 text-zinc-200" value={form.start_date} onChange={(e) => set("start_date", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-zinc-600">End Date</Label>
              <Input data-testid="project-end-date" type="date" className="bg-black/20 border-white/10 text-zinc-200" value={form.end_date} onChange={(e) => set("end_date", e.target.value)} />
            </div>
          </div>
        </section>

        {/* Milestones */}
        <section className="glass-card rounded-2xl p-6">
          <h2 className="text-xs uppercase tracking-widest text-zinc-500 font-medium mb-5 flex items-center gap-2">
            <Calendar className="w-4 h-4" strokeWidth={1.5} /> Milestones
          </h2>
          {milestones.length > 0 && (
            <div className="space-y-3 mb-4">
              {milestones.map((ms, i) => (
                <div key={i} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center glass-card rounded-xl p-3">
                  <div className="sm:col-span-5">
                    <Label className="text-[10px] text-zinc-600 sm:hidden mb-1 block">Name</Label>
                    <Input data-testid={`milestone-name-${i}`} className="bg-black/20 border-white/10 text-zinc-200 text-sm placeholder:text-zinc-600" placeholder="Milestone name" value={ms.name} onChange={(e) => updateMilestone(i, "name", e.target.value)} />
                  </div>
                  <div className="sm:col-span-3">
                    <Label className="text-[10px] text-zinc-600 sm:hidden mb-1 block">Amount</Label>
                    <Input data-testid={`milestone-amount-${i}`} type="number" className="bg-black/20 border-white/10 text-zinc-200 text-sm" placeholder="Amount" value={ms.amount} onChange={(e) => updateMilestone(i, "amount", e.target.value)} />
                  </div>
                  <div className="sm:col-span-3">
                    <Label className="text-[10px] text-zinc-600 sm:hidden mb-1 block">Due Date</Label>
                    <Input data-testid={`milestone-date-${i}`} type="date" className="bg-black/20 border-white/10 text-zinc-200 text-sm" value={ms.due_date} onChange={(e) => updateMilestone(i, "due_date", e.target.value)} />
                  </div>
                  <div className="sm:col-span-1 flex justify-end">
                    <button type="button" onClick={() => removeMilestone(i)} className="text-zinc-600 hover:text-red-400 p-1.5 hover:bg-white/5 rounded-lg transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <button type="button" onClick={addMilestone} data-testid="add-milestone-btn" className="text-xs text-zinc-500 hover:text-zinc-300 bg-white/[0.03] hover:bg-white/[0.06] border border-dashed border-white/10 rounded-xl px-4 py-3 w-full flex items-center justify-center gap-1.5 transition-colors">
            <Plus className="w-4 h-4" /> Add Milestone
          </button>
        </section>

        {/* Submit */}
        <button data-testid="submit-project" type="submit" disabled={loading} className="w-full bg-zinc-100 text-zinc-900 hover:bg-white rounded-xl px-6 py-3 font-medium transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)] disabled:opacity-50 text-sm">
          {loading ? "Creating Project..." : "Create Project"}
        </button>
      </form>
    </div>
  );
}
