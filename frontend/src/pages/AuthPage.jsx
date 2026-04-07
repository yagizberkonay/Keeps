import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, API } from "@/App";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, User, Building2, ArrowRight, Shield } from "lucide-react";
import { toast } from "sonner";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ email: "", password: "", name: "", company: "" });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = isLogin ? "/auth/login" : "/auth/register";
      const payload = isLogin ? { email: form.email, password: form.password } : form;
      const res = await axios.post(`${API}${endpoint}`, payload, { withCredentials: true });
      login(res.data);
      toast.success(isLogin ? "Welcome back!" : "Account created successfully");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.detail || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen page-gradient flex items-center justify-center p-4" data-testid="auth-page">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10 animate-fade-in">
          <div className="inline-flex items-center gap-3 mb-6">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <path d="M8 8L20 20L8 32" stroke="#A18252" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"/>
              <path d="M20 8L32 20L20 32" stroke="#D4D4D8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
            </svg>
            <h1 className="text-3xl font-light tracking-tight text-white/90" style={{ fontFamily: 'Outfit' }}>Keeps</h1>
          </div>
          <p className="text-zinc-500 text-sm tracking-wide">Financial clarity for modern freelancers</p>
        </div>

        {/* Auth Card */}
        <div className="glass-strong rounded-2xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.5)] animate-fade-in animate-fade-in-delay-1" data-testid="auth-card">
          <div className="flex gap-2 mb-8">
            <button
              data-testid="login-tab"
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${isLogin ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Sign In
            </button>
            <button
              data-testid="register-tab"
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${!isLogin ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest text-zinc-500 font-medium">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" strokeWidth={1.5} />
                    <Input
                      data-testid="register-name-input"
                      className="bg-black/20 border-white/10 pl-10 text-zinc-200 focus:ring-1 focus:ring-white/30 placeholder:text-zinc-600"
                      placeholder="Your name"
                      value={form.name}
                      onChange={(e) => setForm({...form, name: e.target.value})}
                      required={!isLogin}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest text-zinc-500 font-medium">Company</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" strokeWidth={1.5} />
                    <Input
                      data-testid="register-company-input"
                      className="bg-black/20 border-white/10 pl-10 text-zinc-200 focus:ring-1 focus:ring-white/30 placeholder:text-zinc-600"
                      placeholder="Company (optional)"
                      value={form.company}
                      onChange={(e) => setForm({...form, company: e.target.value})}
                    />
                  </div>
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-zinc-500 font-medium">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" strokeWidth={1.5} />
                <Input
                  data-testid="email-input"
                  type="email"
                  className="bg-black/20 border-white/10 pl-10 text-zinc-200 focus:ring-1 focus:ring-white/30 placeholder:text-zinc-600"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm({...form, email: e.target.value})}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-zinc-500 font-medium">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" strokeWidth={1.5} />
                <Input
                  data-testid="password-input"
                  type="password"
                  className="bg-black/20 border-white/10 pl-10 text-zinc-200 focus:ring-1 focus:ring-white/30 placeholder:text-zinc-600"
                  placeholder="Min. 6 characters"
                  value={form.password}
                  onChange={(e) => setForm({...form, password: e.target.value})}
                  required
                />
              </div>
            </div>

            <button
              data-testid="auth-submit-button"
              type="submit"
              disabled={loading}
              className="w-full bg-zinc-100 text-zinc-900 hover:bg-white rounded-lg px-6 py-2.5 font-medium transition-colors shadow-[0_0_15px_rgba(255,255,255,0.1)] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-zinc-400 border-t-zinc-800 rounded-full animate-spin" />
              ) : (
                <>
                  {isLogin ? "Sign In" : "Create Account"}
                  <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                </>
              )}
            </button>
          </form>

          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-zinc-600 uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <button
            data-testid="google-auth-button"
            onClick={handleGoogleAuth}
            className="w-full bg-white/5 text-zinc-300 border border-white/10 hover:bg-white/10 rounded-lg px-6 py-2.5 transition-colors flex items-center justify-center gap-3"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
        </div>

        <div className="text-center mt-8 animate-fade-in animate-fade-in-delay-3">
          <div className="flex items-center justify-center gap-2 text-zinc-600 text-xs">
            <Shield className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>End-to-end encrypted</span>
          </div>
          <p className="text-zinc-700 text-[10px] mt-3 tracking-wider uppercase">Hermes Software Inc.</p>
        </div>
      </div>
    </div>
  );
}
