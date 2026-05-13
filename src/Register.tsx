import React, { useState } from "react";
import CoveLogo from "./CoveLogo";

interface RegisterProps {
  onSwitch: () => void;
  onRegister: (data: any) => void;
}

const Register = ({ onSwitch, onRegister }: RegisterProps) => {
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        setSuccess(`Account created! Welcome, ${data.user.name}.`);
        setTimeout(() => onRegister(data.user), 2000);
      } else {
        setError(data.msg || "Registration failed. Please try again.");
      }
    } catch {
      setError("Could not connect to the server. Is it running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative flex items-center justify-center px-4"
      style={{
        minHeight: "100vh",
        paddingTop: "5rem",
        paddingBottom: "5rem",
        background: "linear-gradient(180deg, #080c1c 0%, #080a14 45%, #080b18 100%)",
      }}
    >
      {/* Atmospheric glow behind the card */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 45% at 50% 20%, rgba(79, 125, 247, 0.07) 0%, transparent 70%)" }} />

      <div
        className="relative w-full max-w-sm p-5 sm:p-6 rounded-2xl space-y-3 sm:space-y-4"
        style={{
          background: "linear-gradient(145deg, #0f1220, #0f1220 50%, #111111) padding-box, linear-gradient(135deg, rgba(79,125,247,0.5), rgba(232,153,122,0.35)) border-box",
          border: "1px solid transparent",
          boxShadow: "0 0 60px rgba(79, 125, 247, 0.1), 0 0 40px rgba(232,153,122,0.04), 0 25px 60px rgba(0,0,0,0.7)",
        }}
      >
        {/* Top accent line */}
        <div className="absolute top-0 left-8 right-8 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(79,125,247,0.6), transparent)" }} />

        <div className="text-center">
          <div className="inline-block mb-1"><CoveLogo size={36} /></div>
          <h2 className="text-xl font-bold text-white tracking-tight">Create Account</h2>
          <p className="mt-1 text-xs text-white/40">Join the community and start learning today</p>
        </div>

        <form className="space-y-3" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <div>
              <label className="block text-xs font-medium text-white/60 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                className="w-full rounded-xl px-3 py-2 text-sm text-white focus:outline-none transition-all"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(79,125,247,0.15)" }}
                placeholder="John Doe"
                onFocus={e => (e.currentTarget.style.borderColor = "rgba(79,125,247,0.5)")}
                onBlur={e => (e.currentTarget.style.borderColor = "rgba(79,125,247,0.15)")}
                onChange={(e) => { setFormData({ ...formData, name: e.target.value }); setError(null); }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/60 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                className="w-full rounded-xl px-3 py-2 text-sm text-white focus:outline-none transition-all"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(79,125,247,0.15)" }}
                placeholder="name@example.com"
                onFocus={e => (e.currentTarget.style.borderColor = "rgba(79,125,247,0.5)")}
                onBlur={e => (e.currentTarget.style.borderColor = "rgba(79,125,247,0.15)")}
                onChange={(e) => { setFormData({ ...formData, email: e.target.value }); setError(null); }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/60 uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                type="password"
                required
                className="w-full rounded-xl px-3 py-2 text-sm text-white focus:outline-none transition-all"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(79,125,247,0.15)" }}
                placeholder="••••••••"
                onFocus={e => (e.currentTarget.style.borderColor = "rgba(79,125,247,0.5)")}
                onBlur={e => (e.currentTarget.style.borderColor = "rgba(79,125,247,0.15)")}
                onChange={(e) => { setFormData({ ...formData, password: e.target.value }); setError(null); }}
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              <span className="shrink-0">✕</span>
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#4f7df7]/10 border border-[#4f7df7]/20 text-[#4f7df7] text-xs">
              <span className="shrink-0">✓</span>
              <span>{success}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full text-black font-bold py-2 rounded-xl active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg, #7b9df9 0%, #4f7df7 60%, #3461e0 100%)", boxShadow: "0 4px 24px rgba(79, 125, 247, 0.35)" }}
          >
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p className="text-center text-xs text-white/40">
          Already have an account?{" "}
          <button onClick={onSwitch} className="text-[#4f7df7] hover:underline font-medium">
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
};

export default Register;
