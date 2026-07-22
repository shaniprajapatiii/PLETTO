import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { loginUser } from "../../services/authService";
import { Logo } from "../../components/brand/Logo";

export default function Login() {
   const navigate = useNavigate();
   const { setUser, setWorkspace } = useAuth();
   const [form, setForm] = useState({ email: "", password: "" });
   const [error, setError] = useState("");

   const submit = async (e) => {
      e.preventDefault();
      setError("");
      try {
         const res = await loginUser(form);
         localStorage.setItem("token", res.data.token);
         setUser(res.data.user);
         setWorkspace(res.data.workspace);
         navigate("/dashboard");
      } catch {
         setError("Login failed. Check your email and password.");
      }
   };

   return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(249,235,174,0.16),transparent_34%),#030303] px-4 py-10 sm:px-6">
         <div className="w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-[#0a0a0a]/95 shadow-[0_35px_100px_rgba(0,0,0,0.38)] backdrop-blur-2xl lg:grid lg:grid-cols-[0.95fr_1.05fr]">
            <div className="hidden bg-[linear-gradient(145deg,rgba(249,235,174,0.12),rgba(10,10,10,0.96))] p-8 lg:flex lg:flex-col lg:justify-between">
               <div>
                  <Logo />
                  <h1 className="mt-10 text-3xl font-semibold text-white">Welcome back to a calmer way to work.</h1>
                  <p className="mt-4 max-w-md text-sm leading-7 text-muted-foreground">Keep conversations, docs, and boards in sync with the same premium collaboration flow your team expects.</p>
               </div>
               <div className="rounded-[1.3rem] border border-gold/20 bg-[rgba(249,235,174,0.08)] p-4 text-sm text-muted-foreground shadow-[0_12px_36px_rgba(0,0,0,0.16)]">
                  Secure by design · realtime by default · built for modern teams.
               </div>
            </div>
            <div className="p-6 sm:p-8">
               <div className="mb-8 flex items-center justify-between gap-3 lg:justify-end">
                  <div className="lg:hidden">
                     <Logo />
                  </div>
                  <span className="rounded-full border border-gold/30 bg-[rgba(249,235,174,0.08)] px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-gold">Login</span>
               </div>
               <h2 className="text-3xl font-semibold text-white">Sign in</h2>
               <p className="mt-3 text-sm text-muted-foreground">Access your workspace and continue where you left off.</p>
               {error ? <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">{error}</div> : null}
               <form onSubmit={submit} className="mt-8 space-y-5">
                  <label className="block text-sm text-muted-foreground">
                     Email
                     <input
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="mt-2 w-full rounded-[1.1rem] border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-gold/40"
                     />
                  </label>
                  <label className="block text-sm text-muted-foreground">
                     Password
                     <input
                        type="password"
                        required
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        className="mt-2 w-full rounded-[1.1rem] border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-gold/40"
                     />
                  </label>
                  <button type="submit" className="w-full rounded-[1.1rem] bg-gradient-gold px-5 py-3 text-sm font-semibold text-[var(--noir-900)] transition hover:-translate-y-0.5">
                     Continue
                  </button>
               </form>
               <p className="mt-6 text-center text-sm text-muted-foreground">
                  Don’t have an account? <Link to="/register" className="font-medium text-gold hover:text-white">Create one</Link>
               </p>
            </div>
         </div>
      </div>
   );
}
