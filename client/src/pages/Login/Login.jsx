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
      <div className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
         <div className="w-full max-w-md rounded-[2rem] border border-border/80 bg-[rgba(2,6,23,0.8)] p-6 shadow-soft backdrop-blur-xl sm:p-8">
            <div className="mb-8 flex items-center justify-between gap-3">
               <Logo />
               <span className="rounded-full border border-gold/30 bg-[rgba(248,181,0,0.08)] px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-gold">Login</span>
            </div>
            <h1 className="text-3xl font-semibold text-white">Welcome back</h1>
            <p className="mt-3 text-sm text-muted-foreground">Sign in to continue to your PLETTO workspace.</p>
            {error ? <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">{error}</div> : null}
            <form onSubmit={submit} className="mt-8 space-y-5">
               <label className="block text-sm text-muted-foreground">
                  Email
                  <input
                     type="email"
                     required
                     value={form.email}
                     onChange={(e) => setForm({ ...form, email: e.target.value })}
                     className="mt-2 w-full rounded-[1.2rem] border border-border bg-[rgba(255,255,255,0.06)] px-4 py-3 text-white outline-none transition focus:border-gold"
                  />
               </label>
               <label className="block text-sm text-muted-foreground">
                  Password
                  <input
                     type="password"
                     required
                     value={form.password}
                     onChange={(e) => setForm({ ...form, password: e.target.value })}
                     className="mt-2 w-full rounded-[1.2rem] border border-border bg-[rgba(255,255,255,0.06)] px-4 py-3 text-white outline-none transition focus:border-gold"
                  />
               </label>
               <button type="submit" className="w-full rounded-[1.2rem] bg-gradient-gold px-5 py-3 text-sm font-semibold text-[var(--noir-900)] transition hover:-translate-y-0.5">
                  Continue
               </button>
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
               Don’t have an account? <Link to="/register" className="font-medium text-gold hover:text-white">Create one</Link>
            </p>
         </div>
      </div>
   );
}
