import { useEffect, useRef, useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
   HiSearch,
   HiChatAlt2,
   HiSparkles,
   HiEmojiHappy,
   HiPaperAirplane,
   HiPencil,
   HiTrash,
   HiX,
   HiCheck,
   HiUser,
   HiShieldCheck,
   HiArrowLeft,
   HiArrowsExpand,
   HiGlobeAlt,
} from "react-icons/hi";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import {
   getChannels,
   createChannel,
   getMessages,
   editMessage,
   deleteMessage,
   pinMessage,
   unpinMessage,
   getPinnedMessages,
   addReaction,
   removeReaction,
} from "../../services/chatService";
import { getWorkspaceMembers } from "../../services/workspaceService";
import { getAvatarSrc } from "../../utils/avatar";
import { PageShell } from "../../components/common/PageShell";

const QUICK_EMOJIS = ["👍", "❤️", "😂", "🔥", "🎉", "✨", "🚀", "💡"];

export default function DM() {
   const { user } = useAuth();
   const socket = useSocket();
   const navigate = useNavigate();
   const [searchParams, setSearchParams] = useSearchParams();

   const [members, setMembers] = useState([]);
   const [channels, setChannels] = useState([]);
   const [activeChannel, setActiveChannel] = useState(null);
   const [activeRecipient, setActiveRecipient] = useState(null);
   const [messages, setMessages] = useState([]);
   const [pinnedMessages, setPinnedMessages] = useState([]);
   const [messageText, setMessageText] = useState("");
   const [searchQuery, setSearchQuery] = useState("");
   const [contactFilter, setContactFilter] = useState("all"); // 'all', 'online'
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState(null);

   const [typingUsers, setTypingUsers] = useState([]);
   const [onlineUserIds, setOnlineUserIds] = useState(new Set());

   const [editingMessageId, setEditingMessageId] = useState(null);
   const [editingText, setEditingText] = useState("");
   const [showPinned, setShowPinned] = useState(false);
   const [activeEmojiMenuId, setActiveEmojiMenuId] = useState(null);

   const messagesEndRef = useRef(null);
   const messageListRef = useRef(null);
   const activeChannelRef = useRef(null);
   const typingTimeoutRef = useRef(null);

   const normalizeId = (value) => (value?._id || value)?.toString();
   const isSameChannel = (a, b) => normalizeId(a) === normalizeId(b);

   useEffect(() => {
      activeChannelRef.current = activeChannel;
   }, [activeChannel]);

   // Load workspace members and existing DM channels
   const loadData = async () => {
      try {
         setLoading(true);
         const [membersRes, channelsRes] = await Promise.all([
            getWorkspaceMembers(),
            getChannels({ type: "dm" }),
         ]);

         const fetchedMembers = membersRes.data?.members || [];
         setMembers(fetchedMembers);

         const allChannels = channelsRes.data?.channels || [];
         const dmChannels = allChannels.filter((c) => c.type === "dm");
         setChannels(dmChannels);

         const channelIdParam = searchParams.get("channel");
         const userIdParam = searchParams.get("user");

         if (channelIdParam) {
            const targetChannel = dmChannels.find((c) => normalizeId(c._id) === channelIdParam);
            if (targetChannel) {
               selectDmChannel(targetChannel, fetchedMembers);
            }
         } else if (userIdParam && userIdParam !== user?._id) {
            const targetMember = fetchedMembers.find((m) => normalizeId(m.userId || m._id) === userIdParam);
            if (targetMember) {
               await startDmWithUser(targetMember, dmChannels);
            }
         }
      } catch (err) {
         setError(err.response?.data?.message || "Failed to load DM conversations");
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      loadData();
   }, []);

   const scrollToBottom = (behavior = "smooth") => {
      if (!messageListRef.current) return;
      const container = messageListRef.current;
      container.scrollTo({ top: container.scrollHeight, behavior });
   };

   useEffect(() => {
      const timer = window.setTimeout(() => scrollToBottom("smooth"), 60);
      return () => window.clearTimeout(timer);
   }, [messages, activeChannel]);

   // Socket Listeners
   useEffect(() => {
      if (!socket) return;

      socket.emit("userOnline");

      const handleNewMessage = (newMsg) => {
         if (!isSameChannel(activeChannelRef.current?._id, newMsg.channel)) return;
         setMessages((curr) => {
            if (curr.some((m) => normalizeId(m._id) === normalizeId(newMsg._id))) return curr;
            return [...curr, newMsg];
         });
      };

      const handleMessageEdited = (editedMsg) => {
         if (isSameChannel(activeChannelRef.current?._id, editedMsg.channel)) {
            setMessages((curr) => curr.map((m) => (normalizeId(m._id) === normalizeId(editedMsg._id) ? editedMsg : m)));
         }
      };

      const handleMessageDeleted = ({ messageId }) => {
         setMessages((curr) => curr.filter((m) => normalizeId(m._id) !== normalizeId(messageId)));
      };

      const handleReactionAdded = (msg) => {
         if (isSameChannel(activeChannelRef.current?._id, msg.channel)) {
            setMessages((curr) => curr.map((m) => (normalizeId(m._id) === normalizeId(msg._id) ? msg : m)));
         }
      };

      const handleReactionRemoved = (msg) => {
         if (isSameChannel(activeChannelRef.current?._id, msg.channel)) {
            setMessages((curr) => curr.map((m) => (normalizeId(m._id) === normalizeId(msg._id) ? msg : m)));
         }
      };

      const handleMessagePinned = (msg) => {
         if (isSameChannel(activeChannelRef.current?._id, msg.channel)) {
            setPinnedMessages((curr) => [...curr.filter((p) => normalizeId(p._id) !== normalizeId(msg._id)), msg]);
            setMessages((curr) => curr.map((m) => (normalizeId(m._id) === normalizeId(msg._id) ? msg : m)));
         }
      };

      const handleMessageUnpinned = ({ messageId }) => {
         setPinnedMessages((curr) => curr.filter((m) => normalizeId(m._id) !== normalizeId(messageId)));
         setMessages((curr) => curr.map((m) => (normalizeId(m._id) === normalizeId(messageId) ? { ...m, isPinned: false } : m)));
      };

      const handleTyping = ({ channelId, isTyping, user: typingUser }) => {
         if (!isSameChannel(activeChannelRef.current?._id, channelId)) return;
         if (normalizeId(typingUser.id) === normalizeId(user?._id)) return;

         setTypingUsers((curr) => {
            if (!isTyping) return curr.filter((u) => u.id !== typingUser.id);
            if (curr.some((u) => u.id === typingUser.id)) return curr;
            return [...curr, typingUser];
         });
      };

      const handlePresenceUpdate = ({ userId, status }) => {
         setOnlineUserIds((prev) => {
            const next = new Set(prev);
            if (status === "online") next.add(userId);
            else next.delete(userId);
            return next;
         });
      };

      socket.on("newMessage", handleNewMessage);
      socket.on("messageEdited", handleMessageEdited);
      socket.on("messageDeleted", handleMessageDeleted);
      socket.on("reactionAdded", handleReactionAdded);
      socket.on("reactionRemoved", handleReactionRemoved);
      socket.on("messagePinned", handleMessagePinned);
      socket.on("messageUnpinned", handleMessageUnpinned);
      socket.on("typing", handleTyping);
      socket.on("presenceUpdate", handlePresenceUpdate);

      return () => {
         socket.off("newMessage", handleNewMessage);
         socket.off("messageEdited", handleMessageEdited);
         socket.off("messageDeleted", handleMessageDeleted);
         socket.off("reactionAdded", handleReactionAdded);
         socket.off("reactionRemoved", handleReactionRemoved);
         socket.off("messagePinned", handleMessagePinned);
         socket.off("messageUnpinned", handleMessageUnpinned);
         socket.off("typing", handleTyping);
         socket.off("presenceUpdate", handlePresenceUpdate);
      };
   }, [socket, user]);

   useEffect(() => {
      if (!activeChannel || !socket) return;
      socket.emit("joinChannel", activeChannel._id);
      loadMessages(activeChannel._id);
      loadPins(activeChannel._id);
   }, [activeChannel, socket]);

   const loadMessages = async (channelId) => {
      try {
         const res = await getMessages(channelId);
         setMessages(res.data.messages || []);
      } catch (err) {
         setError("Failed to fetch messages");
      }
   };

   const loadPins = async (channelId) => {
      try {
         const res = await getPinnedMessages(channelId);
         setPinnedMessages(res.data.pinnedMessages || []);
      } catch {
         // ignore
      }
   };

   const selectDmChannel = (channel, currentMembers = members) => {
      setActiveChannel(channel);
      setShowPinned(false);
      setEditingMessageId(null);

      const otherMemberObj = channel.members?.find((m) => normalizeId(m._id || m.userId) !== normalizeId(user?._id));
      if (otherMemberObj) {
         const fullMember =
            currentMembers.find((m) => normalizeId(m.userId || m._id) === normalizeId(otherMemberObj._id || otherMemberObj.userId)) ||
            otherMemberObj;
         setActiveRecipient(fullMember);
      }

      setSearchParams({ channel: channel._id });
   };

   const backToDirectory = () => {
      setActiveChannel(null);
      setActiveRecipient(null);
      setMessages([]);
      setSearchParams({});
   };

   const startDmWithUser = async (targetMember, currentChannels = channels) => {
      const targetUserId = normalizeId(targetMember.userId || targetMember._id);
      if (!targetUserId || targetUserId === normalizeId(user?._id)) return;

      try {
         const existing = currentChannels.find(
            (c) => c.type === "dm" && c.members?.some((m) => normalizeId(m._id || m) === targetUserId)
         );

         if (existing) {
            selectDmChannel(existing);
            return;
         }

         const res = await createChannel({
            type: "dm",
            members: [user._id, targetUserId],
         });

         const newChannel = res.data.channel;
         if (newChannel) {
            setChannels((prev) => [newChannel, ...prev.filter((c) => normalizeId(c._id) !== normalizeId(newChannel._id))]);
            setActiveChannel(newChannel);
            setActiveRecipient(targetMember);
            setSearchParams({ channel: newChannel._id });
         }
      } catch (err) {
         setError(err.response?.data?.message || "Failed to start direct message");
      }
   };

   const handleInputChange = (e) => {
      const text = e.target.value;
      setMessageText(text);

      if (socket && activeChannel) {
         socket.emit("typing", {
            channelId: activeChannel._id,
            isTyping: text.trim().length > 0,
         });

         clearTimeout(typingTimeoutRef.current);
         typingTimeoutRef.current = setTimeout(() => {
            if (socket && activeChannel) {
               socket.emit("typing", {
                  channelId: activeChannel._id,
                  isTyping: false,
               });
            }
         }, 2500);
      }
   };

   const handleSendMessage = (e) => {
      e?.preventDefault();
      if (!messageText.trim() || !activeChannel || !socket) return;

      const draft = {
         _id: `temp-${Date.now()}`,
         channel: activeChannel._id,
         text: messageText.trim(),
         createdAt: new Date().toISOString(),
         user: {
            _id: user?._id,
            name: user?.name || "You",
            avatar: user?.avatar,
         },
         reactions: [],
      };

      setMessages((curr) => [...curr, draft]);
      socket.emit("sendMessage", {
         channelId: activeChannel._id,
         text: messageText.trim(),
      });
      setMessageText("");
      socket.emit("typing", { channelId: activeChannel._id, isTyping: false });
   };

   const filteredMembers = useMemo(() => {
      let otherMembers = members.filter((m) => normalizeId(m.userId || m._id) !== normalizeId(user?._id));
      if (contactFilter === "online") {
         otherMembers = otherMembers.filter((m) => onlineUserIds.has(normalizeId(m.userId || m._id)));
      }
      if (!searchQuery.trim()) return otherMembers;
      const q = searchQuery.toLowerCase();
      return otherMembers.filter(
         (m) =>
            m.name?.toLowerCase().includes(q) ||
            m.email?.toLowerCase().includes(q) ||
            m.role?.toLowerCase().includes(q)
      );
   }, [members, searchQuery, user, contactFilter, onlineUserIds]);

   // Directory Catalog View (Default)
   if (!activeRecipient) {
      return (
         <PageShell
            title="Direct Messages"
            subtitle="Connect 1-on-1 with teammates across your workspace. Click any teammate to launch full-screen chat."
            actions={
               <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-xs font-bold text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{Array.from(onlineUserIds).length} Teammates Online</span>
               </div>
            }
         >
            {error && (
               <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300">
                  {error}
               </div>
            )}

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
               <div className="flex items-center gap-1.5 bg-zinc-950 p-1.5 rounded-xl border border-zinc-800/80 w-full sm:w-auto">
                  <button
                     type="button"
                     onClick={() => setContactFilter("all")}
                     className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        contactFilter === "all" ? "bg-[#f9ebae] text-zinc-950 shadow" : "text-zinc-400 hover:text-white"
                     }`}
                  >
                     All Teammates ({members.length - 1})
                  </button>
                  <button
                     type="button"
                     onClick={() => setContactFilter("online")}
                     className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        contactFilter === "online" ? "bg-emerald-500 text-zinc-950 shadow" : "text-zinc-400 hover:text-white"
                     }`}
                  >
                     🟢 Online Now ({Array.from(onlineUserIds).length})
                  </button>
               </div>

               <div className="relative w-full sm:w-80">
                  <HiSearch className="absolute left-3.5 top-2.5 text-zinc-500" size={14} />
                  <input
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     placeholder="Search teammates by name, email..."
                     className="w-full pl-9 pr-4 py-1.5 rounded-xl border border-zinc-800 bg-zinc-950 text-xs text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-[#f9ebae] transition"
                  />
               </div>
            </div>

            {/* Teammates Cards Grid */}
            {loading ? (
               <div className="py-20 text-center text-xs text-zinc-500 flex flex-col items-center gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#f9ebae] border-t-transparent" />
                  <span>Loading workspace directory…</span>
               </div>
            ) : filteredMembers.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredMembers.map((member) => {
                     const memberId = normalizeId(member.userId || member._id);
                     const avatarSrc = getAvatarSrc(member);
                     const isOnline = onlineUserIds.has(memberId);

                     return (
                        <div
                           key={memberId}
                           className="group p-5 rounded-2xl border border-zinc-800/80 bg-zinc-950/70 hover:border-[#f9ebae]/40 hover:bg-zinc-900/60 transition flex flex-col justify-between space-y-4 shadow-xl"
                        >
                           <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3.5 min-w-0">
                                 <div className="relative shrink-0">
                                    <img
                                       src={avatarSrc}
                                       alt={member.name || member.email}
                                       className="h-12 w-12 rounded-2xl border border-zinc-800 object-cover shadow-md"
                                    />
                                    <span
                                       className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-zinc-950 ${
                                          isOnline ? "bg-emerald-500 animate-pulse" : "bg-zinc-600"
                                       }`}
                                    />
                                 </div>

                                 <div className="min-w-0">
                                    <h3 className="font-bold text-sm text-zinc-100 group-hover:text-[#f9ebae] transition truncate">
                                       {member.name || member.email}
                                    </h3>
                                    <p className="text-xs text-zinc-400 truncate mt-0.5">{member.email}</p>
                                 </div>
                              </div>

                              <span
                                 className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border shrink-0 ${
                                    isOnline ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "bg-zinc-900 text-zinc-500 border-zinc-800"
                                 }`}
                              >
                                 {isOnline ? "Online" : "Away"}
                              </span>
                           </div>

                           <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80 text-xs">
                              <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                                 {member.role || "Member"}
                              </span>

                              <button
                                 type="button"
                                 onClick={() => startDmWithUser(member)}
                                 className="py-1.5 px-3.5 bg-[#f9ebae] hover:bg-[#e6d695] text-zinc-950 rounded-xl transition font-bold text-xs flex items-center gap-1 shadow-md shadow-[#f9ebae]/10"
                              >
                                 <HiArrowsExpand size={13} />
                                 <span>Focus Chat</span>
                              </button>
                           </div>
                        </div>
                     );
                  })}
               </div>
            ) : (
               <div className="text-center py-20 rounded-2xl border border-zinc-800/80 bg-zinc-950/40 p-6 space-y-3">
                  <HiUser className="mx-auto text-zinc-600" size={44} />
                  <h3 className="text-base font-bold text-zinc-200">No teammates found</h3>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                     Invite colleagues to your workspace to start direct 1-on-1 messaging.
                  </p>
               </div>
            )}
         </PageShell>
      );
   }

   // Full-Screen Dedicated DM View
   return (
      <div className="fixed inset-0 z-50 bg-[#09090b] text-zinc-100 flex flex-col overflow-hidden">
         {/* Top Header Bar */}
         <header className="h-16 border-b border-zinc-800/80 bg-zinc-950/90 px-4 sm:px-6 flex items-center justify-between gap-4 backdrop-blur-xl shrink-0">
            <div className="flex items-center gap-3 min-w-0 flex-1">
               <button
                  type="button"
                  onClick={backToDirectory}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-xs font-bold text-zinc-300 transition shrink-0"
               >
                  <HiArrowLeft size={16} />
                  <span className="hidden sm:inline">Back to Direct Messages</span>
               </button>

               <div className="h-4 w-px bg-zinc-800 hidden sm:block" />

               <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                     <img
                        src={getAvatarSrc(activeRecipient)}
                        alt={activeRecipient.name}
                        className="h-10 w-10 rounded-xl border border-zinc-800 object-cover"
                     />
                     <span
                        className={`absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-zinc-950 ${
                           onlineUserIds.has(normalizeId(activeRecipient.userId || activeRecipient._id))
                              ? "bg-emerald-500 animate-pulse"
                              : "bg-zinc-600"
                        }`}
                     />
                  </div>

                  <div className="min-w-0">
                     <h3 className="truncate text-sm font-bold text-zinc-100">
                        {activeRecipient.name || activeRecipient.email}
                     </h3>
                     <p className="text-xs text-emerald-400 font-medium truncate">
                        {onlineUserIds.has(normalizeId(activeRecipient.userId || activeRecipient._id)) ? "🟢 Online now" : "Away"}
                     </p>
                  </div>
               </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center gap-2 shrink-0">
               {pinnedMessages.length > 0 && (
                  <button
                     type="button"
                     onClick={() => setShowPinned(!showPinned)}
                     className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-accent/40 bg-accent-soft text-accent text-xs font-bold transition hover:bg-accent/20"
                  >
                     <span>📌 {pinnedMessages.length} Pinned</span>
                  </button>
               )}

               <button
                  type="button"
                  onClick={() => navigate("/people")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white transition text-xs font-semibold"
               >
                  <HiUser size={14} />
                  <span className="hidden sm:inline">Profile</span>
               </button>
            </div>
         </header>

         {/* Pinned Messages Drawer */}
         {showPinned && pinnedMessages.length > 0 && (
            <div className="bg-zinc-950 border-b border-zinc-800 p-4 space-y-2 shrink-0">
               <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#f9ebae]">📌 Pinned Direct Messages</span>
                  <button onClick={() => setShowPinned(false)} className="text-zinc-400 hover:text-white"><HiX size={16} /></button>
               </div>
               <div className="max-h-36 overflow-y-auto space-y-2">
                  {pinnedMessages.map((msg) => (
                     <div key={msg._id} className="p-2 rounded-xl border border-zinc-800 bg-zinc-900/60 text-xs flex justify-between items-center gap-3">
                        <span className="truncate text-zinc-300"><strong className="text-zinc-100">{msg.user?.name}:</strong> {msg.text}</span>
                        <button onClick={() => unpinMessage(msg._id)} className="text-[10px] text-[#f9ebae] font-bold shrink-0 hover:underline">Unpin</button>
                     </div>
                  ))}
               </div>
            </div>
         )}

         {/* Typing Indicator Bar */}
         {typingUsers.length > 0 && (
            <div className="bg-[#f9ebae]/10 border-b border-[#f9ebae]/20 px-5 py-2 text-xs text-[#f9ebae] font-semibold animate-pulse shrink-0">
               <span>⚡ {activeRecipient.name || "Teammate"} is typing a reply…</span>
            </div>
         )}

         {/* Main DM Messages Body */}
         <div ref={messageListRef} className="flex-1 min-h-0 p-4 sm:p-6 overflow-y-auto space-y-4 saas-grid-bg">
            {messages.length > 0 ? (
               messages.filter((m) => !m.isDeleted).map((msg) => {
                  const isMe = normalizeId(msg.user?._id || msg.user) === normalizeId(user?._id);

                  return (
                     <div key={msg._id} className={`group flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                        <div className="mb-1 flex items-center gap-2 text-[10px] text-zinc-500">
                           <span className="font-bold text-zinc-300">{isMe ? "You" : msg.user?.name || activeRecipient.name}</span>
                           <span>•</span>
                           <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>

                        <div className={`relative max-w-[85%] sm:max-w-[70%] p-3.5 rounded-2xl text-xs leading-relaxed shadow-xl ${
                           isMe ? "bg-[#f9ebae] text-zinc-950 font-medium rounded-tr-xs" : "bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-tl-xs"
                        }`}>
                           {msg.text}
                        </div>
                     </div>
                  );
               })
            ) : (
               <div className="py-20 text-center text-xs text-zinc-500">No messages yet. Send a direct message below!</div>
            )}
            <div ref={messagesEndRef} />
         </div>

         {/* DM Input Footer Bar */}
         <footer className="p-4 border-t border-zinc-800/80 bg-zinc-950/90 shrink-0">
            <form onSubmit={handleSendMessage} className="flex gap-2 max-w-5xl mx-auto">
               <input
                  value={messageText}
                  onChange={handleInputChange}
                  placeholder={`Message ${activeRecipient.name || activeRecipient.email}...`}
                  className="flex-1 bg-zinc-900 border border-zinc-800 px-4 py-3 rounded-2xl text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-[#f9ebae] shadow-inner transition"
               />
               <button
                  type="submit"
                  disabled={!messageText.trim()}
                  className="px-5 py-3 bg-[#f9ebae] hover:bg-[#e6d695] text-zinc-950 text-xs font-extrabold rounded-2xl shadow-md shadow-[#f9ebae]/20 transition disabled:opacity-50"
               >
                  Send
               </button>
            </form>
         </footer>
      </div>
   );
}
