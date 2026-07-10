import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
   HiViewGrid as DashboardIcon,
   HiDocumentText as DocsIcon,
   HiChatAlt2 as ChatIcon,
   HiViewBoards as WhiteboardIcon,
   HiUserCircle as ProfileIcon,
   HiCog as SettingsIcon,
   HiLogout as LogoutIcon,
   HiSearch as SearchIcon,
   HiSparkles as SparklesIcon,
   HiBell as BellIcon,
   HiMenu as MenuIcon,
   HiX as CloseIcon,
   HiPlus as PlusIcon,
   HiHashtag as HashIcon,
   HiChevronRight as ChevronRightIcon,
   HiChevronLeft as ChevronLeftIcon,
   HiStar as StarIcon,
   HiClock as ClockIcon,
   HiChevronDown as ChevronDownIcon,
} from "react-icons/hi";
import { useAuth } from "../../context/AuthContext";
import { createBoard } from "../../services/whiteboardService";
import { createDoc } from "../../services/docsService";
import { createChannel, getChannels } from "../../services/chatService";
import { Logo } from "../brand/Logo";
import { CommandPalette } from "./CommandPalette";
import { PresenceStack } from "../../components/app/PresenceStack";

const navItems = [
   { label: "Dashboard", to: "/dashboard", icon: DashboardIcon },
   { label: "Documents", to: "/docs", icon: DocsIcon },
   { label: "Chat", to: "/chat", icon: ChatIcon },
   { label: "Whiteboard", to: "/whiteboard", icon: WhiteboardIcon },
   { label: "Profile", to: "/profile", icon: ProfileIcon },
   { label: "Settings", to: "/settings", icon: SettingsIcon },
];

const starterNotifications = [
   { id: "1", title: "Launch plan updated", body: "Mira added your rollout notes.", link: "/docs", read: false, createdAt: new Date().toISOString() },
   { id: "2", title: "New whiteboard shared", body: "A fresh roadmap board is ready.", link: "/whiteboard", read: false, createdAt: new Date().toISOString() },
   { id: "3", title: "Workspace invite accepted", body: "Your teammate joined the workspace.", link: "/settings", read: true, createdAt: new Date().toISOString() },
];

export default function Layout() {
   const { user, workspace, loading, setUser, setWorkspace } = useAuth();
   const navigate = useNavigate();
   const location = useLocation();
   const [paletteOpen, setPaletteOpen] = useState(false);
   const [mobileOpen, setMobileOpen] = useState(false);
   const [notifOpen, setNotifOpen] = useState(false);
   const [createOpen, setCreateOpen] = useState(false);
   const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
   const [channels, setChannels] = useState([]);
   const [notifications, setNotifications] = useState(starterNotifications);
   const [searchQuery, setSearchQuery] = useState("");
   const [favorites, setFavorites] = useState([]);
   const [recentItems, setRecentItems] = useState([]);
   const [expandedChannelCategories, setExpandedChannelCategories] = useState(true);
   const createRef = useRef(null);
   const notifRef = useRef(null);

   useEffect(() => {
      const onKeyDown = (event) => {
         if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
            event.preventDefault();
            setPaletteOpen(true);
         }
         if ((event.metaKey || event.ctrlKey) && event.key === "/") {
            event.preventDefault();
            setMobileOpen((value) => !value);
         }
      };

      window.addEventListener("keydown", onKeyDown);
      return () => window.removeEventListener("keydown", onKeyDown);
   }, []);

   const unreadCount = useMemo(() => notifications.filter((item) => !item.read).length, [notifications]);
   const title = navItems.find((item) => location.pathname.startsWith(item.to))?.label ?? "Workspace";
   const breadCrumbs = location.pathname.split("/").filter(Boolean);
   const initials = (user?.name || user?.email || "?").slice(0, 2).toUpperCase();

   // Toggle favorite
   const toggleFavorite = (itemId) => {
      const newFavorites = favorites.includes(itemId)
         ? favorites.filter((id) => id !== itemId)
         : [...favorites, itemId];
      setFavorites(newFavorites);
      localStorage.setItem("sidebarFavorites", JSON.stringify(newFavorites));
   };

   // Add to recent items
   const addToRecent = (itemId) => {
      const updated = [itemId, ...recentItems.filter((id) => id !== itemId)].slice(0, 5);
      setRecentItems(updated);
      localStorage.setItem("sidebarRecent", JSON.stringify(updated));
   };

   // Filter channels by search
   const filteredChannels = channels.filter((channel) =>
      channel.name.toLowerCase().includes(searchQuery.toLowerCase())
   );

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
         if (createRef.current && !createRef.current.contains(event.target)) {
            setCreateOpen(false);
         }
         if (notifRef.current && !notifRef.current.contains(event.target)) {
            setNotifOpen(false);
         }
      };
      window.addEventListener("mousedown", onClick);
      return () => window.removeEventListener("mousedown", onClick);
   }, []);

   if (loading) {
      return <div className="grid min-h-screen place-items-center bg-[#020202] text-sm text-muted-foreground">Connecting your workspace…</div>;
   }

   const handleSignOut = () => {
      localStorage.removeItem("token");
      setUser(null);
      setWorkspace(null);
      navigate("/login");
   };

   const handleCreateChannel = async () => {
      const name = window.prompt("Channel name");
      if (!name?.trim()) return;
      try {
         const response = await createChannel(name.trim());
         const channel = response.data.channel || response.data.data;
         if (channel) {
            setChannels((current) => [channel, ...current]);
         }
         navigate(`/chat?channel=${channel?._id || ""}`);
      } catch {
         window.alert("Unable to create the channel right now.");
      }
   };

   const handleCreateDoc = async () => {
      try {
         const response = await createDoc();
         const document = response.data.document || response.data.data;
         if (document) {
            setNotifications((current) => [{ id: `${Date.now()}`, title: "Document created", body: document.title || "New document", link: "/docs", read: false, createdAt: new Date().toISOString() }, ...current]);
         }
         navigate("/docs");
      } catch {
         window.alert("Unable to create a document right now.");
      }
   };

   const handleCreateBoard = async () => {
      try {
         const response = await createBoard("Untitled board");
         const board = response.data.board || response.data.data;
         if (board) {
            setNotifications((current) => [{ id: `${Date.now()}`, title: "Whiteboard created", body: board.name || "New whiteboard", link: "/whiteboard", read: false, createdAt: new Date().toISOString() }, ...current]);
         }
         navigate("/whiteboard");
      } catch {
         window.alert("Unable to create a whiteboard right now.");
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

   const sidebarContent = (
      <>
         {/* Header */}
         <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-3">
            <Link to="/" className={`flex items-center ${sidebarCollapsed ? "justify-center" : "gap-2"}`}>
               <Logo withText={!sidebarCollapsed} className="h-10" />
            </Link>
            <button onClick={() => setSidebarCollapsed((value) => !value)} className="hidden rounded-full border border-white/10 p-2 text-muted-foreground transition hover:border-gold/30 hover:text-white md:inline-flex">
               <ChevronLeftIcon className={`h-4 w-4 transition ${sidebarCollapsed ? "rotate-180" : ""}`} />
            </button>
            <button onClick={() => setMobileOpen(false)} className="rounded-full border border-white/10 p-2 text-muted-foreground transition hover:border-gold/30 hover:text-white md:hidden">
               <CloseIcon className="h-4 w-4" />
            </button>
         </div>

         {/* Main Navigation */}
         <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
            {/* Search Bar */}
            {!sidebarCollapsed ? (
               <div className="mb-4 p-2">
                  <div className="relative">
                     <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-gold/60" />
                     <input
                        type="text"
                        placeholder="Search channels…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-[12px] border border-white/10 bg-white/[0.03] pl-9 pr-3 py-2 text-sm placeholder-muted-foreground outline-none transition hover:bg-white/[0.05] focus:border-gold/30 focus:bg-white/[0.07]"
                     />
                  </div>
               </div>
            ) : null}

            {/* Workspace Section */}
            <div>
               {!sidebarCollapsed ? (
                  <div className="px-2 pb-2 pt-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/60">
                     Workspace
                  </div>
               ) : null}
               <div className={sidebarCollapsed ? "space-y-1" : "space-y-1"}>
                  {navItems.map((item) => {
                     const Icon = item.icon;
                     const active = location.pathname.startsWith(item.to);
                     return (
                        <Link
                           key={item.to}
                           to={item.to}
                           title={sidebarCollapsed ? item.label : undefined}
                           className={`flex items-center rounded-[12px] border px-3 py-2.5 text-sm font-medium transition ${
                              active
                                 ? "border-gold/40 bg-[rgba(245,181,50,0.12)] text-gold shadow-[0_0_0_1px_rgba(245,181,50,0.12)]"
                                 : "border-transparent text-muted-foreground hover:border-white/10 hover:bg-white/[0.05] hover:text-white"
                           } ${sidebarCollapsed ? "justify-center px-2" : "gap-3"}`}
                        >
                           <Icon className="h-4 w-4 flex-shrink-0" />
                           {!sidebarCollapsed && <span>{item.label}</span>}
                           {active && !sidebarCollapsed ? <span className="ml-auto h-2 w-2 rounded-full bg-gold" /> : null}
                        </Link>
                     );
                  })}
               </div>
            </div>

            {/* Favorites Section */}
            {!sidebarCollapsed && favorites.length > 0 ? (
               <div className="mt-4">
                  <div className="px-2 pb-2 pt-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/60">
                     ⭐ Favorites
                  </div>
                  <div className="space-y-1">
                     {channels
                        .filter((ch) => favorites.includes(ch._id))
                        .map((channel) => (
                           <div key={channel._id} className="group flex items-center gap-2 rounded-[12px] px-2 py-2 hover:bg-white/[0.04]">
                              <button
                                 onClick={() => {
                                    navigate(`/chat?channel=${channel._id}`);
                                    addToRecent(channel._id);
                                 }}
                                 className="flex flex-1 items-center gap-2 rounded-[10px] px-2 py-1.5 text-left text-sm text-muted-foreground transition hover:text-white"
                              >
                                 <HashIcon className="h-3.5 w-3.5 flex-shrink-0 text-gold/60" />
                                 <span className="truncate">{channel.name}</span>
                              </button>
                              <button
                                 onClick={() => toggleFavorite(channel._id)}
                                 className="rounded-full p-1 text-gold/70 opacity-0 transition hover:text-gold group-hover:opacity-100"
                              >
                                 <StarIcon className="h-3.5 w-3.5" />
                              </button>
                           </div>
                        ))}
                  </div>
               </div>
            ) : null}

            {/* Recent Items Section */}
            {!sidebarCollapsed && recentItems.length > 0 ? (
               <div className="mt-4">
                  <div className="px-2 pb-2 pt-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/60">
                     🕐 Recent
                  </div>
                  <div className="space-y-1">
                     {channels
                        .filter((ch) => recentItems.includes(ch._id))
                        .map((channel) => (
                           <button
                              key={channel._id}
                              onClick={() => {
                                 navigate(`/chat?channel=${channel._id}`);
                                 addToRecent(channel._id);
                              }}
                              className="flex w-full items-center gap-2 rounded-[12px] border border-transparent px-3 py-2 text-left text-sm text-muted-foreground transition hover:border-white/10 hover:bg-white/[0.04] hover:text-white"
                           >
                              <ClockIcon className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground/60" />
                              <span className="truncate">{channel.name}</span>
                           </button>
                        ))}
                  </div>
               </div>
            ) : null}

            {/* Channels Section */}
            <div className="mt-4">
               <button
                  onClick={() => setExpandedChannelCategories(!expandedChannelCategories)}
                  className="flex w-full items-center justify-between px-2 pb-2 pt-3 hover:opacity-80"
               >
                  <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/60">
                     💬 Channels {channels.length > 0 && <span className="ml-1 text-gold/70">({channels.length})</span>}
                  </div>
                  <ChevronDownIcon
                     className={`h-4 w-4 text-muted-foreground/60 transition ${
                        expandedChannelCategories ? "" : "-rotate-90"
                     }`}
                  />
               </button>

               {expandedChannelCategories && (
                  <div className="space-y-1">
                     {filteredChannels.length > 0 ? (
                        filteredChannels.map((channel) => (
                           <div
                              key={channel._id}
                              className="group flex items-center gap-1 rounded-[12px] px-2 py-2 hover:bg-white/[0.04]"
                           >
                              <button
                                 onClick={() => {
                                    navigate(`/chat?channel=${channel._id}`);
                                    addToRecent(channel._id);
                                 }}
                                 className="flex flex-1 items-center gap-2.5 rounded-[10px] px-2 py-1.5 text-left text-sm text-muted-foreground transition hover:text-white"
                              >
                                 <HashIcon className="h-3.5 w-3.5 flex-shrink-0 text-gold/70" />
                                 <span className="truncate">{channel.name}</span>
                              </button>
                              <button
                                 onClick={() => toggleFavorite(channel._id)}
                                 title={favorites.includes(channel._id) ? "Remove from favorites" : "Add to favorites"}
                                 className="rounded-full p-1 text-muted-foreground/60 opacity-0 transition hover:text-gold group-hover:opacity-100"
                              >
                                 <StarIcon className={`h-3.5 w-3.5 ${favorites.includes(channel._id) ? "fill-gold text-gold" : ""}`} />
                              </button>
                           </div>
                        ))
                     ) : searchQuery ? (
                        <div className="rounded-[12px] border border-dashed border-white/10 bg-white/[0.02] px-3 py-3 text-center text-sm text-muted-foreground">
                           No channels match "{searchQuery}"
                        </div>
                     ) : (
                        <div className="rounded-[12px] border border-dashed border-white/10 bg-white/[0.02] px-3 py-3 text-sm text-muted-foreground">
                           Create your first channel to start collaborating.
                        </div>
                     )}
                  </div>
               )}

               {!searchQuery && (
                  <button
                     onClick={handleCreateChannel}
                     className="mt-2 flex w-full items-center justify-center gap-2 rounded-[12px] border border-dashed border-white/10 px-3 py-2.5 text-sm text-muted-foreground transition hover:border-gold/30 hover:bg-white/[0.02] hover:text-gold"
                  >
                     <PlusIcon className="h-4 w-4" />
                     New channel
                  </button>
               )}
            </div>
         </nav>

         {/* User Profile Section */}
         <div className="border-t border-white/10 p-3">
            <div className={`flex items-center rounded-[14px] border border-white/10 bg-white/[0.04] p-3 transition hover:bg-white/[0.06] ${sidebarCollapsed ? "justify-center" : "gap-3"}`}>
               <Link
                  to="/profile"
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[10px] bg-gradient-gold text-sm font-bold text-[var(--noir-900)]"
               >
                  {initials}
               </Link>
               {!sidebarCollapsed ? (
                  <>
                     <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-white">{user?.name || "You"}</div>
                        <div className="truncate text-xs text-muted-foreground">{user?.email}</div>
                     </div>
                     <button
                        onClick={handleSignOut}
                        className="rounded-full border border-white/10 p-2 text-muted-foreground transition hover:border-gold/30 hover:bg-white/[0.05] hover:text-gold"
                     >
                        <LogoutIcon className="h-4 w-4" />
                     </button>
                  </>
               ) : null}
            </div>
         </div>
      </>
   );

   return (
      <div className="flex min-h-screen bg-[#030303] text-slate-100">
         {/* Desktop Sidebar */}
         <aside className={`hidden flex-col border-r border-white/8 bg-gradient-to-b from-[rgba(8,8,8,0.98)] to-[rgba(5,5,5,0.96)] md:flex ${
            sidebarCollapsed ? "w-[76px]" : "w-[280px]"
         } transition-all duration-300 ease-out`}>
            {sidebarContent}
         </aside>

         {/* Mobile Sidebar */}
         {mobileOpen ? (
            <div className="fixed inset-0 z-50 flex md:hidden">
               <div className="absolute inset-0 bg-[rgba(2,2,2,0.72)] backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
               <aside className="relative flex w-[280px] max-w-[85vw] flex-col border-r border-white/10 bg-gradient-to-b from-[rgba(8,8,8,0.98)] to-[rgba(5,5,5,0.96)] animate-[slideIn_180ms_ease-out]">
                  {sidebarContent}
               </aside>
            </div>
         ) : null}

         {/* Main Content */}
         <div className="flex min-w-0 flex-1 flex-col">
            {/* Header */}
            <header className="flex h-16 items-center gap-3 border-b border-white/8 bg-gradient-to-r from-[rgba(6,6,6,0.95)] via-[rgba(8,8,8,0.92)] to-[rgba(6,6,6,0.95)] px-3 shadow-[0_12px_42px_rgba(0,0,0,0.2)] backdrop-blur-2xl sm:px-5 transition">
               {/* Sidebar Toggle */}
               <button
                  onClick={() => setSidebarCollapsed((value) => !value)}
                  className="hidden rounded-full border border-white/10 bg-white/[0.03] p-2 text-muted-foreground transition hover:border-gold/30 hover:bg-white/[0.05] hover:text-white md:inline-flex"
               >
                  <ChevronLeftIcon className={`h-4 w-4 transition ${sidebarCollapsed ? "rotate-180" : ""}`} />
               </button>

               {/* Mobile Menu */}
               <button
                  onClick={() => setMobileOpen(true)}
                  className="rounded-full border border-white/10 bg-white/[0.03] p-2 text-muted-foreground transition hover:border-gold/30 hover:bg-white/[0.05] hover:text-white md:hidden"
               >
                  <MenuIcon className="h-4 w-4" />
               </button>

               {/* Breadcrumb & Title */}
               <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-gold/80 font-semibold">
                     <span>PLETTO</span>
                     {breadCrumbs.map((segment, index) => (
                        <span key={segment} className="flex items-center gap-2">
                           <ChevronRightIcon className="h-3 w-3 text-white/30" />
                           <span className={index === breadCrumbs.length - 1 ? "text-white" : "text-muted-foreground"}>
                              {segment}
                           </span>
                        </span>
                     ))}
                  </div>
                  <h1 className="mt-0.5 text-[1rem] font-semibold text-white">{title}</h1>
               </div>

               {/* Presence Stack */}
               <div className="hidden items-center gap-2 md:flex">
                  <PresenceStack />
               </div>

               {/* Notifications */}
               <div ref={notifRef} className="relative">
                  <button
                     onClick={() => setNotifOpen((value) => !value)}
                     className="relative rounded-full border border-white/10 bg-white/[0.03] p-2 text-muted-foreground transition hover:border-gold/30 hover:bg-white/[0.05] hover:text-white"
                  >
                     <BellIcon className="h-4 w-4" />
                     {unreadCount > 0 ? (
                        <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-gold px-1 text-[9px] font-semibold text-[var(--noir-900)]">
                           {unreadCount}
                        </span>
                     ) : null}
                  </button>
                  {notifOpen ? (
                     <div className="absolute right-0 mt-2 w-80 rounded-[18px] border border-white/10 bg-[#070707] p-3 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
                        <div className="flex items-center justify-between px-2 py-2">
                           <div className="text-xs uppercase tracking-[0.2em] font-semibold text-gold">Notifications</div>
                           <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                              {unreadCount > 0 ? <button onClick={markAllRead}>Mark read</button> : null}
                              <button onClick={clearAll}>Clear</button>
                           </div>
                        </div>
                        {notifications.length > 0 ? (
                           <div className="space-y-2">
                              {notifications.map((notification) => (
                                 <button
                                    key={notification.id}
                                    onClick={() => openNotification(notification)}
                                    className={`w-full rounded-[14px] border px-3 py-3 text-left transition ${
                                       notification.read
                                          ? "border-white/10 bg-white/[0.03]"
                                          : "border-gold/30 bg-[rgba(245,181,50,0.08)]"
                                    }`}
                                 >
                                    <div className="text-sm font-semibold text-white">{notification.title}</div>
                                    <div className="mt-1 text-xs text-muted-foreground">{notification.body}</div>
                                 </button>
                              ))}
                           </div>
                        ) : (
                           <div className="rounded-[14px] border border-dashed border-white/10 bg-white/[0.03] px-3 py-5 text-center text-sm text-muted-foreground">
                              You are all caught up.
                           </div>
                        )}
                     </div>
                  ) : null}
               </div>

               {/* Create Button */}
               <div ref={createRef} className="relative">
                  <button
                     onClick={() => setCreateOpen((value) => !value)}
                     className="rounded-full border border-white/10 bg-white/[0.03] p-2 text-muted-foreground transition hover:border-gold/30 hover:bg-white/[0.05] hover:text-white"
                  >
                     <PlusIcon className="h-4 w-4" />
                  </button>
                  {createOpen ? (
                     <div className="absolute right-0 mt-2 w-56 rounded-[18px] border border-white/10 bg-[#070707] p-2 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
                        {[
                           { label: "New document", action: handleCreateDoc },
                           { label: "New channel", action: handleCreateChannel },
                           { label: "New whiteboard", action: handleCreateBoard },
                        ].map((item) => (
                           <button
                              key={item.label}
                              onClick={() => {
                                 item.action();
                                 setCreateOpen(false);
                              }}
                              className="flex w-full items-center justify-between rounded-[12px] px-3 py-2.5 text-left text-sm text-muted-foreground transition hover:bg-[rgba(245,181,50,0.08)] hover:text-white"
                           >
                              <span>{item.label}</span>
                              <ChevronRightIcon className="h-4 w-4" />
                           </button>
                        ))}
                     </div>
                  ) : null}
               </div>

               {/* Ask AI Button */}
               <button
                  onClick={() => setPaletteOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-gold px-3 py-2 text-sm font-semibold text-[var(--noir-900)] shadow-[0_4px_16px_rgba(245,181,50,0.25)] transition hover:-translate-y-0.5 hover:shadow-[0_6px_24px_rgba(245,181,50,0.35)]"
               >
                  <SparklesIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Ask AI</span>
               </button>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 overflow-auto bg-[#050505] p-3 sm:p-4 lg:p-5">
               <Outlet />
            </main>
         </div>

         {/* Command Palette */}
         <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      </div>
   );
}
