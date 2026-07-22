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
      } catch {
         setError("Unable to create account. Try again with a valid email.");
      }
   };

   return (
      <div
         className="flex min-h-screen items-center justify-center bg-[#030303] px-4 py-10 sm:px-6"
         style={{
            backgroundImage:
               "linear-gradient(rgba(249, 235, 174, 0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(249, 235, 174, 0.045) 1px, transparent 1px), radial-gradient(circle at top left, rgba(249, 235, 174, 0.16), transparent 34%)",
            backgroundSize: "44px 44px, 44px 44px, auto",
         }}
      >
         <div className="w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-[#090909]/90 shadow-[0_35px_100px_rgba(0,0,0,0.38)] backdrop-blur-2xl lg:grid lg:grid-cols-[0.95fr_1.05fr]">
            <div className="relative hidden overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(249,235,174,0.14),transparent_35%),linear-gradient(135deg,#0b0b0b,#070707)] p-8 lg:flex lg:flex-col lg:justify-between">
               <div className="absolute inset-0 bg-[linear-gradient(rgba(249,235,174,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(249,235,174,0.045)_1px,transparent_1px)] bg-[size:40px_40px] opacity-60" />
               <div className="relative">
                  <Logo />
                  <h1 className="mt-10 text-3xl font-semibold text-white">Build your next workspace with clarity.</h1>
                  <p className="mt-4 max-w-md text-sm leading-7 text-slate-400">
                     Launch faster, keep your team aligned, and turn collaboration into a premium experience from the first sign-in.
                  </p>
               </div>
               <div className="relative rounded-[1.3rem] border border-[#f9ebae]/15 bg-[#121212]/80 p-4 text-sm text-slate-400 shadow-[0_12px_36px_rgba(0,0,0,0.16)]">
                  No clutter · real-time flow · polished product experience.
               </div>
            </div>

            <div className="p-6 sm:p-8">
               <div className="mb-8 flex items-center justify-between gap-3 lg:justify-end">
                  <div className="lg:hidden">
                     <Logo />
                  </div>
                  <span className="rounded-full border border-[#f9ebae]/25 bg-[rgba(249,235,174,0.08)] px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-[#f9ebae]">
                     Register
                  </span>
               </div>

               <h2 className="text-3xl font-semibold text-white">Create your workspace</h2>
               <p className="mt-3 text-sm text-slate-400">Start with a refined, connected experience designed for ambitious teams.</p>

               {error ? (
                  <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">
                     {error}
                  </div>
               ) : null}

               <form onSubmit={submit} className="mt-8 space-y-5">
                  <label className="block text-sm text-slate-400">
                     Name
                     <input
                        required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="mt-2 w-full rounded-[1.1rem] border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-[#f9ebae]/40 focus:bg-white/[0.06]"
                     />
                  </label>
                  <label className="block text-sm text-slate-400">
                     Email
                     <input
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="mt-2 w-full rounded-[1.1rem] border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-[#f9ebae]/40 focus:bg-white/[0.06]"
                     />
                  </label>
                  <label className="block text-sm text-slate-400">
                     Password
                     <input
                        type="password"
                        required
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        className="mt-2 w-full rounded-[1.1rem] border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-[#f9ebae]/40 focus:bg-white/[0.06]"
                     />
                  </label>

                  <button
                     type="submit"
                     className="w-full rounded-[1.1rem] bg-gradient-to-r from-[#f9ebae] via-[#f9ebae] to-[#d8c46e] px-5 py-3 text-sm font-semibold text-[#140d03] shadow-[0_16px_40px_rgba(249,235,174,0.18)] transition hover:-translate-y-0.5"
                  >
                     Create account
                  </button>
               </form>

               <p className="mt-6 text-center text-sm text-slate-400">
                  Already have an account?{" "}
                  <Link to="/login" className="font-medium text-[#f9ebae] transition hover:text-white">
                     Sign in
                  </Link>
               </p>
            </div>
         </div>
      </div>
   );
}
