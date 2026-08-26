import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
   HiSearch,
   HiSparkles,
   HiDocumentText,
   HiChatAlt2,
   HiViewBoards,
   HiViewGrid,
   HiUserCircle,
   HiCog,
   HiUsers,
   HiHashtag,
   HiArrowRight,
   HiLightningBolt,
   HiX,
} from "react-icons/hi";

const CATEGORIZED_ACTIONS = [
   {
      category: "NAVIGATION",
      items: [
         { id: "dashboard", title: "Mission Control Dashboard", description: "Overview stats & workspace activity", href: "/dashboard", icon: HiViewGrid },
         { id: "docs", title: "Knowledge Documents", description: "Full-screen markdown & spec editor", href: "/docs", icon: HiDocumentText },
         { id: "chat", title: "Team Channels", description: "Public & private discussion rooms", href: "/chat", icon: HiChatAlt2 },
         { id: "dm", title: "Direct Messages", description: "1-on-1 teammate conversations", href: "/dm", icon: HiUsers },
         { id: "board", title: "Visual Whiteboards", description: "Flowcharting & sticky note canvas", href: "/whiteboard", icon: HiViewBoards },
      ],
   },
   {
      category: "WORKSPACES",
      items: [
         { id: "my-channels", title: "My Channel Directory", description: "Manage workspace assets & privacy", href: "/my-channels", icon: HiHashtag },
         { id: "people", title: "Team Directory & Presence", description: "View workspace members & online status", href: "/people", icon: HiUsers },
      ],
   },
   {
      category: "ACCOUNT & AI",
      items: [
         { id: "profile", title: "Profile & Avatar Settings", description: "Update personal details & bio", href: "/profile", icon: HiUserCircle },
         { id: "settings", title: "Workspace Invites & Roles", description: "Manage members & workspace settings", href: "/settings", icon: HiCog },
         { id: "ai", title: "Ask PLETTO AI Assistant", description: "Summarize notes & workspace updates", href: "/dashboard", icon: HiSparkles },
      ],
   },
];

export function CommandPalette({ open, onOpenChange }) {
   const [query, setQuery] = useState("");
   const [selectedIndex, setSelectedIndex] = useState(0);
   const navigate = useNavigate();

   useEffect(() => {
      if (!open) return;
      setQuery("");
      setSelectedIndex(0);
   }, [open]);

   const flatActions = useMemo(() => {
      const q = query.trim().toLowerCase();
      const result = [];
      CATEGORIZED_ACTIONS.forEach((cat) => {
         cat.items.forEach((item) => {
            if (!q || `${item.title} ${item.description}`.toLowerCase().includes(q)) {
               result.push({ ...item, category: cat.category });
            }
         });
      });
      return result;
   }, [query]);

   useEffect(() => {
      if (!open) return;
      const onKeyDown = (event) => {
         if (event.key === "Escape") {
            onOpenChange(false);
         }
         if (event.key === "ArrowDown") {
            event.preventDefault();
            setSelectedIndex((index) => Math.min(index + 1, flatActions.length - 1));
         }
         if (event.key === "ArrowUp") {
            event.preventDefault();
            setSelectedIndex((index) => Math.max(index - 1, 0));
         }
         if (event.key === "Enter") {
            const action = flatActions[selectedIndex];
            if (action) {
               event.preventDefault();
               navigate(action.href);
               onOpenChange(false);
            }
         }
      };
      window.addEventListener("keydown", onKeyDown);
      return () => window.removeEventListener("keydown", onKeyDown);
   }, [flatActions, onOpenChange, open, navigate, selectedIndex]);

   if (!open) return null;

   return (
      <div
         className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 px-4 py-16 backdrop-blur-md"
         onClick={() => onOpenChange(false)}
      >
         <div
            className="w-full max-w-2xl rounded-3xl border border-zinc-800/90 bg-zinc-950/95 p-4 sm:p-5 shadow-2xl space-y-4 shadow-black/80"
            onClick={(event) => event.stopPropagation()}
         >
            {/* Search Input Bar */}
            <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/80 px-4 py-3 shadow-inner">
               <HiSearch className="h-5 w-5 text-[#f9ebae] shrink-0" />
               <input
                  autoFocus
                  value={query}
                  onChange={(event) => {
                     setQuery(event.target.value);
                     setSelectedIndex(0);
                  }}
                  placeholder="Search pages, channels, documents, or AI commands (⌘K)..."
                  className="w-full bg-transparent text-sm text-zinc-100 placeholder:text-zinc-500 outline-none"
               />
               <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="px-2 py-1 rounded-lg border border-zinc-800 bg-zinc-950 text-[10px] font-mono font-bold text-zinc-400 hover:text-white transition"
               >
                  ESC
               </button>
            </div>

            {/* Categorized Search Results */}
            <div className="max-h-[55vh] overflow-y-auto space-y-2 pr-1">
               {flatActions.length === 0 ? (
                  <div className="py-12 text-center text-xs text-zinc-500 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 p-6">
                     No commands match "{query}".
                  </div>
               ) : (
                  flatActions.map((action, index) => {
                     const Icon = action.icon;
                     const isSelected = selectedIndex === index;

                     return (
                        <button
                           key={action.id}
                           type="button"
                           onClick={() => {
                              navigate(action.href);
                              onOpenChange(false);
                           }}
                           onMouseEnter={() => setSelectedIndex(index)}
                           className={`group flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                              isSelected
                                 ? "border-[#f9ebae]/40 bg-[#f9ebae]/10 shadow-lg shadow-[#f9ebae]/5"
                                 : "border-zinc-800/80 bg-zinc-900/40 hover:bg-zinc-900/80"
                           }`}
                        >
                           <div className="flex items-center gap-3.5 min-w-0">
                              <div
                                 className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
                                    isSelected
                                       ? "bg-[#f9ebae] text-zinc-950"
                                       : "bg-zinc-900 border border-zinc-800 text-[#f9ebae]"
                                 }`}
                              >
                                 <Icon className="h-5 w-5" />
                              </div>
                              <div className="min-w-0">
                                 <div className="text-xs font-extrabold text-zinc-100 group-hover:text-[#f9ebae] transition truncate">
                                    {action.title}
                                 </div>
                                 <div className="text-[11px] text-zinc-400 truncate mt-0.5">{action.description}</div>
                              </div>
                           </div>

                           <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-zinc-800 bg-zinc-950 text-[10px] font-bold text-zinc-400 group-hover:text-[#f9ebae] group-hover:border-[#f9ebae]/30 transition shrink-0">
                              <HiLightningBolt size={12} />
                              <span>Jump</span>
                           </div>
                        </button>
                     );
                  })
               )}
            </div>

            {/* Footer Navigation Hints */}
            <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80 text-[10px] text-zinc-500 font-mono">
               <div className="flex items-center gap-3">
                  <span>↑↓ Navigate</span>
                  <span>↵ Select</span>
                  <span>Esc Close</span>
               </div>
               <span className="text-[#f9ebae] font-bold">PLETTO Command Palette</span>
            </div>
         </div>
      </div>
   );
}
