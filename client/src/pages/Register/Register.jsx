import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { registerUser } from "../../services/authService";
import { Logo } from "../../components/brand/Logo";
import { HiArrowRight, HiOutlineUser, HiOutlineMail, HiOutlineLockClosed } from "react-icons/hi";

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
         setError("Unable to create account. Please ensure all fields are filled with valid data.");
      } finally {
         setLoading(false);
      }
   };

   return (
      <div className="min-h-screen w-full flex items-center justify-center bg-black app-grid-bg p-4 sm:p-6 lg:p-8">
         <div className="w-full max-w-4xl big-card overflow-hidden grid lg:grid-cols-2 shadow-[0_20px_70px_rgba(0,0,0,0.95)]">
            {/* Left Graphic Banner (Big Card side) */}
            <div className="hidden lg:flex flex-col justify-between p-10 sm:p-12 bg-gradient-to-b from-[#111114] to-black border-r border-white/10">
               <div>
                  <Link to="/">
                     <Logo />
                  </Link>
                  <h2 className="mt-14 text-3xl font-black tracking-tight text-white leading-tight">
                     Build your workspace with speed and clarity.
                  </h2>
                  <p className="mt-4 text-sm text-neutral-400 leading-relaxed font-normal">
                     Get started in seconds with team discussion rooms, direct messaging, and rich member rosters.
                  </p>
               </div>

               <div className="space-y-3">
                  <div className="p-4 rounded-xl border border-white/15 bg-black/60 text-xs font-mono text-neutral-300">
                     • Zero-friction team onboarding
                     <br />
                     • Instant role assignments & permissions
                     <br />
                     • 100% pure black & white design system
                  </div>
                  <div className="text-[11px] font-mono text-neutral-500">
                     ENTERPRISE GRADE • REALTIME SOCKET ENGINE
                  </div>
               </div>
            </div>

            {/* Right Form Big Card */}
            <div className="p-8 sm:p-12 flex flex-col justify-center">
               <div className="flex items-center justify-between mb-8">
                  <Link to="/" className="lg:hidden">
                     <Logo />
                  </Link>
                  <span className="badge-bw px-3 py-1 text-xs font-mono">
                     REGISTER
                  </span>
               </div>

               <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Create Workspace</h1>
               <p className="mt-1.5 text-xs sm:text-sm text-neutral-400">Setup your account and launch your collaborative workspace.</p>

               {error ? (
                  <div className="mt-5 p-4 rounded-xl border border-white/30 bg-[#16161a] text-xs font-bold text-white">
                     {error}
                  </div>
               ) : null}

               <form onSubmit={submit} className="mt-8 space-y-5">
                  <div>
                     <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider font-mono">Full Name</label>
                     <div className="relative mt-2">
                        <HiOutlineUser className="absolute left-3.5 top-3.5 h-4 w-4 text-neutral-500" />
                        <input
                           required
                           value={form.name}
                           onChange={(e) => setForm({ ...form, name: e.target.value })}
                           placeholder="Alex Morgan"
                           className="w-full rounded-xl border border-white/15 bg-[#121214] py-3 pl-10 pr-4 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-white transition"
                        />
                     </div>
                  </div>

                  <div>
                     <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider font-mono">Work Email</label>
                     <div className="relative mt-2">
                        <HiOutlineMail className="absolute left-3.5 top-3.5 h-4 w-4 text-neutral-500" />
                        <input
                           type="email"
                           required
                           value={form.email}
                           onChange={(e) => setForm({ ...form, email: e.target.value })}
                           placeholder="alex@company.com"
                           className="w-full rounded-xl border border-white/15 bg-[#121214] py-3 pl-10 pr-4 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-white transition"
                        />
                     </div>
                  </div>

                  <div>
                     <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider font-mono">Password</label>
                     <div className="relative mt-2">
                        <HiOutlineLockClosed className="absolute left-3.5 top-3.5 h-4 w-4 text-neutral-500" />
                        <input
                           type="password"
                           required
                           value={form.password}
                           onChange={(e) => setForm({ ...form, password: e.target.value })}
                           placeholder="••••••••••••"
                           className="w-full rounded-xl border border-white/15 bg-[#121214] py-3 pl-10 pr-4 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-white transition"
                        />
                     </div>
                  </div>

                  <button
                     type="submit"
                     disabled={loading}
                     className="btn-white w-full py-3.5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                  >
                     <span>{loading ? "Creating Workspace..." : "Create Workspace"}</span>
                     <HiArrowRight className="h-4 w-4" />
                  </button>
               </form>

               <div className="mt-8 pt-6 border-t border-white/10 text-center text-xs text-neutral-400">
                  Already have an account?{" "}
                  <Link to="/login" className="font-bold text-white hover:underline">
                     Sign In
                  </Link>
               </div>
            </div>
         </div>
      </div>
   );
}
