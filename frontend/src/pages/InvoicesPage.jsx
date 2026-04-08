import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "@/App";
import axios from "axios";
import { Plus, FileText, Send, CheckCircle, Trash2, DollarSign, Eye, Download } from "lucide-react";
import { toast } from "sonner";

const statusColors = {
  draft: "bg-white/5 text-zinc-500",
  sent: "bg-[#3B5A70]/15 text-[#3B5A70]",
  paid: "bg-[#4A6E59]/15 text-[#4A6E59]",
  overdue: "bg-red-500/15 text-red-400/80",
};

export default function InvoicesPage() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchInvoices = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/invoices`, { withCredentials: true });
      setInvoices(res.data);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  const updateStatus = async (e, id, status) => {
    e.stopPropagation();
    try {
      await axios.put(`${API}/invoices/${id}`, { status }, { withCredentials: true });
      toast.success(`Invoice marked as ${status}`);
      fetchInvoices();
    } catch { toast.error("Failed to update"); }
  };

  const deleteInvoice = async (e, id) => {
    e.stopPropagation();
    try {
      await axios.delete(`${API}/invoices/${id}`, { withCredentials: true });
      toast.success("Invoice deleted");
      fetchInvoices();
    } catch { toast.error("Failed to delete"); }
  };

  const downloadPdf = async (e, id, number) => {
    e.stopPropagation();
    try {
      const res = await axios.get(`${API}/invoices/${id}/pdf`, { withCredentials: true, responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const link = document.createElement("a"); link.href = url; link.download = `${number}.pdf`; link.click();
      window.URL.revokeObjectURL(url);
      toast.success("PDF downloaded");
    } catch { toast.error("Failed to download PDF"); }
  };

  return (
    <div data-testid="invoices-page">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-fade-in">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-light tracking-tight text-white/90" style={{ fontFamily: 'Outfit' }}>Invoices</h1>
          <p className="text-zinc-500 text-sm mt-1">Manage and track your invoices</p>
        </div>
        <button data-testid="create-invoice-button" onClick={() => navigate("/invoices/new")} className="bg-zinc-100 text-zinc-900 hover:bg-white rounded-lg px-5 py-2.5 font-medium text-sm transition-colors shadow-[0_0_15px_rgba(255,255,255,0.1)] flex items-center gap-2 self-start sm:self-auto">
          <Plus className="w-4 h-4" strokeWidth={1.5} /> New Invoice
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white/80 rounded-full" /></div>
      ) : invoices.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 sm:p-16 text-center animate-fade-in">
          <DollarSign className="w-12 h-12 text-zinc-700 mx-auto mb-4" strokeWidth={1} />
          <p className="text-zinc-500 text-sm mb-4">No invoices yet. Create your first one.</p>
          <button onClick={() => navigate("/invoices/new")} className="bg-white/5 text-zinc-300 border border-white/10 hover:bg-white/10 rounded-lg px-5 py-2 text-sm transition-colors">Get Started</button>
        </div>
      ) : (
        <div className="space-y-3 animate-fade-in animate-fade-in-delay-1">
          {/* Header row - desktop */}
          <div className="hidden lg:grid grid-cols-12 gap-4 px-5 text-[10px] uppercase tracking-widest text-zinc-600">
            <span className="col-span-4">Client</span>
            <span className="col-span-2">Number</span>
            <span className="col-span-2">Amount</span>
            <span className="col-span-1">Status</span>
            <span className="col-span-1">Due</span>
            <span className="col-span-2 text-right">Actions</span>
          </div>

          {invoices.map((inv) => (
            <div
              key={inv.id}
              data-testid={`invoice-row-${inv.id}`}
              onClick={() => navigate(`/invoices/${inv.id}`)}
              className="glass-card rounded-xl p-4 sm:p-5 cursor-pointer group"
            >
              {/* Desktop layout */}
              <div className="hidden lg:grid grid-cols-12 gap-4 items-center">
                <div className="col-span-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-zinc-400" strokeWidth={1.5} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-zinc-200 font-medium truncate">{inv.client_name}</p>
                    {inv.client_email && <p className="text-[11px] text-zinc-600 truncate">{inv.client_email}</p>}
                  </div>
                </div>
                <div className="col-span-2"><p className="text-sm text-zinc-400">{inv.invoice_number}</p></div>
                <div className="col-span-2">
                  <p className="text-sm font-medium text-white/80 tabular-nums">{inv.currency} {inv.total?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                  <p className="text-[10px] text-zinc-600">Tax: {inv.tax_amount?.toFixed(2)}</p>
                </div>
                <div className="col-span-1">
                  <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${statusColors[inv.status] || statusColors.draft}`}>{inv.status}</span>
                </div>
                <div className="col-span-1"><p className="text-xs text-zinc-500">{inv.due_date}</p></div>
                <div className="col-span-2 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button data-testid={`view-invoice-${inv.id}`} onClick={(e) => { e.stopPropagation(); navigate(`/invoices/${inv.id}`); }} className="p-2 text-zinc-500 hover:text-zinc-200 hover:bg-white/5 rounded-lg transition-colors" title="View">
                    <Eye className="w-4 h-4" strokeWidth={1.5} />
                  </button>
                  <button data-testid={`download-invoice-${inv.id}`} onClick={(e) => downloadPdf(e, inv.id, inv.invoice_number)} className="p-2 text-zinc-500 hover:text-zinc-200 hover:bg-white/5 rounded-lg transition-colors" title="Download PDF">
                    <Download className="w-4 h-4" strokeWidth={1.5} />
                  </button>
                  {inv.status === "draft" && (
                    <button data-testid={`send-invoice-${inv.id}`} onClick={(e) => updateStatus(e, inv.id, "sent")} className="p-2 text-zinc-500 hover:text-[#3B5A70] hover:bg-white/5 rounded-lg transition-colors" title="Mark as Sent">
                      <Send className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                  )}
                  {inv.status === "sent" && (
                    <button data-testid={`pay-invoice-${inv.id}`} onClick={(e) => updateStatus(e, inv.id, "paid")} className="p-2 text-zinc-500 hover:text-[#4A6E59] hover:bg-white/5 rounded-lg transition-colors" title="Mark as Paid">
                      <CheckCircle className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                  )}
                  <button data-testid={`delete-invoice-${inv.id}`} onClick={(e) => deleteInvoice(e, inv.id)} className="p-2 text-zinc-500 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors" title="Delete">
                    <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                  </button>
                </div>
              </div>

              {/* Mobile layout */}
              <div className="lg:hidden">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-zinc-400" strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="text-sm text-zinc-200 font-medium">{inv.client_name}</p>
                      <p className="text-[11px] text-zinc-600">{inv.invoice_number}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${statusColors[inv.status] || statusColors.draft}`}>{inv.status}</span>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <p className="text-sm font-medium text-white/80 tabular-nums">{inv.currency} {inv.total?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                  <p className="text-xs text-zinc-500">Due {inv.due_date}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
