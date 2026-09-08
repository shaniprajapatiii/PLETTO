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
      title: "Organization",
      items: [
         { label: "Directory", to: "/my-channels", icon: HashIcon },
         { label: "Team", to: "/people", icon: PeopleIcon },
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
      <div className="min-h-screen w-full bg-[#0b0c10] text-zinc-100 flex flex-col lg:flex-row overflow-x-hidden app-grid-bg">
         {/* Desktop Sidebar */}
         <aside className={`hidden lg:flex lg:flex-col border-r border-zinc-800/80 bg-[#0d0e13]/95 backdrop-blur-xl h-screen sticky top-0 transition-all duration-200 z-30 ${sidebarCollapsed ? "w-16 px-2.5 py-4" : "w-60 px-3.5 py-4"}`}>
            {/* Workspace Logo Header */}
            <div className={`flex items-center ${sidebarCollapsed ? "justify-center flex-col gap-2" : "justify-between gap-2"}`}>
               <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="flex items-center gap-2.5 rounded-lg px-2 py-1 text-left transition hover:bg-zinc-800/50 min-w-0"
               >
                  <Logo className="w-full" iconClassName="h-7 w-7" withText={!sidebarCollapsed} />
               </button>

               <button
                  type="button"
                  onClick={() => setSidebarCollapsed((v) => !v)}
                  className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-1.5 text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-200"
                  title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
               >
                  {sidebarCollapsed ? <ChevronRightIcon className="h-3.5 w-3.5" /> : <ChevronLeftIcon className="h-3.5 w-3.5" />}
               </button>
            </div>

            {/* Quick Search & New Channel Button */}
            <div className="mt-4 space-y-1.5">
               {!sidebarCollapsed ? (
                  <button
                     type="button"
                     onClick={() => setPaletteOpen(true)}
                     className="w-full flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/60 px-2.5 py-1.5 text-xs text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-200 group"
                  >
                     <span className="flex items-center gap-2">
                        <SearchIcon className="h-3.5 w-3.5 text-zinc-500 group-hover:text-zinc-300" />
                        <span>Search...</span>
                     </span>
                     <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1 py-0.2 text-[10px] font-mono text-zinc-400">⌘K</kbd>
                  </button>
               ) : (
                  <button
                     type="button"
                     onClick={() => setPaletteOpen(true)}
                     className="flex w-full justify-center rounded-lg border border-zinc-800 bg-zinc-900/60 py-1.5 text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-200"
                     title="Search (⌘K)"
                  >
                     <SearchIcon className="h-4 w-4" />
                  </button>
               )}

               <button
                  type="button"
                  onClick={() => setCreateChannelModalOpen(true)}
                  className={`flex w-full items-center gap-1.5 rounded-lg bg-zinc-100 px-2.5 py-1.5 text-xs font-semibold text-zinc-900 transition hover:bg-white ${sidebarCollapsed ? "justify-center" : ""}`}
               >
                  <PlusIcon className="h-3.5 w-3.5 shrink-0" />
                  {!sidebarCollapsed ? <span>New Channel</span> : null}
               </button>
            </div>

            {/* Nav Groups */}
            <div className="mt-5 flex-1 overflow-y-auto space-y-5 pr-0.5">
               {navGroups.map((group) => (
                  <div key={group.title} className="space-y-1">
                     {!sidebarCollapsed ? (
                        <div className="px-2.5 pb-1 text-[11px] font-medium text-zinc-500">{group.title}</div>
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
                                 className={`group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                                    active
                                       ? "bg-zinc-800/90 text-zinc-100 border border-zinc-700/60 shadow-sm"
                                       : "text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200 border border-transparent"
                                 } ${sidebarCollapsed ? "justify-center px-1.5" : ""}`}
                                 title={item.label}
                              >
                                 <Icon className={`h-4 w-4 shrink-0 ${active ? "text-zinc-100" : "text-zinc-400 group-hover:text-zinc-200"}`} />
                                 {!sidebarCollapsed ? (
                                    <span className="flex-1 text-left truncate">{item.label}</span>
                                 ) : null}
                                 {!sidebarCollapsed && item.to === "/chat" && channels.length > 0 ? (
                                    <span className="rounded-full bg-zinc-800 px-1.5 py-0.2 text-[10px] text-zinc-400">
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
            <div className="mt-auto border-t border-zinc-800/80 pt-3">
               <div className={`flex items-center gap-1.5 ${sidebarCollapsed ? "flex-col justify-center" : ""}`}>
                  <button
                     type="button"
                     onClick={() => navigate("/profile")}
                     className={`flex min-w-0 flex-1 items-center gap-2.5 rounded-lg p-1.5 transition hover:bg-zinc-800/50 ${sidebarCollapsed ? "justify-center" : ""}`}
                  >
                     <div className="relative shrink-0">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 text-xs font-medium text-zinc-200">
                           {(user?.name || user?.email || "U").charAt(0).toUpperCase()}
                        </div>
                        <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full border-2 border-zinc-900 bg-emerald-500" />
                     </div>
                     {!sidebarCollapsed ? (
                        <div className="min-w-0 text-left">
                           <div className="truncate text-xs font-medium text-zinc-200">{user?.name || "User"}</div>
                           <div className="truncate text-[10px] text-zinc-500">{user?.email || "Online"}</div>
                        </div>
                     ) : null}
                  </button>

                  <button
                     type="button"
                     onClick={handleLogout}
                     className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-red-500/10 hover:text-red-400"
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
            <header className="flex h-13 shrink-0 items-center justify-between gap-3 border-b border-zinc-800/80 bg-[#0d0e13]/80 px-4 backdrop-blur-md sm:px-6 z-20">
               <div className="flex min-w-0 items-center gap-2.5">
                  <button
                     type="button"
                     onClick={() => setMobileNavOpen(true)}
                     className="rounded-lg border border-zinc-800 p-1.5 text-zinc-400 transition hover:text-white lg:hidden"
                  >
                     <MenuIcon className="h-4 w-4" />
                  </button>

                  <div className="flex min-w-0 items-center gap-2 text-xs">
                     <span className="text-zinc-500">Workspace</span>
                     <span className="text-zinc-700">/</span>
                     <span className="truncate font-medium text-zinc-200">{currentNavItem.label}</span>
                  </div>
               </div>

               <div className="flex items-center gap-2 sm:gap-3">
                  <div className="hidden sm:flex items-center">
                     <PresenceStack />
                  </div>

                  {/* Notifications Bell */}
                  <div ref={(el) => (notifRef.current[0] = el)} className="relative">
                     <button
                        ref={(el) => (notifRef.current[1] = el)}
                        onClick={() => setNotifOpen((v) => !v)}
                        className="relative p-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white hover:border-zinc-700 transition"
                     >
                        <BellIcon className="h-4 w-4" />
                        {unreadCount > 0 ? (
                           <span className="absolute top-1 right-1 flex h-1.5 w-1.5 rounded-full bg-indigo-500" />
                        ) : null}
                     </button>

                     {notifOpen ? (
                        <div ref={(el) => (notifRef.current[2] = el)} className="absolute right-0 mt-2 w-80 rounded-xl border border-zinc-800 bg-zinc-900/95 p-4 shadow-xl z-50 space-y-3 backdrop-blur-md">
                           <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                              <span className="text-xs font-semibold text-zinc-200">Notifications</span>
                              <div className="flex gap-2 text-[11px] text-zinc-400">
                                 {unreadCount > 0 ? <button onClick={markAllRead} className="hover:text-zinc-200">Mark read</button> : null}
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
                                          n.read ? "border-zinc-800/80 bg-zinc-950/40 text-zinc-400" : "border-zinc-700 bg-zinc-800/60 text-zinc-200"
                                       }`}
                                    >
                                       <div className="font-medium text-zinc-200">{n.title}</div>
                                       <div className="mt-0.5 text-zinc-400 text-[11px] leading-snug">{n.body}</div>
                                    </button>
                                 ))}
                              </div>
                           ) : (
                              <div className="py-6 text-center text-xs text-zinc-500">No new notifications</div>
                           )}
                        </div>
                     ) : null}
                  </div>
               </div>
            </header>

            {/* Page Container */}
            <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-7 max-w-full">
               <div className="mx-auto w-full max-w-7xl min-w-0">
                  <Outlet />
               </div>
            </main>
         </div>

         {/* Mobile Drawer */}
         {mobileNavOpen ? (
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm lg:hidden" onClick={() => setMobileNavOpen(false)}>
               <div className="flex h-full w-64 flex-col space-y-4 border-r border-zinc-800 bg-[#0d0e13] p-4" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                     <Logo />
                     <button type="button" onClick={() => setMobileNavOpen(false)} className="rounded-lg p-1 text-zinc-400 transition hover:text-white">
                        <CloseIcon className="h-5 w-5" />
                     </button>
                  </div>

                  <nav className="flex-1 space-y-4 overflow-y-auto">
                     {navGroups.map((g) => (
                        <div key={g.title} className="space-y-1">
                           <div className="px-2 text-[10px] font-medium text-zinc-500 uppercase tracking-wider">{g.title}</div>
                           {g.items.map((item) => {
                              const Icon = item.icon;
                              const active = location.pathname.startsWith(item.to);
                              return (
                                 <button
                                    key={item.label}
                                    type="button"
                                    onClick={() => { navigate(item.to); setMobileNavOpen(false); }}
                                    className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition ${
                                       active ? "bg-zinc-800 text-white border border-zinc-700" : "text-zinc-400 hover:text-zinc-200"
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
               </div>
            </div>
         ) : null}

         {/* Modals */}
         {(createChannelModalOpen || searchChannelsOpen) && (
            <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 px-4 py-6 backdrop-blur-sm">
               <div ref={modalRef} className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-5 shadow-2xl">
                  <div className="mb-4 flex items-center justify-between">
                     <h3 className="text-sm font-semibold text-zinc-100">
                        {createChannelModalOpen ? "New Channel" : "Search Channels"}
                     </h3>
                     <button onClick={() => { setCreateChannelModalOpen(false); setSearchChannelsOpen(false); }} className="text-zinc-400 hover:text-white">
                        <CloseIcon className="h-4 w-4" />
                     </button>
                  </div>

                  {createChannelModalOpen ? (
                     <div className="space-y-3.5">
                        <div>
                           <label className="text-xs font-medium text-zinc-300">Channel Name</label>
                           <input
                              value={channelName}
                              onChange={(e) => setChannelName(e.target.value)}
                              placeholder="e.g. general"
                              className="mt-1 w-full rounded-lg border border-zinc-700/80 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-100 focus:border-zinc-500 outline-none"
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
                                    className={`py-1.5 px-3 rounded-lg border text-xs font-medium capitalize ${
                                       channelPrivacy === p ? "border-zinc-500 bg-zinc-800 text-white" : "border-zinc-800 bg-zinc-950 text-zinc-400"
                                    }`}
                                 >
                                    {p} Channel
                                 </button>
                              ))}
                           </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                           <button onClick={() => setCreateChannelModalOpen(false)} className="px-3 py-1.5 rounded-lg border border-zinc-800 text-xs text-zinc-400 hover:text-white">
                              Cancel
                           </button>
                           <button onClick={createChannelNow} className="px-3.5 py-1.5 rounded-lg bg-zinc-100 text-xs font-semibold text-zinc-950 hover:bg-white">
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
                           className="w-full rounded-lg border border-zinc-700/80 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-100 outline-none focus:border-zinc-500"
                        />
                        <div className="max-h-60 overflow-y-auto space-y-1">
                           {channelSearchResults.map((ch) => (
                              <button
                                 key={ch._id}
                                 onClick={() => { navigate(`/chat?channel=${ch._id}`); setSearchChannelsOpen(false); }}
                                 className="w-full p-2 rounded-lg text-left text-xs text-zinc-300 hover:bg-zinc-800/50 transition flex items-center gap-2"
                              >
                                 <HashIcon className="h-3.5 w-3.5 text-zinc-400" />
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
