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
         setError("Login failed. Please check your credentials.");
      }
   };

   return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#030303] saas-grid-bg p-4 sm:p-6">
         <div className="w-full max-w-4xl rounded-2xl border border-zinc-800 bg-zinc-950/90 shadow-2xl overflow-hidden grid lg:grid-cols-2 backdrop-blur-xl">
            {/* Left Graphic Banner */}
            <div className="hidden lg:flex flex-col justify-between p-10 bg-[radial-gradient(ellipse_at_top_left,rgba(249,235,174,0.12),transparent_70%)] border-r border-zinc-800/80">
               <div>
                  <Logo />
                  <h2 className="mt-12 text-3xl font-bold tracking-tight text-white leading-tight">
                     Streamline your collaborative workspace.
                  </h2>
                  <p className="mt-4 text-sm text-zinc-400 leading-relaxed">
                     Connect team chats, knowledge documents, and real-time whiteboards into one unified platform.
                  </p>
               </div>

               <div className="p-4 rounded-xl border border-[rgba(249,235,174,0.3)] bg-[rgba(249,235,174,0.05)] text-xs text-[#f9ebae]">
                  ⚡ End-to-end real-time collaboration with zero latency.
               </div>
            </div>

            {/* Right Form Card */}
            <div className="p-8 sm:p-10 flex flex-col justify-center">
               <div className="flex items-center justify-between mb-8">
                  <Logo />
                  <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#f9ebae] bg-[rgba(249,235,174,0.1)] rounded-full border border-[rgba(249,235,174,0.2)]">
                     Sign In
                  </span>
               </div>

               <h1 className="text-2xl font-bold text-zinc-100">Welcome Back</h1>
               <p className="mt-1.5 text-xs text-zinc-400">Enter your email and password to access your workspace.</p>

               {error ? (
                  <div className="mt-4 p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-xs text-red-300 font-medium">
                     {error}
                  </div>
               ) : null}

               <form onSubmit={submit} className="mt-6 space-y-4">
                  <div>
                     <label className="block text-xs font-semibold text-zinc-300">Email Address</label>
                     <input
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="alex@company.com"
                        className="mt-1.5 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-[#f9ebae] transition"
                     />
                  </div>

                  <div>
                     <label className="block text-xs font-semibold text-zinc-300">Password</label>
                     <input
                        type="password"
                        required
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        placeholder="••••••••"
                        className="mt-1.5 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-[#f9ebae] transition"
                     />
                  </div>

                  <button
                     type="submit"
                     className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-[#f9ebae] via-[#f9ebae] to-[#d8c46e] text-zinc-950 font-bold text-sm shadow-md shadow-[#f9ebae]/20 transition duration-150"
                  >
                     Sign In to Workspace
                  </button>
               </form>

               <p className="mt-6 text-center text-xs text-zinc-400">
                  Don't have an account?{" "}
                  <Link to="/register" className="font-semibold text-[#f9ebae] hover:underline">
                     Create Workspace
                  </Link>
               </p>
            </div>
         </div>
      </div>
   );
}


