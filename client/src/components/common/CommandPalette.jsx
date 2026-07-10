import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HiSearch, HiSparkles, HiDocumentText, HiChatAlt2, HiViewBoards, HiViewGrid, HiUserCircle, HiCog, HiVideoCamera, HiLightningBolt } from "react-icons/hi";

const QUICK_ACTIONS = [
   { id: "dashboard", title: "Go to Dashboard", description: "Mission control", href: "/dashboard", icon: HiViewGrid },
   { id: "docs", title: "Open Documents", description: "Realtime editor", href: "/docs", icon: HiDocumentText },
   { id: "chat", title: "Open Channels", description: "Team chat", href: "/chat", icon: HiChatAlt2 },
   { id: "board", title: "Open Whiteboard", description: "Infinite canvas", href: "/whiteboard", icon: HiViewBoards },
   { id: "profile", title: "Open Profile", description: "Account & preferences", href: "/profile", icon: HiUserCircle },
   { id: "settings", title: "Workspace members", description: "Invite & roles", href: "/settings", icon: HiCog },
   { id: "ai", title: "Ask PLETTO AI", description: "Summarize this week", href: "/dashboard", icon: HiSparkles },
   { id: "call", title: "Start a call", description: "Launch a quick huddle", href: "/chat", icon: HiVideoCamera },
];

export function CommandPalette({ open, onOpenChange }) {
   const [query, setQuery] = useState("");
   const [selectedIndex, setSelectedIndex] = useState(0);
   const navigate = useNavigate();

   useEffect(() => {
      if (!open) return;
      const resetState = () => {
         setQuery("");
         setSelectedIndex(0);
      };
      resetState();
   }, [open]);

   const filteredActions = useMemo(() => {
      const value = query.trim().toLowerCase();
      if (!value) return QUICK_ACTIONS;
      return QUICK_ACTIONS.filter((action) => `${action.title} ${action.description}`.toLowerCase().includes(value));
   }, [query]);

   useEffect(() => {
      if (!open) return;
      const onKeyDown = (event) => {
         if (event.key === "Escape") {
            onOpenChange(false);
         }
         if (event.key === "ArrowDown") {
            event.preventDefault();
            setSelectedIndex((index) => Math.min(index + 1, filteredActions.length - 1));
         }
         if (event.key === "ArrowUp") {
            event.preventDefault();
            setSelectedIndex((index) => Math.max(index - 1, 0));
         }
         if (event.key === "Enter") {
            const action = filteredActions[selectedIndex];
            if (action) {
               event.preventDefault();
               navigate(action.href);
               onOpenChange(false);
            }
         }
      };
      window.addEventListener("keydown", onKeyDown);
      return () => window.removeEventListener("keydown", onKeyDown);
   }, [filteredActions, onOpenChange, open, navigate, selectedIndex]);

   if (!open) return null;

   return (
      <div className="fixed inset-0 z-50 flex items-start justify-center bg-[rgba(2,6,23,0.72)] px-4 py-16 backdrop-blur-sm" onClick={() => onOpenChange(false)}>
         <div className="w-full max-w-2xl rounded-[2rem] border border-gold/30 bg-[rgba(2,6,23,0.95)] p-4 shadow-soft" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center gap-3 rounded-[1.25rem] border border-border bg-[rgba(255,255,255,0.06)] px-4 py-3">
               <HiSearch className="h-5 w-5 text-gold" />
               <input
                  autoFocus
                  value={query}
                  onChange={(event) => {
                     setQuery(event.target.value);
                     setSelectedIndex(0);
                  }}
                  placeholder="Search docs, channels, people, or AI commands…"
                  className="w-full bg-transparent text-sm text-white outline-none"
               />
               <button onClick={() => onOpenChange(false)} className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Esc
               </button>
            </div>

            <div className="mt-4 max-h-[60vh] overflow-y-auto space-y-2">
               {filteredActions.length === 0 ? (
                  <div className="rounded-[1.1rem] border border-dashed border-border/60 bg-[rgba(255,255,255,0.03)] p-5 text-sm text-muted-foreground">
                     No quick actions match your search yet.
                  </div>
               ) : (
                  filteredActions.map((action, index) => {
                     const Icon = action.icon;
                     return (
                        <button
                           key={action.id}
                           type="button"
                           onClick={() => {
                              navigate(action.href);
                              onOpenChange(false);
                           }}
                           onMouseEnter={() => setSelectedIndex(index)}
                           className={`flex w-full items-center justify-between rounded-[1.1rem] border px-4 py-3 text-left transition ${selectedIndex === index ? "border-gold/40 bg-[rgba(248,181,0,0.08)]" : "border-border bg-[rgba(255,255,255,0.03)]"}`}
                        >
                           <div className="flex items-center gap-3">
                              <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${selectedIndex === index ? "bg-gradient-gold text-[var(--noir-900)]" : "bg-[rgba(255,255,255,0.05)] text-gold"}`}>
                                 <Icon className="h-4 w-4" />
                              </div>
                              <div>
                                 <div className="text-sm font-semibold text-white">{action.title}</div>
                                 <div className="text-xs text-muted-foreground">{action.description}</div>
                              </div>
                           </div>
                           <div className="flex items-center gap-2 rounded-full border border-gold/20 bg-[rgba(248,181,0,0.08)] px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-gold">
                              <HiLightningBolt className="h-3.5 w-3.5" />
                              Jump
                           </div>
                        </button>
                     );
                  })
               )}
            </div>
         </div>
      </div>
   );
}
