import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
   HiSearch,
   HiChatAlt2,
   HiViewGrid,
   HiUserCircle,
   HiCog,
   HiUsers,
   HiHashtag,
   HiArrowRight,
} from "react-icons/hi";

const CATEGORIZED_ACTIONS = [
   {
      category: "Navigation",
      items: [
         { id: "dashboard", title: "Dashboard", description: "Workspace overview, metrics, and activity", href: "/dashboard", icon: HiViewGrid },
         { id: "channels", title: "Channels", description: "Team discussions and public rooms", href: "/chat", icon: HiChatAlt2 },
         { id: "dm", title: "Direct Messages", description: "1-on-1 private conversations", href: "/dm", icon: HiUsers },
      ],
   },
   {
      category: "Organization",
      items: [
         { id: "my-channels", title: "Channel Directory", description: "Browse, filter, and manage channels", href: "/my-channels", icon: HiHashtag },
         { id: "people", title: "Team Directory", description: "All team members and live status", href: "/people", icon: HiUsers },
      ],
   },
   {
      category: "Account & Workspace",
      items: [
         { id: "profile", title: "Profile", description: "Your details, avatar, and bio", href: "/profile", icon: HiUserCircle },
         { id: "settings", title: "Settings", description: "Workspace members, roles, and invite", href: "/settings", icon: HiCog },
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
         className="fixed inset-0 z-50 flex items-start justify-center bg-black/85 px-4 pt-20 sm:pt-28 pb-6 backdrop-blur-md"
         onClick={() => onOpenChange(false)}
      >
         <div
            className="w-full max-w-2xl rounded-2xl border border-white/20 bg-[#080808] p-4 sm:p-5 shadow-[0_20px_60px_rgba(0,0,0,0.95)] space-y-4 ring-1 ring-white/10"
            onClick={(event) => event.stopPropagation()}
         >
            {/* Big Search Input Bar */}
            <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-[#121214] px-4 py-3">
               <HiSearch className="h-5 w-5 text-neutral-400 shrink-0" />
               <input
                  autoFocus
                  value={query}
                  onChange={(event) => {
                     setQuery(event.target.value);
                     setSelectedIndex(0);
                  }}
                  placeholder="Type a command or search..."
                  className="w-full bg-transparent text-sm sm:text-base font-medium text-white placeholder:text-neutral-500 outline-none"
               />
               <kbd className="px-2 py-0.5 rounded border border-white/20 bg-black text-[11px] font-mono text-neutral-300">
                  ESC
               </kbd>
            </div>

            {/* Search Results */}
            <div className="max-h-[55vh] overflow-y-auto space-y-1.5 pr-1">
               {flatActions.length === 0 ? (
                  <div className="py-12 text-center text-sm text-neutral-500">
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
                           className={`group flex w-full items-center justify-between rounded-xl p-3 text-left transition ${
                              isSelected
                                 ? "bg-white text-black"
                                 : "text-neutral-200 hover:bg-white/10"
                           }`}
                        >
                           <div className="flex items-center gap-3.5 min-w-0">
                              <div
                                 className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition ${
                                    isSelected
                                       ? "bg-black text-white border-black"
                                       : "bg-[#141416] border-white/10 text-white"
                                 }`}
                              >
                                 <Icon className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                 <div className="text-sm font-semibold truncate">
                                    {action.title}
                                 </div>
                                 <div
                                    className={`text-xs truncate transition ${
                                       isSelected ? "text-neutral-700" : "text-neutral-400"
                                    }`}
                                 >
                                    {action.description}
                                 </div>
                              </div>
                           </div>

                           <HiArrowRight
                              className={`h-4 w-4 shrink-0 transition ${
                                 isSelected ? "text-black translate-x-0.5" : "text-neutral-600"
                              }`}
                           />
                        </button>
                     );
                  })
               )}
            </div>

            {/* Footer Hints */}
            <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs text-neutral-400 font-mono">
               <div className="flex items-center gap-4">
                  <span>↑↓ Navigate</span>
                  <span>↵ Open</span>
               </div>
               <span>PLETTO PALETTE</span>
            </div>
         </div>
      </div>
   );
}
