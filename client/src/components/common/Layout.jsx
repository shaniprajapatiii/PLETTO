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
      return <div className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top_left,rgba(248,181,0,0.12),transparent_22%),#020617] text-sm text-muted-foreground">Connecting your workspace…</div>;
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
         <div className="flex items-center justify-between gap-2 border-b border-border/70 px-4 py-4">
            <Link to="/" className="flex items-center gap-2">
               <Logo />
            </Link>
            <button onClick={() => setMobileOpen(false)} className="rounded-full border border-border p-2 text-muted-foreground transition hover:border-gold/40 hover:text-white md:hidden">
               <CloseIcon className="h-4 w-4" />
            </button>
         </div>

         <div className="p-3">
            <button
               onClick={() => setPaletteOpen(true)}
               className="flex w-full items-center gap-2 rounded-2xl border border-border bg-[rgba(255,255,255,0.04)] px-3 py-2 text-left text-sm text-muted-foreground transition hover:border-gold/40 hover:text-white"
            >
               <SearchIcon className="h-4 w-4 text-gold" />
               Jump to anything
               <span className="ml-auto rounded-full border border-border px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-gold">⌘K</span>
            </button>
         </div>

         <nav className="flex-1 space-y-1 overflow-y-auto px-2 pb-3">
            <div className="px-2 pb-2 pt-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">Workspace</div>
            {navItems.map((item) => {
               const Icon = item.icon;
               const active = location.pathname.startsWith(item.to);
               return (
                  <Link
                     key={item.to}
                     to={item.to}
                     className={`flex items-center gap-2.5 rounded-2xl border px-3 py-2.5 text-sm transition ${active ? "border-gold/30 bg-[rgba(248,181,0,0.12)] text-white" : "border-transparent text-muted-foreground hover:border-border hover:bg-[rgba(255,255,255,0.04)] hover:text-white"}`}
                  >
                     <Icon className="h-4 w-4" />
                     {item.label}
                     {active ? <span className="ml-auto h-2 w-2 rounded-full bg-gold" /> : null}
                  </Link>
               );
            })}

            <div className="flex items-center justify-between px-2 pb-2 pt-6">
               <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">Channels</div>
               <button onClick={handleCreateChannel} className="rounded-full border border-border p-1 text-muted-foreground transition hover:border-gold/40 hover:text-gold">
                  <PlusIcon className="h-3.5 w-3.5" />
               </button>
            </div>
            {channels.length > 0 ? (
               channels.map((channel) => (
                  <button
                     key={channel._id}
                     type="button"
                     onClick={() => navigate(`/chat?channel=${channel._id}`)}
                     className="flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-sm text-muted-foreground transition hover:bg-[rgba(255,255,255,0.04)] hover:text-white"
                  >
                     <HashIcon className="h-3.5 w-3.5 text-gold/70" />
                     {channel.name}
                  </button>
               ))
            ) : (
               <div className="rounded-2xl border border-dashed border-border/70 bg-[rgba(255,255,255,0.03)] px-3 py-4 text-sm text-muted-foreground">
                  Create your first channel to start collaborating.
               </div>
            )}
         </nav>

         <div className="border-t border-border/70 p-3">
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-[rgba(255,255,255,0.04)] p-3">
               <Link to="/profile" className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-gold text-[11px] font-semibold text-[var(--noir-900)]">
                  {initials}
               </Link>
               <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-white">{user?.name || "You"}</div>
                  <div className="truncate text-xs text-muted-foreground">{user?.email}</div>
               </div>
               <button onClick={handleSignOut} className="rounded-full border border-border p-2 text-muted-foreground transition hover:border-gold/40 hover:text-gold">
                  <LogoutIcon className="h-4 w-4" />
               </button>
            </div>
         </div>
      </>
   );

   return (
      <div className="flex min-h-screen bg-[radial-gradient(circle_at_bottom_right,rgba(248,181,0,0.1),transparent_30%),#020617] text-slate-100">
         <aside className="hidden w-[250px] flex-col border-r border-border/70 bg-[rgba(2,6,23,0.95)] md:flex">
            {sidebarContent}
         </aside>

         {mobileOpen ? (
            <div className="fixed inset-0 z-50 flex md:hidden">
               <div className="absolute inset-0 bg-[rgba(2,6,23,0.7)]" onClick={() => setMobileOpen(false)} />
               <aside className="relative flex w-[280px] max-w-[85vw] flex-col border-r border-border/70 bg-[rgba(2,6,23,0.98)] animate-[fadeIn_180ms_ease-out]">
                  {sidebarContent}
               </aside>
            </div>
         ) : null}

         <div className="flex min-w-0 flex-1 flex-col">
            <header className="flex h-16 items-center gap-2 border-b border-border/70 bg-[rgba(2,6,23,0.76)] px-3 backdrop-blur-xl sm:px-5">
               <button onClick={() => setMobileOpen(true)} className="rounded-full border border-border bg-[rgba(255,255,255,0.04)] p-2 text-muted-foreground transition hover:border-gold/40 hover:text-white md:hidden">
                  <MenuIcon className="h-4 w-4" />
               </button>

               <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-gold">
                     <span>pletto</span>
                     {breadCrumbs.map((segment, index) => (
                        <span key={segment} className="flex items-center gap-2">
                           <ChevronRightIcon className="h-3 w-3" />
                           <span className={index === breadCrumbs.length - 1 ? "text-white" : "text-muted-foreground"}>{segment}</span>
                        </span>
                     ))}
                  </div>
                  <h1 className="mt-1 text-lg font-semibold text-white">{title}</h1>
               </div>

               <div className="hidden items-center gap-2 md:flex">
                  <PresenceStack />
               </div>

               <div ref={notifRef} className="relative">
                  <button onClick={() => setNotifOpen((value) => !value)} className="relative rounded-full border border-border bg-[rgba(255,255,255,0.04)] p-2 text-muted-foreground transition hover:border-gold/40 hover:text-white">
                     <BellIcon className="h-4 w-4" />
                     {unreadCount > 0 ? <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-gold px-1 text-[9px] font-semibold text-[var(--noir-900)]">{unreadCount}</span> : null}
                  </button>
                  {notifOpen ? (
                     <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-border bg-[rgba(2,6,23,0.96)] p-2 shadow-soft">
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
                                 <button key={notification.id} onClick={() => openNotification(notification)} className={`w-full rounded-2xl border px-3 py-3 text-left transition ${notification.read ? "border-border bg-[rgba(255,255,255,0.03)]" : "border-gold/30 bg-[rgba(248,181,0,0.08)]"}`}>
                                    <div className="text-sm font-medium text-white">{notification.title}</div>
                                    <div className="mt-1 text-xs text-muted-foreground">{notification.body}</div>
                                 </button>
                              ))}
                           </div>
                        ) : (
                           <div className="rounded-2xl border border-dashed border-border/70 bg-[rgba(255,255,255,0.03)] px-3 py-5 text-center text-sm text-muted-foreground">
                              You are all caught up.
                           </div>
                        )}
                     </div>
                  ) : null}
               </div>

               <div ref={createRef} className="relative">
                  <button onClick={() => setCreateOpen((value) => !value)} className="rounded-full border border-border bg-[rgba(255,255,255,0.04)] p-2 text-muted-foreground transition hover:border-gold/40 hover:text-white">
                     <PlusIcon className="h-4 w-4" />
                  </button>
                  {createOpen ? (
                     <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-border bg-[rgba(2,6,23,0.96)] p-2 shadow-soft">
                        {[
                           { label: "New document", action: handleCreateDoc },
                           { label: "New channel", action: handleCreateChannel },
                           { label: "New whiteboard", action: handleCreateBoard },
                        ].map((item) => (
                           <button key={item.label} onClick={() => { item.action(); setCreateOpen(false); }} className="flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-left text-sm text-muted-foreground transition hover:bg-[rgba(248,181,0,0.08)] hover:text-white">
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

            <main className="flex-1 overflow-auto p-4 sm:p-6">
               <Outlet />
            </main>
         </div>

         <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      </div>
   );
}
