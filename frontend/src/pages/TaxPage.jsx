import { useState, useEffect } from "react";
import { API } from "@/App";
import axios from "axios";
import { Calculator, Percent, TrendingDown, BarChart3 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TaxVault from "@/components/TaxVault";
import { toast } from "sonner";

function TaxCalculator({ type, title, icon: Icon, description }) {
  const [revenue, setRevenue] = useState("");
  const [expenses, setExpenses] = useState("");
  const [rate, setRate] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const calculate = async () => {
    if (!revenue) return;
    setLoading(true);
    try {
      const payload = { revenue: parseFloat(revenue), expenses: parseFloat(expenses) || 0, tax_type: type };
      if (rate) payload.rate = parseFloat(rate);
      const res = await axios.post(`${API}/tax/calculate`, payload, { withCredentials: true });
      setResult(res.data);
    } catch {
      toast.error("Calculation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-6" data-testid={`tax-calc-${type}`}>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-[#3B5A70]/20 flex items-center justify-center">
          <Icon className="w-5 h-5 text-[#3B5A70]" strokeWidth={1.5} />
        </div>
        <div>
          <h3 className="text-sm text-zinc-200 font-medium">{title}</h3>
          <p className="text-[11px] text-zinc-600">{description}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-widest text-zinc-500">Revenue</Label>
            <Input data-testid={`tax-revenue-${type}`} type="number" className="bg-black/20 border-white/10 text-zinc-200 text-sm placeholder:text-zinc-600" placeholder="0" value={revenue} onChange={(e) => setRevenue(e.target.value)} />
          </div>
          {type === "income" && (
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-zinc-500">Expenses</Label>
              <Input data-testid={`tax-expenses-${type}`} type="number" className="bg-black/20 border-white/10 text-zinc-200 text-sm placeholder:text-zinc-600" placeholder="0" value={expenses} onChange={(e) => setExpenses(e.target.value)} />
            </div>
          )}
          {type !== "income" && (
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-zinc-500">Rate %</Label>
              <Input data-testid={`tax-rate-${type}`} type="number" className="bg-black/20 border-white/10 text-zinc-200 text-sm placeholder:text-zinc-600" placeholder="20" value={rate} onChange={(e) => setRate(e.target.value)} />
            </div>
          )}
        </div>

        <button
          data-testid={`tax-calculate-${type}`}
          onClick={calculate}
          disabled={loading}
          className="w-full bg-white/5 text-zinc-300 border border-white/10 hover:bg-white/10 rounded-lg py-2 text-sm font-medium transition-colors"
        >
          {loading ? "Calculating..." : "Calculate"}
        </button>

        {result && (
          <div className="glass-card rounded-xl p-4 space-y-2 mt-3" data-testid={`tax-result-${type}`}>
            <div className="flex justify-between text-xs text-zinc-400">
              <span>Tax Type</span>
              <span className="text-zinc-300">{result.tax_type}</span>
            </div>
            {result.rate !== undefined && (
              <div className="flex justify-between text-xs text-zinc-400">
                <span>Rate</span>
                <span className="text-zinc-300">{result.rate}%</span>
              </div>
            )}
            <div className="flex justify-between text-xs text-zinc-400">
              <span>Tax Amount</span>
              <span className="text-[#A18252] font-medium">${(result.tax_amount || result.total_tax)?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            {result.effective_rate !== undefined && (
              <div className="flex justify-between text-xs text-zinc-400">
                <span>Effective Rate</span>
                <span className="text-zinc-300">{result.effective_rate}%</span>
              </div>
            )}
            {result.brackets && (
              <div className="mt-3 space-y-1.5 pt-2 border-t border-white/5">
                <p className="text-[10px] uppercase tracking-widest text-zinc-500">Bracket Breakdown</p>
                {result.brackets.map((b, i) => (
                  <div key={i} className="flex justify-between text-[11px]">
                    <span className="text-zinc-500">{b.rate}% on ${b.taxable?.toLocaleString()}</span>
                    <span className="text-zinc-400 tabular-nums">${b.tax?.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function TaxPage() {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${API}/tax/summary`, { withCredentials: true });
        setSummary(res.data);
      } catch {}
    })();
  }, []);

  return (
    <div data-testid="tax-page">
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-white/90" style={{ fontFamily: 'Outfit' }}>Tax Center</h1>
        <p className="text-zinc-500 text-sm mt-1">Calculate, track, and plan your tax obligations</p>
      </div>

      {/* Tax Summary */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8 animate-fade-in animate-fade-in-delay-1">
          <div className="glass-card rounded-2xl p-5">
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Total Revenue</p>
            <p className="text-xl font-light text-white/90 tabular-nums" style={{ fontFamily: 'Outfit' }}>${summary.total_revenue?.toLocaleString()}</p>
          </div>
          <div className="glass-card rounded-2xl p-5">
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Tax Collected</p>
            <p className="text-xl font-light text-[#A18252] tabular-nums" style={{ fontFamily: 'Outfit' }}>${summary.total_tax_collected?.toLocaleString()}</p>
          </div>
          <div className="glass-card rounded-2xl p-5">
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Paid Invoices</p>
            <p className="text-xl font-light text-white/90 tabular-nums" style={{ fontFamily: 'Outfit' }}>{summary.invoice_count}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in animate-fade-in-delay-2">
        {/* Calculators */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="vat" className="w-full">
            <TabsList className="bg-white/[0.03] border border-white/10 rounded-xl p-1 mb-6" data-testid="tax-tabs">
              <TabsTrigger value="vat" className="data-[state=active]:bg-white/10 data-[state=active]:text-white rounded-lg text-zinc-500 text-xs">VAT / KDV</TabsTrigger>
              <TabsTrigger value="withholding" className="data-[state=active]:bg-white/10 data-[state=active]:text-white rounded-lg text-zinc-500 text-xs">Withholding</TabsTrigger>
              <TabsTrigger value="income" className="data-[state=active]:bg-white/10 data-[state=active]:text-white rounded-lg text-zinc-500 text-xs">Income Tax</TabsTrigger>
            </TabsList>
            <TabsContent value="vat">
              <TaxCalculator type="vat" title="VAT (KDV)" icon={Percent} description="Value Added Tax calculation" />
            </TabsContent>
            <TabsContent value="withholding">
              <TaxCalculator type="withholding" title="Withholding Tax (Stopaj)" icon={TrendingDown} description="Tax withheld at source" />
            </TabsContent>
            <TabsContent value="income">
              <TaxCalculator type="income" title="Income Tax" icon={BarChart3} description="Progressive income tax brackets" />
            </TabsContent>
          </Tabs>
        </div>

        {/* Vault */}
        <div>
          <TaxVault />
        </div>
      </div>
    </div>
  );
}
