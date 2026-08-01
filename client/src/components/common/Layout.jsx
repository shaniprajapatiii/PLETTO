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
         { label: "Channels", to: "/chat", icon: ChatIcon, badge: "live" },
         { label: "Direct Messages", to: "/dm", icon: ChatIcon, badge: null },
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
               const response = await getChannels({ type: "channel" });
               const channelList = (response.data.channels || []).filter((c) => c.type !== "dm");
               setChannels(channelList);
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
         <aside className={`hidden lg:flex lg:flex-col border-r border-zinc-800/80 bg-zinc-950/95 backdrop-blur-xl h-screen sticky top-0 transition-all duration-300 z-30 shadow-[10px_0_40px_-20px_rgba(0,0,0,0.7)] ${sidebarCollapsed ? "w-20 px-3 py-5" : "w-[15rem] px-4 py-5"}`}>
            {/* Workspace Logo Header */}
            <div className={`flex ${sidebarCollapsed ? "flex-col items-center gap-2" : "items-center justify-between gap-2"}`}>
               <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="flex items-center gap-3 rounded-xl px-2 py-1.5 text-left transition hover:bg-zinc-900/80 min-w-0"
               >
                  <Logo className="w-full" iconClassName="h-9 w-9" withText={!sidebarCollapsed} />
               </button>

               <button
                  type="button"
                  onClick={() => setSidebarCollapsed((v) => !v)}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-2 text-zinc-400 transition hover:border-accent hover:text-accent"
                  title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
               >
                  {sidebarCollapsed ? <ChevronRightIcon className="h-4 w-4" /> : <ChevronLeftIcon className="h-4 w-4" />}
               </button>
            </div>

            {/* Quick Actions & Search */}
            <div className="mt-4 space-y-2">
               {!sidebarCollapsed ? (
                  <button
                     type="button"
                     onClick={() => setPaletteOpen(true)}
                     className="w-full flex items-center justify-between rounded-xl border border-zinc-800/80 bg-zinc-900/70 px-3 py-2 text-xs text-zinc-400 transition hover:border-accent hover:bg-zinc-900 hover:text-zinc-200 group"
                  >
                     <span className="flex items-center gap-2">
                        <SearchIcon className="h-3.5 w-3.5 text-zinc-500 group-hover:text-accent" />
                        <span>Search workspace...</span>
                     </span>
                     <kbd className="rounded-md border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono font-medium text-zinc-400">⌘K</kbd>
                  </button>
               ) : (
                  <button
                     type="button"
                     onClick={() => setPaletteOpen(true)}
                     className="flex w-full justify-center rounded-xl border border-zinc-800/80 bg-zinc-900/70 py-2 text-zinc-400 transition hover:border-accent hover:text-accent"
                     title="Search (⌘K)"
                  >
                     <SearchIcon className="h-4 w-4" />
                  </button>
               )}

               <button
                  type="button"
                  onClick={() => setCreateChannelModalOpen(true)}
                  className={`flex w-full items-center gap-2 rounded-xl bg-accent px-3 py-2.5 text-xs font-bold text-zinc-950 shadow-[0_10px_30px_-12px_rgba(249,235,174,0.35)] transition hover:brightness-95 ${sidebarCollapsed ? "justify-center" : ""}`}
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
                        <div className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-500">{group.title}</div>
                     ) : null}
                     <nav className="space-y-1">
                        {group.items.map((item) => {
                           const Icon = item.icon;
                           const active = location.pathname.startsWith(item.to);
                           return (
                              <button
                                 key={item.label}
                                 type="button"
                                 onClick={() => navigate(item.to)}
                                 className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition ${
                                    active
                                       ? "border border-accent bg-accent-soft text-accent"
                                       : "text-zinc-400 hover:bg-zinc-900/70 hover:text-zinc-200"
                                 } ${sidebarCollapsed ? "justify-center px-2" : ""}`}
                                 title={item.label}
                              >
                                 <div className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${active ? "bg-accent-soft" : "bg-zinc-900/70 group-hover:bg-zinc-800"}`}>
                                    <Icon className={`h-4 w-4 shrink-0 ${active ? "text-accent" : "text-zinc-400"}`} />
                                 </div>
                                 {!sidebarCollapsed ? (
                                    <span className="flex-1 text-left truncate">{item.label}</span>
                                 ) : null}
                                 {!sidebarCollapsed && item.to === "/chat" && channels.length > 0 ? (
                                    <span className="rounded-full bg-accent-soft px-1.5 py-0.5 text-[10px] font-bold text-accent">
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
            <div className="mt-auto border-t border-zinc-800/80 pt-4">
               <div className={`flex items-center gap-2 ${sidebarCollapsed ? "flex-col justify-center" : ""}`}>
                  <button
                     type="button"
                     onClick={() => navigate("/profile")}
                     className={`flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-2 transition hover:border-accent hover:bg-zinc-900 ${sidebarCollapsed ? "justify-center" : ""}`}
                  >
                     <div className="relative shrink-0">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 text-xs font-bold text-zinc-200">
                           {(user?.name || user?.email || "U").charAt(0).toUpperCase()}
                        </div>
                        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-zinc-950 bg-emerald-500" />
                     </div>
                     {!sidebarCollapsed ? (
                        <div className="min-w-0 text-left">
                           <div className="truncate text-xs font-semibold text-zinc-200">{user?.name || "User Profile"}</div>
                           <div className="truncate text-[10px] text-zinc-500">{user?.email || "Online"}</div>
                        </div>
                     ) : null}
                  </button>

                  <button
                     type="button"
                     onClick={handleLogout}
                     className="rounded-lg p-2 text-zinc-400 transition hover:bg-red-500/10 hover:text-red-400"
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
            <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-zinc-800/80 bg-zinc-950/80 px-3 backdrop-blur-md sm:px-6 z-20">
               <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                  <button
                     type="button"
                     onClick={() => setMobileNavOpen(true)}
                     className="rounded-lg border border-zinc-800 p-2 text-zinc-400 transition hover:text-white lg:hidden"
                  >
                     <MenuIcon className="h-4 w-4" />
                  </button>

                  <div className="flex min-w-0 items-center gap-2 text-xs">
                     <span className="hidden text-zinc-500 sm:inline">Workspace</span>
                     <span className="hidden text-zinc-700 sm:inline">/</span>
                     <span className="truncate font-semibold text-zinc-200">{currentNavItem.label}</span>
                  </div>
               </div>

               <div className="flex items-center gap-2 sm:gap-3">
                  <div className="hidden sm:flex items-center">
                     <PresenceStack />
                  </div>

                  <button
                     type="button"
                     onClick={() => setPaletteOpen(true)}
                     className="hidden items-center gap-1.5 rounded-lg border border-accent bg-accent-soft px-3 py-1.5 text-xs font-semibold text-accent transition hover:brightness-95 sm:flex"
                  >
                     <SparklesIcon className="h-3.5 w-3.5 text-accent" />
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
                           <span className="absolute top-1 right-1 flex h-2 w-2 rounded-full bg-accent animate-pulse" />
                        ) : null}
                     </button>

                     {notifOpen ? (
                        <div ref={(el) => (notifRef.current[2] = el)} className="absolute right-0 mt-2 w-80 rounded-xl border border-zinc-800 bg-zinc-950 p-4 shadow-2xl z-50 space-y-3">
                           <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                              <span className="text-xs font-bold text-zinc-200">Notifications</span>
                              <div className="flex gap-2 text-[11px] text-zinc-400">
                                 {unreadCount > 0 ? <button onClick={markAllRead} className="hover:text-accent">Mark read</button> : null}
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
                                          n.read ? "border-zinc-800 bg-zinc-900/40 text-zinc-400" : "border-accent bg-accent-soft text-zinc-200"
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
            <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-3 sm:p-6 lg:p-8 max-w-full">
               <div className="mx-auto w-full max-w-7xl min-w-0">
                  <Outlet />
               </div>
            </main>
         </div>

         {/* Mobile Drawer */}
         {mobileNavOpen ? (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm lg:hidden" onClick={() => setMobileNavOpen(false)}>
               <div className="flex h-full w-72 flex-col space-y-6 border-r border-zinc-800 bg-zinc-950 p-5" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                     <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-xs font-black text-zinc-950">P</div>
                        <div>
                           <div className="text-sm font-semibold text-zinc-100">PLETTO Workspace</div>
                           <div className="text-[10px] uppercase tracking-[0.24em] text-accent">Mobile</div>
                        </div>
                     </div>
                     <button type="button" onClick={() => setMobileNavOpen(false)} className="rounded-lg p-1 text-zinc-400 transition hover:bg-zinc-900 hover:text-white">
                        <CloseIcon className="h-5 w-5" />
                     </button>
                  </div>

                  <nav className="flex-1 space-y-4 overflow-y-auto">
                     {navGroups.map((g) => (
                        <div key={g.title} className="space-y-1">
                           <div className="px-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-500">{g.title}</div>
                           {g.items.map((item) => {
                              const Icon = item.icon;
                              const active = location.pathname.startsWith(item.to);
                              return (
                                 <button
                                    key={item.label}
                                    type="button"
                                    onClick={() => { navigate(item.to); setMobileNavOpen(false); }}
                                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition ${active ? "border border-accent bg-accent-soft text-accent" : "text-zinc-400 hover:bg-zinc-900/70 hover:text-zinc-200"}`}
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
