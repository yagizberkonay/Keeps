import { useState, useEffect } from "react";
import { API } from "@/App";
import axios from "axios";
import { Globe, CheckCircle, AlertTriangle, Info, Shield, ChevronDown, ChevronUp } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const statusIcon = { pass: CheckCircle, fail: AlertTriangle, warning: AlertTriangle, info: Info };
const statusColor = {
  pass: "text-[#4A6E59] bg-[#4A6E59]/10",
  fail: "text-red-400/80 bg-red-500/10",
  warning: "text-[#A18252] bg-[#A18252]/10",
  info: "text-[#3B5A70] bg-[#3B5A70]/10"
};

export default function CompliancePage() {
  const [countries, setCountries] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState("");
  const [result, setResult] = useState(null);
  const [checking, setChecking] = useState(false);
  const [expandedCountry, setExpandedCountry] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [cRes, iRes] = await Promise.all([
          axios.get(`${API}/compliance/countries`, { withCredentials: true }),
          axios.get(`${API}/invoices`, { withCredentials: true })
        ]);
        setCountries(cRes.data);
        setInvoices(iRes.data);
      } catch {}
    })();
  }, []);

  const runCheck = async () => {
    if (!selectedCountry || !selectedInvoice) { toast.error("Select both country and invoice"); return; }
    setChecking(true);
    try {
      const res = await axios.post(`${API}/compliance/check`, { country_code: selectedCountry, invoice_id: selectedInvoice }, { withCredentials: true });
      setResult(res.data);
    } catch { toast.error("Compliance check failed"); }
    finally { setChecking(false); }
  };

  const scoreColor = (s) => s >= 80 ? "text-[#4A6E59]" : s >= 50 ? "text-[#A18252]" : "text-red-400/80";

  return (
    <div data-testid="compliance-page">
      <div className="mb-8 animate-fade-in">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-light tracking-tight text-white/90" style={{ fontFamily: 'Outfit' }}>Global Compliance</h1>
        <p className="text-zinc-500 text-sm mt-1">Ensure your invoices meet international regulations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Checker */}
        <div className="lg:col-span-2 space-y-6 animate-fade-in animate-fade-in-delay-1">
          <div className="glass-card rounded-2xl p-6" data-testid="compliance-checker">
            <h2 className="text-xs uppercase tracking-widest text-zinc-500 font-medium mb-5 flex items-center gap-2">
              <Shield className="w-4 h-4" strokeWidth={1.5} /> Invoice Compliance Check
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-zinc-600 block">Target Country</label>
                <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                  <SelectTrigger data-testid="compliance-country-select" className="bg-black/20 border-white/10 text-zinc-200"><SelectValue placeholder="Select country..." /></SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-white/10 max-h-[250px]">
                    {countries.map(c => <SelectItem key={c.code} value={c.code} className="text-zinc-300 focus:bg-white/10">{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-zinc-600 block">Invoice</label>
                <Select value={selectedInvoice} onValueChange={setSelectedInvoice}>
                  <SelectTrigger data-testid="compliance-invoice-select" className="bg-black/20 border-white/10 text-zinc-200"><SelectValue placeholder="Select invoice..." /></SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-white/10">
                    {invoices.map(i => <SelectItem key={i.id} value={i.id} className="text-zinc-300 focus:bg-white/10">{i.invoice_number} — {i.client_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <button data-testid="run-compliance-check" onClick={runCheck} disabled={checking} className="bg-zinc-100 text-zinc-900 hover:bg-white rounded-lg px-6 py-2.5 font-medium text-sm transition-colors disabled:opacity-50">
              {checking ? "Checking..." : "Run Compliance Check"}
            </button>
          </div>

          {/* Result */}
          {result && (
            <div className="glass-card rounded-2xl p-6 animate-fade-in" data-testid="compliance-result">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-sm text-zinc-200 font-medium">{result.country} Compliance</h3>
                  <p className="text-[11px] text-zinc-500 mt-0.5">{result.invoice_number}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`text-3xl font-light tabular-nums ${scoreColor(result.score)}`} style={{ fontFamily: 'Outfit' }}>
                    {result.score}%
                  </div>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Score</span>
                </div>
              </div>

              {/* Score bar */}
              <div className="w-full h-2 rounded-full bg-white/5 mb-6 overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-1000 ${result.score >= 80 ? 'bg-[#4A6E59]' : result.score >= 50 ? 'bg-[#A18252]' : 'bg-red-400/60'}`} style={{ width: `${result.score}%` }} />
              </div>

              {result.notes && (
                <div className="glass-card rounded-xl p-4 mb-5">
                  <p className="text-xs text-zinc-400"><span className="text-zinc-500 font-medium">Note:</span> {result.notes}</p>
                </div>
              )}

              <div className="space-y-2">
                {result.checks?.map((check, i) => {
                  const Icon = statusIcon[check.status] || Info;
                  return (
                    <div key={i} className="flex items-center gap-3 py-2.5 px-4 rounded-xl bg-white/[0.01] hover:bg-white/[0.02] transition-colors">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${statusColor[check.status]}`}>
                        <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-zinc-300">{check.description}</p>
                        <p className="text-[10px] text-zinc-600 capitalize">{check.field?.replace("_", " ")}</p>
                      </div>
                      <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${statusColor[check.status]}`}>{check.status}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Country Rules Reference */}
        <div className="animate-fade-in animate-fade-in-delay-2">
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-xs uppercase tracking-widest text-zinc-500 font-medium mb-4 flex items-center gap-2">
              <Globe className="w-4 h-4" strokeWidth={1.5} /> Country Regulations
            </h3>
            <div className="space-y-2">
              {countries.map((c) => (
                <div key={c.code} className="rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedCountry(expandedCountry === c.code ? null : c.code)}
                    className="w-full flex items-center justify-between py-3 px-4 hover:bg-white/[0.02] transition-colors text-left"
                    data-testid={`country-rule-${c.code}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-zinc-300">{c.name}</span>
                      {c.tax_id_required && <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#A18252]/15 text-[#A18252]">Tax ID</span>}
                    </div>
                    {expandedCountry === c.code ? <ChevronUp className="w-3.5 h-3.5 text-zinc-500" /> : <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />}
                  </button>
                  {expandedCountry === c.code && (
                    <div className="px-4 pb-3 animate-fade-in">
                      <p className="text-xs text-zinc-500 mb-2">{c.notes}</p>
                      <div className="space-y-1">
                        {c.requirements?.map((r, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-[10px] text-zinc-600">
                            <div className="w-1 h-1 rounded-full bg-zinc-600" />
                            <span className="capitalize">{r.replace("_", " ")}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
