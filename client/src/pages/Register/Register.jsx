import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { registerUser } from "../../services/authService";
import { Logo } from "../../components/brand/Logo";

export default function Register() {
   const navigate = useNavigate();
   const { setUser, setWorkspace } = useAuth();
   const [form, setForm] = useState({ name: "", email: "", password: "" });
   const [error, setError] = useState("");

   const submit = async (e) => {
      e.preventDefault();
      setError("");
      try {
         const res = await registerUser(form);
         localStorage.setItem("token", res.data.token);
         setUser(res.data.user);
         setWorkspace(res.data.workspace);
         navigate("/dashboard");
      } catch (err) {
         setError("Unable to create account. Try again with a valid email.");
      }
   };

   return (
      <div className="min-h-[calc(100vh-32px)] px-4 py-10 sm:px-6">
         <div className="mx-auto max-w-md rounded-[2rem] border border-border bg-[rgba(255,255,255,0.05)] p-8 shadow-soft backdrop-blur-xl">
            <div className="mb-8 flex items-center justify-between">
               <Logo />
               <span className="rounded-full border border-gold/30 bg-[rgba(248,181,0,0.08)] px-3 py-1 text-xs uppercase tracking-[0.2em] text-gold">Register</span>
            </div>
            <h1 className="text-3xl font-semibold text-white">Create your workspace</h1>
            <p className="mt-3 text-sm text-muted-foreground">Get started with the same teamwork experience as the original app.</p>
            {error && <div className="mt-5 rounded-2xl bg-red-500/10 p-3 text-sm text-red-200">{error}</div>}
            <form onSubmit={submit} className="mt-8 space-y-5">
               <label className="block text-sm text-muted-foreground">
                  Name
                  <input
                     required
                     value={form.name}
                     onChange={(e) => setForm({ ...form, name: e.target.value })}
                     className="mt-2 w-full rounded-3xl border border-border bg-[rgba(255,255,255,0.06)] px-4 py-3 text-white outline-none focus:border-gold"
                  />
               </label>
               <label className="block text-sm text-muted-foreground">
                  Email
                  <input
                     type="email"
                     required
                     value={form.email}
                     onChange={(e) => setForm({ ...form, email: e.target.value })}
                     className="mt-2 w-full rounded-3xl border border-border bg-[rgba(255,255,255,0.06)] px-4 py-3 text-white outline-none focus:border-gold"
                  />
               </label>
               <label className="block text-sm text-muted-foreground">
                  Password
                  <input
                     type="password"
                     required
                     value={form.password}
                     onChange={(e) => setForm({ ...form, password: e.target.value })}
                     className="mt-2 w-full rounded-3xl border border-border bg-[rgba(255,255,255,0.06)] px-4 py-3 text-white outline-none focus:border-gold"
                  />
               </label>
               <button type="submit" className="w-full rounded-3xl bg-gradient-gold px-5 py-3 text-sm font-semibold text-[var(--noir-900)] transition hover:-translate-y-0.5">
                  Create account
               </button>
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
               Already have an account? <Link to="/login" className="text-gold hover:text-white">Sign in</Link>
            </p>
         </div>
      </div>
   );
}
