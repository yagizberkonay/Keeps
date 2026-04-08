import { useRef, useState, useEffect } from "react";
import { API } from "@/App";
import axios from "axios";
import { Pen, RotateCcw, Save, Check } from "lucide-react";
import { toast } from "sonner";

export default function SignaturePad({ onSave, compact = false }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [saved, setSaved] = useState(false);
  const [existingSignature, setExistingSignature] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${API}/signature`, { withCredentials: true });
        if (res.data?.signature_data) {
          setExistingSignature(res.data.signature_data);
          setSaved(true);
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);
    ctx.strokeStyle = "#D4D4D8";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    // Draw existing signature if available
    if (existingSignature) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
        setHasSignature(true);
      };
      img.src = existingSignature;
    }
  }, [existingSignature]);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches?.[0];
    return {
      x: (touch ? touch.clientX : e.clientX) - rect.left,
      y: (touch ? touch.clientY : e.clientY) - rect.top
    };
  };

  const startDraw = (e) => {
    e.preventDefault();
    setIsDrawing(true);
    setSaved(false);
    const ctx = canvasRef.current.getContext("2d");
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext("2d");
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setHasSignature(true);
  };

  const endDraw = () => setIsDrawing(false);

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    setHasSignature(false);
    setSaved(false);
  };

  const save = async () => {
    if (!hasSignature) return;
    const dataUrl = canvasRef.current.toDataURL("image/png");
    try {
      await axios.post(`${API}/signature`, { signature_data: dataUrl }, { withCredentials: true });
      setSaved(true);
      toast.success("Signature saved");
      if (onSave) onSave(dataUrl);
    } catch { toast.error("Failed to save signature"); }
  };

  return (
    <div data-testid="signature-pad" className={compact ? "" : "glass-card rounded-2xl p-6"}>
      {!compact && (
        <div className="flex items-center gap-2 mb-4">
          <Pen className="w-4 h-4 text-zinc-400" strokeWidth={1.5} />
          <h3 className="text-xs uppercase tracking-widest text-zinc-500 font-medium">Digital Signature</h3>
          {saved && <Check className="w-4 h-4 text-[#4A6E59]" strokeWidth={1.5} />}
        </div>
      )}

      <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black/20" style={{ touchAction: 'none' }}>
        <canvas
          ref={canvasRef}
          className="w-full cursor-crosshair"
          style={{ height: compact ? '100px' : '140px' }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
        {!hasSignature && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-xs text-zinc-600">Draw your signature here</p>
          </div>
        )}
      </div>

      <div className="flex gap-2 mt-3">
        <button data-testid="signature-clear" onClick={clear} className="text-xs text-zinc-500 hover:text-zinc-300 bg-white/5 hover:bg-white/10 rounded-lg px-3 py-1.5 flex items-center gap-1 transition-colors">
          <RotateCcw className="w-3 h-3" /> Clear
        </button>
        <button data-testid="signature-save" onClick={save} disabled={!hasSignature || saved} className="text-xs text-zinc-900 bg-zinc-100 hover:bg-white rounded-lg px-3 py-1.5 flex items-center gap-1 transition-colors disabled:opacity-40">
          <Save className="w-3 h-3" /> {saved ? "Saved" : "Save"}
        </button>
      </div>
    </div>
  );
}
