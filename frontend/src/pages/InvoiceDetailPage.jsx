import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API, BACKEND_URL } from "@/App";
import axios from "axios";
import { ArrowLeft, Download, Send, CheckCircle, Clock, FileText, Pen, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import SignaturePad from "@/components/SignaturePad";

const statusConfig = {
  draft: { label: "Draft", color: "bg-zinc-500/15 text-zinc-400", icon: Clock },
  sent: { label: "Sent", color: "bg-[#3B5A70]/15 text-[#3B5A70]", icon: Send },
  paid: { label: "Paid", color: "bg-[#4A6E59]/15 text-[#4A6E59]", icon: CheckCircle },
  overdue: { label: "Overdue", color: "bg-red-500/15 text-red-400", icon: Clock },
};

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signature, setSignature] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [invRes, sigRes] = await Promise.all([
          axios.get(`${API}/invoices`, { withCredentials: true }),
          axios.get(`${API}/signature`, { withCredentials: true })
        ]);
        const inv = invRes.data.find(i => i.id === id);
        if (inv) setInvoice(inv); else navigate("/invoices");
        if (sigRes.data?.signature_data) setSignature(sigRes.data.signature_data);
      } catch { navigate("/invoices"); }
      finally { setLoading(false); }
    })();
  }, [id, navigate]);

  const updateStatus = async (status) => {
    try {
      await axios.put(`${API}/invoices/${id}`, { status }, { withCredentials: true });
      setInvoice(prev => ({ ...prev, status }));
      toast.success(`Invoice marked as ${status}`);
    } catch { toast.error("Failed to update status"); }
  };

  const downloadPdf = async () => {
    try {
      const res = await axios.get(`${API}/invoices/${id}/pdf`, { withCredentials: true, responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `${invoice?.invoice_number || "invoice"}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success("PDF downloaded");
    } catch { toast.error("Failed to download PDF"); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white/80 rounded-full" /></div>;
  if (!invoice) return null;

  const sc = statusConfig[invoice.status] || statusConfig.draft;
  const StatusIcon = sc.icon;

  return (
    <div data-testid="invoice-detail-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8 animate-fade-in">
        <button data-testid="back-to-invoices" onClick={() => navigate("/invoices")} className="text-zinc-500 hover:text-zinc-300 p-2 hover:bg-white/5 rounded-lg transition-colors self-start">
          <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-white/90" style={{ fontFamily: 'Outfit' }}>{invoice.invoice_number}</h1>
            <span className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1.5 ${sc.color}`}>
              <StatusIcon className="w-3 h-3" strokeWidth={1.5} />{sc.label}
            </span>
          </div>
          <p className="text-zinc-500 text-sm mt-0.5">{invoice.client_name}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {invoice.status === "draft" && (
            <button data-testid="mark-sent-btn" onClick={() => updateStatus("sent")} className="bg-white/5 text-zinc-300 border border-white/10 hover:bg-white/10 rounded-lg px-4 py-2 text-sm flex items-center gap-2 transition-colors">
              <Send className="w-4 h-4" strokeWidth={1.5} /> Mark Sent
            </button>
          )}
          {invoice.status === "sent" && (
            <button data-testid="mark-paid-btn" onClick={() => updateStatus("paid")} className="bg-[#4A6E59]/20 text-[#4A6E59] hover:bg-[#4A6E59]/30 rounded-lg px-4 py-2 text-sm flex items-center gap-2 transition-colors">
              <CheckCircle className="w-4 h-4" strokeWidth={1.5} /> Mark Paid
            </button>
          )}
          <button data-testid="download-pdf-btn" onClick={downloadPdf} className="bg-zinc-100 text-zinc-900 hover:bg-white rounded-lg px-4 py-2 text-sm font-medium flex items-center gap-2 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.1)]">
            <Download className="w-4 h-4" strokeWidth={1.5} /> Download PDF
          </button>
          {invoice.portal_token && (
            <button data-testid="copy-portal-link" onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/portal/${invoice.portal_token}`);
              toast.success("Client portal link copied!");
            }} className="bg-white/5 text-zinc-300 border border-white/10 hover:bg-white/10 rounded-lg px-4 py-2 text-sm flex items-center gap-2 transition-colors">
              <ExternalLink className="w-4 h-4" strokeWidth={1.5} /> Copy Portal Link
            </button>
          )}
        </div>
      </div>

      {/* Invoice Document */}
      <div className="glass-card rounded-2xl p-4 sm:p-8 animate-fade-in animate-fade-in-delay-1" data-testid="invoice-document">
        <div className="bg-white rounded-xl p-6 sm:p-10 max-w-3xl mx-auto text-zinc-900" style={{ fontFamily: 'Inter, sans-serif' }}>
          {/* Invoice Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-8 pb-8 border-b border-zinc-200">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <svg width="28" height="28" viewBox="0 0 40 40" fill="none"><path d="M8 8L20 20L8 32" stroke="#A18252" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M20 8L32 20L20 32" stroke="#888" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <span className="text-lg font-semibold tracking-tight" style={{ fontFamily: 'Outfit' }}>Keeps</span>
              </div>
              <p className="text-xs text-zinc-500">Hermes Software Inc.</p>
              {invoice.from_address && <p className="text-xs text-zinc-500 mt-1">{invoice.from_address}</p>}
            </div>
            <div className="text-left sm:text-right">
              <p className="text-2xl font-bold text-zinc-800 tracking-tight" style={{ fontFamily: 'Outfit' }}>INVOICE</p>
              <p className="text-sm text-zinc-500 mt-1">{invoice.invoice_number}</p>
              <p className="text-xs text-zinc-400 mt-2">Issued: {invoice.created_at?.slice(0, 10)}</p>
              <p className="text-xs text-zinc-400">Due: {invoice.due_date}</p>
            </div>
          </div>

          {/* Bill To */}
          <div className="mb-8">
            <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-medium mb-2">Bill To</p>
            <p className="text-sm font-semibold text-zinc-800">{invoice.client_name}</p>
            {invoice.client_email && <p className="text-xs text-zinc-500">{invoice.client_email}</p>}
            {invoice.client_address && <p className="text-xs text-zinc-500">{invoice.client_address}</p>}
            {invoice.client_phone && <p className="text-xs text-zinc-500">{invoice.client_phone}</p>}
          </div>

          {/* Items Table */}
          <div className="mb-8">
            <div className="hidden sm:grid grid-cols-12 gap-4 text-[10px] uppercase tracking-widest text-zinc-400 font-medium pb-3 border-b border-zinc-200">
              <span className="col-span-5">Description</span>
              <span className="col-span-2 text-right">Qty</span>
              <span className="col-span-3 text-right">Unit Price</span>
              <span className="col-span-2 text-right">Amount</span>
            </div>
            {invoice.items?.map((item, i) => (
              <div key={i} className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 py-3 border-b border-zinc-100 text-sm">
                <span className="sm:col-span-5 text-zinc-700 font-medium">{item.description}</span>
                <span className="sm:col-span-2 sm:text-right text-zinc-500 tabular-nums">
                  <span className="sm:hidden text-zinc-400 text-xs">Qty: </span>{item.quantity}
                </span>
                <span className="sm:col-span-3 sm:text-right text-zinc-500 tabular-nums">
                  <span className="sm:hidden text-zinc-400 text-xs">Price: </span>{invoice.currency} {item.unit_price?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                <span className="sm:col-span-2 sm:text-right font-medium text-zinc-800 tabular-nums">
                  {invoice.currency} {item.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-full sm:w-72 space-y-2">
              <div className="flex justify-between text-sm text-zinc-500">
                <span>Subtotal</span>
                <span className="tabular-nums">{invoice.currency} {invoice.subtotal?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm text-zinc-500">
                <span>Tax ({invoice.tax_rate}%)</span>
                <span className="tabular-nums">{invoice.currency} {invoice.tax_amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-zinc-900 pt-3 border-t-2 border-zinc-800" style={{ fontFamily: 'Outfit' }}>
                <span>Total</span>
                <span className="tabular-nums">{invoice.currency} {invoice.total?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Notes & Footer */}
          {invoice.notes && (
            <div className="mb-6 p-4 bg-zinc-50 rounded-lg">
              <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-medium mb-1">Notes</p>
              <p className="text-xs text-zinc-600 leading-relaxed">{invoice.notes}</p>
            </div>
          )}
          {invoice.payment_terms && (
            <p className="text-xs text-zinc-400">Payment Terms: {invoice.payment_terms}</p>
          )}

          {/* Signature */}
          {signature && (
            <div className="mt-6 pt-4 border-t border-zinc-100">
              <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-medium mb-2">Authorized Signature</p>
              <img src={signature} alt="Signature" className="h-12 object-contain" />
            </div>
          )}

          <div className="mt-8 pt-4 border-t border-zinc-100 text-center">
            <p className="text-[10px] text-zinc-400">Thank you for your business</p>
            <p className="text-[9px] text-zinc-300 mt-1">Powered by Keeps &middot; Hermes Software Inc.</p>
          </div>
        </div>
      </div>

      {/* Signature Management */}
      <div className="mt-6 max-w-3xl mx-auto animate-fade-in animate-fade-in-delay-2">
        <SignaturePad onSave={(data) => setSignature(data)} />
      </div>
    </div>
  );
}
