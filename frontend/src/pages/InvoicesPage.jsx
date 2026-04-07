import { useState, useEffect, useCallback } from "react";
import { API } from "@/App";
import axios from "axios";
import { Plus, FileText, Send, CheckCircle, Trash2, X, DollarSign } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

const currencies = ["USD", "EUR", "GBP", "TRY", "JPY", "CAD", "AUD", "CHF"];

const statusColors = {
  draft: "bg-white/5 text-zinc-500",
  sent: "bg-[#3B5A70]/15 text-[#3B5A70]",
  paid: "bg-[#4A6E59]/15 text-[#4A6E59]",
  overdue: "bg-red-500/15 text-red-400/80",
};

function CreateInvoiceDialog({ onCreated }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ client_name: "", client_email: "", currency: "USD", tax_rate: 0, due_date: "", notes: "" });
  const [items, setItems] = useState([{ description: "", quantity: 1, unit_price: 0 }]);
  const [loading, setLoading] = useState(false);

  const addItem = () => setItems([...items, { description: "", quantity: 1, unit_price: 0 }]);
  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i, field, value) => {
    const updated = [...items];
    updated[i][field] = value;
    setItems(updated);
  };

  const subtotal = items.reduce((sum, it) => sum + (it.quantity * it.unit_price), 0);
  const taxAmount = subtotal * (form.tax_rate / 100);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API}/invoices`, { ...form, items, tax_rate: parseFloat(form.tax_rate) || 0 }, { withCredentials: true });
      toast.success("Invoice created");
      setOpen(false);
      setForm({ client_name: "", client_email: "", currency: "USD", tax_rate: 0, due_date: "", notes: "" });
      setItems([{ description: "", quantity: 1, unit_price: 0 }]);
      onCreated();
    } catch {
      toast.error("Failed to create invoice");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button data-testid="create-invoice-button" className="bg-zinc-100 text-zinc-900 hover:bg-white rounded-lg px-5 py-2.5 font-medium text-sm transition-colors shadow-[0_0_15px_rgba(255,255,255,0.1)] flex items-center gap-2">
          <Plus className="w-4 h-4" strokeWidth={1.5} /> New Invoice
        </button>
      </DialogTrigger>
      <DialogContent className="glass-strong border-white/10 max-w-2xl max-h-[85vh] overflow-y-auto" data-testid="create-invoice-dialog">
        <DialogHeader>
          <DialogTitle className="text-white/90 font-light tracking-tight" style={{ fontFamily: 'Outfit' }}>Create Invoice</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-zinc-500 font-medium">Client Name</Label>
              <Input data-testid="invoice-client-name" className="bg-black/20 border-white/10 text-zinc-200 placeholder:text-zinc-600" placeholder="Client name" value={form.client_name} onChange={(e) => setForm({...form, client_name: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-zinc-500 font-medium">Client Email</Label>
              <Input data-testid="invoice-client-email" className="bg-black/20 border-white/10 text-zinc-200 placeholder:text-zinc-600" placeholder="email@client.com" value={form.client_email} onChange={(e) => setForm({...form, client_email: e.target.value})} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-zinc-500 font-medium">Currency</Label>
              <Select value={form.currency} onValueChange={(val) => setForm({...form, currency: val})}>
                <SelectTrigger data-testid="invoice-currency-select" className="bg-black/20 border-white/10 text-zinc-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-white/10">
                  {currencies.map(c => <SelectItem key={c} value={c} className="text-zinc-300 focus:bg-white/10 focus:text-white">{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-zinc-500 font-medium">Tax Rate %</Label>
              <Input data-testid="invoice-tax-rate" type="number" className="bg-black/20 border-white/10 text-zinc-200" placeholder="0" value={form.tax_rate} onChange={(e) => setForm({...form, tax_rate: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-zinc-500 font-medium">Due Date</Label>
              <Input data-testid="invoice-due-date" type="date" className="bg-black/20 border-white/10 text-zinc-200" value={form.due_date} onChange={(e) => setForm({...form, due_date: e.target.value})} />
            </div>
          </div>

          {/* Line Items */}
          <div>
            <Label className="text-xs uppercase tracking-widest text-zinc-500 font-medium mb-3 block">Line Items</Label>
            <div className="space-y-3">
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5">
                    <Input data-testid={`invoice-item-desc-${i}`} className="bg-black/20 border-white/10 text-zinc-200 text-sm placeholder:text-zinc-600" placeholder="Description" value={item.description} onChange={(e) => updateItem(i, "description", e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <Input data-testid={`invoice-item-qty-${i}`} type="number" className="bg-black/20 border-white/10 text-zinc-200 text-sm" placeholder="Qty" value={item.quantity} onChange={(e) => updateItem(i, "quantity", parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="col-span-3">
                    <Input data-testid={`invoice-item-price-${i}`} type="number" className="bg-black/20 border-white/10 text-zinc-200 text-sm" placeholder="Price" value={item.unit_price} onChange={(e) => updateItem(i, "unit_price", parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="col-span-1 text-right text-sm text-zinc-400 tabular-nums pb-2">
                    ${(item.quantity * item.unit_price).toFixed(0)}
                  </div>
                  <div className="col-span-1">
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeItem(i)} className="text-zinc-600 hover:text-red-400 transition-colors p-2">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button type="button" onClick={addItem} data-testid="add-invoice-item" className="mt-3 text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1">
              <Plus className="w-3 h-3" /> Add item
            </button>
          </div>

          {/* Totals */}
          <div className="glass-card rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm text-zinc-400">
              <span>Subtotal</span>
              <span className="tabular-nums">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-zinc-400">
              <span>Tax ({form.tax_rate || 0}%)</span>
              <span className="tabular-nums">${taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-white/90 font-medium pt-2 border-t border-white/10">
              <span>Total</span>
              <span className="tabular-nums">${(subtotal + taxAmount).toFixed(2)}</span>
            </div>
          </div>

          <button data-testid="submit-invoice" type="submit" disabled={loading} className="w-full bg-zinc-100 text-zinc-900 hover:bg-white rounded-lg px-6 py-2.5 font-medium transition-colors shadow-[0_0_15px_rgba(255,255,255,0.1)] disabled:opacity-50">
            {loading ? "Creating..." : "Create Invoice"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchInvoices = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/invoices`, { withCredentials: true });
      setInvoices(res.data);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  const updateStatus = async (id, status) => {
    try {
      await axios.put(`${API}/invoices/${id}`, { status }, { withCredentials: true });
      toast.success(`Invoice marked as ${status}`);
      fetchInvoices();
    } catch { toast.error("Failed to update"); }
  };

  const deleteInvoice = async (id) => {
    try {
      await axios.delete(`${API}/invoices/${id}`, { withCredentials: true });
      toast.success("Invoice deleted");
      fetchInvoices();
    } catch { toast.error("Failed to delete"); }
  };

  return (
    <div data-testid="invoices-page">
      <div className="flex items-center justify-between mb-8 animate-fade-in">
        <div>
          <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-white/90" style={{ fontFamily: 'Outfit' }}>Invoices</h1>
          <p className="text-zinc-500 text-sm mt-1">Manage and track your invoices</p>
        </div>
        <CreateInvoiceDialog onCreated={fetchInvoices} />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white/80 rounded-full" />
        </div>
      ) : invoices.length === 0 ? (
        <div className="glass-card rounded-2xl p-16 text-center animate-fade-in">
          <DollarSign className="w-12 h-12 text-zinc-700 mx-auto mb-4" strokeWidth={1} />
          <p className="text-zinc-500 text-sm">No invoices yet. Create your first one.</p>
        </div>
      ) : (
        <div className="space-y-3 animate-fade-in animate-fade-in-delay-1">
          {invoices.map((inv) => (
            <div key={inv.id} className="glass-card rounded-xl p-5 flex items-center justify-between group" data-testid={`invoice-row-${inv.id}`}>
              <div className="flex items-center gap-5">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-zinc-400" strokeWidth={1.5} />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <p className="text-sm text-zinc-200 font-medium">{inv.client_name}</p>
                    <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${statusColors[inv.status] || statusColors.draft}`}>
                      {inv.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-600 mt-0.5">{inv.invoice_number} &middot; Due {inv.due_date}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right mr-4">
                  <p className="text-sm font-medium text-white/80 tabular-nums">{inv.currency} {inv.total?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                  <p className="text-[10px] text-zinc-600">Tax: {inv.currency} {inv.tax_amount?.toFixed(2)}</p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {inv.status === "draft" && (
                    <button data-testid={`send-invoice-${inv.id}`} onClick={() => updateStatus(inv.id, "sent")} className="p-2 text-zinc-500 hover:text-[#3B5A70] hover:bg-white/5 rounded-lg transition-colors" title="Mark as Sent">
                      <Send className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                  )}
                  {inv.status === "sent" && (
                    <button data-testid={`pay-invoice-${inv.id}`} onClick={() => updateStatus(inv.id, "paid")} className="p-2 text-zinc-500 hover:text-[#4A6E59] hover:bg-white/5 rounded-lg transition-colors" title="Mark as Paid">
                      <CheckCircle className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                  )}
                  <button data-testid={`delete-invoice-${inv.id}`} onClick={() => deleteInvoice(inv.id)} className="p-2 text-zinc-500 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors" title="Delete">
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
