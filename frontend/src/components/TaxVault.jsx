import { useState, useEffect } from "react";
import { API } from "@/App";
import axios from "axios";
import { Vault, Plus, Minus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function TaxVault() {
  const [vault, setVault] = useState({ current_amount: 0, target_amount: 0, transactions: [] });
  const [amount, setAmount] = useState("");
  const [showActions, setShowActions] = useState(false);

  const fetchVault = async () => {
    try {
      const res = await axios.get(`${API}/tax/vault`, { withCredentials: true });
      setVault(res.data);
    } catch {}
  };

  useEffect(() => { fetchVault(); }, []);

  const handleAction = async (action) => {
    const val = parseFloat(amount);
    if (!val || val <= 0) return;
    try {
      const res = await axios.post(`${API}/tax/vault`, { amount: val, action }, { withCredentials: true });
      setVault(res.data);
      setAmount("");
      toast.success(action === "deposit" ? "Funds added to vault" : "Funds withdrawn");
    } catch {
      toast.error("Action failed");
    }
  };

  const handleSetTarget = async () => {
    const val = parseFloat(amount);
    if (!val || val <= 0) return;
    try {
      const res = await axios.post(`${API}/tax/vault`, { amount: val, action: "set_target" }, { withCredentials: true });
      setVault(res.data);
      setAmount("");
      toast.success("Target updated");
    } catch {
      toast.error("Failed to set target");
    }
  };

  const progress = vault.target_amount > 0 ? Math.min((vault.current_amount / vault.target_amount) * 100, 100) : 0;
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="glass-card rounded-2xl p-6 glow-amber h-full flex flex-col" data-testid="tax-vault-widget">
      <div className="flex items-center gap-2 mb-6">
        <Vault className="w-4 h-4 text-[#A18252]" strokeWidth={1.5} />
        <h3 className="text-xs uppercase tracking-widest text-[#A18252] font-medium">Tax Vault</h3>
      </div>

      {/* Circular Progress */}
      <div className="flex-1 flex items-center justify-center mb-4">
        <div className="relative w-[140px] h-[140px]">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
            <circle
              cx="60" cy="60" r="54" fill="none"
              stroke="#A18252"
              strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
              style={{ filter: 'drop-shadow(0 0 8px rgba(161,130,82,0.4))' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-xl font-light text-white/90 tabular-nums" style={{ fontFamily: 'Outfit' }}>
              ${vault.current_amount?.toLocaleString(undefined, { minimumFractionDigits: 0 })}
            </p>
            <p className="text-[10px] text-zinc-500 mt-0.5">{progress.toFixed(0)}% of target</p>
          </div>
        </div>
      </div>

      {vault.target_amount > 0 && (
        <p className="text-center text-xs text-zinc-500 mb-4">
          Target: ${vault.target_amount?.toLocaleString()}
        </p>
      )}

      {/* Actions */}
      <button
        data-testid="vault-toggle-actions"
        onClick={() => setShowActions(!showActions)}
        className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors text-center mb-3"
      >
        {showActions ? 'Hide' : 'Manage Vault'}
      </button>

      {showActions && (
        <div className="space-y-3">
          <Input
            data-testid="vault-amount-input"
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="bg-black/20 border-white/10 text-zinc-200 text-sm placeholder:text-zinc-600"
          />
          <div className="flex gap-2">
            <button
              data-testid="vault-deposit-btn"
              onClick={() => handleAction("deposit")}
              className="flex-1 bg-[#4A6E59]/20 text-[#4A6E59] hover:bg-[#4A6E59]/30 rounded-lg py-2 text-xs font-medium transition-colors flex items-center justify-center gap-1"
            >
              <Plus className="w-3 h-3" /> Deposit
            </button>
            <button
              data-testid="vault-withdraw-btn"
              onClick={() => handleAction("withdraw")}
              className="flex-1 bg-white/5 text-zinc-400 hover:bg-white/10 rounded-lg py-2 text-xs font-medium transition-colors flex items-center justify-center gap-1"
            >
              <Minus className="w-3 h-3" /> Withdraw
            </button>
          </div>
          {!vault.target_amount && (
            <button
              data-testid="vault-set-target-btn"
              onClick={handleSetTarget}
              className="w-full bg-[#A18252]/20 text-[#A18252] hover:bg-[#A18252]/30 rounded-lg py-2 text-xs font-medium transition-colors"
            >
              Set Target
            </button>
          )}
        </div>
      )}
    </div>
  );
}
