import { useEffect, useRef, useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { HiSearch, HiChatAlt2, HiSparkles } from "react-icons/hi";
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
import { PageShell } from "../../components/common/PageShell";
import { getAvatarSrc } from "../../utils/avatar";

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
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState(null);

   const [typingUsers, setTypingUsers] = useState([]);
   const [onlineUserIds, setOnlineUserIds] = useState(new Set());

   const [editingMessageId, setEditingMessageId] = useState(null);
   const [editingText, setEditingText] = useState("");
   const [showPinned, setShowPinned] = useState(false);

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

         // Determine which DM channel or user to open initially
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

         // Default: open first DM channel if present, or first teammate
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
            setPinnedMessages((curr) => [...curr, msg]);
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

   // Join channel socket room on channel change
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
      e.preventDefault();
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

   const filteredMembers = useMemo(() => {
      const otherMembers = members.filter((m) => normalizeId(m.userId || m._id) !== normalizeId(user?._id));
      if (!searchQuery.trim()) return otherMembers;
      const q = searchQuery.toLowerCase();
      return otherMembers.filter(
         (m) =>
            m.name?.toLowerCase().includes(q) ||
            m.email?.toLowerCase().includes(q) ||
            m.role?.toLowerCase().includes(q)
      );
   }, [members, searchQuery, user]);

   if (loading) {
      return (
         <div className="flex items-center justify-center py-20 text-xs text-zinc-400">
            <div className="mr-3 h-8 w-8 animate-spin rounded-full border-2 border-[#f9ebae] border-t-transparent" />
            Loading Direct Messages...
         </div>
      );
   }

   return (
      <div className="w-full">
         <PageShell
            className="flex flex-col"
            title="Direct Messages"
            subtitle="Private conversations with teammates in real time."
            actions={
               <div className="flex items-center gap-2 rounded-lg border border-[rgba(249,235,174,0.3)] bg-[rgba(249,235,174,0.08)] px-3 py-1.5 text-xs font-semibold text-[#f9ebae]">
                  <HiSparkles className="h-4 w-4 text-[#f9ebae]" />
                  <span>Live</span>
               </div>
            }
         >
            <div className="flex flex-col">
               <div className="grid min-h-[70vh] grid-cols-1 gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
               <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-3 backdrop-blur-md">
                  <div className="mb-3 flex items-center justify-between">
                     <div className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
                        <HiChatAlt2 className="text-[#f9ebae]" size={18} />
                        <span>Contacts</span>
                     </div>
                     <span className="rounded-full border border-zinc-800 bg-zinc-900/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
                        1-on-1
                     </span>
                  </div>

                  <div className="relative">
                     <HiSearch className="absolute left-3 top-2.5 text-zinc-500" size={14} />
                     <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search teammates"
                        className="w-full rounded-2xl border border-zinc-800/80 bg-zinc-900/70 py-2 pl-9 pr-3 text-xs text-zinc-100 placeholder:text-zinc-500 outline-none transition focus:border-[#f9ebae]/30"
                     />
                  </div>

                  <div className="mt-3 flex-1 space-y-2 overflow-y-auto pr-1">
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
                                 className={`flex w-full items-center justify-between rounded-2xl border p-3 text-left transition ${
                                    isSelected
                                       ? "border-[#f9ebae]/30 bg-[rgba(249,235,174,0.08)]"
                                       : "border-transparent bg-transparent hover:border-zinc-800 hover:bg-zinc-900/60"
                                 }`}
                              >
                                 <div className="flex min-w-0 items-center gap-3">
                                    <div className="relative shrink-0">
                                       <img src={avatarSrc} alt={member.name || member.email} className="h-11 w-11 rounded-2xl border border-zinc-800 object-cover" />
                                       <span
                                          className={`absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-zinc-950 ${
                                             isOnline ? "bg-emerald-500" : "bg-zinc-600"
                                          }`}
                                       />
                                    </div>
                                    <div className="min-w-0">
                                       <div className="flex items-center gap-1.5">
                                          <h4 className="truncate text-xs font-semibold text-zinc-100">{member.name || member.email}</h4>
                                          {member.role === "owner" && (
                                             <span className="rounded bg-[#f9ebae]/10 px-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-[#f9ebae]">
                                                Admin
                                             </span>
                                          )}
                                       </div>
                                       <p className="mt-0.5 truncate text-[11px] text-zinc-400">{member.email}</p>
                                    </div>
                                 </div>

                                 <span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase ${isOnline ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-900 text-zinc-500"}`}>
                                    {isOnline ? "Online" : "Away"}
                                 </span>
                              </button>
                           );
                        })
                     ) : (
                        <div className="py-10 text-center text-xs text-zinc-500">No teammates found.</div>
                     )}
                  </div>
               </div>

               <div className="flex min-h-[60vh] min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-950/60 backdrop-blur-md">
                  {activeRecipient ? (
                     <>
                        <div className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-800/80 px-6">
                           <div className="flex min-w-0 items-center gap-3.5">
                              <div className="relative shrink-0">
                                 <img src={getAvatarSrc(activeRecipient)} alt={activeRecipient.name} className="h-10 w-10 rounded-2xl border border-zinc-800 object-cover" />
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
                                    <h3 className="truncate text-sm font-semibold text-zinc-100">{activeRecipient.name || activeRecipient.email}</h3>
                                    <span className="rounded-full border border-zinc-800 bg-zinc-900/70 px-2 py-0.5 text-[10px] font-semibold text-zinc-400">
                                       Direct Message
                                    </span>
                                 </div>
                                 <p className="truncate text-[11px] text-zinc-400">
                                    {onlineUserIds.has(normalizeId(activeRecipient.userId || activeRecipient._id)) ? "Online now" : "Offline"}
                                 </p>
                              </div>
                           </div>

                           <div className="flex items-center gap-2">
                              {pinnedMessages.length > 0 && (
                                 <button
                                    type="button"
                                    onClick={() => setShowPinned(!showPinned)}
                                    className="rounded-2xl border border-[rgba(249,235,174,0.3)] bg-[rgba(249,235,174,0.08)] px-3 py-1.5 text-[11px] font-semibold text-[#f9ebae] transition hover:bg-[rgba(249,235,174,0.12)]"
                                 >
                                    📌 {pinnedMessages.length} pinned
                                 </button>
                              )}
                              <button
                                 type="button"
                                 onClick={() => navigate("/people")}
                                 className="rounded-2xl border border-zinc-800 bg-zinc-900/70 px-3 py-1.5 text-[11px] font-semibold text-zinc-300 transition hover:text-white"
                              >
                                 View profile
                              </button>
                           </div>
                        </div>

                        {typingUsers.length > 0 && (
                           <div className="flex items-center gap-2 border-b border-zinc-800/80 bg-zinc-900/40 px-6 py-2 text-xs text-zinc-400">
                              <span className="h-1.5 w-1.5 animate-ping rounded-full bg-zinc-400" />
                              <span>{activeRecipient.name || "Teammate"} is typing…</span>
                           </div>
                        )}

                        {showPinned && pinnedMessages.length > 0 && (
                           <div className="m-4 space-y-2 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4">
                              <div className="flex items-center justify-between">
                                 <span className="text-xs font-semibold text-[#f9ebae]">Pinned Messages</span>
                                 <button type="button" onClick={() => setShowPinned(false)} className="text-zinc-400 hover:text-white">
                                    ✕
                                 </button>
                              </div>
                              <div className="max-h-40 space-y-2 overflow-y-auto">
                                 {pinnedMessages.map((msg) => (
                                    <div key={msg._id} className="flex items-center justify-between gap-2 rounded-2xl border border-zinc-800/80 bg-zinc-950/70 px-3 py-2 text-xs">
                                       <div>
                                          <span className="font-semibold text-zinc-200">{msg.user?.name}: </span>
                                          <span className="text-zinc-400">{msg.text}</span>
                                       </div>
                                       <button type="button" onClick={() => unpinMessage(msg._id)} className="text-[10px] text-zinc-500 hover:text-[#f9ebae]">
                                          Unpin
                                       </button>
                                    </div>
                                 ))}
                              </div>
                           </div>
                        )}

                        <div ref={messageListRef} className="relative flex-1 min-h-0 space-y-4 overflow-y-auto px-4 py-5 sm:px-6">
                           {messages.length > 0 ? (
                              messages
                                 .filter((m) => !m.isDeleted)
                                 .map((msg) => {
                                    const isMe = normalizeId(msg.user?._id || msg.user) === normalizeId(user?._id);

                                    return (
                                       <div key={msg._id} className={`flex flex-col ${isMe ? "items-end" : "items-start"} group`}>
                                          <div className="mb-1 flex items-center gap-2">
                                             <span className="text-[10px] font-semibold text-zinc-400">{isMe ? "You" : msg.user?.name || activeRecipient.name}</span>
                                             <span className="text-[9px] text-zinc-500">
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                             </span>
                                             {msg.isEdited && <span className="text-[9px] text-zinc-500">(edited)</span>}
                                             {msg.isPinned && <span className="text-xs text-[#f9ebae]">📌</span>}
                                          </div>

                                          <div
                                             className={`relative max-w-[85%] rounded-[22px] px-3.5 py-3 text-xs leading-relaxed shadow-none sm:max-w-[70%] ${
                                                isMe
                                                   ? "rounded-tr-md bg-[#f9ebae]/15 text-zinc-100"
                                                   : "rounded-tl-md border border-zinc-800/80 bg-zinc-900/70 text-zinc-100"
                                             }`}
                                          >
                                             {editingMessageId === msg._id ? (
                                                <form
                                                   onSubmit={(e) => {
                                                      e.preventDefault();
                                                      handleEdit(msg._id, editingText);
                                                   }}
                                                   className="min-w-[240px] space-y-2"
                                                >
                                                   <input
                                                      value={editingText}
                                                      onChange={(e) => setEditingText(e.target.value)}
                                                      className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white outline-none"
                                                   />
                                                   <div className="flex justify-end gap-2">
                                                      <button type="button" onClick={() => setEditingMessageId(null)} className="rounded-lg bg-zinc-800 px-2.5 py-1 text-[10px] text-zinc-300">
                                                         Cancel
                                                      </button>
                                                      <button type="submit" className="rounded-lg bg-indigo-600 px-2.5 py-1 text-[10px] font-semibold text-white">
                                                         Save
                                                      </button>
                                                   </div>
                                                </form>
                                             ) : (
                                                <>
                                                   <p>{msg.text}</p>
                                                   {msg.reactions && msg.reactions.length > 0 && (
                                                      <div className="mt-2 flex flex-wrap gap-1">
                                                         {msg.reactions.map((r) => (
                                                            <button
                                                               key={r.emoji}
                                                               onClick={() => {
                                                                  if (r.users?.some((u) => normalizeId(u._id) === normalizeId(user?._id))) {
                                                                     removeReaction(msg._id, r.emoji);
                                                                  } else {
                                                                     addReaction(msg._id, r.emoji);
                                                                  }
                                                               }}
                                                               className={`rounded-full border px-2 py-0.5 text-[10px] ${
                                                                  r.users?.some((u) => normalizeId(u._id) === normalizeId(user?._id))
                                                                     ? "border-amber-400/40 bg-amber-400/20 text-amber-300"
                                                                     : "border-zinc-700 bg-zinc-800/80 text-zinc-300"
                                                               }`}
                                                            >
                                                               {r.emoji} {r.users?.length || 0}
                                                            </button>
                                                         ))}
                                                      </div>
                                                   )}
                                                </>
                                             )}

                                             <div className={`absolute top-1 ${isMe ? "-left-16" : "-right-16"} flex items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-900/95 p-1 opacity-0 shadow-lg transition group-hover:opacity-100`}>
                                                <button type="button" onClick={() => pinMessage(msg._id)} className="rounded-lg p-1 text-zinc-400 transition hover:text-[#f9ebae]" title="Pin message">
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
                                                         className="rounded-lg p-1 text-zinc-400 transition hover:text-white"
                                                         title="Edit"
                                                      >
                                                         ✏️
                                                      </button>
                                                      <button type="button" onClick={() => handleDelete(msg._id)} className="rounded-lg p-1 text-zinc-400 transition hover:text-red-400" title="Delete">
                                                         🗑️
                                                      </button>
                                                   </>
                                                )}
                                             </div>
                                          </div>
                                       </div>
                                    );
                                 })
                           ) : (
                              <div className="flex h-full flex-col items-center justify-center space-y-3 py-20 text-center text-xs text-zinc-500">
                                 <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#f9ebae]/20 bg-[#f9ebae]/10 text-xl text-[#f9ebae]">
                                    💬
                                 </div>
                                 <div>
                                    <h4 className="text-sm font-semibold text-zinc-200">Start the conversation</h4>
                                    <p className="mt-1 text-zinc-400">Your direct message will stay private and feel instant.</p>
                                 </div>
                              </div>
                           )}
                           <div ref={messagesEndRef} />

                        </div>

                        <form onSubmit={handleSendMessage} className="flex shrink-0 gap-2 border-t border-zinc-800/80 bg-zinc-900/40 p-4">
                           <input
                              value={messageText}
                              onChange={handleInputChange}
                              placeholder={`Message ${activeRecipient.name || activeRecipient.email}...`}
                              className="flex-1 rounded-2xl border border-zinc-800/80 bg-zinc-950/70 px-4 py-3 text-xs text-zinc-100 outline-none transition focus:border-[#f9ebae]/30"
                           />
                           <button
                              type="submit"
                              disabled={!messageText.trim()}
                              className="rounded-2xl bg-[#f9ebae] px-5 py-3 text-xs font-semibold text-zinc-950 transition hover:bg-[#e9d98f] disabled:opacity-50"
                           >
                              Send
                           </button>
                        </form>
                     </>
                  ) : (
                     <div className="flex flex-1 flex-col items-center justify-center space-y-4 p-8 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-zinc-800 bg-zinc-900/70 text-2xl text-zinc-500">
                           <HiSparkles />
                        </div>
                        <div>
                           <h3 className="text-base font-semibold text-zinc-200">Pick a teammate</h3>
                           <p className="mt-1 max-w-xs text-xs text-zinc-400">Choose someone from the left side to open a crisp direct conversation.</p>
                        </div>
                     </div>
                  )}
               </div>
               </div>
            </div>
         </PageShell>
      </div>
   );
}
