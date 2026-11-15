import { useEffect, useMemo, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
   HiViewGrid as DashboardIcon,
   HiChatAlt2 as ChatIcon,
   HiUsers as PeopleIcon,
   HiUserCircle as ProfileIcon,
   HiCog as SettingsIcon,
   HiBell as BellIcon,
   HiPlus as PlusIcon,
   HiSearch as SearchIcon,
   HiX as CloseIcon,
   HiHashtag as HashIcon,
   HiMenu as MenuIcon,
   HiChevronLeft as ChevronLeftIcon,
   HiChevronRight as ChevronRightIcon,
   HiLogout as LogoutIcon,
} from "react-icons/hi";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { createChannel, getChannels } from "../../services/chatService";
import { Logo } from "../brand/Logo";
import { CommandPalette } from "./CommandPalette";
import { PresenceStack } from "../../components/app/PresenceStack";

const navGroups = [
   {
      title: "Workspace",
      items: [
         { label: "Dashboard", to: "/dashboard", icon: DashboardIcon },
         { label: "Channels", to: "/chat", icon: ChatIcon },
         { label: "Direct Messages", to: "/dm", icon: ChatIcon },
      ]
   },
   {
      title: "Directory",
      items: [
         { label: "Channels List", to: "/my-channels", icon: HashIcon },
         { label: "Team Members", to: "/people", icon: PeopleIcon },
      ]
   },
   {
      title: "Account",
      items: [
         { label: "Profile", to: "/profile", icon: ProfileIcon },
         { label: "Settings", to: "/settings", icon: SettingsIcon },
      ]
   }
];

const starterNotifications = [
   { id: "1", title: "Channel discussion", body: "New messages posted in team channels.", link: "/chat", read: false, createdAt: new Date().toISOString() },
   { id: "2", title: "Team activity", body: "Check the latest team updates.", link: "/chat", read: false, createdAt: new Date().toISOString() },
   { id: "3", title: "Workspace update", body: "A new teammate joined the workspace.", link: "/settings", read: true, createdAt: new Date().toISOString() },
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
      return () => window.removeEventListener("mousedown", onClick);
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
            type: channelPrivacy,
            members: [user?._id].filter(Boolean),
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
      } catch (err) {
         window.alert(err.response?.data?.message || "Unable to create the channel right now.");
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
      <div className="min-h-screen w-full bg-black text-white flex flex-col lg:flex-row overflow-x-hidden app-grid-bg">
         {/* Desktop Sidebar */}
         <aside className={`hidden lg:flex lg:flex-col border-r border-white/10 bg-black/95 backdrop-blur-2xl h-screen sticky top-0 transition-all duration-200 z-30 ${sidebarCollapsed ? "w-20 px-3 py-6" : "w-64 px-4 py-6"}`}>
            {/* Workspace Logo Header */}
            <div className={`flex items-center ${sidebarCollapsed ? "justify-center flex-col gap-3" : "justify-between gap-2"}`}>
               <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 text-left transition hover:bg-white/10 min-w-0"
               >
                  <Logo className="w-full" iconClassName="h-8 w-8" withText={!sidebarCollapsed} />
               </button>

               <button
                  type="button"
                  onClick={() => setSidebarCollapsed((v) => !v)}
                  className="rounded-xl border border-white/15 bg-[#121214] p-2 text-neutral-400 transition hover:border-white/35 hover:text-white"
                  title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
               >
                  {sidebarCollapsed ? <ChevronRightIcon className="h-4 w-4" /> : <ChevronLeftIcon className="h-4 w-4" />}
               </button>
            </div>

            {/* Quick Search & New Channel Button */}
            <div className="mt-6 space-y-2">
               {!sidebarCollapsed ? (
                  <button
                     type="button"
                     onClick={() => setPaletteOpen(true)}
                     className="w-full flex items-center justify-between rounded-xl border border-white/15 bg-[#0e0e11] px-3.5 py-2.5 text-xs text-neutral-400 transition hover:border-white/30 hover:bg-[#151518] hover:text-white group"
                  >
                     <span className="flex items-center gap-2.5">
                        <SearchIcon className="h-4 w-4 text-neutral-400 group-hover:text-white transition-colors" />
                        <span className="font-medium">Quick search...</span>
                     </span>
                     <kbd className="rounded border border-white/20 bg-black px-1.5 py-0.5 text-[10px] font-mono text-neutral-300">⌘K</kbd>
                  </button>
               ) : (
                  <button
                     type="button"
                     onClick={() => setPaletteOpen(true)}
                     className="flex w-full justify-center rounded-xl border border-white/15 bg-[#0e0e11] py-2.5 text-neutral-400 transition hover:border-white/35 hover:text-white"
                     title="Search (⌘K)"
                  >
                     <SearchIcon className="h-4 w-4" />
                  </button>
               )}

               <button
                  type="button"
                  onClick={() => setCreateChannelModalOpen(true)}
                  className={`btn-white flex w-full items-center gap-2 px-3.5 py-2.5 text-xs font-bold transition shadow-sm ${sidebarCollapsed ? "justify-center" : ""}`}
               >
                  <PlusIcon className="h-4 w-4 shrink-0" />
                  {!sidebarCollapsed ? <span>New Channel</span> : null}
               </button>
            </div>

            {/* Nav Groups */}
            <div className="mt-6 flex-1 overflow-y-auto space-y-6 pr-0.5">
               {navGroups.map((group) => (
                  <div key={group.title} className="space-y-1.5">
                     {!sidebarCollapsed ? (
                        <div className="px-3 pb-1 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider font-mono">{group.title}</div>
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
                                 className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
                                    active
                                       ? "bg-white text-black shadow-md border border-white"
                                       : "text-neutral-400 hover:bg-white/10 hover:text-white border border-transparent"
                                 } ${sidebarCollapsed ? "justify-center px-2" : ""}`}
                                 title={item.label}
                              >
                                 <Icon className={`h-4 w-4 shrink-0 ${active ? "text-black" : "text-neutral-400 group-hover:text-white"}`} />
                                 {!sidebarCollapsed ? (
                                    <span className="flex-1 text-left truncate">{item.label}</span>
                                 ) : null}
                                 {!sidebarCollapsed && item.to === "/chat" && channels.length > 0 ? (
                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${active ? "bg-black text-white" : "bg-[#18181b] text-neutral-300"}`}>
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
            <div className="mt-auto border-t border-white/10 pt-4">
               <div className={`flex items-center gap-2 ${sidebarCollapsed ? "flex-col justify-center" : ""}`}>
                  <button
                     type="button"
                     onClick={() => navigate("/profile")}
                     className={`flex min-w-0 flex-1 items-center gap-3 rounded-xl p-2 transition hover:bg-white/10 ${sidebarCollapsed ? "justify-center" : ""}`}
                  >
                     <div className="relative shrink-0">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/20 bg-[#161618] text-xs font-bold text-white">
                           {(user?.name || user?.email || "U").charAt(0).toUpperCase()}
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-black bg-white" />
                     </div>
                     {!sidebarCollapsed ? (
                        <div className="min-w-0 text-left">
                           <div className="truncate text-xs font-bold text-white">{user?.name || "Workspace User"}</div>
                           <div className="truncate text-[10px] text-neutral-400 font-mono">{user?.email || "online"}</div>
                        </div>
                     ) : null}
                  </button>

                  <button
                     type="button"
                     onClick={handleLogout}
                     className="rounded-xl border border-white/10 bg-[#121214] p-2 text-neutral-400 transition hover:border-white/30 hover:bg-white/10 hover:text-white"
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
            <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-white/10 bg-black/90 px-4 sm:px-8 backdrop-blur-2xl z-20">
               {/* Left: Mobile trigger & Breadcrumb */}
               <div className="flex min-w-0 items-center gap-3.5">
                  <button
                     type="button"
                     onClick={() => setMobileNavOpen(true)}
                     className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-[#121214] text-white transition hover:bg-white/15 lg:hidden shrink-0"
                     aria-label="Open mobile menu"
                  >
                     <MenuIcon className="h-5 w-5" />
                  </button>

                  <div className="flex items-center gap-2 overflow-hidden">
                     <div className="inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-[#0a0a0c] px-4 py-1.5 text-xs font-mono shadow-sm">
                        <span className="h-2 w-2 rounded-full bg-white shrink-0 animate-pulse" />
                        <span className="font-semibold text-neutral-400 truncate max-w-[120px] sm:max-w-[180px]">
                           {workspace?.name || "Workspace"}
                        </span>
                        <span className="text-neutral-600">/</span>
                        <span className="font-bold text-white truncate">
                           {currentNavItem?.label || "Overview"}
                        </span>
                     </div>
                  </div>
               </div>

               {/* Center: Command Palette Search */}
               <div className="hidden md:flex items-center justify-center flex-1 max-w-lg px-2">
                  <button
                     type="button"
                     onClick={() => setPaletteOpen(true)}
                     className="group flex w-full items-center justify-between gap-3 rounded-xl border border-white/15 bg-[#0c0c0e] px-4 py-2 text-xs text-neutral-400 transition-all hover:border-white/30 hover:bg-[#141417] hover:text-white shadow-sm"
                  >
                     <span className="flex items-center gap-2.5 truncate">
                        <SearchIcon className="h-4 w-4 text-neutral-400 group-hover:text-white transition-colors" />
                        <span className="font-medium">Search or jump to...</span>
                     </span>
                     <kbd className="rounded border border-white/20 bg-black px-1.5 py-0.5 text-[10px] font-mono text-neutral-300">
                        ⌘K
                     </kbd>
                  </button>
               </div>

               {/* Right: Presence, Notifications & Profile */}
               <div className="flex items-center gap-2 sm:gap-3">
                  <div className="hidden sm:flex items-center">
                     <PresenceStack />
                  </div>

                  {/* Notifications Bell */}
                  <div ref={(el) => (notifRef.current[0] = el)} className="relative">
                     <button
                        ref={(el) => (notifRef.current[1] = el)}
                        onClick={() => setNotifOpen((v) => !v)}
                        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-[#0c0c0e] text-neutral-300 transition hover:border-white/30 hover:bg-[#141417] hover:text-white"
                        title="Notifications"
                     >
                        <BellIcon className="h-4 w-4" />
                        {unreadCount > 0 ? (
                           <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-white ring-2 ring-black" />
                        ) : null}
                     </button>

                     {notifOpen ? (
                        <div ref={(el) => (notifRef.current[2] = el)} className="absolute right-0 mt-3 w-80 rounded-2xl border border-white/20 bg-[#0a0a0c] p-4 shadow-2xl z-50 space-y-3 backdrop-blur-2xl ring-1 ring-white/10">
                           <div className="flex items-center justify-between pb-3 border-b border-white/10">
                              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">Notifications</span>
                              <div className="flex gap-2.5 text-xs text-neutral-400 font-medium">
                                 {unreadCount > 0 ? <button onClick={markAllRead} className="hover:text-white">Mark read</button> : null}
                                 <button onClick={clearAll} className="hover:text-white">Clear</button>
                              </div>
                           </div>
                           {notifications.length > 0 ? (
                              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                                 {notifications.map((n) => (
                                    <button
                                       key={n.id}
                                       onClick={() => openNotification(n)}
                                       className={`w-full p-3 rounded-xl border text-left text-xs transition ${
                                          n.read ? "border-white/5 bg-black/40 text-neutral-400" : "border-white/25 bg-[#141418] text-white"
                                       }`}
                                    >
                                       <div className="font-bold text-white">{n.title}</div>
                                       <div className="mt-1 text-neutral-400 text-xs leading-snug">{n.body}</div>
                                    </button>
                                 ))}
                              </div>
                           ) : (
                              <div className="py-8 text-center text-xs text-neutral-500">No notifications</div>
                           )}
                        </div>
                     ) : null}
                  </div>

                  {/* Profile Capsule */}
                  <button
                     type="button"
                     onClick={() => navigate("/profile")}
                     className="flex items-center gap-2.5 rounded-full border border-white/15 bg-[#0c0c0e] py-1 pl-1 pr-3.5 text-xs font-semibold text-neutral-200 transition hover:border-white/30 hover:bg-[#141417] hover:text-white"
                     title="View Profile"
                  >
                     <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-black text-xs font-extrabold shadow-sm">
                        {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                     </div>
                     <span className="hidden sm:inline font-bold max-w-[110px] truncate">
                        {user?.name || "Profile"}
                     </span>
                  </button>
               </div>
            </header>

            {/* Page Container */}
            <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 xl:p-10 max-w-full">
               <div className="mx-auto w-full max-w-7xl min-w-0">
                  <Outlet />
               </div>
            </main>
         </div>

         {/* Mobile Drawer */}
         {mobileNavOpen ? (
            <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md lg:hidden" onClick={() => setMobileNavOpen(false)}>
               <div className="flex h-full w-72 flex-col space-y-6 border-r border-white/15 bg-black p-5" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                     <Logo />
                     <button type="button" onClick={() => setMobileNavOpen(false)} className="rounded-xl p-1.5 text-neutral-400 transition hover:text-white border border-white/15 bg-[#121214]">
                        <CloseIcon className="h-5 w-5" />
                     </button>
                  </div>

                  <button
                     type="button"
                     onClick={() => { setCreateChannelModalOpen(true); setMobileNavOpen(false); }}
                     className="btn-white flex w-full items-center justify-center gap-2 py-3 text-xs font-bold"
                  >
                     <PlusIcon className="h-4 w-4" />
                     <span>New Channel</span>
                  </button>

                  <nav className="flex-1 space-y-6 overflow-y-auto pr-1">
                     {navGroups.map((g) => (
                        <div key={g.title} className="space-y-1.5">
                           <div className="px-2 text-[11px] font-bold text-neutral-500 uppercase tracking-wider font-mono">{g.title}</div>
                           {g.items.map((item) => {
                              const Icon = item.icon;
                              const active = location.pathname.startsWith(item.to);
                              return (
                                 <button
                                    key={item.label}
                                    type="button"
                                    onClick={() => { navigate(item.to); setMobileNavOpen(false); }}
                                    className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition ${
                                       active ? "bg-white text-black font-bold shadow-md" : "text-neutral-300 hover:bg-white/10 hover:text-white"
                                    }`}
                                 >
                                    <Icon className="h-4 w-4" />
                                    <span>{item.label}</span>
                                 </button>
                              );
                           })}
                        </div>
                     ))}
                  </nav>

                  <div className="border-t border-white/10 pt-4">
                     <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-[#121214] py-2.5 text-xs font-semibold text-neutral-300 hover:bg-white/10 hover:text-white transition"
                     >
                        <LogoutIcon className="h-4 w-4" />
                        <span>Sign Out</span>
                     </button>
                  </div>
               </div>
            </div>
         ) : null}

         {/* Create Channel & Search Channels Modal */}
         {(createChannelModalOpen || searchChannelsOpen) && (
            <div className="fixed inset-0 z-50 grid place-items-center bg-black/85 px-4 py-6 backdrop-blur-md">
               <div ref={modalRef} className="w-full max-w-lg rounded-2xl border border-white/20 bg-[#09090b] p-6 shadow-2xl space-y-5 ring-1 ring-white/10">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                     <h3 className="text-base font-bold text-white tracking-tight">
                        {createChannelModalOpen ? "Create New Channel" : "Search Channels"}
                     </h3>
                     <button onClick={() => { setCreateChannelModalOpen(false); setSearchChannelsOpen(false); }} className="rounded-lg p-1 text-neutral-400 hover:text-white hover:bg-white/10 transition">
                        <CloseIcon className="h-5 w-5" />
                     </button>
                  </div>

                  {createChannelModalOpen ? (
                     <div className="space-y-4">
                        <div>
                           <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider font-mono">Channel Name</label>
                           <input
                              value={channelName}
                              onChange={(e) => setChannelName(e.target.value)}
                              placeholder="e.g. general-discussion"
                              className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#121214] px-4 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:border-white focus:outline-none transition"
                           />
                        </div>
                        <div>
                           <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider font-mono">Privacy Setting</label>
                           <div className="mt-1.5 grid grid-cols-2 gap-3">
                              {["public", "private"].map((p) => (
                                 <button
                                    key={p}
                                    type="button"
                                    onClick={() => setChannelPrivacy(p)}
                                    className={`py-2.5 px-4 rounded-xl border text-xs font-bold capitalize transition ${
                                       channelPrivacy === p ? "border-white bg-white text-black" : "border-white/15 bg-[#121214] text-neutral-400 hover:border-white/30 hover:text-white"
                                    }`}
                                 >
                                    {p} Channel
                                 </button>
                              ))}
                           </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                           <button onClick={() => setCreateChannelModalOpen(false)} className="px-4 py-2 rounded-xl border border-white/15 text-xs font-semibold text-neutral-400 hover:text-white hover:bg-white/10 transition">
                              Cancel
                           </button>
                           <button onClick={createChannelNow} className="btn-white px-5 py-2 text-xs font-bold">
                              Create Channel
                           </button>
                        </div>
                     </div>
                  ) : (
                     <div className="space-y-3">
                        <input
                           value={channelSearchQuery}
                           onChange={(e) => setChannelSearchQuery(e.target.value)}
                           placeholder="Search channels..."
                           className="w-full rounded-xl border border-white/15 bg-[#121214] px-4 py-2.5 text-sm text-white placeholder:text-neutral-500 outline-none focus:border-white transition"
                        />
                        <div className="max-h-60 overflow-y-auto space-y-1.5">
                           {channelSearchResults.map((ch) => (
                              <button
                                 key={ch._id}
                                 onClick={() => { navigate(`/chat?channel=${ch._id}`); setSearchChannelsOpen(false); }}
                                 className="w-full p-3 rounded-xl text-left text-xs font-semibold text-neutral-200 hover:bg-white hover:text-black transition flex items-center gap-2.5"
                              >
                                 <HashIcon className="h-4 w-4" />
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
