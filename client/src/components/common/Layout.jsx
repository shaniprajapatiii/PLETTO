import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
   HiViewGrid as DashboardIcon,
   HiDocumentText as DocsIcon,
   HiChatAlt2 as ChatIcon,
   HiViewBoards as WhiteboardIcon,
   HiUsers as PeopleIcon,
   HiCog as SettingsIcon,
   HiBell as BellIcon,
   HiPlus as PlusIcon,
   HiSearch as SearchIcon,
   HiSparkles as SparklesIcon,
   HiX as CloseIcon,
   HiHashtag as HashIcon,
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
   { label: "People", to: "/people", icon: PeopleIcon },
   { label: "Whiteboard", to: "/whiteboard", icon: WhiteboardIcon },
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
   const [notifOpen, setNotifOpen] = useState(false);
   const [channels, setChannels] = useState([]);
   const [notifications, setNotifications] = useState(starterNotifications);
   const [createChannelModalOpen, setCreateChannelModalOpen] = useState(false);
   const [searchChannelsOpen, setSearchChannelsOpen] = useState(false);
   const [channelName, setChannelName] = useState("");
   const [channelPrivacy, setChannelPrivacy] = useState("public");
   const [invitees, setInvitees] = useState("");
   const [channelSearchQuery, setChannelSearchQuery] = useState("");
   const [dockHidden, setDockHidden] = useState(false);
   const [showChatFlyout, setShowChatFlyout] = useState(false);
   const notifRef = useRef(null);
   const modalRef = useRef(null);
   const scrollYRef = useRef(0);

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
         if (notifRef.current && !notifRef.current.contains(event.target)) {
            setNotifOpen(false);
         }
         if (modalRef.current && !modalRef.current.contains(event.target) && (createChannelModalOpen || searchChannelsOpen)) {
            setCreateChannelModalOpen(false);
            setSearchChannelsOpen(false);
         }
      };

      const onScroll = () => {
         const currentY = window.scrollY;
         if (currentY > scrollYRef.current + 12) {
            setDockHidden(true);
         } else if (currentY < scrollYRef.current - 1) {
            setDockHidden(false);
         }
         scrollYRef.current = currentY;
      };

      const onMouseMove = (event) => {
         if (window.innerHeight - event.clientY < 120) {
            setDockHidden(false);
         }
      };

      window.addEventListener("mousedown", onClick);
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("mousemove", onMouseMove);
      return () => {
         window.removeEventListener("mousedown", onClick);
         window.removeEventListener("scroll", onScroll);
         window.removeEventListener("mousemove", onMouseMove);
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
         }
      };

      window.addEventListener("keydown", onKeyDown);
      return () => window.removeEventListener("keydown", onKeyDown);
   }, []);

   const unreadCount = useMemo(() => notifications.filter((item) => !item.read).length, [notifications]);
   const title = navItems.find((item) => location.pathname.startsWith(item.to))?.label ?? "Workspace";
   const breadCrumbs = location.pathname.split("/").filter(Boolean);

   const handleSignOut = () => {
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
         <div className="flex min-h-screen flex-col">
            <header className="flex h-16 items-center gap-3 border-b border-white/8 bg-gradient-to-r from-[rgba(6,6,6,0.95)] via-[rgba(8,8,8,0.92)] to-[rgba(6,6,6,0.95)] px-4 shadow-[0_12px_42px_rgba(0,0,0,0.2)] backdrop-blur-2xl transition sm:px-6">
               <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-gold/80 font-semibold">
                     <span>PLETTO</span>
                     {breadCrumbs.map((segment, index) => (
                        <span key={`${segment}-${index}`} className="flex items-center gap-2">
                           <span className="text-white/30">/</span>
                           <span className={index === breadCrumbs.length - 1 ? "text-white" : "text-muted-foreground"}>
                              {segment}
                           </span>
                        </span>
                     ))}
                  </div>
                  <h1 className="mt-0.5 text-[1rem] font-semibold text-white">{title}</h1>
               </div>

               <div className="hidden items-center gap-2 md:flex">
                  <PresenceStack />
               </div>

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

               <button
                  onClick={() => setPaletteOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-gold px-3 py-2 text-sm font-semibold text-[var(--noir-900)] shadow-[0_4px_16px_rgba(245,181,50,0.25)] transition hover:-translate-y-0.5 hover:shadow-[0_6px_24px_rgba(245,181,50,0.35)]"
               >
                  <SparklesIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Ask AI</span>
               </button>
            </header>

            <main className="flex-1 overflow-auto bg-[#050505] p-4 sm:p-5 lg:p-6">
               <Outlet />
            </main>
         </div>

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
                                          ? "border-gold/50 bg-[rgba(245,181,50,0.1)] text-white"
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
                              className="rounded-full bg-gradient-gold px-5 py-3 text-sm font-semibold text-[var(--noir-900)] shadow-[0_8px_35px_rgba(245,181,50,0.24)] transition hover:-translate-y-0.5"
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

         <div className={`fixed bottom-5 left-1/2 z-40 flex w-[min(92vw,880px)] -translate-x-1/2 items-center justify-between gap-2 rounded-full border border-gold/60 bg-[#020202] bg-opacity-95 px-4 py-3 shadow-[0_28px_80px_rgba(0,0,0,0.45)] transition-transform duration-300 ${dockHidden ? "translate-y-[140%]" : "translate-y-0"}`}>
            <button onClick={() => navigate("/dashboard")} className="flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.04] text-gold transition hover:bg-white/[0.08]">
               <Logo withText={false} className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2">
               {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = location.pathname.startsWith(item.to);
                  return (
                     <button
                        key={item.to}
                        onClick={() => navigate(item.to)}
                        onMouseEnter={item.to === "/chat" ? () => setShowChatFlyout(true) : undefined}
                        onMouseLeave={item.to === "/chat" ? () => setShowChatFlyout(false) : undefined}
                        className={`relative flex h-11 w-11 items-center justify-center rounded-full transition ${
                           active
                              ? "bg-gold/15 text-gold shadow-[0_0_0_1px_rgba(245,181,50,0.18)]"
                              : "text-muted-foreground hover:bg-white/[0.08] hover:text-white"
                        }`}
                     >
                        <Icon className="h-5 w-5" />
                        {item.to === "/chat" && channels.length > 0 ? (
                           <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-semibold text-white shadow-[0_0_0_4px_rgba(0,0,0,0.25)]">
                              {channels.length}
                           </span>
                        ) : null}
                        {item.to === "/chat" && showChatFlyout ? (
                           <div className="absolute bottom-full mb-2 w-[220px] rounded-3xl border border-white/10 bg-[#080808] p-3 text-sm shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
                              <div className="mb-3 text-xs uppercase tracking-[0.24em] text-muted-foreground">Recent rooms</div>
                              <div className="space-y-2">
                                 {channels.slice(0, 4).map((channel) => (
                                    <button
                                       key={channel._id}
                                       onClick={() => {
                                          navigate(`/chat?channel=${channel._id}`);
                                          setShowChatFlyout(false);
                                       }}
                                       className="flex w-full items-center gap-2 rounded-[18px] border border-white/10 bg-white/[0.03] px-3 py-2 text-left text-sm text-white transition hover:border-gold/30 hover:bg-white/[0.06]"
                                    >
                                       <HashIcon className="h-4 w-4 text-gold" />
                                       <span className="truncate">{channel.name}</span>
                                    </button>
                                 ))}
                                 {channels.length === 0 ? (
                                    <div className="rounded-[18px] border border-dashed border-white/10 bg-white/[0.03] px-3 py-4 text-center text-sm text-muted-foreground">
                                       No recent channels yet.
                                    </div>
                                 ) : null}
                              </div>
                           </div>
                        ) : null}
                     </button>
                  );
               })}

               <button
                  onClick={() => setSearchChannelsOpen(true)}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-muted-foreground transition hover:bg-white/[0.08] hover:text-white"
               >
                  <SearchIcon className="h-5 w-5" />
               </button>
               <button
                  onClick={() => setCreateChannelModalOpen(true)}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-muted-foreground transition hover:bg-white/[0.08] hover:text-white"
               >
                  <PlusIcon className="h-5 w-5" />
               </button>
            </div>

            <button
               onClick={() => navigate("/settings")}
               className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-muted-foreground transition hover:bg-white/[0.08] hover:text-white"
            >
               <SettingsIcon className="h-5 w-5" />
            </button>
         </div>

         <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      </div>
   );
}
