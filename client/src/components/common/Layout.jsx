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

   useEffect(() => {
      if (loading || !workspace) return;
      const loadChannels = async () => {
         try {
            const response = await getChannels();
            setChannels(response.data.channels || []);
         } catch {
            setChannels([]);
         }
      };
      loadChannels();
   }, [loading, workspace]);

   useEffect(() => {
      setMobileOpen(false);
      setNotifOpen(false);
      setCreateOpen(false);
   }, [location.pathname]);

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

   const unreadCount = useMemo(() => notifications.filter((item) => !item.read).length, [notifications]);
   const title = navItems.find((item) => location.pathname.startsWith(item.to))?.label ?? "Workspace";
   const breadCrumbs = location.pathname.split("/").filter(Boolean);
   const initials = (user?.name || user?.email || "?").slice(0, 2).toUpperCase();

   const sidebarContent = (
      <>
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

         {!sidebarCollapsed ? (
            <div className="p-3">
               <button
                  onClick={() => setPaletteOpen(true)}
                  className="flex w-full items-center gap-2 rounded-[16px] border border-white/10 bg-white/[0.03] px-3 py-2.5 text-left text-sm text-muted-foreground transition hover:border-gold/30 hover:bg-white/[0.05] hover:text-white"
               >
                  <SearchIcon className="h-4 w-4 text-gold" />
                  Jump to anything
                  <span className="ml-auto rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-gold">⌘K</span>
               </button>
            </div>
         ) : (
            <div className="flex justify-center p-3">
               <button onClick={() => setPaletteOpen(true)} className="grid h-10 w-10 place-items-center rounded-[14px] border border-white/10 bg-white/[0.03] text-gold transition hover:border-gold/30 hover:bg-white/[0.05]">
                  <SearchIcon className="h-4 w-4" />
               </button>
            </div>
         )}

         <nav className="flex-1 space-y-1 overflow-y-auto px-2 pb-3">
            {!sidebarCollapsed ? <div className="px-2 pb-2 pt-2 text-[10px] uppercase tracking-[0.24em] text-muted-foreground/70">Workspace</div> : null}
            {navItems.map((item) => {
               const Icon = item.icon;
               const active = location.pathname.startsWith(item.to);
               return (
                  <Link
                     key={item.to}
                     to={item.to}
                     title={sidebarCollapsed ? item.label : undefined}
                     className={`flex items-center rounded-[14px] border px-3 py-2.25 text-sm transition ${active ? "border-gold/30 bg-[rgba(245,181,50,0.12)] text-white shadow-[0_0_0_1px_rgba(245,181,50,0.12)]" : "border-transparent text-muted-foreground hover:border-white/10 hover:bg-white/[0.04] hover:text-white"} ${sidebarCollapsed ? "justify-center px-2 py-2.5" : "gap-2.5"}`}
                  >
                     <Icon className="h-4 w-4" />
                     {!sidebarCollapsed ? item.label : null}
                     {active && !sidebarCollapsed ? <span className="ml-auto h-2 w-2 rounded-full bg-gold" /> : null}
                  </Link>
               );
            })}

            {!sidebarCollapsed ? (
               <div className="flex items-center justify-between px-2 pb-2 pt-5">
                  <div className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground/70">Channels</div>
                  <button onClick={handleCreateChannel} className="rounded-full border border-white/10 p-1 text-muted-foreground transition hover:border-gold/30 hover:text-gold">
                     <PlusIcon className="h-3.5 w-3.5" />
                  </button>
               </div>
            ) : null}
            {channels.length > 0 ? (
               channels.map((channel) => (
                  <button
                     key={channel._id}
                     type="button"
                     onClick={() => navigate(`/chat?channel=${channel._id}`)}
                     title={sidebarCollapsed ? channel.name : undefined}
                     className={`flex w-full items-center rounded-[14px] px-3 py-2 text-sm text-muted-foreground transition hover:bg-white/[0.04] hover:text-white ${sidebarCollapsed ? "justify-center px-2" : "gap-2"}`}
                  >
                     <HashIcon className="h-3.5 w-3.5 text-gold/70" />
                     {!sidebarCollapsed ? channel.name : null}
                  </button>
               ))
            ) : (
               !sidebarCollapsed ? (
                  <div className="rounded-[14px] border border-dashed border-white/10 bg-white/[0.03] px-3 py-4 text-sm text-muted-foreground">
                     Create your first channel to start collaborating.
                  </div>
               ) : null
            )}
         </nav>

         <div className="border-t border-white/10 p-3">
            <div className={`flex items-center rounded-[16px] border border-white/10 bg-white/[0.035] p-3 ${sidebarCollapsed ? "justify-center" : "gap-3"}`}>
               <Link to="/profile" className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-gold text-[11px] font-semibold text-[var(--noir-900)]">
                  {initials}
               </Link>
               {!sidebarCollapsed ? (
                  <>
                     <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-white">{user?.name || "You"}</div>
                        <div className="truncate text-xs text-muted-foreground">{user?.email}</div>
                     </div>
                     <button onClick={handleSignOut} className="rounded-full border border-white/10 p-2 text-muted-foreground transition hover:border-gold/30 hover:text-gold">
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
         <aside className={`hidden flex-col border-r border-white/10 bg-[rgba(5,5,5,0.96)] md:flex ${sidebarCollapsed ? "w-[74px]" : "w-[256px]"}`}>
            {sidebarContent}
         </aside>

         {mobileOpen ? (
            <div className="fixed inset-0 z-50 flex md:hidden">
               <div className="absolute inset-0 bg-[rgba(2,2,2,0.72)]" onClick={() => setMobileOpen(false)} />
               <aside className="relative flex w-[280px] max-w-[85vw] flex-col border-r border-white/10 bg-[#060606] animate-[fadeIn_180ms_ease-out]">
                  {sidebarContent}
               </aside>
            </div>
         ) : null}

         <div className="flex min-w-0 flex-1 flex-col">
            <header className="flex h-16 items-center gap-2 border-b border-white/10 bg-[rgba(6,6,6,0.92)] px-3 shadow-[0_12px_42px_rgba(0,0,0,0.2)] backdrop-blur-2xl sm:px-5">
               <button onClick={() => setSidebarCollapsed((value) => !value)} className="hidden rounded-full border border-white/10 bg-white/[0.03] p-2 text-muted-foreground transition hover:border-gold/30 hover:text-white md:inline-flex">
                  <ChevronLeftIcon className={`h-4 w-4 transition ${sidebarCollapsed ? "rotate-180" : ""}`} />
               </button>
               <button onClick={() => setMobileOpen(true)} className="rounded-full border border-white/10 bg-white/[0.03] p-2 text-muted-foreground transition hover:border-gold/30 hover:text-white md:hidden">
                  <MenuIcon className="h-4 w-4" />
               </button>

               <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-gold">
                     <span className="font-semibold">PLETTO</span>
                     {breadCrumbs.map((segment, index) => (
                        <span key={segment} className="flex items-center gap-2">
                           <ChevronRightIcon className="h-3 w-3" />
                           <span className={index === breadCrumbs.length - 1 ? "text-white" : "text-muted-foreground"}>{segment}</span>
                        </span>
                     ))}
                  </div>
                  <h1 className="mt-0.5 text-[1rem] font-semibold text-white">{title}</h1>
               </div>

               <div className="hidden items-center gap-2 md:flex">
                  <PresenceStack />
               </div>

               <div ref={notifRef} className="relative">
                  <button onClick={() => setNotifOpen((value) => !value)} className="relative rounded-full border border-white/10 bg-white/[0.03] p-2 text-muted-foreground transition hover:border-gold/30 hover:text-white">
                     <BellIcon className="h-4 w-4" />
                     {unreadCount > 0 ? <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-gold px-1 text-[9px] font-semibold text-[var(--noir-900)]">{unreadCount}</span> : null}
                  </button>
                  {notifOpen ? (
                     <div className="absolute right-0 mt-2 w-80 rounded-[18px] border border-white/10 bg-[#070707] p-2 shadow-soft">
                        <div className="flex items-center justify-between px-2 py-2">
                           <div className="text-xs uppercase tracking-[0.2em] text-gold">Notifications</div>
                           <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                              {unreadCount > 0 ? <button onClick={markAllRead}>Mark read</button> : null}
                              <button onClick={clearAll}>Clear</button>
                           </div>
                        </div>
                        {notifications.length > 0 ? (
                           <div className="space-y-2">
                              {notifications.map((notification) => (
                                 <button key={notification.id} onClick={() => openNotification(notification)} className={`w-full rounded-[14px] border px-3 py-3 text-left transition ${notification.read ? "border-white/10 bg-white/[0.03]" : "border-gold/30 bg-[rgba(245,181,50,0.08)]"}`}>
                                    <div className="text-sm font-medium text-white">{notification.title}</div>
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

               <div ref={createRef} className="relative">
                  <button onClick={() => setCreateOpen((value) => !value)} className="rounded-full border border-white/10 bg-white/[0.03] p-2 text-muted-foreground transition hover:border-gold/30 hover:text-white">
                     <PlusIcon className="h-4 w-4" />
                  </button>
                  {createOpen ? (
                     <div className="absolute right-0 mt-2 w-56 rounded-[18px] border border-white/10 bg-[#070707] p-2 shadow-soft">
                        {[
                           { label: "New document", action: handleCreateDoc },
                           { label: "New channel", action: handleCreateChannel },
                           { label: "New whiteboard", action: handleCreateBoard },
                        ].map((item) => (
                           <button key={item.label} onClick={() => { item.action(); setCreateOpen(false); }} className="flex w-full items-center justify-between rounded-[14px] px-3 py-2.5 text-left text-sm text-muted-foreground transition hover:bg-[rgba(245,181,50,0.08)] hover:text-white">
                              <span>{item.label}</span>
                              <ChevronRightIcon className="h-4 w-4" />
                           </button>
                        ))}
                     </div>
                  ) : null}
               </div>

               <button
                  onClick={() => setPaletteOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-gold px-3 py-2 text-sm font-semibold text-[var(--noir-900)] transition hover:-translate-y-0.5"
               >
                  <SparklesIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Ask AI</span>
               </button>
            </header>

            <main className="flex-1 overflow-auto bg-[#050505] p-3 sm:p-4 lg:p-5">
               <Outlet />
            </main>
         </div>

         <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      </div>
   );
}
