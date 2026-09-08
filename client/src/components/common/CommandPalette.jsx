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
         { id: "dashboard", title: "Dashboard", description: "Workspace overview and recent activity", href: "/dashboard", icon: HiViewGrid },
         { id: "channels", title: "Channels", description: "Team discussions and public rooms", href: "/chat", icon: HiChatAlt2 },
         { id: "dm", title: "Direct Messages", description: "1-on-1 conversations", href: "/dm", icon: HiUsers },
      ],
   },
   {
      category: "Organization",
      items: [
         { id: "my-channels", title: "Directory", description: "Workspace channels and rooms", href: "/my-channels", icon: HiHashtag },
         { id: "people", title: "Team", description: "Team members and online status", href: "/people", icon: HiUsers },
      ],
   },
   {
      category: "Account",
      items: [
         { id: "profile", title: "Profile", description: "Personal details and avatar", href: "/profile", icon: HiUserCircle },
         { id: "settings", title: "Settings", description: "Workspace settings and roles", href: "/settings", icon: HiCog },
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
         className="fixed inset-0 z-50 flex items-start justify-center bg-black/75 px-4 py-16 backdrop-blur-sm"
         onClick={() => onOpenChange(false)}
      >
         <div
            className="w-full max-w-xl rounded-xl border border-zinc-800 bg-[#12141a] p-3 shadow-2xl space-y-3"
            onClick={(event) => event.stopPropagation()}
         >
            {/* Search Input Bar */}
            <div className="flex items-center gap-2.5 rounded-lg border border-zinc-800 bg-zinc-950/80 px-3 py-2">
               <HiSearch className="h-4 w-4 text-zinc-400 shrink-0" />
               <input
                  autoFocus
                  value={query}
                  onChange={(event) => {
                     setQuery(event.target.value);
                     setSelectedIndex(0);
                  }}
                  placeholder="Search pages, channels, or documents..."
                  className="w-full bg-transparent text-xs text-zinc-100 placeholder:text-zinc-500 outline-none"
               />
               <kbd className="px-1.5 py-0.5 rounded border border-zinc-800 bg-zinc-900 text-[10px] font-mono text-zinc-400">
                  ESC
               </kbd>
            </div>

            {/* Search Results */}
            <div className="max-h-[50vh] overflow-y-auto space-y-1 pr-1">
               {flatActions.length === 0 ? (
                  <div className="py-8 text-center text-xs text-zinc-500">
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
                           className={`group flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition ${
                              isSelected
                                 ? "bg-zinc-800 text-white"
                                 : "text-zinc-300 hover:bg-zinc-800/50"
                           }`}
                        >
                           <div className="flex items-center gap-2.5 min-w-0">
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300">
                                 <Icon className="h-3.5 w-3.5" />
                              </div>
                              <div className="min-w-0">
                                 <div className="text-xs font-medium truncate">
                                    {action.title}
                                 </div>
                                 <div className="text-[11px] text-zinc-400 truncate">{action.description}</div>
                              </div>
                           </div>

                           <HiArrowRight className={`h-3.5 w-3.5 shrink-0 transition ${isSelected ? "text-zinc-200" : "text-zinc-600"}`} />
                        </button>
                     );
                  })
               )}
            </div>

            {/* Footer Hints */}
            <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 text-[10px] text-zinc-500 font-mono">
               <div className="flex items-center gap-3">
                  <span>↑↓ Navigate</span>
                  <span>↵ Select</span>
               </div>
               <span>Command Palette</span>
            </div>
         </div>
      </div>
   );
}
