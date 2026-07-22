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
   HiTemplate as TemplatesIcon,
   HiCalendar as CalendarIcon,
   HiChevronLeft as ChevronLeftIcon,
   HiChevronRight as ChevronRightIcon,
   HiAdjustments as AdjustmentsIcon,
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

const navItems = [
   { label: "Dashboard", to: "/dashboard", icon: DashboardIcon, description: "Overview" },
   { label: "Documents", to: "/docs", icon: DocsIcon, description: "Knowledge" },
   { label: "Chat", to: "/chat", icon: ChatIcon, description: "Messages" },
   { label: "My Channels", to: "/my-channels", icon: HashIcon, description: "Rooms" },
   { label: "People", to: "/people", icon: PeopleIcon, description: "Team" },
   { label: "Whiteboard", to: "/whiteboard", icon: WhiteboardIcon, description: "Ideas" },
   { label: "Search", action: "search", icon: SearchIcon, description: "Find quickly" },
];

const secondaryNavItems = [
   { label: "Templates", to: "/docs", icon: TemplatesIcon, description: "Starter kits" },
   { label: "Calendar", to: "/dashboard", icon: CalendarIcon, description: "Plan ahead" },
   { label: "Settings", to: "/settings", icon: SettingsIcon, description: "Preferences" },
];

const createShortcuts = [
   { label: "New Doc", action: "doc", icon: DocsIcon },
   { label: "New Board", action: "board", icon: WhiteboardIcon },
   { label: "New Channel", action: "channel", icon: HashIcon },
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
   const [sidebarContrast, setSidebarContrast] = useState(false);
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
   const title = navItems.find((item) => location.pathname.startsWith(item.to))?.label ?? "Workspace";
   const activeNavItem = navItems.find((item) => location.pathname.startsWith(item.to)) ?? navItems[0];
   const recentItems = useMemo(() => {
      const items = [];

      channels.forEach((channel) => {
         items.push({
            id: channel._id,
            label: channel.name,
            meta: "Channel",
            icon: HashIcon,
         });
      });

      notifications.slice(0, 3).forEach((notification) => {
         const kind = notification.link?.includes("/docs") ? "Docs" : notification.link?.includes("/whiteboard") ? "Board" : "Update";
         items.push({
            id: notification.id,
            label: notification.title,
            meta: kind,
            icon: kind === "Docs" ? DocsIcon : kind === "Board" ? WhiteboardIcon : SparklesIcon,
         });
      });

      return items.slice(0, 6);
   }, [channels, notifications]);

   const handleNavClick = (item) => {
      if (item.action === "search") {
         setSearchChannelsOpen(true);
         return;
      }
      if (item.to) {
         navigate(item.to);
      }
   };

   const handleQuickAction = (action) => {
      if (action === "doc") {
         handleCreateDoc();
      } else if (action === "board") {
         handleCreateBoard();
      } else if (action === "channel") {
         setCreateChannelModalOpen(true);
      } else if (action === "settings") {
         navigate("/settings");
      }
   };

   const handleLogout = () => {
      localStorage.removeItem("token");
      setUser(null);
      setWorkspace(null);
      navigate("/login");
   };

   const createChannelNow = async () => {
      if (!channelName.trim()) return;
      try {
         const response = await createChannel({ name: channelName.trim(), type: channelPrivacy });
         const channel = response.data.channel || response.data.data;
         if (channel) {
            setChannels((current) => [channel, ...current]);
            if (socket) {
               socket.emit("channelCreated", channel._id);
            }
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

   const channelSearchResults = channels.filter((channel) =>
      channel.name.toLowerCase().includes(channelSearchQuery.toLowerCase())
   );

   return (
      <div className="min-h-screen bg-[#030303] text-slate-100">
         <div className="flex min-h-screen flex-col lg:flex-row">
            <aside className={`hidden lg:flex lg:flex-col border-r border-white/10 bg-[rgba(255,255,255,0.03)] backdrop-blur-xl px-4 py-5 transition-[width,transform,opacity] duration-300 ease-out ${sidebarCollapsed ? "lg:w-20" : "lg:w-72"}`}>
               <div className={`flex items-center justify-between gap-2 ${sidebarCollapsed ? "flex-col" : ""}`}>
                  <button
                     type="button"
                     onClick={() => navigate("/dashboard")}
                     className={`flex w-full items-center rounded-[18px] bg-white/[0.04] px-2 py-2.5 text-left transition hover:bg-white/[0.08] ${sidebarCollapsed ? "justify-center" : "gap-3"}`}
                  >
                     <div className="rounded-2xl bg-[#111111] p-2">
                        <Logo withText={false} iconClassName="h-5 w-5" />
                     </div>
                     {!sidebarCollapsed ? (
                        <div>
                           <div className="text-sm font-semibold tracking-[0.24em] text-white">PLETTO</div>
                           <div className="text-[10px] uppercase tracking-[0.24em] text-gold">Studio</div>
                        </div>
                     ) : null}
                  </button>
                  <button
                     type="button"
                     onClick={() => setSidebarCollapsed((value) => !value)}
                     className={`rounded-full border border-gold/20 bg-[rgba(249,235,174,0.10)] p-2 text-gold transition hover:bg-[rgba(249,235,174,0.16)] ${sidebarCollapsed ? "inline-flex" : "hidden lg:inline-flex"}`}
                     aria-label="Toggle sidebar"
                     title="Toggle sidebar"
                  >
                     {sidebarCollapsed ? <ChevronRightIcon className="h-4 w-4" /> : <ChevronLeftIcon className="h-4 w-4" />}
                  </button>
               </div>

               <div className="mt-5 flex items-center gap-2">
                  <button
                     type="button"
                     onClick={() => setSidebarContrast((value) => !value)}
                     className={`flex flex-1 items-center rounded-[16px] bg-white/[0.04] px-2 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-white/[0.08] ${sidebarCollapsed ? "justify-center" : "gap-2"}`}
                     title="Contrast"
                  >
                     <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-2xl ${sidebarContrast ? "bg-[rgba(249,235,174,0.12)] text-gold" : "bg-white/[0.06] text-muted-foreground"}`}>
                        <AdjustmentsIcon className="h-4 w-4" />
                     </span>
                     {!sidebarCollapsed ? <span>Contrast</span> : null}
                  </button>
                  <button
                     type="button"
                     onClick={() => setSearchChannelsOpen(true)}
                     className="flex shrink-0 items-center rounded-[16px] bg-white/[0.04] px-2.5 py-2.5 text-muted-foreground transition hover:bg-white/[0.08]"
                     title="Search"
                  >
                     <SearchIcon className="h-4 w-4" />
                  </button>
               </div>

               <div className="mt-7 space-y-6 overflow-y-auto pr-1">
                  <div className={`${sidebarCollapsed ? "" : "space-y-3"}`}>
                     {!sidebarCollapsed ? <div className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Discover</div> : null}
                     <nav className="space-y-1">
                        {navItems.map((item) => {
                           const Icon = item.icon;
                           const active = item.to ? location.pathname.startsWith(item.to) : false;
                           return (
                              <button
                                 key={item.label}
                                 type="button"
                                 onClick={() => handleNavClick(item)}
                                 title={item.label}
                                 className={`group flex w-full items-center rounded-[16px] bg-white/[0.03] px-2 py-2.5 text-left transition ${sidebarCollapsed ? "justify-center" : "gap-3"} ${active ? "bg-[rgba(249,235,174,0.16)] text-gold" : "text-muted-foreground hover:bg-white/[0.06] hover:text-white"}`}
                              >
                                 <span className={`relative grid h-9 w-9 place-items-center rounded-2xl ${active ? "bg-[rgba(249,235,174,0.18)] text-gold" : "bg-white/[0.06] text-muted-foreground"}`}>
                                    <Icon className="h-4 w-4" />
                                    {sidebarCollapsed ? (
                                       <span className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border border-white/10 bg-[#0b0b0b]/95 px-2.5 py-1 text-[11px] font-medium text-slate-200 opacity-0 transition group-hover:opacity-100">
                                          {item.label}
                                       </span>
                                    ) : null}
                                 </span>
                                 {!sidebarCollapsed ? (
                                    <span className="min-w-0 flex-1">
                                       <span className="block text-sm font-medium">{item.label}</span>
                                       <span className="mt-0.5 block text-[10px] uppercase tracking-[0.18em] text-white/35">{item.description}</span>
                                    </span>
                                 ) : null}
                                 {!sidebarCollapsed && item.to === "/chat" && channels.length > 0 ? (
                                    <span className="rounded-full bg-red-500/90 px-2 py-0.5 text-[10px] font-semibold text-white">
                                       {channels.length}
                                    </span>
                                 ) : null}
                              </button>
                           );
                        })}
                     </nav>
                  </div>

                  <div className={`${sidebarCollapsed ? "" : "space-y-3"}`}>
                     {!sidebarCollapsed ? <div className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Create</div> : null}
                     <button
                        type="button"
                        onClick={() => setCreateChannelModalOpen(true)}
                        className={`flex w-full items-center rounded-[16px] bg-white/[0.03] px-2 py-2.5 text-sm font-medium text-white transition hover:bg-white/[0.08] ${sidebarCollapsed ? "justify-center" : "gap-2"}`}
                        title="Create channel"
                     >
                        <span className="grid h-8 w-8 place-items-center rounded-full bg-[rgba(249,235,174,0.16)] text-gold">
                           <PlusIcon className="h-4 w-4" />
                        </span>
                        {!sidebarCollapsed ? <span>Create channel</span> : null}
                     </button>
                     {!sidebarCollapsed ? (
                        <div className="grid grid-cols-2 gap-2">
                           {createShortcuts.map((action) => {
                              const Icon = action.icon;
                              return (
                                 <button
                                    key={action.label}
                                    type="button"
                                    onClick={() => handleQuickAction(action.action)}
                                    className="rounded-[16px] bg-white/[0.03] px-2.5 py-2.5 text-left text-sm text-slate-300 transition hover:bg-white/[0.08]"
                                 >
                                    <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-[rgba(249,235,174,0.12)] text-gold">
                                       <Icon className="h-3.5 w-3.5" />
                                    </div>
                                    <div className="text-[11px] font-medium">{action.label}</div>
                                 </button>
                              );
                           })}
                        </div>
                     ) : null}
                  </div>

                  <div className={`${sidebarCollapsed ? "" : "space-y-3"}`}>
                     {!sidebarCollapsed ? <div className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Recent</div> : null}
                     <div className="space-y-1">
                        {recentItems.map((item) => {
                           const Icon = item.icon;
                           return (
                              <button
                                 key={item.id}
                                 type="button"
                                 onClick={() => navigate(item.meta === "Channel" ? `/chat?channel=${item.id}` : item.meta === "Docs" ? "/docs" : "/whiteboard")}
                                 title={item.label}
                                 className={`flex w-full items-center rounded-[16px] bg-white/[0.03] px-2 py-2.5 text-left transition ${sidebarCollapsed ? "justify-center" : "gap-2"} text-muted-foreground hover:bg-white/[0.08] hover:text-white`}
                              >
                                 <span className="grid h-8 w-8 place-items-center rounded-2xl bg-[rgba(249,235,174,0.10)] text-gold">
                                    <Icon className="h-4 w-4" />
                                 </span>
                                 {!sidebarCollapsed ? (
                                    <div className="min-w-0 flex-1">
                                       <div className="truncate text-sm font-medium text-white">{item.label}</div>
                                       <div className="truncate text-[10px] uppercase tracking-[0.18em] text-white/35">{item.meta}</div>
                                    </div>
                                 ) : null}
                              </button>
                           );
                        })}
                     </div>
                  </div>
               </div>

               <div className={`mt-auto ${sidebarCollapsed ? "flex justify-center" : ""}`}>
                  <div className={`w-full ${sidebarCollapsed ? "max-w-[64px]" : ""}`}>
                     <button
                        type="button"
                        onClick={() => navigate("/profile")}
                        className={`flex w-full items-center rounded-[16px] bg-white/[0.03] px-2 py-2.5 text-left transition hover:bg-white/[0.08] ${sidebarCollapsed ? "justify-center" : "gap-3"}`}
                        title="Profile"
                     >
                        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-gold text-sm font-semibold text-[var(--noir-900)] shadow-[0_0_0_1px_rgba(249,235,174,0.24)]">
                           {(user?.name || user?.email || "U").charAt(0).toUpperCase()}
                        </div>
                        {!sidebarCollapsed ? (
                           <div className="min-w-0">
                              <div className="truncate text-sm font-semibold text-white">{user?.name || "Profile"}</div>
                              <div className="truncate text-xs text-muted-foreground">Open profile</div>
                           </div>
                        ) : null}
                     </button>
                     <button
                        type="button"
                        onClick={handleLogout}
                        className={`mt-3 flex w-full items-center justify-center rounded-[16px] bg-red-500/10 px-2 py-2.5 text-sm font-medium text-red-300 transition hover:bg-red-500/20 ${sidebarCollapsed ? "justify-center" : "gap-2"}`}
                        title="Logout"
                     >
                        <LogoutIcon className="h-4 w-4" />
                        {!sidebarCollapsed ? <span>Logout</span> : null}
                     </button>
                  </div>
               </div>
            </aside>

            <div className="flex flex-1 flex-col">
               <header className="border-b border-white/10 bg-[rgba(7,7,7,0.72)] px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-6">
                  <div className="flex items-center justify-between gap-3">
                     <div className="flex items-center gap-3">
                        <button
                           type="button"
                           onClick={() => setMobileNavOpen(true)}
                           className="rounded-2xl border border-white/10 bg-white/[0.04] p-2 text-muted-foreground transition hover:border-gold/20 hover:text-white lg:hidden"
                           aria-label="Open navigation"
                        >
                           <MenuIcon className="h-4 w-4" />
                        </button>
                        <div>
                           <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-gold">
                              <span>Workspace</span>
                              <span className="text-white/20">/</span>
                              <span className="text-muted-foreground">{activeNavItem.label}</span>
                           </div>
                           <h1 className="text-base font-semibold text-white">{title}</h1>
                        </div>
                     </div>

                     <div className="flex items-center gap-2">
                        <div className="hidden items-center gap-2 md:flex">
                           <PresenceStack />
                        </div>
                        <button
                           type="button"
                           onClick={() => setPaletteOpen(true)}
                           className="hidden rounded-full border border-gold/20 bg-[rgba(249,235,174,0.1)] px-3 py-2 text-sm font-semibold text-gold transition hover:bg-[rgba(249,235,174,0.16)] sm:inline-flex"
                        >
                           Ask AI
                        </button>
                        <button
                           type="button"
                           onClick={() => setSearchChannelsOpen(true)}
                           className="rounded-full border border-white/10 bg-white/[0.04] p-2 text-muted-foreground transition hover:border-gold/20 hover:text-white"
                           aria-label="Search channels"
                        >
                           <SearchIcon className="h-4 w-4" />
                        </button>
                        <div ref={(el) => (notifRef.current[0] = el)} className="relative">
                           <button
                              ref={(el) => (notifRef.current[1] = el)}
                              onClick={() => setNotifOpen((value) => !value)}
                              className="relative rounded-full border border-white/10 bg-white/[0.04] p-2 text-muted-foreground transition hover:border-gold/20 hover:text-white"
                              aria-label="Open notifications"
                           >
                              <BellIcon className="h-4 w-4" />
                              {unreadCount > 0 ? (
                                 <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-gold px-1 text-[9px] font-semibold text-[var(--noir-900)]">
                                    {unreadCount}
                                 </span>
                              ) : null}
                           </button>
                           {notifOpen ? (
                              <div ref={(el) => (notifRef.current[2] = el)} className="absolute right-0 z-50 mt-2 w-80 rounded-[18px] border border-white/10 bg-[#070707] p-3 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
                                 <div className="flex items-center justify-between px-2 py-2">
                                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Notifications</div>
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
                                                   : "border-gold/30 bg-[rgba(249,235,174,0.08)]"
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
                        <button
                           type="button"
                           onClick={() => navigate("/profile")}
                           className="rounded-full border border-white/10 bg-white/[0.04] p-2 text-muted-foreground transition hover:border-gold/20 hover:text-white"
                           aria-label="Open profile"
                        >
                           <ProfileIcon className="h-4 w-4" />
                        </button>
                     </div>
                  </div>
               </header>

               <main className="flex-1 overflow-auto bg-transparent p-4 sm:p-6 lg:p-8">
                  <div className="mx-auto w-full max-w-[1440px]">
                     <Outlet />
                  </div>
               </main>
            </div>
         </div>

         {mobileNavOpen ? (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm lg:hidden" onClick={() => setMobileNavOpen(false)}>
               <div className="h-full w-[88vw] max-w-[320px] border-r border-white/10 bg-[#070707] p-5" onClick={(event) => event.stopPropagation()}>
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="rounded-2xl border border-white/10 bg-[#0d0d0d] p-2">
                           <Logo withText={false} iconClassName="h-5 w-5" />
                        </div>
                        <div>
                           <div className="text-sm font-semibold tracking-[0.24em] text-white">PLETTO</div>
                           <div className="text-[10px] uppercase tracking-[0.24em] text-gold">Studio</div>
                        </div>
                     </div>
                     <button type="button" onClick={() => setMobileNavOpen(false)} className="rounded-full border border-white/10 p-2 text-muted-foreground">
                        <CloseIcon className="h-4 w-4" />
                     </button>
                  </div>

                  <div className="mt-5 p-2">
                     <div className="rounded-[1.8rem] bg-[rgba(255,255,255,0.03)] p-3">
                        <div className="px-2 py-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Discover</div>
                        <nav className="space-y-1">
                           {navItems.map((item) => {
                              const Icon = item.icon;
                              const active = location.pathname.startsWith(item.to);
                              return (
                                 <button
                                    key={item.to}
                                    type="button"
                                    onClick={() => {
                                       navigate(item.to);
                                       setMobileNavOpen(false);
                                    }}
                                    className={`flex w-full items-center gap-3 rounded-[16px] px-3 py-2.5 text-left transition ${
                                       active
                                          ? "bg-[rgba(249,235,174,0.12)] text-gold"
                                          : "text-muted-foreground hover:bg-white/[0.05] hover:text-white"
                                    }`}
                                 >
                                    <span className={`grid h-9 w-9 place-items-center rounded-2xl ${active ? "bg-[rgba(249,235,174,0.14)]" : "bg-white/[0.04]"}`}>
                                       <Icon className="h-4 w-4" />
                                    </span>
                                    <span className="text-sm font-medium">{item.label}</span>
                                 </button>
                              );
                           })}
                        </nav>
                     </div>
                  </div>

                  <div className="mt-4 p-2">
                     <div className="rounded-[1.8rem] bg-[rgba(255,255,255,0.03)] p-3">
                        <div className="px-2 py-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Quick create</div>
                        <div className="grid grid-cols-2 gap-2">
                           {createShortcuts.map((action) => {
                              const Icon = action.icon;
                              return (
                                 <button
                                    key={action.label}
                                    type="button"
                                    onClick={() => {
                                       handleQuickAction(action.action);
                                       setMobileNavOpen(false);
                                    }}
                                    className="rounded-[16px] border border-white/[0.06] bg-[#0d0d0d] px-2.5 py-2.5 text-left text-sm text-slate-300 transition hover:border-white/10 hover:bg-white/[0.05]"
                                 >
                                    <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-[rgba(249,235,174,0.12)] text-gold">
                                       <Icon className="h-3.5 w-3.5" />
                                    </div>
                                    <div className="text-[11px] font-medium">{action.label}</div>
                                 </button>
                              );
                           })}
                        </div>
                     </div>
                  </div>

                  <div className="mt-4 p-2">
                     <div className="rounded-[1.8rem] border border-white/[0.06] bg-[rgba(255,255,255,0.03)] p-4">
                        <div className="text-sm font-semibold text-white">{user?.name || "Welcome back"}</div>
                        <div className="mt-1 text-sm text-muted-foreground">{workspace?.name || "Workspace ready"}</div>
                        <div className="mt-4 flex flex-col gap-2">
                           <button
                              type="button"
                              onClick={() => {
                                 setMobileNavOpen(false);
                                 navigate("/settings");
                              }}
                              className="rounded-[16px] border border-white/[0.06] bg-white/[0.04] px-3 py-2 text-sm font-medium text-white transition hover:border-white/10 hover:bg-white/[0.06]"
                           >
                              Open settings
                           </button>
                           <button
                              type="button"
                              onClick={() => {
                                 setMobileNavOpen(false);
                                 setPaletteOpen(true);
                              }}
                              className="rounded-[16px] bg-gradient-gold px-3 py-2 text-sm font-semibold text-[var(--noir-900)]"
                           >
                              Ask AI
                           </button>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         ) : null}

         {(createChannelModalOpen || searchChannelsOpen) && (
            <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 px-4 py-6">
               <div ref={modalRef} className="w-full max-w-2xl rounded-[28px] border border-white/10 bg-[#070707] p-6 shadow-[0_32px_120px_rgba(0,0,0,0.65)]">
                  <div className="mb-6 flex items-center justify-between gap-3">
                     <div>
                        <h2 className="text-xl font-semibold text-white">
                           {createChannelModalOpen ? "Create a new channel" : "Search channels"}
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                           {createChannelModalOpen
                              ? "Set privacy and invite collaborators in a single tap."
                              : "Search for rooms and recent channels without leaving the page."}
                        </p>
                     </div>
                     <button onClick={() => { setCreateChannelModalOpen(false); setSearchChannelsOpen(false); }} className="text-muted-foreground transition hover:text-white">
                        <CloseIcon className="h-5 w-5" />
                     </button>
                  </div>

                  {createChannelModalOpen ? (
                     <div className="space-y-4">
                        <div className="space-y-2">
                           <label className="text-sm font-medium text-white">Channel name</label>
                           <input
                              value={channelName}
                              onChange={(e) => setChannelName(e.target.value)}
                              placeholder="e.g. product-launch"
                              className="w-full rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-gold/40"
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-sm font-medium text-white">Privacy</label>
                           <div className="grid gap-3 sm:grid-cols-2">
                              {[
                                 { value: "public", label: "Public", description: "Anyone in the workspace can join." },
                                 { value: "private", label: "Private", description: "Invite-only channel access." },
                              ].map((option) => (
                                 <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setChannelPrivacy(option.value)}
                                    className={`rounded-[18px] border px-4 py-4 text-left transition ${
                                       channelPrivacy === option.value
                                          ? "border-gold/50 bg-[rgba(249,235,174,0.1)] text-white"
                                          : "border-white/10 bg-white/[0.03] text-muted-foreground hover:border-white/20"
                                    }`}
                                 >
                                    <div className="font-medium">{option.label}</div>
                                    <div className="mt-1 text-sm text-muted-foreground">{option.description}</div>
                                 </button>
                              ))}
                           </div>
                        </div>
                        <div className="space-y-2">
                           <label className="text-sm font-medium text-white">Invite collaborators</label>
                           <textarea
                              value={invitees}
                              onChange={(e) => setInvitees(e.target.value)}
                              placeholder="Add emails or names separated by commas"
                              className="min-h-[110px] w-full rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-gold/40"
                           />
                        </div>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                           <button
                              type="button"
                              onClick={() => { setCreateChannelModalOpen(false); }}
                              className="rounded-full border border-white/10 px-5 py-3 text-sm font-medium text-muted-foreground transition hover:border-white/20 hover:text-white"
                           >
                              Cancel
                           </button>
                           <button
                              type="button"
                              onClick={createChannelNow}
                              className="rounded-full bg-gradient-gold px-5 py-3 text-sm font-semibold text-[var(--noir-900)] shadow-[0_8px_35px_rgba(249,235,174,0.24)] transition hover:-translate-y-0.5"
                           >
                              Create channel
                           </button>
                        </div>
                     </div>
                  ) : (
                     <div className="space-y-4">
                        <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-4">
                           <div className="flex items-center gap-3">
                              <SearchIcon className="h-5 w-5 text-gold" />
                              <input
                                 value={channelSearchQuery}
                                 onChange={(e) => setChannelSearchQuery(e.target.value)}
                                 placeholder="Search channels..."
                                 className="w-full bg-transparent text-white outline-none placeholder:text-muted-foreground"
                              />
                           </div>
                        </div>
                        <div className="max-h-72 space-y-3 overflow-auto pr-1">
                           {channelSearchResults.length > 0 ? (
                              channelSearchResults.map((channel) => (
                                 <button
                                    key={channel._id}
                                    onClick={() => {
                                       navigate(`/chat?channel=${channel._id}`);
                                       setSearchChannelsOpen(false);
                                    }}
                                    className="w-full rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-3 text-left text-sm text-white transition hover:border-gold/30 hover:bg-white/[0.06]"
                                 >
                                    {channel.name}
                                 </button>
                              ))
                           ) : (
                              <div className="rounded-[18px] border border-dashed border-white/10 bg-white/[0.03] px-4 py-6 text-center text-sm text-muted-foreground">
                                 No channels match your search yet.
                              </div>
                           )}
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
