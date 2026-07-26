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
   HiDotsVertical,
   HiBadgeCheck,
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

   const normalizeId = (value) => value?.toString();
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
               setLoading(false);
               return;
            }
         }

         if (userIdParam && userIdParam !== user?._id) {
            const targetMember = fetchedMembers.find((m) => normalizeId(m.userId || m._id) === userIdParam);
            if (targetMember) {
               await startDmWithUser(targetMember, dmChannels);
               setLoading(false);
               return;
            }
         }

         if (dmChannels.length > 0) {
            selectDmChannel(dmChannels[0], fetchedMembers);
         } else {
            const otherMembers = fetchedMembers.filter((m) => normalizeId(m.userId || m._id) !== normalizeId(user?._id));
            if (otherMembers.length > 0) {
               await startDmWithUser(otherMembers[0], dmChannels);
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
            const tempIndex = curr.findIndex(
               (m) =>
                  typeof m._id === "string" &&
                  m._id.startsWith("temp-") &&
                  m.text === newMsg.text &&
                  normalizeId(m.user?._id || m.user) === normalizeId(newMsg.user?._id || newMsg.user)
            );
            if (tempIndex >= 0) {
               const next = [...curr];
               next[tempIndex] = newMsg;
               return next;
            }
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
            setPinnedMessages((curr) => [...curr.filter(p => p._id !== msg._id), msg]);
            setMessages((curr) => curr.map((m) => (normalizeId(m._id) === normalizeId(msg._id) ? msg : m)));
         }
      };

      const handleMessageUnpinned = ({ messageId }) => {
         setPinnedMessages((curr) => curr.filter((m) => normalizeId(m._id) !== normalizeId(messageId)));
         setMessages((curr) => curr.map((m) => (normalizeId(m._id) === normalizeId(messageId) ? { ...m, isPinned: false } : m)));
      };

      const handleTyping = ({ channelId, isTyping, user: typingUser }) => {
         if (!isSameChannel(activeChannelRef.current?._id, channelId)) return;
         if (typingUser.id === user?._id) return;

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
            color: user?.color,
         },
         reactions: [],
         isEdited: false,
         isPinned: false,
         isDeleted: false,
      };

      setMessages((curr) => [...curr, draft]);
      socket.emit("sendMessage", {
         channelId: activeChannel._id,
         text: messageText.trim(),
      });
      setMessageText("");
      socket.emit("typing", { channelId: activeChannel._id, isTyping: false });
   };

   const handleEdit = async (msgId, newText) => {
      try {
         await editMessage(msgId, newText);
         if (socket && activeChannel) {
            socket.emit("editMessage", {
               messageId: msgId,
               channelId: activeChannel._id,
               text: newText,
            });
         }
         setEditingMessageId(null);
         setEditingText("");
      } catch {
         setError("Failed to edit message");
      }
   };

   const handleDelete = async (msgId) => {
      try {
         await deleteMessage(msgId);
         if (socket && activeChannel) {
            socket.emit("deleteMessage", {
               messageId: msgId,
               channelId: activeChannel._id,
            });
         }
      } catch {
         setError("Failed to delete message");
      }
   };

   const handleTogglePin = async (msg) => {
      try {
         if (msg.isPinned) {
            await unpinMessage(msg._id);
            if (socket && activeChannel) {
               socket.emit("unpinMessage", { messageId: msg._id, channelId: activeChannel._id });
            }
         } else {
            await pinMessage(msg._id);
            if (socket && activeChannel) {
               socket.emit("pinMessage", { messageId: msg._id, channelId: activeChannel._id });
            }
         }
      } catch {
         setError("Failed to update pin status");
      }
   };

   const handleToggleReaction = async (msgId, emoji) => {
      try {
         const msg = messages.find((m) => normalizeId(m._id) === normalizeId(msgId));
         const existingReaction = msg?.reactions?.find((r) => r.emoji === emoji);
         const isReacted = existingReaction?.users?.some((u) => normalizeId(u._id || u) === normalizeId(user?._id));

         if (isReacted) {
            await removeReaction(msgId, emoji);
            if (socket && activeChannel) {
               socket.emit("removeReaction", { messageId: msgId, channelId: activeChannel._id, emoji });
            }
         } else {
            await addReaction(msgId, emoji);
            if (socket && activeChannel) {
               socket.emit("addReaction", { messageId: msgId, channelId: activeChannel._id, emoji });
            }
         }
         setActiveEmojiMenuId(null);
      } catch {
         setError("Failed to update reaction");
      }
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

   if (loading) {
      return (
         <div className="flex h-[calc(100vh-6rem)] items-center justify-center rounded-2xl border border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl">
            <div className="flex flex-col items-center gap-3 text-xs text-zinc-400">
               <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent border-t-transparent shadow-lg shadow-accent/20" />
               <span className="font-semibold text-zinc-300">Connecting Direct Messages...</span>
            </div>
         </div>
      );
   }

   return (
      <div className="h-[calc(100vh-6.5rem)] flex gap-4 overflow-hidden">
         {/* Left Contacts Sidebar */}
         <div className="w-80 flex flex-col shrink-0 rounded-2xl border border-zinc-800/80 bg-zinc-950/90 backdrop-blur-xl p-3.5 shadow-2xl overflow-hidden">
            {/* Header Title */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
               <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent-soft border border-accent/20 text-accent">
                     <HiChatAlt2 size={18} />
                  </div>
                  <div>
                     <h2 className="text-xs font-bold text-zinc-100 tracking-wide">Direct Messages</h2>
                     <p className="text-[10px] text-zinc-500 font-medium">1-on-1 Teammate Chats</p>
                  </div>
               </div>
               <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-bold text-accent">
                  {filteredMembers.length}
               </span>
            </div>

            {/* Search Input */}
            <div className="mt-3 relative">
               <HiSearch className="absolute left-3 top-2.5 text-zinc-500" size={14} />
               <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search teammate..."
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 py-2 pl-9 pr-7 text-xs text-zinc-100 placeholder:text-zinc-500 outline-none transition focus:border-accent"
               />
               {searchQuery ? (
                  <button
                     type="button"
                     onClick={() => setSearchQuery("")}
                     className="absolute right-2.5 top-2.5 text-zinc-500 hover:text-zinc-300"
                  >
                     <HiX size={12} />
                  </button>
               ) : null}
            </div>

            {/* Quick Status Filter Tabs */}
            <div className="mt-2.5 grid grid-cols-2 gap-1 p-1 rounded-xl bg-zinc-900/80 border border-zinc-800/60 text-[10px] font-bold">
               <button
                  type="button"
                  onClick={() => setContactFilter("all")}
                  className={`py-1 rounded-lg transition ${
                     contactFilter === "all" ? "bg-accent text-zinc-950 font-extrabold shadow" : "text-zinc-400 hover:text-white"
                  }`}
               >
                  All Teammates ({members.length - 1})
               </button>
               <button
                  type="button"
                  onClick={() => setContactFilter("online")}
                  className={`py-1 rounded-lg transition ${
                     contactFilter === "online" ? "bg-emerald-500 text-zinc-950 font-extrabold shadow" : "text-zinc-400 hover:text-white"
                  }`}
               >
                  🟢 Online ({Array.from(onlineUserIds).length})
               </button>
            </div>

            {/* Teammates Contact List */}
            <div className="mt-3 flex-1 overflow-y-auto space-y-1.5 pr-1">
               {filteredMembers.length > 0 ? (
                  filteredMembers.map((member) => {
                     const memberId = normalizeId(member.userId || member._id);
                     const avatarSrc = getAvatarSrc(member);
                     const isOnline = onlineUserIds.has(memberId);
                     const isSelected = normalizeId(activeRecipient?.userId || activeRecipient?._id) === memberId;

                     return (
                        <button
                           key={memberId}
                           type="button"
                           onClick={() => startDmWithUser(member)}
                           className={`group relative flex w-full items-center justify-between rounded-xl border p-2.5 text-left transition-all ${
                              isSelected
                                 ? "border-accent bg-accent-soft text-accent shadow-md shadow-accent/5"
                                 : "border-transparent bg-zinc-900/40 text-zinc-300 hover:border-zinc-800 hover:bg-zinc-900/90 hover:text-zinc-100"
                           }`}
                        >
                           <div className="flex min-w-0 items-center gap-3">
                              <div className="relative shrink-0">
                                 <img
                                    src={avatarSrc}
                                    alt={member.name || member.email}
                                    className={`h-10 w-10 rounded-xl border object-cover transition ${
                                       isSelected ? "border-accent" : "border-zinc-800 group-hover:border-zinc-700"
                                    }`}
                                 />
                                 <span
                                    className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-zinc-950 ${
                                       isOnline ? "bg-emerald-500 animate-pulse" : "bg-zinc-600"
                                    }`}
                                 />
                              </div>

                              <div className="min-w-0">
                                 <div className="flex items-center gap-1.5">
                                    <h4 className="truncate text-xs font-semibold">{member.name || member.email}</h4>
                                    {member.role === "owner" && (
                                       <span className="rounded bg-accent/20 px-1 py-0.2 text-[9px] font-bold text-accent">
                                          Admin
                                       </span>
                                    )}
                                 </div>
                                 <p className="mt-0.5 truncate text-[10px] text-zinc-400 group-hover:text-zinc-300">
                                    {member.email}
                                 </p>
                              </div>
                           </div>

                           <div className="flex flex-col items-end gap-1">
                              <span
                                 className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                                    isOnline ? "bg-emerald-500/15 text-emerald-400" : "bg-zinc-800/80 text-zinc-500"
                                 }`}
                              >
                                 {isOnline ? "Online" : "Away"}
                              </span>
                           </div>
                        </button>
                     );
                  })
               ) : (
                  <div className="py-12 text-center text-xs text-zinc-500 flex flex-col items-center gap-2">
                     <HiUser className="h-6 w-6 text-zinc-600" />
                     <span>No teammates found</span>
                  </div>
               )}
            </div>
         </div>

         {/* Main Conversation Panel */}
         <div className="flex-1 flex flex-col min-w-0 rounded-2xl border border-zinc-800/80 bg-zinc-950/90 backdrop-blur-xl shadow-2xl overflow-hidden">
            {activeRecipient ? (
               <>
                  {/* Chat Conversation Top Header */}
                  <div className="h-16 shrink-0 border-b border-zinc-800/80 bg-zinc-950/70 px-5 flex items-center justify-between gap-4">
                     <div className="flex min-w-0 items-center gap-3.5">
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
                           <div className="flex items-center gap-2">
                              <h3 className="truncate text-sm font-bold text-zinc-100">
                                 {activeRecipient.name || activeRecipient.email}
                              </h3>
                              <span className="rounded-full border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[10px] font-semibold text-zinc-400">
                                 Direct Chat
                              </span>
                           </div>
                           <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                              <span
                                 className={
                                    onlineUserIds.has(normalizeId(activeRecipient.userId || activeRecipient._id))
                                       ? "text-emerald-400 font-medium flex items-center gap-1"
                                       : "text-zinc-500"
                                 }
                              >
                                 {onlineUserIds.has(normalizeId(activeRecipient.userId || activeRecipient._id)) ? (
                                    <>
                                       <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                       Online now
                                    </>
                                 ) : (
                                    "Offline"
                                 )}
                              </span>
                              <span className="text-zinc-700">•</span>
                              <span className="text-zinc-400 truncate">{activeRecipient.email}</span>
                           </div>
                        </div>
                     </div>

                     {/* Action Controls */}
                     <div className="flex items-center gap-2">
                        {pinnedMessages.length > 0 && (
                           <button
                              type="button"
                              onClick={() => setShowPinned(!showPinned)}
                              className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                                 showPinned
                                    ? "border-accent bg-accent text-zinc-950 font-bold"
                                    : "border-accent/40 bg-accent-soft text-accent hover:bg-accent/20"
                              }`}
                           >
                              <span>📌</span>
                              <span>{pinnedMessages.length} Pinned</span>
                           </button>
                        )}

                        <button
                           type="button"
                           onClick={() => navigate(`/people`)}
                           className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-zinc-700 hover:text-white"
                        >
                           <HiUser className="h-3.5 w-3.5 text-zinc-400" />
                           <span>Profile</span>
                        </button>
                     </div>
                  </div>

                  {/* Typing Indicator Bar */}
                  {typingUsers.length > 0 && (
                     <div className="flex items-center gap-2 border-b border-zinc-800/80 bg-accent-soft/40 px-5 py-2 text-xs text-accent font-medium animate-pulse">
                        <span className="h-2 w-2 rounded-full bg-accent" />
                        <span>{activeRecipient.name || "Teammate"} is typing a reply…</span>
                     </div>
                  )}

                  {/* Pinned Messages Drawer */}
                  {showPinned && pinnedMessages.length > 0 && (
                     <div className="m-3 space-y-2 rounded-xl border border-accent/30 bg-zinc-900/90 p-3.5 backdrop-blur-md shadow-xl">
                        <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                           <span className="text-xs font-bold text-accent flex items-center gap-1.5">
                              <span>📌</span> Pinned Direct Messages ({pinnedMessages.length})
                           </span>
                           <button
                              type="button"
                              onClick={() => setShowPinned(false)}
                              className="text-zinc-400 hover:text-white"
                           >
                              <HiX size={16} />
                           </button>
                        </div>
                        <div className="max-h-40 space-y-2 overflow-y-auto pr-1">
                           {pinnedMessages.map((msg) => (
                              <div
                                 key={msg._id}
                                 className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-950 p-2 text-xs"
                              >
                                 <div className="min-w-0">
                                    <span className="font-semibold text-zinc-200">{msg.user?.name || "User"}: </span>
                                    <span className="text-zinc-300">{msg.text}</span>
                                 </div>
                                 <button
                                    type="button"
                                    onClick={() => handleTogglePin(msg)}
                                    className="shrink-0 text-[11px] font-bold text-accent hover:underline"
                                 >
                                    Unpin
                                 </button>
                              </div>
                           ))}
                        </div>
                     </div>
                  )}

                  {/* Messages Scroll Area */}
                  <div
                     ref={messageListRef}
                     className="flex-1 min-h-0 space-y-4 overflow-y-auto p-4 sm:p-6 saas-grid-bg"
                  >
                     {messages.length > 0 ? (
                        messages
                           .filter((m) => !m.isDeleted)
                           .map((msg) => {
                              const isMe = normalizeId(msg.user?._id || msg.user) === normalizeId(user?._id);

                              return (
                                 <div
                                    key={msg._id}
                                    className={`group relative flex flex-col ${isMe ? "items-end" : "items-start"}`}
                                 >
                                    {/* Message Info Header */}
                                    <div className="mb-1 flex items-center gap-2 text-[10px] text-zinc-500">
                                       <span className="font-semibold text-zinc-400">
                                          {isMe ? "You" : msg.user?.name || activeRecipient.name}
                                       </span>
                                       <span>•</span>
                                       <span>
                                          {new Date(msg.createdAt).toLocaleTimeString([], {
                                             hour: "2-digit",
                                             minute: "2-digit",
                                          })}
                                       </span>
                                       {msg.isEdited && <span className="italic text-zinc-500">(edited)</span>}
                                       {msg.isPinned && <span className="text-accent font-bold">📌 Pinned</span>}
                                    </div>

                                    {/* Bubble Container */}
                                    <div className="relative max-w-[85%] sm:max-w-[70%]">
                                       <div
                                          className={`relative rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-lg transition-all ${
                                             isMe
                                                ? "rounded-tr-xs bg-accent text-zinc-950 font-medium"
                                                : "rounded-tl-xs border border-zinc-800 bg-zinc-900/90 text-zinc-100 backdrop-blur-md"
                                          }`}
                                       >
                                          {editingMessageId === msg._id ? (
                                             <form
                                                onSubmit={(e) => {
                                                   e.preventDefault();
                                                   handleEdit(msg._id, editingText);
                                                }}
                                                className="min-w-[260px] space-y-2"
                                             >
                                                <input
                                                   value={editingText}
                                                   onChange={(e) => setEditingText(e.target.value)}
                                                   className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white outline-none focus:border-accent"
                                                />
                                                <div className="flex justify-end gap-2">
                                                   <button
                                                      type="button"
                                                      onClick={() => setEditingMessageId(null)}
                                                      className="rounded-lg bg-zinc-800 px-2.5 py-1 text-[10px] text-zinc-300 hover:text-white"
                                                   >
                                                      Cancel
                                                   </button>
                                                   <button
                                                      type="submit"
                                                      className="rounded-lg bg-accent px-3 py-1 text-[10px] font-bold text-zinc-950"
                                                   >
                                                      Save Edits
                                                   </button>
                                                </div>
                                             </form>
                                          ) : (
                                             <>
                                                <p className="whitespace-pre-wrap break-words">{msg.text}</p>

                                                {/* Reactions Counter Row */}
                                                {msg.reactions && msg.reactions.length > 0 && (
                                                   <div className="mt-2.5 flex flex-wrap gap-1">
                                                      {msg.reactions.map((r) => {
                                                         const hasReacted = r.users?.some(
                                                            (u) => normalizeId(u._id || u) === normalizeId(user?._id)
                                                         );
                                                         return (
                                                            <button
                                                               key={r.emoji}
                                                               type="button"
                                                               onClick={() => handleToggleReaction(msg._id, r.emoji)}
                                                               className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold transition ${
                                                                  hasReacted
                                                                     ? "border-accent bg-accent/20 text-accent"
                                                                     : "border-zinc-700 bg-zinc-800/80 text-zinc-300 hover:border-zinc-600"
                                                               }`}
                                                            >
                                                               <span>{r.emoji}</span>
                                                               <span>{r.users?.length || 0}</span>
                                                            </button>
                                                         );
                                                      })}
                                                   </div>
                                                )}
                                             </>
                                          )}
                                       </div>

                                       {/* Hover Action Bar */}
                                       <div
                                          className={`absolute top-0 ${
                                             isMe ? "-left-28" : "-right-28"
                                          } hidden group-hover:flex items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-950/95 p-1 shadow-2xl z-20 backdrop-blur-md`}
                                       >
                                          {/* Quick Emoji Menu Button */}
                                          <div className="relative">
                                             <button
                                                type="button"
                                                onClick={() =>
                                                   setActiveEmojiMenuId(activeEmojiMenuId === msg._id ? null : msg._id)
                                                }
                                                className="p-1.5 rounded-lg text-zinc-400 hover:text-accent hover:bg-zinc-900 transition"
                                                title="Add reaction"
                                             >
                                                <HiEmojiHappy size={14} />
                                             </button>

                                             {activeEmojiMenuId === msg._id && (
                                                <div className="absolute bottom-full mb-2 left-0 flex items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-950 p-2 shadow-2xl z-30">
                                                   {QUICK_EMOJIS.map((emoji) => (
                                                      <button
                                                         key={emoji}
                                                         type="button"
                                                         onClick={() => handleToggleReaction(msg._id, emoji)}
                                                         className="p-1 text-sm hover:scale-125 transition"
                                                      >
                                                         {emoji}
                                                      </button>
                                                   ))}
                                                </div>
                                             )}
                                          </div>

                                          <button
                                             type="button"
                                             onClick={() => handleTogglePin(msg)}
                                             className={`p-1.5 rounded-lg transition ${
                                                msg.isPinned ? "text-accent bg-accent/10" : "text-zinc-400 hover:text-accent hover:bg-zinc-900"
                                             }`}
                                             title={msg.isPinned ? "Unpin message" : "Pin message"}
                                          >
                                             📌
                                          </button>

                                          {isMe && (
                                             <>
                                                <button
                                                   type="button"
                                                   onClick={() => {
                                                      setEditingMessageId(msg._id);
                                                      setEditingText(msg.text);
                                                   }}
                                                   className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition"
                                                   title="Edit message"
                                                >
                                                   <HiPencil size={13} />
                                                </button>
                                                <button
                                                   type="button"
                                                   onClick={() => handleDelete(msg._id)}
                                                   className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition"
                                                   title="Delete message"
                                                >
                                                   <HiTrash size={13} />
                                                </button>
                                             </>
                                          )}
                                       </div>
                                    </div>
                                 </div>
                              );
                           })
                     ) : (
                        <div className="flex h-full flex-col items-center justify-center space-y-4 py-16 text-center">
                           <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-accent/30 bg-accent-soft text-2xl text-accent shadow-xl shadow-accent/10">
                              💬
                           </div>
                           <div className="max-w-sm">
                              <h4 className="text-sm font-bold text-zinc-200">Start a private conversation</h4>
                              <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
                                 Send a direct message to {activeRecipient.name || activeRecipient.email}. Your conversation is 1-on-1 and encrypted within your workspace.
                              </p>
                           </div>
                        </div>
                     )}
                     <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input Box Footer */}
                  <div className="p-4 border-t border-zinc-800/80 bg-zinc-950/80">
                     {/* Quick Emoji Bar */}
                     <div className="flex items-center gap-1.5 mb-2 overflow-x-auto pb-1">
                        <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mr-1 shrink-0">
                           Reactions:
                        </span>
                        {QUICK_EMOJIS.map((emoji) => (
                           <button
                              key={emoji}
                              type="button"
                              onClick={() => setMessageText((prev) => prev + " " + emoji)}
                              className="px-2 py-0.5 rounded-lg border border-zinc-800 bg-zinc-900/60 text-xs hover:border-accent hover:bg-zinc-900 transition shrink-0"
                           >
                              {emoji}
                           </button>
                        ))}
                     </div>

                     <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
                        <div className="relative flex-1">
                           <input
                              value={messageText}
                              onChange={handleInputChange}
                              placeholder={`Write a message to ${activeRecipient.name || activeRecipient.email}...`}
                              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-4 py-3 text-xs text-zinc-100 placeholder:text-zinc-500 outline-none transition focus:border-accent"
                           />
                        </div>

                        <button
                           type="submit"
                           disabled={!messageText.trim()}
                           className="flex items-center gap-1.5 rounded-xl bg-accent px-5 py-3 text-xs font-bold text-zinc-950 shadow-lg shadow-accent/20 transition hover:brightness-95 disabled:opacity-50 shrink-0"
                        >
                           <span>Send</span>
                           <HiPaperAirplane className="h-3.5 w-3.5 rotate-90" />
                        </button>
                     </form>
                  </div>
               </>
            ) : (
               /* Empty State: Select a teammate */
               <div className="flex flex-1 flex-col items-center justify-center p-8 text-center space-y-4">
                  <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-accent/30 bg-accent-soft text-3xl text-accent shadow-2xl shadow-accent/10">
                     <HiSparkles />
                  </div>
                  <div className="max-w-md space-y-1">
                     <h3 className="text-lg font-bold text-zinc-100">Select a teammate to start chatting</h3>
                     <p className="text-xs text-zinc-400 leading-relaxed">
                        Pick someone from the left contact list to open a 1-on-1 direct message stream in real time.
                     </p>
                  </div>
               </div>
            )}
         </div>
      </div>
   );
}
