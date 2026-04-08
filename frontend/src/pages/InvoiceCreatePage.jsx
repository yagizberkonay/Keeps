import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "@/App";
import axios from "axios";
import { ArrowLeft, Plus, X, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const currencies = ["USD", "EUR", "GBP", "TRY", "JPY", "CAD", "AUD", "CHF", "INR", "BRL", "MXN", "KRW"];

export default function InvoiceCreatePage() {
  const navigate = useNavigate();
  const [showPreview, setShowPreview] = useState(true);
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState({
    client_name: "", client_email: "", client_address: "", client_phone: "",
    currency: "USD", tax_rate: 0, due_date: "",
    notes: "", payment_terms: "Net 30",
    from_name: "", from_address: ""
  });
  const [items, setItems] = useState([{ description: "", quantity: 1, unit_price: 0 }]);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${API}/clients`, { withCredentials: true });
        setClients(res.data);
      } catch {}
    })();
  }, []);

  const set = (field, val) => setForm(prev => ({ ...prev, [field]: val }));
  const addItem = () => setItems(prev => [...prev, { description: "", quantity: 1, unit_price: 0 }]);
  const removeItem = (i) => setItems(prev => prev.filter((_, idx) => idx !== i));
  const updateItem = (i, field, value) => {
    setItems(prev => { const u = [...prev]; u[i] = { ...u[i], [field]: value }; return u; });
  };

  const selectClient = (clientId) => {
    const c = clients.find(cl => cl.id === clientId);
    if (c) setForm(prev => ({ ...prev, client_name: c.name, client_email: c.email || "", client_phone: c.phone || "", client_address: c.address || "" }));
  };

  const subtotal = items.reduce((s, it) => s + (it.quantity * it.unit_price), 0);
  const taxAmount = subtotal * ((parseFloat(form.tax_rate) || 0) / 100);
  const total = subtotal + taxAmount;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.client_name) { toast.error("Client name is required"); return; }
    if (items.every(it => !it.description)) { toast.error("Add at least one item"); return; }
    setLoading(true);
    try {
      const res = await axios.post(`${API}/invoices`, {
        ...form, items: items.filter(it => it.description),
        tax_rate: parseFloat(form.tax_rate) || 0
      }, { withCredentials: true });
      toast.success("Invoice created successfully");
      navigate(`/invoices/${res.data.id}`);
    } catch { toast.error("Failed to create invoice"); }
    finally { setLoading(false); }
  };

  return (
    <div data-testid="invoice-create-page">
      <div className="flex items-center gap-4 mb-8 animate-fade-in">
        <button data-testid="back-to-invoices" onClick={() => navigate("/invoices")} className="text-zinc-500 hover:text-zinc-300 p-2 hover:bg-white/5 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-white/90" style={{ fontFamily: 'Outfit' }}>New Invoice</h1>
          <p className="text-zinc-500 text-sm mt-0.5">Fill in the details to create a new invoice</p>
        </div>
        <button onClick={() => setShowPreview(!showPreview)} className="hidden lg:flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-300 bg-white/5 rounded-lg px-3 py-2 transition-colors">
          {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          {showPreview ? "Hide Preview" : "Show Preview"}
        </button>
      </div>

      <div className={`grid gap-8 animate-fade-in animate-fade-in-delay-1 ${showPreview ? 'grid-cols-1 lg:grid-cols-5' : 'grid-cols-1 max-w-3xl'}`}>
        {/* Form */}
        <form onSubmit={handleSubmit} className={showPreview ? "lg:col-span-3" : ""}>
          <div className="space-y-8">
            {/* Client Section */}
            <section className="glass-card rounded-2xl p-6">
              <h2 className="text-xs uppercase tracking-widest text-zinc-500 font-medium mb-5">Client Information</h2>
              {clients.length > 0 && (
                <div className="mb-5">
                  <Label className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1.5 block">Select Existing Client</Label>
                  <Select onValueChange={selectClient}>
                    <SelectTrigger data-testid="select-existing-client" className="bg-black/20 border-white/10 text-zinc-200">
                      <SelectValue placeholder="Choose a client..." />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-white/10">
                      {clients.map(c => <SelectItem key={c.id} value={c.id} className="text-zinc-300 focus:bg-white/10 focus:text-white">{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-widest text-zinc-600">Client Name *</Label>
                  <Input data-testid="invoice-client-name" className="bg-black/20 border-white/10 text-zinc-200 placeholder:text-zinc-600" placeholder="Company or person" value={form.client_name} onChange={(e) => set("client_name", e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-widest text-zinc-600">Email</Label>
                  <Input data-testid="invoice-client-email" type="email" className="bg-black/20 border-white/10 text-zinc-200 placeholder:text-zinc-600" placeholder="client@email.com" value={form.client_email} onChange={(e) => set("client_email", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-widest text-zinc-600">Phone</Label>
                  <Input data-testid="invoice-client-phone" className="bg-black/20 border-white/10 text-zinc-200 placeholder:text-zinc-600" placeholder="+1 234 567 890" value={form.client_phone} onChange={(e) => set("client_phone", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-widest text-zinc-600">Address</Label>
                  <Input data-testid="invoice-client-address" className="bg-black/20 border-white/10 text-zinc-200 placeholder:text-zinc-600" placeholder="Street, City, Country" value={form.client_address} onChange={(e) => set("client_address", e.target.value)} />
                </div>
              </div>
            </section>

            {/* Invoice Details */}
            <section className="glass-card rounded-2xl p-6">
              <h2 className="text-xs uppercase tracking-widest text-zinc-500 font-medium mb-5">Invoice Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-widest text-zinc-600">Currency</Label>
                  <Select value={form.currency} onValueChange={(v) => set("currency", v)}>
                    <SelectTrigger data-testid="invoice-currency-select" className="bg-black/20 border-white/10 text-zinc-200"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-white/10">{currencies.map(c => <SelectItem key={c} value={c} className="text-zinc-300 focus:bg-white/10">{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-widest text-zinc-600">Tax Rate %</Label>
                  <Input data-testid="invoice-tax-rate" type="number" step="0.1" className="bg-black/20 border-white/10 text-zinc-200" placeholder="0" value={form.tax_rate} onChange={(e) => set("tax_rate", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-widest text-zinc-600">Due Date</Label>
                  <Input data-testid="invoice-due-date" type="date" className="bg-black/20 border-white/10 text-zinc-200" value={form.due_date} onChange={(e) => set("due_date", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-widest text-zinc-600">Payment Terms</Label>
                  <Select value={form.payment_terms} onValueChange={(v) => set("payment_terms", v)}>
                    <SelectTrigger data-testid="invoice-payment-terms" className="bg-black/20 border-white/10 text-zinc-200"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-white/10">
                      {["Net 15", "Net 30", "Net 45", "Net 60", "Due on Receipt"].map(t => <SelectItem key={t} value={t} className="text-zinc-300 focus:bg-white/10">{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            {/* Line Items */}
            <section className="glass-card rounded-2xl p-6">
              <h2 className="text-xs uppercase tracking-widest text-zinc-500 font-medium mb-5">Line Items</h2>
              <div className="space-y-3">
                <div className="hidden sm:grid grid-cols-12 gap-3 text-[10px] uppercase tracking-widest text-zinc-600 px-1">
                  <span className="col-span-5">Description</span>
                  <span className="col-span-2">Quantity</span>
                  <span className="col-span-3">Unit Price</span>
                  <span className="col-span-1 text-right">Amount</span>
                  <span className="col-span-1"></span>
                </div>
                {items.map((item, i) => (
                  <div key={i} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center glass-card rounded-xl p-3 sm:p-2 sm:bg-transparent sm:border-0 sm:rounded-none sm:backdrop-blur-none">
                    <div className="sm:col-span-5">
                      <Label className="text-[10px] text-zinc-600 sm:hidden mb-1 block">Description</Label>
                      <Input data-testid={`invoice-item-desc-${i}`} className="bg-black/20 border-white/10 text-zinc-200 text-sm placeholder:text-zinc-600" placeholder="Service or product" value={item.description} onChange={(e) => updateItem(i, "description", e.target.value)} />
                    </div>
                    <div className="sm:col-span-2">
                      <Label className="text-[10px] text-zinc-600 sm:hidden mb-1 block">Quantity</Label>
                      <Input data-testid={`invoice-item-qty-${i}`} type="number" min="0" step="any" className="bg-black/20 border-white/10 text-zinc-200 text-sm" value={item.quantity} onChange={(e) => updateItem(i, "quantity", parseFloat(e.target.value) || 0)} />
                    </div>
                    <div className="sm:col-span-3">
                      <Label className="text-[10px] text-zinc-600 sm:hidden mb-1 block">Unit Price</Label>
                      <Input data-testid={`invoice-item-price-${i}`} type="number" min="0" step="any" className="bg-black/20 border-white/10 text-zinc-200 text-sm" value={item.unit_price} onChange={(e) => updateItem(i, "unit_price", parseFloat(e.target.value) || 0)} />
                    </div>
                    <div className="sm:col-span-1 text-right text-sm text-zinc-400 tabular-nums">
                      ${(item.quantity * item.unit_price).toFixed(2)}
                    </div>
                    <div className="sm:col-span-1 flex justify-end">
                      {items.length > 1 && (
                        <button type="button" onClick={() => removeItem(i)} className="text-zinc-600 hover:text-red-400 transition-colors p-1.5 hover:bg-white/5 rounded-lg">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <button type="button" onClick={addItem} data-testid="add-invoice-item" className="mt-4 text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1.5 bg-white/[0.03] hover:bg-white/[0.06] border border-dashed border-white/10 rounded-xl px-4 py-3 w-full justify-center">
                <Plus className="w-4 h-4" /> Add Line Item
              </button>
            </section>

            {/* Notes */}
            <section className="glass-card rounded-2xl p-6">
              <h2 className="text-xs uppercase tracking-widest text-zinc-500 font-medium mb-4">Notes & Terms</h2>
              <Textarea data-testid="invoice-notes" className="bg-black/20 border-white/10 text-zinc-200 placeholder:text-zinc-600 min-h-[80px]" placeholder="Additional notes, terms, or payment instructions..." value={form.notes} onChange={(e) => set("notes", e.target.value)} />
            </section>

            {/* Totals & Submit */}
            <div className="glass-card rounded-2xl p-6 glow-amber">
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm text-zinc-400"><span>Subtotal</span><span className="tabular-nums">{form.currency} {subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm text-zinc-400"><span>Tax ({form.tax_rate || 0}%)</span><span className="tabular-nums">{form.currency} {taxAmount.toFixed(2)}</span></div>
                <div className="flex justify-between text-lg text-white/90 font-medium pt-3 border-t border-white/10">
                  <span style={{ fontFamily: 'Outfit' }}>Total</span>
                  <span className="tabular-nums" style={{ fontFamily: 'Outfit' }}>{form.currency} {total.toFixed(2)}</span>
                </div>
              </div>
              <button data-testid="submit-invoice" type="submit" disabled={loading} className="w-full bg-zinc-100 text-zinc-900 hover:bg-white rounded-xl px-6 py-3 font-medium transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)] disabled:opacity-50 text-sm">
                {loading ? "Creating Invoice..." : "Create Invoice"}
              </button>
            </div>
          </div>
        </form>

        {/* Live Preview */}
        {showPreview && (
          <div className="hidden lg:block lg:col-span-2">
            <div className="sticky top-8">
              <div className="glass-card rounded-2xl p-6 overflow-hidden" data-testid="invoice-live-preview">
                <h3 className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4">Live Preview</h3>
                <div className="bg-white rounded-xl p-5 text-zinc-900 text-[10px] leading-relaxed" style={{ fontFamily: 'Inter' }}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-[14px] font-semibold text-zinc-800" style={{ fontFamily: 'Outfit' }}>INVOICE</p>
                      <p className="text-zinc-500 mt-0.5">Draft</p>
                    </div>
                    <div className="text-right">
                      <svg width="20" height="20" viewBox="0 0 40 40" fill="none"><path d="M8 8L20 20L8 32" stroke="#A18252" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M20 8L32 20L20 32" stroke="#888" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      <p className="font-medium mt-0.5">Keeps</p>
                    </div>
                  </div>
                  <div className="border-t border-zinc-200 pt-3 mb-3">
                    <p className="font-semibold text-[11px]">{form.client_name || "Client Name"}</p>
                    {form.client_email && <p className="text-zinc-500">{form.client_email}</p>}
                    {form.client_address && <p className="text-zinc-500">{form.client_address}</p>}
                  </div>
                  <div className="space-y-1 mb-3">
                    {items.filter(it => it.description).map((it, i) => (
                      <div key={i} className="flex justify-between">
                        <span className="text-zinc-700">{it.description}</span>
                        <span className="tabular-nums">{form.currency} {(it.quantity * it.unit_price).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-zinc-200 pt-2 space-y-1">
                    <div className="flex justify-between text-zinc-500"><span>Subtotal</span><span>{form.currency} {subtotal.toFixed(2)}</span></div>
                    <div className="flex justify-between text-zinc-500"><span>Tax</span><span>{form.currency} {taxAmount.toFixed(2)}</span></div>
                    <div className="flex justify-between font-bold text-[11px] pt-1 border-t border-zinc-200"><span>Total</span><span>{form.currency} {total.toFixed(2)}</span></div>
                  </div>
                  {form.notes && <p className="text-zinc-500 mt-3 pt-2 border-t border-zinc-100 italic">{form.notes}</p>}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
