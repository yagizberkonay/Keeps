import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Clock, CheckCircle, FileText, ExternalLink } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ClientPortalPage() {
  const { token } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${API}/portal/${token}`);
        setInvoice(res.data);
      } catch (err) {
        setError(err.response?.data?.detail || "Invoice not found");
      } finally { setLoading(false); }
    })();
  }, [token]);

  if (loading) return (
    <div className="min-h-screen page-gradient flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white/80 rounded-full" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen page-gradient flex items-center justify-center">
      <div className="glass-card rounded-2xl p-10 text-center max-w-md">
        <FileText className="w-12 h-12 text-zinc-700 mx-auto mb-4" strokeWidth={1} />
        <h2 className="text-lg text-zinc-200 font-light mb-2" style={{ fontFamily: 'Outfit' }}>Invoice Not Found</h2>
        <p className="text-sm text-zinc-500">{error}</p>
      </div>
    </div>
  );

  const inv = invoice;
  const statusConfig = {
    draft: { label: "Draft", color: "bg-zinc-500/15 text-zinc-400" },
    sent: { label: "Sent", color: "bg-[#3B5A70]/15 text-[#3B5A70]" },
    paid: { label: "Paid", color: "bg-[#4A6E59]/15 text-[#4A6E59]" },
  };
  const sc = statusConfig[inv.status] || statusConfig.draft;

  return (
    <div className="min-h-screen page-gradient" data-testid="client-portal-page">
      {/* Header */}
      <div className="glass-strong py-4 px-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg width="28" height="28" viewBox="0 0 40 40" fill="none"><path d="M8 8L20 20L8 32" stroke="#A18252" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"/><path d="M20 8L32 20L20 32" stroke="#D4D4D8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/></svg>
            <span className="text-sm font-light text-white/90" style={{ fontFamily: 'Outfit' }}>Keeps</span>
          </div>
          <span className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full ${sc.color}`}>{sc.label}</span>
        </div>
      </div>

      {/* Invoice Document */}
      <div className="max-w-4xl mx-auto p-4 sm:p-8">
        <div className="glass-card rounded-2xl p-4 sm:p-8">
          <div className="bg-white rounded-xl p-6 sm:p-10 text-zinc-900" style={{ fontFamily: 'Inter, sans-serif' }}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-8 pb-8 border-b border-zinc-200">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <svg width="24" height="24" viewBox="0 0 40 40" fill="none"><path d="M8 8L20 20L8 32" stroke="#A18252" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M20 8L32 20L20 32" stroke="#888" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <span className="text-base font-semibold tracking-tight" style={{ fontFamily: 'Outfit' }}>Keeps</span>
                </div>
                <p className="text-xs text-zinc-500">Hermes Software Inc.</p>
                {inv.from_name && <p className="text-xs text-zinc-500 mt-1">{inv.from_name}</p>}
              </div>
              <div className="text-left sm:text-right">
                <p className="text-2xl font-bold text-zinc-800 tracking-tight" style={{ fontFamily: 'Outfit' }}>INVOICE</p>
                <p className="text-sm text-zinc-500 mt-1">{inv.invoice_number}</p>
                <p className="text-xs text-zinc-400 mt-2">Issued: {inv.created_at?.slice(0, 10)}</p>
                <p className="text-xs text-zinc-400">Due: {inv.due_date}</p>
              </div>
            </div>

            {/* Bill To */}
            <div className="mb-8">
              <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-medium mb-2">Bill To</p>
              <p className="text-sm font-semibold text-zinc-800">{inv.client_name}</p>
              {inv.client_email && <p className="text-xs text-zinc-500">{inv.client_email}</p>}
              {inv.client_address && <p className="text-xs text-zinc-500">{inv.client_address}</p>}
            </div>

            {/* Items */}
            <div className="mb-8">
              <div className="hidden sm:grid grid-cols-12 gap-4 text-[10px] uppercase tracking-widest text-zinc-400 font-medium pb-3 border-b border-zinc-200">
                <span className="col-span-5">Description</span>
                <span className="col-span-2 text-right">Qty</span>
                <span className="col-span-3 text-right">Unit Price</span>
                <span className="col-span-2 text-right">Amount</span>
              </div>
              {inv.items?.map((item, i) => (
                <div key={i} className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 py-3 border-b border-zinc-100 text-sm">
                  <span className="sm:col-span-5 text-zinc-700 font-medium">{item.description}</span>
                  <span className="sm:col-span-2 sm:text-right text-zinc-500 tabular-nums">{item.quantity}</span>
                  <span className="sm:col-span-3 sm:text-right text-zinc-500 tabular-nums">{inv.currency} {item.unit_price?.toFixed(2)}</span>
                  <span className="sm:col-span-2 sm:text-right font-medium text-zinc-800 tabular-nums">{inv.currency} {item.amount?.toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="flex justify-end mb-8">
              <div className="w-full sm:w-72 space-y-2">
                <div className="flex justify-between text-sm text-zinc-500"><span>Subtotal</span><span className="tabular-nums">{inv.currency} {inv.subtotal?.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm text-zinc-500"><span>Tax ({inv.tax_rate}%)</span><span className="tabular-nums">{inv.currency} {inv.tax_amount?.toFixed(2)}</span></div>
                <div className="flex justify-between text-lg font-bold text-zinc-900 pt-3 border-t-2 border-zinc-800" style={{ fontFamily: 'Outfit' }}>
                  <span>Total</span><span className="tabular-nums">{inv.currency} {inv.total?.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {inv.notes && (
              <div className="p-4 bg-zinc-50 rounded-lg mb-4">
                <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-medium mb-1">Notes</p>
                <p className="text-xs text-zinc-600">{inv.notes}</p>
              </div>
            )}

            <div className="mt-8 pt-4 border-t border-zinc-100 text-center">
              <p className="text-[10px] text-zinc-400">Thank you for your business</p>
              <p className="text-[9px] text-zinc-300 mt-1">Powered by Keeps &middot; Hermes Software Inc.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
