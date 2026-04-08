import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, API } from "@/App";
import axios from "axios";
import { User, Lock, Database, Trash2, Download, Shield, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

function ProfileSection() {
  const { user, checkAuth } = useAuth();
  const [form, setForm] = useState({ name: user?.name || "", company: user?.company || "" });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.put(`${API}/settings/profile`, form, { withCredentials: true });
      await checkAuth();
      toast.success("Profile updated");
    } catch { toast.error("Failed to update"); }
    finally { setSaving(false); }
  };

  return (
    <div className="glass-card rounded-2xl p-6" data-testid="settings-profile">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center"><User className="w-5 h-5 text-zinc-400" strokeWidth={1.5} /></div>
        <div><h3 className="text-sm text-zinc-200 font-medium">Profile</h3><p className="text-[11px] text-zinc-600">Manage your personal information</p></div>
      </div>
      <form onSubmit={handleSave} className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase tracking-widest text-zinc-600">Email</Label>
          <Input className="bg-black/20 border-white/10 text-zinc-500 cursor-not-allowed" value={user?.email || ""} disabled />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-widest text-zinc-600">Full Name</Label>
            <Input data-testid="settings-name" className="bg-black/20 border-white/10 text-zinc-200 placeholder:text-zinc-600" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-widest text-zinc-600">Company</Label>
            <Input data-testid="settings-company" className="bg-black/20 border-white/10 text-zinc-200 placeholder:text-zinc-600" value={form.company} onChange={(e) => setForm({...form, company: e.target.value})} />
          </div>
        </div>
        <button data-testid="save-profile-btn" type="submit" disabled={saving} className="bg-zinc-100 text-zinc-900 hover:bg-white rounded-lg px-5 py-2 font-medium text-sm transition-colors disabled:opacity-50">
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}

function SecuritySection() {
  const [form, setForm] = useState({ current_password: "", new_password: "", confirm_password: "" });
  const [saving, setSaving] = useState(false);

  const handleChange = async (e) => {
    e.preventDefault();
    if (form.new_password !== form.confirm_password) { toast.error("Passwords don't match"); return; }
    if (form.new_password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setSaving(true);
    try {
      await axios.put(`${API}/settings/password`, { current_password: form.current_password, new_password: form.new_password }, { withCredentials: true });
      toast.success("Password changed");
      setForm({ current_password: "", new_password: "", confirm_password: "" });
    } catch (err) { toast.error(err.response?.data?.detail || "Failed to change password"); }
    finally { setSaving(false); }
  };

  return (
    <div className="glass-card rounded-2xl p-6" data-testid="settings-security">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center"><Lock className="w-5 h-5 text-zinc-400" strokeWidth={1.5} /></div>
        <div><h3 className="text-sm text-zinc-200 font-medium">Password</h3><p className="text-[11px] text-zinc-600">Change your account password</p></div>
      </div>
      <form onSubmit={handleChange} className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase tracking-widest text-zinc-600">Current Password</Label>
          <Input data-testid="current-password" type="password" className="bg-black/20 border-white/10 text-zinc-200" placeholder="Enter current password" value={form.current_password} onChange={(e) => setForm({...form, current_password: e.target.value})} required />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-widest text-zinc-600">New Password</Label>
            <Input data-testid="new-password" type="password" className="bg-black/20 border-white/10 text-zinc-200" placeholder="Min. 6 characters" value={form.new_password} onChange={(e) => setForm({...form, new_password: e.target.value})} required />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-widest text-zinc-600">Confirm Password</Label>
            <Input data-testid="confirm-password" type="password" className="bg-black/20 border-white/10 text-zinc-200" placeholder="Repeat new password" value={form.confirm_password} onChange={(e) => setForm({...form, confirm_password: e.target.value})} required />
          </div>
        </div>
        <button data-testid="change-password-btn" type="submit" disabled={saving} className="bg-zinc-100 text-zinc-900 hover:bg-white rounded-lg px-5 py-2 font-medium text-sm transition-colors disabled:opacity-50">
          {saving ? "Changing..." : "Change Password"}
        </button>
      </form>
    </div>
  );
}

function DataSection() {
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const exportData = async () => {
    setExporting(true);
    try {
      const res = await axios.get(`${API}/settings/export`, { withCredentials: true });
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `keeps-backup-${new Date().toISOString().slice(0,10)}.json`;
      a.click(); URL.revokeObjectURL(url);
      toast.success("Data exported");
    } catch { toast.error("Export failed"); }
    finally { setExporting(false); }
  };

  const deleteAllData = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    try {
      await axios.delete(`${API}/settings/data`, { withCredentials: true });
      toast.success("All data deleted");
      setConfirmDelete(false);
    } catch { toast.error("Failed to delete data"); }
    finally { setDeleting(false); }
  };

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-2xl p-6" data-testid="settings-export">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center"><Database className="w-5 h-5 text-zinc-400" strokeWidth={1.5} /></div>
          <div><h3 className="text-sm text-zinc-200 font-medium">Export Data</h3><p className="text-[11px] text-zinc-600">Download all your data as JSON backup</p></div>
        </div>
        <p className="text-xs text-zinc-500 mb-4">Includes invoices, projects, clients, tax vault, and chat history.</p>
        <button data-testid="export-data-btn" onClick={exportData} disabled={exporting} className="bg-white/5 text-zinc-300 border border-white/10 hover:bg-white/10 rounded-lg px-5 py-2.5 text-sm flex items-center gap-2 transition-colors disabled:opacity-50">
          <Download className="w-4 h-4" strokeWidth={1.5} /> {exporting ? "Exporting..." : "Export All Data"}
        </button>
      </div>

      <div className="glass-card rounded-2xl p-6 border-red-500/10" data-testid="settings-delete-data">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center"><Trash2 className="w-5 h-5 text-red-400/70" strokeWidth={1.5} /></div>
          <div><h3 className="text-sm text-red-400/80 font-medium">Delete All Data</h3><p className="text-[11px] text-zinc-600">Permanently remove all invoices, projects, and clients</p></div>
        </div>
        {confirmDelete && (
          <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4 mb-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400/70 shrink-0 mt-0.5" strokeWidth={1.5} />
            <div><p className="text-sm text-red-400/80 font-medium">Are you sure?</p><p className="text-xs text-zinc-500 mt-0.5">This will permanently delete all your invoices, projects, clients, vault data, and chat history. This cannot be undone.</p></div>
          </div>
        )}
        <button data-testid="delete-data-btn" onClick={deleteAllData} disabled={deleting} className={`${confirmDelete ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-white/5 text-zinc-400 hover:bg-white/10'} border border-white/10 rounded-lg px-5 py-2.5 text-sm flex items-center gap-2 transition-colors disabled:opacity-50`}>
          <Trash2 className="w-4 h-4" strokeWidth={1.5} /> {deleting ? "Deleting..." : confirmDelete ? "Confirm Delete" : "Delete All Data"}
        </button>
        {confirmDelete && <button onClick={() => setConfirmDelete(false)} className="ml-3 text-xs text-zinc-500 hover:text-zinc-300 mt-3">Cancel</button>}
      </div>
    </div>
  );
}

function AccountSection() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const deleteAccount = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    try {
      await axios.delete(`${API}/settings/account`, { withCredentials: true });
      toast.success("Account deleted");
      await logout();
      navigate("/auth");
    } catch { toast.error("Failed to delete account"); }
    finally { setDeleting(false); }
  };

  return (
    <div className="glass-card rounded-2xl p-6 border-red-500/10" data-testid="settings-account">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center"><Shield className="w-5 h-5 text-red-400/70" strokeWidth={1.5} /></div>
        <div><h3 className="text-sm text-red-400/80 font-medium">Delete Account</h3><p className="text-[11px] text-zinc-600">Permanently delete your account and all associated data</p></div>
      </div>
      {confirmDelete && (
        <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4 mb-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400/70 shrink-0 mt-0.5" strokeWidth={1.5} />
          <p className="text-xs text-zinc-500">This action is <strong className="text-red-400/80">irreversible</strong>. Your account, all data, and sessions will be permanently deleted.</p>
        </div>
      )}
      <button data-testid="delete-account-btn" onClick={deleteAccount} disabled={deleting} className={`${confirmDelete ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-zinc-400'} border border-white/10 rounded-lg px-5 py-2.5 text-sm flex items-center gap-2 transition-colors`}>
        <Trash2 className="w-4 h-4" strokeWidth={1.5} /> {deleting ? "Deleting..." : confirmDelete ? "Confirm Delete Account" : "Delete Account"}
      </button>
      {confirmDelete && <button onClick={() => setConfirmDelete(false)} className="ml-3 text-xs text-zinc-500 hover:text-zinc-300 mt-3">Cancel</button>}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div data-testid="settings-page">
      <div className="mb-8 animate-fade-in">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-light tracking-tight text-white/90" style={{ fontFamily: 'Outfit' }}>Settings</h1>
        <p className="text-zinc-500 text-sm mt-1">Manage your account and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="animate-fade-in animate-fade-in-delay-1">
        <TabsList className="bg-white/[0.03] border border-white/10 rounded-xl p-1 mb-8 flex-wrap h-auto" data-testid="settings-tabs">
          <TabsTrigger value="profile" className="data-[state=active]:bg-white/10 data-[state=active]:text-white rounded-lg text-zinc-500 text-xs">Profile</TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-white/10 data-[state=active]:text-white rounded-lg text-zinc-500 text-xs">Security</TabsTrigger>
          <TabsTrigger value="data" className="data-[state=active]:bg-white/10 data-[state=active]:text-white rounded-lg text-zinc-500 text-xs">Data</TabsTrigger>
          <TabsTrigger value="account" className="data-[state=active]:bg-white/10 data-[state=active]:text-white rounded-lg text-zinc-500 text-xs">Account</TabsTrigger>
        </TabsList>
        <TabsContent value="profile"><ProfileSection /></TabsContent>
        <TabsContent value="security"><SecuritySection /></TabsContent>
        <TabsContent value="data"><DataSection /></TabsContent>
        <TabsContent value="account"><AccountSection /></TabsContent>
      </Tabs>
    </div>
  );
}
