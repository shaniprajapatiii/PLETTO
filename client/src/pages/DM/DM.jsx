import { useEffect, useRef, useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
   HiSearch,
   HiPaperClip,
   HiEmojiHappy,
   HiPencil,
   HiTrash,
   HiXCircle,
   HiUser,
   HiDotsVertical,
   HiCheckCircle,
   HiLockClosed,
   HiChatAlt,
   HiChatAlt2,
   HiSparkles,
   HiCheck,
   HiExclamation,
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

const EMOJI_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🔥", "🎉", "✨"];

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
   const [showEmojiPicker, setShowEmojiPicker] = useState(null);

   const messagesEndRef = useRef(null);
   const activeChannelRef = useRef(null);
   const typingTimeoutRef = useRef(null);

   useEffect(() => {
      activeChannelRef.current = activeChannel;
   }, [activeChannel]);

   // Load workspace members and existing DM channels
   const loadData = async () => {
      try {
         setLoading(true);
         const [membersRes, channelsRes] = await Promise.all([
            getWorkspaceMembers(),
            getChannels(),
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
            const targetChannel = dmChannels.find((c) => c._id === channelIdParam);
            if (targetChannel) {
               selectDmChannel(targetChannel, fetchedMembers);
               setLoading(false);
               return;
            }
         }

         if (userIdParam && userIdParam !== user?._id) {
            const targetMember = fetchedMembers.find((m) => m.userId === userIdParam || m._id === userIdParam);
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
            const otherMembers = fetchedMembers.filter((m) => (m.userId || m._id) !== user?._id);
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

   // Auto-scroll messages
   useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
   }, [messages]);

   // Socket Listeners
   useEffect(() => {
      if (!socket) return;

      socket.emit("userOnline");

      const handleNewMessage = (newMsg) => {
         if (activeChannelRef.current?._id === newMsg.channel) {
            setMessages((curr) => {
               if (curr.some((m) => m._id === newMsg._id)) return curr;
               return [...curr, newMsg];
            });
         }
      };

      const handleMessageEdited = (editedMsg) => {
         if (activeChannelRef.current?._id === editedMsg.channel) {
            setMessages((curr) => curr.map((m) => (m._id === editedMsg._id ? editedMsg : m)));
         }
      };

      const handleMessageDeleted = ({ messageId }) => {
         setMessages((curr) => curr.filter((m) => m._id !== messageId));
      };

      const handleReactionAdded = (msg) => {
         if (activeChannelRef.current?._id === msg.channel) {
            setMessages((curr) => curr.map((m) => (m._id === msg._id ? msg : m)));
         }
      };

      const handleReactionRemoved = (msg) => {
         if (activeChannelRef.current?._id === msg.channel) {
            setMessages((curr) => curr.map((m) => (m._id === msg._id ? msg : m)));
         }
      };

      const handleMessagePinned = (msg) => {
         if (activeChannelRef.current?._id === msg.channel) {
            setPinnedMessages((curr) => [...curr, msg]);
            setMessages((curr) => curr.map((m) => (m._id === msg._id ? msg : m)));
         }
      };

      const handleMessageUnpinned = ({ messageId }) => {
         setPinnedMessages((curr) => curr.filter((m) => m._id !== messageId));
         setMessages((curr) => curr.map((m) => (m._id === messageId ? { ...m, isPinned: false } : m)));
      };

      const handleTyping = ({ channelId, isTyping, user: typingUser }) => {
         if (activeChannelRef.current?._id !== channelId) return;
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

      // Find recipient user from members array
      const otherMemberObj = channel.members?.find((m) => (m._id || m.userId) !== user?._id);
      if (otherMemberObj) {
         const fullMember = currentMembers.find((m) => (m.userId || m._id) === (otherMemberObj._id || otherMemberObj.userId)) || otherMemberObj;
         setActiveRecipient(fullMember);
      }

      setSearchParams({ channel: channel._id });
   };

   const startDmWithUser = async (targetMember, currentChannels = channels) => {
      const targetUserId = targetMember.userId || targetMember._id;
      if (!targetUserId || targetUserId === user?._id) return;

      try {
         const existing = currentChannels.find(
            (c) => c.type === "dm" && c.members?.some((m) => (m._id || m) === targetUserId)
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
            setChannels((prev) => [newChannel, ...prev.filter((c) => c._id !== newChannel._id)]);
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

      socket.emit("sendMessage", {
         channelId: activeChannel._id,
         text: messageText.trim(),
      });

      setMessageText("");
      if (socket && activeChannel) {
         socket.emit("typing", { channelId: activeChannel._id, isTyping: false });
      }
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
      const otherMembers = members.filter((m) => (m.userId || m._id) !== user?._id);
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
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#f9ebae] border-t-transparent mr-3" />
            Loading Direct Messages...
         </div>
      );
   }

   return (
      <div className="h-[calc(100vh-6rem)] flex rounded-2xl border border-zinc-800/80 bg-zinc-950/90 backdrop-blur-xl overflow-hidden shadow-2xl">
         {/* Left Side Contact List (WhatsApp/Discord DM Style) */}
         <div className="w-80 border-r border-zinc-800/80 bg-zinc-950 flex flex-col shrink-0">
            {/* Header */}
            <div className="p-4 border-b border-zinc-800/80 space-y-3">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-zinc-100 font-bold text-sm">
                     <HiChatAlt2 className="text-[#f9ebae]" size={18} />
                     <span>Direct Messages</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[rgba(249,235,174,0.12)] text-[10px] font-bold text-[#f9ebae] border border-[rgba(249,235,174,0.3)]">
                     1-on-1 Chat
                  </span>
               </div>

               {/* Search Bar */}
               <div className="relative">
                  <HiSearch className="absolute left-3 top-2.5 text-zinc-500" size={14} />
                  <input
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     placeholder="Search teammates..."
                     className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-zinc-800 bg-zinc-900/80 text-xs text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-[#f9ebae] transition"
                  />
               </div>
            </div>

            {/* Teammates List */}
            <div className="flex-1 overflow-y-auto space-y-0.5 p-2">
               {filteredMembers.length > 0 ? (
                  filteredMembers.map((member) => {
                     const memberId = member.userId || member._id;
                     const avatarSrc = getAvatarSrc(member);
                     const isOnline = onlineUserIds.has(memberId);
                     const existingChan = channels.find((c) =>
                        c.members?.some((m) => (m._id || m) === memberId)
                     );
                     const isSelected = activeRecipient && (activeRecipient.userId || activeRecipient._id) === memberId;

                     return (
                        <button
                           key={memberId}
                           type="button"
                           onClick={() => startDmWithUser(member)}
                           className={`w-full p-3 rounded-xl flex items-center justify-between text-left transition ${
                              isSelected
                                 ? "bg-[#f9ebae]/10 border border-[#f9ebae]/30"
                                 : "hover:bg-zinc-900/60 border border-transparent"
                           }`}
                        >
                           <div className="flex items-center gap-3 min-w-0">
                              <div className="relative shrink-0">
                                 <img
                                    src={avatarSrc}
                                    alt={member.name || member.email}
                                    className="h-10 w-10 rounded-xl border border-zinc-800 object-cover"
                                 />
                                 <span
                                    className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-zinc-950 ${
                                       isOnline ? "bg-emerald-500" : "bg-zinc-600"
                                    }`}
                                 />
                              </div>
                              <div className="min-w-0">
                                 <div className="flex items-center gap-1.5">
                                    <h4 className="text-xs font-bold text-zinc-200 truncate">
                                       {member.name || member.email}
                                    </h4>
                                    {member.role === "owner" && (
                                       <span className="text-[9px] font-bold uppercase tracking-wider text-[#f9ebae] bg-[rgba(249,235,174,0.15)] px-1 rounded">
                                          Admin
                                       </span>
                                    )}
                                 </div>
                                 <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                                    {member.email}
                                 </p>
                              </div>
                           </div>

                           <div className="flex flex-col items-end gap-1">
                              <span
                                 className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                                    isOnline ? "text-emerald-400 bg-emerald-500/10" : "text-zinc-500 bg-zinc-900"
                                 }`}
                              >
                                 {isOnline ? "Online" : "Offline"}
                              </span>
                           </div>
                        </button>
                     );
                  })
               ) : (
                  <div className="py-10 text-center text-xs text-zinc-500">
                     No teammates found.
                  </div>
               )}
            </div>
         </div>

         {/* Right Side DM Conversation Window */}
         <div className="flex-1 flex flex-col min-w-0 bg-zinc-950/60">
            {activeRecipient ? (
               <>
                  {/* Recipient Header */}
                  <div className="h-16 px-6 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-950/90 backdrop-blur-md shrink-0">
                     <div className="flex items-center gap-3.5 min-w-0">
                        <div className="relative shrink-0">
                           <img
                              src={getAvatarSrc(activeRecipient)}
                              alt={activeRecipient.name}
                              className="h-10 w-10 rounded-xl border border-zinc-800 object-cover"
                           />
                           <span
                              className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-zinc-950 ${
                                 onlineUserIds.has(activeRecipient.userId || activeRecipient._id)
                                    ? "bg-emerald-500 animate-pulse"
                                    : "bg-zinc-600"
                              }`}
                           />
                        </div>
                        <div className="min-w-0">
                           <div className="flex items-center gap-2">
                              <h3 className="text-sm font-bold text-zinc-100 truncate">
                                 {activeRecipient.name || activeRecipient.email}
                              </h3>
                              <span className="px-2 py-0.5 text-[10px] font-semibold text-[#f9ebae] bg-[#f9ebae]/10 rounded border border-[#f9ebae]/20">
                                 Direct Message
                              </span>
                           </div>
                           <p className="text-[11px] text-zinc-400 truncate">
                              {onlineUserIds.has(activeRecipient.userId || activeRecipient._id)
                                 ? "Active now in workspace"
                                 : "Offline"}
                           </p>
                        </div>
                     </div>

                     <div className="flex items-center gap-2">
                        {pinnedMessages.length > 0 && (
                           <button
                              type="button"
                              onClick={() => setShowPinned(!showPinned)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[rgba(249,235,174,0.3)] bg-[rgba(249,235,174,0.1)] text-xs font-semibold text-[#f9ebae] hover:bg-[rgba(249,235,174,0.2)] transition"
                           >
                              <span>📌 {pinnedMessages.length} Pinned</span>
                           </button>
                        )}
                        <button
                           type="button"
                           onClick={() => navigate("/people")}
                           className="px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-xs font-semibold text-zinc-300 hover:text-white transition"
                        >
                           View Profile
                        </button>
                     </div>
                  </div>

                  {/* Typing bar */}
                  {typingUsers.length > 0 && (
                     <div className="px-6 py-1.5 bg-[rgba(249,235,174,0.06)] border-b border-[rgba(249,235,174,0.15)] text-xs text-[#f9ebae] italic flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#f9ebae] animate-ping" />
                        <span>{activeRecipient.name || "Teammate"} is typing…</span>
                     </div>
                  )}

                  {/* Pinned Messages panel */}
                  {showPinned && pinnedMessages.length > 0 && (
                     <div className="m-4 p-4 rounded-xl border border-[rgba(249,235,174,0.3)] bg-[rgba(249,235,174,0.05)] space-y-2">
                        <div className="flex items-center justify-between">
                           <span className="text-xs font-bold text-[#f9ebae]">Pinned Messages</span>
                           <button onClick={() => setShowPinned(false)} className="text-zinc-400 hover:text-white">
                              ✕
                           </button>
                        </div>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                           {pinnedMessages.map((msg) => (
                              <div key={msg._id} className="p-2.5 rounded-lg border border-zinc-800 bg-zinc-950 flex items-center justify-between gap-2 text-xs">
                                 <div>
                                    <span className="font-bold text-zinc-200">{msg.user?.name}: </span>
                                    <span className="text-zinc-400">{msg.text}</span>
                                 </div>
                                 <button onClick={() => unpinMessage(msg._id)} className="text-[10px] text-zinc-500 hover:text-[#f9ebae]">
                                    Unpin
                                 </button>
                              </div>
                           ))}
                        </div>
                     </div>
                  )}

                  {/* Messages Canvas */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                     {messages.length > 0 ? (
                        messages
                           .filter((m) => !m.isDeleted)
                           .map((msg) => {
                              const isMe = (msg.user?._id || msg.user) === user?._id;

                              return (
                                 <div
                                    key={msg._id}
                                    className={`flex flex-col ${isMe ? "items-end" : "items-start"} group`}
                                 >
                                    <div className="flex items-center gap-2 mb-1">
                                       <span className="text-[10px] font-semibold text-zinc-400">
                                          {isMe ? "You" : msg.user?.name || activeRecipient.name}
                                       </span>
                                       <span className="text-[9px] text-zinc-400">
                                          {new Date(msg.createdAt).toLocaleTimeString([], {
                                             hour: "2-digit",
                                             minute: "2-digit",
                                          })}
                                       </span>
                                       {msg.isEdited && (
                                          <span className="text-[9px] text-zinc-400">(edited)</span>
                                       )}
                                       {msg.isPinned && <span className="text-xs text-[#f9ebae]">📌</span>}
                                    </div>

                                    <div
                                       className={`relative max-w-lg p-3.5 rounded-2xl text-xs leading-relaxed transition shadow-sm ${
                                          isMe
                                             ? "bg-[#f9ebae] text-zinc-950 font-medium rounded-tr-none"
                                             : "bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-tl-none"
                                       }`}
                                    >
                                       {editingMessageId === msg._id ? (
                                          <form
                                             onSubmit={(e) => {
                                                e.preventDefault();
                                                handleEdit(msg._id, editingText);
                                             }}
                                             className="space-y-2 min-w-[240px]"
                                          >
                                             <input
                                                value={editingText}
                                                onChange={(e) => setEditingText(e.target.value)}
                                                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-xs text-white outline-none"
                                             />
                                             <div className="flex justify-end gap-1.5">
                                                <button
                                                   type="button"
                                                   onClick={() => setEditingMessageId(null)}
                                                   className="px-2.5 py-1 rounded bg-zinc-800 text-zinc-300 text-[10px]"
                                                >
                                                   Cancel
                                                </button>
                                                <button
                                                   type="submit"
                                                   className="px-2.5 py-1 rounded bg-indigo-600 text-white text-[10px] font-bold"
                                                >
                                                   Save
                                                </button>
                                             </div>
                                          </form>
                                       ) : (
                                          <>
                                             <p>{msg.text}</p>

                                             {/* Reactions display */}
                                             {msg.reactions && msg.reactions.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                   {msg.reactions.map((r) => (
                                                      <button
                                                         key={r.emoji}
                                                         onClick={() => {
                                                            if (r.users?.some((u) => u._id === user?._id)) {
                                                               removeReaction(msg._id, r.emoji);
                                                            } else {
                                                               addReaction(msg._id, r.emoji);
                                                            }
                                                         }}
                                                         className={`px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1 border transition ${
                                                            r.users?.some((u) => u._id === user?._id)
                                                               ? "border-amber-400/40 bg-amber-400/20 text-amber-300 font-bold"
                                                               : "border-zinc-700 bg-zinc-800 text-zinc-300"
                                                         }`}
                                                      >
                                                         {r.emoji} {r.users?.length || 0}
                                                      </button>
                                                   ))}
                                                </div>
                                             )}
                                          </>
                                       )}

                                       {/* Hover action toolbar */}
                                       <div
                                          className={`absolute top-1 ${
                                             isMe ? "-left-16" : "-right-16"
                                          } opacity-0 group-hover:opacity-100 flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1 transition shadow-lg z-10`}
                                       >
                                          <button
                                             type="button"
                                             onClick={() => pinMessage(msg._id)}
                                             className="p-1 text-zinc-400 hover:text-[#f9ebae]"
                                             title="Pin message"
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
                                                   className="p-1 text-zinc-400 hover:text-white"
                                                   title="Edit"
                                                >
                                                   ✏️
                                                </button>
                                                <button
                                                   type="button"
                                                   onClick={() => handleDelete(msg._id)}
                                                   className="p-1 text-zinc-400 hover:text-red-400"
                                                   title="Delete"
                                                >
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
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-3 py-20 text-xs text-zinc-500">
                           <div className="h-12 w-12 rounded-2xl bg-[rgba(249,235,174,0.1)] border border-[rgba(249,235,174,0.2)] flex items-center justify-center text-[#f9ebae] text-xl">
                              💬
                           </div>
                           <div>
                              <h4 className="font-bold text-zinc-200 text-sm">
                                 Start a conversation with {activeRecipient.name || activeRecipient.email}
                              </h4>
                              <p className="text-zinc-400 text-xs mt-1">
                                 Direct messages are private between the two of you.
                              </p>
                           </div>
                        </div>
                     )}
                     <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input Box */}
                  <form onSubmit={handleSendMessage} className="p-4 border-t border-zinc-800/80 bg-zinc-950 flex gap-2">
                     <input
                        value={messageText}
                        onChange={handleInputChange}
                        placeholder={`Message ${activeRecipient.name || activeRecipient.email}...`}
                        className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900/90 px-4 py-3 text-xs text-zinc-100 outline-none focus:border-[#f9ebae] placeholder:text-zinc-500 transition"
                     />
                     <button
                        type="submit"
                        disabled={!messageText.trim()}
                        className="px-5 py-3 rounded-xl bg-[#f9ebae] hover:bg-[#e6d695] text-zinc-950 font-bold text-xs shadow-md shadow-[#f9ebae]/20 transition disabled:opacity-50"
                     >
                        Send
                     </button>
                  </form>
               </>
            ) : (
               <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-4">
                  <div className="h-16 w-16 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 text-2xl">
                     💬
                  </div>
                  <div>
                     <h3 className="text-base font-bold text-zinc-200">No Teammate Selected</h3>
                     <p className="text-xs text-zinc-400 max-w-xs mt-1">
                        Select a teammate from the left sidebar to start a 1-on-1 direct message.
                     </p>
                  </div>
               </div>
            )}
         </div>
      </div>
   );
}
