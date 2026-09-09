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
   const [loading, setLoading] = useState(false);

   const submit = async (e) => {
      e.preventDefault();
      setError("");
      setLoading(true);
      try {
         const res = await registerUser(form);
         localStorage.setItem("token", res.data.token);
         setUser(res.data.user);
         setWorkspace(res.data.workspace);
         navigate("/dashboard");
      } catch {
         setError("Unable to create account. Please try again with a valid email.");
      } finally {
         setLoading(false);
      }
   };

   return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#0b0c10] app-grid-bg p-4 sm:p-6">
         <div className="w-full max-w-4xl rounded-2xl border border-zinc-800 bg-zinc-900/90 shadow-2xl overflow-hidden grid lg:grid-cols-2 backdrop-blur-xl">
            {/* Left Banner */}
            <div className="hidden lg:flex flex-col justify-between p-10 bg-zinc-950/40 border-r border-zinc-800/80">
               <div>
                  <Link to="/">
                     <Logo />
                  </Link>
                  <h2 className="mt-12 text-2xl font-semibold tracking-tight text-white leading-snug">
                     Build your next workspace with clarity.
                  </h2>
                  <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
                     Connect team chats, knowledge documents, and direct messaging into one unified platform.
                  </p>
               </div>

               <div className="p-3.5 rounded-lg border border-zinc-800 bg-zinc-900/60 text-xs text-zinc-300">
                  Role permissions, member roster, and real-time syncing.
               </div>
            </div>

            {/* Right Form Card */}
            <div className="p-8 sm:p-10 flex flex-col justify-center">
               <div className="flex items-center justify-between mb-8">
                  <Link to="/">
                     <Logo />
                  </Link>
                  <span className="px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-300 bg-zinc-800 rounded-md border border-zinc-700">
                     Register
                  </span>
               </div>

               <h1 className="text-xl font-semibold text-zinc-100">Create Workspace</h1>
               <p className="mt-1 text-xs text-zinc-400">Get started with your collaborative workspace.</p>

               {error ? (
                  <div className="mt-4 p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-xs text-red-300 font-medium">
                     {error}
                  </div>
               ) : null}

               <form onSubmit={submit} className="mt-6 space-y-4">
                  <div>
                     <label className="block text-xs font-medium text-zinc-300">Full Name</label>
                     <input
                        required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Alex Morgan"
                        className="mt-1.5 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-zinc-500 transition"
                     />
                  </div>

                  <div>
                     <label className="block text-xs font-medium text-zinc-300">Work Email</label>
                     <input
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="alex@company.com"
                        className="mt-1.5 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-zinc-500 transition"
                     />
                  </div>

                  <div>
                     <label className="block text-xs font-medium text-zinc-300">Password</label>
                     <input
                        type="password"
                        required
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        placeholder="••••••••"
                        className="mt-1.5 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-zinc-500 transition"
                     />
                  </div>

                  <button
                     type="submit"
                     disabled={loading}
                     className="w-full py-2.5 px-4 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-medium text-sm transition disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                  >
                     {loading ? (
                        <>
                           <span className="h-4 w-4 rounded-full border-2 border-zinc-950 border-t-transparent animate-spin" />
                           <span>Creating Account...</span>
                        </>
                     ) : (
                        <span>Create Workspace</span>
                     )}
                  </button>
               </form>

               <p className="mt-6 text-center text-xs text-zinc-400">
                  Already have an account?{" "}
                  <Link to="/login" className="font-medium text-zinc-200 hover:underline">
                     Sign In
                  </Link>
               </p>
            </div>
         </div>
      </div>
   );
}


