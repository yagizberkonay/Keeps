import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "@/App";
import axios from "axios";
import { Plus, FolderKanban, Users, Milestone, Trash2, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

function AddMilestoneDialog({ projectId, onAdded }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", amount: "", due_date: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/projects/${projectId}/milestones`, { ...form, amount: parseFloat(form.amount) || 0 }, { withCredentials: true });
      toast.success("Milestone added");
      setOpen(false);
      setForm({ name: "", amount: "", due_date: "" });
      onAdded();
    } catch { toast.error("Failed to add milestone"); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button data-testid={`add-milestone-${projectId}`} onClick={(e) => e.stopPropagation()} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1">
          <Plus className="w-3 h-3" /> Milestone
        </button>
      </DialogTrigger>
      <DialogContent className="glass-strong border-white/10" data-testid="add-milestone-dialog">
        <DialogHeader>
          <DialogTitle className="text-white/90 font-light" style={{ fontFamily: 'Outfit' }}>Add Milestone</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-widest text-zinc-500 font-medium">Name</Label>
            <Input data-testid="milestone-name-input" className="bg-black/20 border-white/10 text-zinc-200 placeholder:text-zinc-600" placeholder="Milestone name" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-zinc-500 font-medium">Amount</Label>
              <Input data-testid="milestone-amount-input" type="number" className="bg-black/20 border-white/10 text-zinc-200" placeholder="0" value={form.amount} onChange={(e) => setForm({...form, amount: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-zinc-500 font-medium">Due Date</Label>
              <Input data-testid="milestone-date-input" type="date" className="bg-black/20 border-white/10 text-zinc-200" value={form.due_date} onChange={(e) => setForm({...form, due_date: e.target.value})} />
            </div>
          </div>
          <button data-testid="submit-milestone" type="submit" className="w-full bg-zinc-100 text-zinc-900 hover:bg-white rounded-lg px-6 py-2.5 font-medium transition-colors">Add Milestone</button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function ProjectsPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/projects`, { withCredentials: true });
      setProjects(res.data);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const deleteProject = async (e, id) => {
    e.stopPropagation();
    try {
      await axios.delete(`${API}/projects/${id}`, { withCredentials: true });
      toast.success("Project deleted");
      fetchData();
    } catch { toast.error("Failed to delete"); }
  };

  return (
    <div data-testid="projects-page">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-fade-in">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-light tracking-tight text-white/90" style={{ fontFamily: 'Outfit' }}>Projects</h1>
          <p className="text-zinc-500 text-sm mt-1">Track project profitability and milestones</p>
        </div>
        <button data-testid="create-project-button" onClick={() => navigate("/projects/new")} className="bg-zinc-100 text-zinc-900 hover:bg-white rounded-lg px-5 py-2.5 font-medium text-sm transition-colors shadow-[0_0_15px_rgba(255,255,255,0.1)] flex items-center gap-2 self-start sm:self-auto">
          <Plus className="w-4 h-4" strokeWidth={1.5} /> New Project
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white/80 rounded-full" /></div>
      ) : projects.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 sm:p-16 text-center animate-fade-in">
          <FolderKanban className="w-12 h-12 text-zinc-700 mx-auto mb-4" strokeWidth={1} />
          <p className="text-zinc-500 text-sm mb-4">No projects yet. Create your first one.</p>
          <button onClick={() => navigate("/projects/new")} className="bg-white/5 text-zinc-300 border border-white/10 hover:bg-white/10 rounded-lg px-5 py-2 text-sm transition-colors">Get Started</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 animate-fade-in animate-fade-in-delay-1">
          {projects.map((proj) => {
            const budgetUsed = proj.budget > 0 ? Math.min((proj.spent / proj.budget) * 100, 100) : 0;
            const milestonesDone = proj.milestones?.filter(m => m.status === 'completed').length || 0;
            return (
              <div key={proj.id} className="glass-card rounded-2xl p-5 sm:p-6 group" data-testid={`project-card-${proj.id}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="min-w-0">
                    <h3 className="text-sm text-zinc-200 font-medium truncate">{proj.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Users className="w-3 h-3 text-zinc-600 shrink-0" strokeWidth={1.5} />
                      <span className="text-[11px] text-zinc-500 truncate">{proj.client_name}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0 ml-2">
                    <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      proj.status === 'active' ? 'bg-[#4A6E59]/15 text-[#4A6E59]' : 'bg-white/5 text-zinc-500'
                    }`}>{proj.status}</span>
                    <button data-testid={`delete-project-${proj.id}`} onClick={(e) => deleteProject(e, proj.id)} className="p-1 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>

                {proj.description && <p className="text-xs text-zinc-500 mb-4 line-clamp-2">{proj.description}</p>}

                {proj.budget > 0 && (
                  <div className="mb-4">
                    <div className="flex justify-between text-[10px] text-zinc-500 mb-2">
                      <span>Budget</span>
                      <span className="tabular-nums">${proj.spent?.toLocaleString()} / ${proj.budget?.toLocaleString()}</span>
                    </div>
                    <Progress value={budgetUsed} className="h-1.5 bg-white/5" />
                  </div>
                )}

                {proj.milestones?.length > 0 && (
                  <div className="mb-4 space-y-2">
                    <p className="text-[10px] uppercase tracking-widest text-zinc-600">Milestones ({milestonesDone}/{proj.milestones.length})</p>
                    {proj.milestones.slice(0, 3).map((ms) => (
                      <div key={ms.id} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-white/[0.02]">
                        <div className="flex items-center gap-2 min-w-0">
                          <Milestone className="w-3 h-3 text-zinc-600 shrink-0" strokeWidth={1.5} />
                          <span className="text-xs text-zinc-400 truncate">{ms.name}</span>
                        </div>
                        <span className="text-xs text-zinc-500 tabular-nums shrink-0 ml-2">${ms.amount?.toLocaleString()}</span>
                      </div>
                    ))}
                    {proj.milestones.length > 3 && <p className="text-[10px] text-zinc-600 text-center">+{proj.milestones.length - 3} more</p>}
                  </div>
                )}

                <AddMilestoneDialog projectId={proj.id} onAdded={fetchData} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
