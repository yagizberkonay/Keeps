import { useState, useRef, useEffect } from "react";
import { API } from "@/App";
import axios from "axios";
import { Bot, X, Send, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function AIAdvisor() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) inputRef.current.focus();
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const res = await axios.post(`${API}/ai/chat`, { message: userMsg }, { withCredentials: true });
      setMessages(prev => [...prev, { role: "assistant", content: res.data.response }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "I'm having trouble connecting right now. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* FAB */}
      {!isOpen && (
        <button
          data-testid="ai-advisor-fab"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl glass-strong flex items-center justify-center transition-all duration-300 hover:scale-105 glow-sage group"
          style={{ boxShadow: '0 0 30px rgba(74,110,89,0.2), 0 8px 32px rgba(0,0,0,0.4)' }}
        >
          <Sparkles className="w-6 h-6 text-[#4A6E59] group-hover:text-[#5a8e6f] transition-colors" strokeWidth={1.5} />
        </button>
      )}

      {/* Panel */}
      {isOpen && (
        <div
          data-testid="ai-advisor-panel"
          className="fixed bottom-6 right-6 z-50 w-[400px] h-[520px] rounded-2xl overflow-hidden flex flex-col"
          style={{
            background: 'rgba(9, 9, 12, 0.85)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 0 40px rgba(74,110,89,0.1), 0 25px 60px rgba(0,0,0,0.5)'
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#4A6E59]/20 flex items-center justify-center">
                <Bot className="w-4 h-4 text-[#4A6E59]" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm text-zinc-200 font-medium" style={{ fontFamily: 'Outfit' }}>Keeps AI</p>
                <p className="text-[10px] text-zinc-600">Tax & Finance Advisor</p>
              </div>
            </div>
            <button
              data-testid="ai-advisor-close"
              onClick={() => setIsOpen(false)}
              className="text-zinc-500 hover:text-zinc-300 p-1.5 hover:bg-white/5 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center px-4">
                <Sparkles className="w-8 h-8 text-[#4A6E59]/40 mb-3" strokeWidth={1} />
                <p className="text-sm text-zinc-400 mb-1">Ask me anything about taxes</p>
                <p className="text-[11px] text-zinc-600">I can help with deductions, VAT, expense categorization, and more.</p>
                <div className="mt-4 space-y-2 w-full">
                  {["What expenses can I deduct?", "How to optimize my VAT?", "Best practices for invoicing"].map((q) => (
                    <button
                      key={q}
                      onClick={() => { setInput(q); }}
                      className="w-full text-left text-xs text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03] px-3 py-2 rounded-lg transition-colors border border-white/5"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-white/10 text-zinc-200'
                    : 'bg-[#4A6E59]/10 text-zinc-300 border border-[#4A6E59]/20'
                }`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-[#4A6E59]/10 border border-[#4A6E59]/20 rounded-xl px-4 py-3">
                  <div className="flex gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#4A6E59] animate-pulse" />
                    <div className="w-1.5 h-1.5 rounded-full bg-[#4A6E59] animate-pulse" style={{ animationDelay: '0.2s' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-[#4A6E59] animate-pulse" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} className="p-4 border-t border-white/5">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                data-testid="ai-advisor-input"
                className="flex-1 bg-black/30 border-white/10 text-zinc-200 text-sm placeholder:text-zinc-600 focus:ring-1 focus:ring-[#4A6E59]/30"
                placeholder="Ask about taxes, deductions..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <button
                data-testid="ai-advisor-send"
                type="submit"
                disabled={loading || !input.trim()}
                className="bg-[#4A6E59]/20 text-[#4A6E59] hover:bg-[#4A6E59]/30 rounded-lg px-3 transition-colors disabled:opacity-30"
              >
                <Send className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
