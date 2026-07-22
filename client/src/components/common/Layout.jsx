import { useEffect, useMemo, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
   HiViewGrid as DashboardIcon,
   HiDocumentText as DocsIcon,
   HiChatAlt2 as ChatIcon,
   HiViewBoards as WhiteboardIcon,
   HiUsers as PeopleIcon,
   HiUserCircle as ProfileIcon,
   HiCog as SettingsIcon,
   HiBell as BellIcon,
   HiPlus as PlusIcon,
   HiSearch as SearchIcon,
   HiSparkles as SparklesIcon,
   HiX as CloseIcon,
   HiHashtag as HashIcon,
   HiMenu as MenuIcon,
   HiChevronLeft as ChevronLeftIcon,
   HiChevronRight as ChevronRightIcon,
   HiLogout as LogoutIcon,
} from "react-icons/hi";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { createBoard } from "../../services/whiteboardService";
import { createDoc } from "../../services/docsService";
import { createChannel, getChannels } from "../../services/chatService";
import { Logo } from "../brand/Logo";
import { CommandPalette } from "./CommandPalette";
import { PresenceStack } from "../../components/app/PresenceStack";

const navGroups = [
   {
      title: "CORE",
      items: [
         { label: "Dashboard", to: "/dashboard", icon: DashboardIcon, badge: null },
         { label: "Documents", to: "/docs", icon: DocsIcon, badge: null },
         { label: "Chat", to: "/chat", icon: ChatIcon, badge: "live" },
         { label: "Whiteboard", to: "/whiteboard", icon: WhiteboardIcon, badge: null },
      ]
   },
   {
      title: "WORKSPACES",
      items: [
         { label: "My Channels", to: "/my-channels", icon: HashIcon, badge: null },
         { label: "People & Team", to: "/people", icon: PeopleIcon, badge: null },
      ]
   },
   {
      title: "ACCOUNT",
      items: [
         { label: "Profile", to: "/profile", icon: ProfileIcon, badge: null },
         { label: "Settings", to: "/settings", icon: SettingsIcon, badge: null },
      ]
   }
];

const starterNotifications = [
   { id: "1", title: "Launch plan updated", body: "Mira added your rollout notes.", link: "/docs", read: false, createdAt: new Date().toISOString() },
   { id: "2", title: "New whiteboard shared", body: "A fresh roadmap board is ready.", link: "/whiteboard", read: false, createdAt: new Date().toISOString() },
   { id: "3", title: "Workspace invite accepted", body: "Your teammate joined the workspace.", link: "/settings", read: true, createdAt: new Date().toISOString() },
];

export default function Layout() {
   const { user, workspace, loading, setUser, setWorkspace } = useAuth();
   const socket = useSocket();
   const navigate = useNavigate();
   const location = useLocation();
   const [paletteOpen, setPaletteOpen] = useState(false);
   const [notifOpen, setNotifOpen] = useState(false);
   const [channels, setChannels] = useState([]);
   const [notifications, setNotifications] = useState(starterNotifications);
   const [createChannelModalOpen, setCreateChannelModalOpen] = useState(false);
   const [searchChannelsOpen, setSearchChannelsOpen] = useState(false);
   const [channelName, setChannelName] = useState("");
   const [channelPrivacy, setChannelPrivacy] = useState("public");
   const [invitees, setInvitees] = useState("");
   const [channelSearchQuery, setChannelSearchQuery] = useState("");
   const [mobileNavOpen, setMobileNavOpen] = useState(false);
   const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
   const notifRef = useRef([]);
   const modalRef = useRef(null);

   useEffect(() => {
      if (!loading && workspace) {
         const loadChannels = async () => {
            try {
               const response = await getChannels();
               setChannels(response.data.channels || []);
            } catch {
               setChannels([]);
            }
         };
         loadChannels();
      }
   }, [loading, workspace]);

   useEffect(() => {
      const onClick = (event) => {
         const clickedInsideNotif = notifRef.current.some((node) => node && node.contains(event.target));
         if (!clickedInsideNotif) {
            setNotifOpen(false);
         }
         if (modalRef.current && !modalRef.current.contains(event.target) && (createChannelModalOpen || searchChannelsOpen)) {
            setCreateChannelModalOpen(false);
            setSearchChannelsOpen(false);
         }
      };

      window.addEventListener("mousedown", onClick);
      return () => {
         window.removeEventListener("mousedown", onClick);
      };
   }, [createChannelModalOpen, searchChannelsOpen]);

   useEffect(() => {
      const onKeyDown = (event) => {
         if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
            event.preventDefault();
            setPaletteOpen(true);
         }
         if (event.key === "Escape") {
            setCreateChannelModalOpen(false);
            setSearchChannelsOpen(false);
            setNotifOpen(false);
            setMobileNavOpen(false);
         }
      };

      window.addEventListener("keydown", onKeyDown);
      return () => window.removeEventListener("keydown", onKeyDown);
   }, []);

   const unreadCount = useMemo(() => notifications.filter((item) => !item.read).length, [notifications]);
   
   const allItems = useMemo(() => navGroups.flatMap(g => g.items), []);
   const currentNavItem = useMemo(() => {
      return allItems.find((item) => location.pathname.startsWith(item.to)) ?? allItems[0];
   }, [allItems, location.pathname]);

   const handleLogout = () => {
      localStorage.removeItem("token");
      setUser(null);
      setWorkspace(null);
      navigate("/login");
   };

   const createChannelNow = async () => {
      if (!channelName.trim()) return;
      try {
         const response = await createChannel({
            name: channelName.trim(),
            privacy: channelPrivacy,
            invitees: invitees.split(",").map((s) => s.trim()).filter(Boolean),
         });
         const channel = response.data.channel;
         if (channel) {
            setChannels((prev) => [channel, ...prev]);
            navigate(`/chat?channel=${channel._id}`);
         }
         setCreateChannelModalOpen(false);
         setChannelName("");
         setInvitees("");
         setChannelPrivacy("public");
      } catch {
         window.alert("Unable to create the channel right now.");
      }
   };

   const markAllRead = () => {
      setNotifications((current) => current.map((item) => ({ ...item, read: true })));
   };

   const clearAll = () => {
      setNotifications([]);
   };

   const openNotification = (notification) => {
      setNotifications((current) => current.map((item) => (item.id === notification.id ? { ...item, read: true } : item)));
      if (notification.link) {
         setNotifOpen(false);
         navigate(notification.link);
      }
   };

   const channelSearchResults = channels.filter((channel) =>
      channel.name.toLowerCase().includes(channelSearchQuery.toLowerCase())
   );

   return (
      <div className="min-h-screen w-full bg-[#09090b] text-zinc-100 flex flex-col lg:flex-row overflow-x-hidden saas-grid-bg">
         {/* Desktop Sidebar */}
         <aside className={`hidden lg:flex lg:flex-col border-r border-zinc-800/80 bg-zinc-950/95 backdrop-blur-xl h-screen sticky top-0 transition-all duration-300 z-30 ${sidebarCollapsed ? "w-20 px-3 py-5" : "w-64 px-4 py-5"}`}>
            {/* Workspace Logo Header */}
            <div className="flex items-center justify-between gap-2">
               <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="flex items-center gap-3 p-1 rounded-lg hover:bg-zinc-900 transition min-w-0"
               >
                  <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-amber-400 text-zinc-950 font-bold shadow-md shadow-amber-400/20 shrink-0">
                     P
                  </div>
                  {!sidebarCollapsed ? (
                     <div className="min-w-0 text-left">
                        <div className="text-sm font-bold tracking-tight text-white truncate">PLETTO Workspace</div>
                        <div className="text-[10px] font-semibold text-amber-300 uppercase tracking-widest">Enterprise</div>
                     </div>
                  ) : null}
               </button>

               <button
                  type="button"
                  onClick={() => setSidebarCollapsed((v) => !v)}
                  className={`p-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900 transition ${sidebarCollapsed ? "hidden" : "inline-flex"}`}
                  title="Toggle sidebar"
               >
                  <ChevronLeftIcon className="h-4 w-4" />
               </button>
            </div>

            {/* Quick Actions & Search */}
            <div className="mt-4 space-y-2">
               {!sidebarCollapsed ? (
                  <button
                     type="button"
                     onClick={() => setPaletteOpen(true)}
                     className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-zinc-800/80 bg-zinc-900/60 text-xs text-zinc-400 hover:border-amber-400/40 hover:text-zinc-200 transition group"
                  >
                     <span className="flex items-center gap-2">
                        <SearchIcon className="h-3.5 w-3.5 text-zinc-500 group-hover:text-amber-300" />
                        <span>Search workspace...</span>
                     </span>
                     <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-medium rounded bg-zinc-800 text-zinc-400 border border-zinc-700">⌘K</kbd>
                  </button>
               ) : (
                  <button
                     type="button"
                     onClick={() => setPaletteOpen(true)}
                     className="w-full flex justify-center py-2 rounded-lg border border-zinc-800/80 bg-zinc-900/60 text-zinc-400 hover:text-white"
                     title="Search (⌘K)"
                  >
                     <SearchIcon className="h-4 w-4" />
                  </button>
               )}

               <button
                  type="button"
                  onClick={() => setCreateChannelModalOpen(true)}
                  className={`w-full flex items-center gap-2 py-2 px-3 rounded-lg bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-bold shadow-md shadow-amber-400/20 transition ${sidebarCollapsed ? "justify-center" : ""}`}
               >
                  <PlusIcon className="h-4 w-4 shrink-0" />
                  {!sidebarCollapsed ? <span>New Channel</span> : null}
               </button>
            </div>

            {/* Nav Groups */}
            <div className="mt-6 flex-1 overflow-y-auto space-y-6 pr-1">
               {navGroups.map((group) => (
                  <div key={group.title} className="space-y-1">
                     {!sidebarCollapsed ? (
                        <div className="px-3 text-[10px] font-bold text-zinc-500 tracking-wider uppercase">{group.title}</div>
                     ) : null}
                     <nav className="space-y-0.5">
                        {group.items.map((item) => {
                           const Icon = item.icon;
                           const active = location.pathname.startsWith(item.to);
                           return (
                              <button
                                 key={item.label}
                                 type="button"
                                 onClick={() => navigate(item.to)}
                                 className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                                    active
                                       ? "bg-amber-400/10 text-amber-300 font-bold border-l-2 border-amber-400"
                                       : "text-zinc-400 hover:bg-zinc-900/70 hover:text-zinc-200"
                                 } ${sidebarCollapsed ? "justify-center px-0" : ""}`}
                                 title={item.label}
                              >
                                 <Icon className={`h-4 w-4 shrink-0 ${active ? "text-amber-300" : "text-zinc-400"}`} />
                                 {!sidebarCollapsed ? (
                                    <span className="flex-1 text-left truncate">{item.label}</span>
                                 ) : null}
                                 {!sidebarCollapsed && item.to === "/chat" && channels.length > 0 ? (
                                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-400/20 text-amber-300 rounded-full">
                                       {channels.length}
                                    </span>
                                 ) : null}
                              </button>
                           );
                        })}
                     </nav>
                  </div>
               ))}
            </div>

            {/* Bottom Profile Bar */}
            <div className="mt-auto pt-4 border-t border-zinc-800/80">
               <div className={`flex items-center gap-3 ${sidebarCollapsed ? "flex-col justify-center" : ""}`}>
                  <button
                     type="button"
                     onClick={() => navigate("/profile")}
                     className={`flex-1 flex items-center gap-3 p-1.5 rounded-lg hover:bg-zinc-900/80 transition min-w-0 ${sidebarCollapsed ? "justify-center" : ""}`}
                  >
                     <div className="relative shrink-0">
                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-zinc-800 text-xs font-bold text-zinc-200 border border-zinc-700">
                           {(user?.name || user?.email || "U").charAt(0).toUpperCase()}
                        </div>
                        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-zinc-950" />
                     </div>
                     {!sidebarCollapsed ? (
                        <div className="min-w-0 text-left">
                           <div className="text-xs font-semibold text-zinc-200 truncate">{user?.name || "User Profile"}</div>
                           <div className="text-[10px] text-zinc-500 truncate">{user?.email || "Online"}</div>
                        </div>
                     ) : null}
                  </button>

                  <button
                     type="button"
                     onClick={handleLogout}
                     className="p-2 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition"
                     title="Logout"
                  >
                     <LogoutIcon className="h-4 w-4" />
                  </button>
               </div>
            </div>
         </aside>

         {/* Main Content Area */}
         <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
            {/* Header Navbar */}
            <header className="h-14 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-4 shrink-0 z-20">
               <div className="flex items-center gap-3">
                  <button
                     type="button"
                     onClick={() => setMobileNavOpen(true)}
                     className="p-2 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white lg:hidden"
                  >
                     <MenuIcon className="h-4 w-4" />
                  </button>

                  <div className="flex items-center gap-2 text-xs">
                     <span className="text-zinc-500 font-medium">Workspace</span>
                     <span className="text-zinc-700">/</span>
                     <span className="font-semibold text-zinc-200">{currentNavItem.label}</span>
                  </div>
               </div>

               <div className="flex items-center gap-3">
                  <div className="hidden sm:flex items-center">
                     <PresenceStack />
                  </div>

                  <button
                     type="button"
                     onClick={() => setPaletteOpen(true)}
                     className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-400/30 bg-amber-400/10 text-xs font-semibold text-amber-300 hover:bg-amber-400/20 transition"
                  >
                     <SparklesIcon className="h-3.5 w-3.5 text-amber-300" />
                     <span>Ask AI</span>
                  </button>

                  {/* Notifications Bell */}
                  <div ref={(el) => (notifRef.current[0] = el)} className="relative">
                     <button
                        ref={(el) => (notifRef.current[1] = el)}
                        onClick={() => setNotifOpen((v) => !v)}
                        className="relative p-2 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900 transition"
                     >
                        <BellIcon className="h-4 w-4" />
                        {unreadCount > 0 ? (
                           <span className="absolute top-1 right-1 flex h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                        ) : null}
                     </button>

                     {notifOpen ? (
                        <div ref={(el) => (notifRef.current[2] = el)} className="absolute right-0 mt-2 w-80 rounded-xl border border-zinc-800 bg-zinc-950 p-4 shadow-2xl z-50 space-y-3">
                           <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                              <span className="text-xs font-bold text-zinc-200">Notifications</span>
                              <div className="flex gap-2 text-[11px] text-zinc-400">
                                 {unreadCount > 0 ? <button onClick={markAllRead} className="hover:text-amber-300">Mark read</button> : null}
                                 <button onClick={clearAll} className="hover:text-zinc-200">Clear</button>
                              </div>
                           </div>
                           {notifications.length > 0 ? (
                              <div className="space-y-2 max-h-64 overflow-y-auto">
                                 {notifications.map((n) => (
                                    <button
                                       key={n.id}
                                       onClick={() => openNotification(n)}
                                       className={`w-full p-2.5 rounded-lg border text-left text-xs transition ${
                                          n.read ? "border-zinc-800 bg-zinc-900/40 text-zinc-400" : "border-amber-400/30 bg-amber-400/5 text-zinc-200"
                                       }`}
                                    >
                                       <div className="font-semibold text-zinc-200">{n.title}</div>
                                       <div className="mt-0.5 text-zinc-400 leading-snug">{n.body}</div>
                                    </button>
                                 ))}
                              </div>
                           ) : (
                              <div className="py-6 text-center text-xs text-zinc-500">All caught up!</div>
                           )}
                        </div>
                     ) : null}
                  </div>
               </div>
            </header>

            {/* Page Canvas Container */}
            <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 max-w-full">
               <div className="mx-auto w-full max-w-7xl">
                  <Outlet />
               </div>
            </main>
         </div>

         {/* Mobile Drawer */}
         {mobileNavOpen ? (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm lg:hidden" onClick={() => setMobileNavOpen(false)}>
               <div className="h-full w-72 border-r border-zinc-800 bg-zinc-950 p-5 flex flex-col space-y-6" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                     <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded bg-amber-400 text-zinc-950 font-bold flex items-center justify-center text-xs">P</div>
                        <span className="font-bold text-sm text-zinc-100">PLETTO SaaS</span>
                     </div>
                     <button type="button" onClick={() => setMobileNavOpen(false)} className="p-1 rounded text-zinc-400 hover:text-white">
                        <CloseIcon className="h-5 w-5" />
                     </button>
                  </div>

                  <nav className="flex-1 overflow-y-auto space-y-4">
                     {navGroups.map((g) => (
                        <div key={g.title} className="space-y-1">
                           <div className="text-[10px] font-bold text-zinc-500 tracking-wider uppercase px-2">{g.title}</div>
                           {g.items.map((item) => {
                              const Icon = item.icon;
                              const active = location.pathname.startsWith(item.to);
                              return (
                                 <button
                                    key={item.label}
                                    type="button"
                                    onClick={() => { navigate(item.to); setMobileNavOpen(false); }}
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium ${active ? "bg-amber-400/20 text-amber-300 font-semibold" : "text-zinc-400"}`}
                                 >
                                    <Icon className="h-4 w-4" />
                                    <span>{item.label}</span>
                                 </button>
                              );
                           })}
                        </div>
                     ))}
                  </nav>
               </div>
            </div>
         ) : null}

         {/* Modals */}
         {(createChannelModalOpen || searchChannelsOpen) && (
            <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 px-4 py-6 backdrop-blur-sm">
               <div ref={modalRef} className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
                  <div className="mb-4 flex items-center justify-between">
                     <h3 className="text-lg font-bold text-zinc-100">
                        {createChannelModalOpen ? "Create New Channel" : "Search Channels"}
                     </h3>
                     <button onClick={() => { setCreateChannelModalOpen(false); setSearchChannelsOpen(false); }} className="text-zinc-400 hover:text-white">
                        <CloseIcon className="h-5 w-5" />
                     </button>
                  </div>

                  {createChannelModalOpen ? (
                     <div className="space-y-4">
                        <div>
                           <label className="text-xs font-medium text-zinc-300">Channel Name</label>
                           <input
                              value={channelName}
                              onChange={(e) => setChannelName(e.target.value)}
                              placeholder="e.g. general-discussion"
                              className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-sm text-zinc-100 focus:border-indigo-500 outline-none"
                           />
                        </div>
                        <div>
                           <label className="text-xs font-medium text-zinc-300">Privacy</label>
                           <div className="mt-1 grid grid-cols-2 gap-2">
                              {["public", "private"].map((p) => (
                                 <button
                                    key={p}
                                    type="button"
                                    onClick={() => setChannelPrivacy(p)}
                                    className={`py-2 px-3 rounded-lg border text-xs font-semibold capitalize ${channelPrivacy === p ? "border-indigo-500 bg-indigo-500/10 text-indigo-400" : "border-zinc-800 bg-zinc-900 text-zinc-400"}`}
                                 >
                                    {p} Channel
                                 </button>
                              ))}
                           </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                           <button onClick={() => setCreateChannelModalOpen(false)} className="px-4 py-2 rounded-lg border border-zinc-800 text-xs text-zinc-400 hover:text-white">
                              Cancel
                           </button>
                           <button onClick={createChannelNow} className="px-4 py-2 rounded-lg bg-indigo-600 text-xs font-semibold text-white hover:bg-indigo-500">
                              Create Channel
                           </button>
                        </div>
                     </div>
                  ) : (
                     <div className="space-y-3">
                        <input
                           value={channelSearchQuery}
                           onChange={(e) => setChannelSearchQuery(e.target.value)}
                           placeholder="Search rooms..."
                           className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-sm text-zinc-100 outline-none focus:border-indigo-500"
                        />
                        <div className="max-h-60 overflow-y-auto space-y-1">
                           {channelSearchResults.map((ch) => (
                              <button
                                 key={ch._id}
                                 onClick={() => { navigate(`/chat?channel=${ch._id}`); setSearchChannelsOpen(false); }}
                                 className="w-full p-2 rounded-lg text-left text-xs text-zinc-300 hover:bg-zinc-900 transition flex items-center gap-2"
                              >
                                 <HashIcon className="h-4 w-4 text-indigo-400" />
                                 <span>{ch.name}</span>
                              </button>
                           ))}
                        </div>
                     </div>
                  )}
               </div>
            </div>
         )}

         <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      </div>
   );
}
