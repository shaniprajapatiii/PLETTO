import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Logo } from "../brand/Logo";

const navItems = [
   { label: "Dashboard", to: "/dashboard" },
   { label: "Documents", to: "/docs" },
   { label: "Chat", to: "/chat" },
   { label: "Whiteboard", to: "/whiteboard" },
   { label: "Profile", to: "/profile" },
   { label: "Settings", to: "/settings" },
];

export default function Layout() {
   const { user, workspace, loading, setUser, setWorkspace } = useAuth();
   const navigate = useNavigate();

   if (loading) {
      return <div className="min-h-screen grid place-items-center">Loading...</div>;
   }

   const handleSignOut = () => {
      localStorage.removeItem("token");
      setUser(null);
      setWorkspace(null);
      navigate("/login");
   };

   return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_bottom_right,rgba(248,181,0,0.1),transparent_30%),#020617] text-slate-100">
         <div className="flex min-h-screen flex-col lg:flex-row">
            <aside className="w-full border-b border-border/70 bg-[rgba(0,0,0,0.45)] p-6 lg:w-80 lg:border-b-0 lg:border-r lg:bg-[rgba(2,6,23,0.95)]">
               <div className="flex items-center justify-between gap-2">
                  <Logo />
                  <span className="rounded-full border border-gold/30 bg-[rgba(248,181,0,0.08)] px-3 py-1 text-xs uppercase tracking-[0.2em] text-gold">Live</span>
               </div>
               <p className="mt-4 text-sm text-muted-foreground">Workspace collaboration for teams that move fast.</p>
               <nav className="mt-8 flex flex-col gap-2">
                  {navItems.map((item) => (
                     <Link
                        key={item.to}
                        to={item.to}
                        className="rounded-3xl border border-border bg-card/80 px-4 py-3 text-sm font-medium text-white transition hover:border-gold/40 hover:bg-[rgba(248,181,0,0.08)]"
                     >
                        {item.label}
                     </Link>
                  ))}
               </nav>
               <div className="mt-8 rounded-3xl border border-border bg-card/70 p-5">
                  <div className="text-sm text-muted-foreground">Workspace</div>
                  <div className="mt-2 font-semibold text-white">{workspace?.name || "Your workspace"}</div>
                  <div className="mt-2 text-xs uppercase tracking-[0.2em] text-gold">{workspace?.role || "member"}</div>
               </div>
               <div className="mt-5 rounded-3xl border border-border bg-card/70 p-5">
                  <div className="text-sm text-muted-foreground">Signed in as</div>
                  <div className="mt-2 font-semibold text-white">{user?.name ?? user?.email}</div>
                  <button
                     onClick={handleSignOut}
                     className="mt-4 w-full rounded-full bg-gradient-gold px-4 py-2 text-sm font-semibold text-[var(--noir-900)] transition hover:-translate-y-0.5"
                  >
                     Sign Out
                  </button>
               </div>
            </aside>

            <main className="flex-1 overflow-auto p-6">
               <header className="mb-6 rounded-3xl border border-border bg-card/70 p-6 text-white shadow-soft">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                     <div>
                        <h1 className="text-2xl font-semibold">Welcome back, {user?.name ?? "Team"}</h1>
                        <p className="mt-2 text-sm text-muted-foreground">Access docs, chat, whiteboards, and workspace controls here.</p>
                     </div>
                     <div className="rounded-3xl bg-[rgba(248,181,0,0.1)] px-4 py-3 text-sm text-gold">
                        {workspace?.name || "Workspace dashboard"}
                     </div>
                  </div>
               </header>
               <Outlet />
            </main>
         </div>
      </div>
   );
}
