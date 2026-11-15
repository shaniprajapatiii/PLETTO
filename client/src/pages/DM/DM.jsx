import { useEffect, useRef, useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
   HiSearch,
   HiChatAlt2,
   HiTrash,
   HiX,
   HiUser,
   HiUsers,
   HiArrowLeft,
   HiArrowsExpand,
} from "react-icons/hi";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import {
   getChannels,
   createChannel,
   getMessages,
   deleteMessage,
   deleteLatestMessage,
} from "../../services/chatService";
import { getWorkspaceMembers } from "../../services/workspaceService";
import { getAvatarSrc } from "../../utils/avatar";
import { PageShell } from "../../components/common/PageShell";

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
   const [messageText, setMessageText] = useState("");
   const [searchQuery, setSearchQuery] = useState("");
   const [contactFilter, setContactFilter] = useState("all"); // 'all', 'online'
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState(null);

   const [typingUsers, setTypingUsers] = useState([]);
   const [onlineUserIds, setOnlineUserIds] = useState(new Set());

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
            const withoutTemp = curr.filter(
               (m) => !(m._id?.toString().startsWith("temp-") && m.text === newMsg.text)
            );
            return [...withoutTemp, newMsg];
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

      const handleTyping = ({ channelId, isTyping, user: typingUser }) => {
         if (!isSameChannel(activeChannelRef.current?._id, channelId)) return;
         if (normalizeId(typingUser?.id || typingUser?._id) === normalizeId(user?._id)) return;

         setTypingUsers((curr) => {
            const typingId = normalizeId(typingUser?.id || typingUser?._id);
            if (!isTyping) return curr.filter((u) => normalizeId(u.id || u._id) !== typingId);
            if (curr.some((u) => normalizeId(u.id || u._id) === typingId)) return curr;
            return [...curr, typingUser];
         });
      };

      const handlePresenceUpdate = ({ userId, status }) => {
         if (!userId) return;
         setOnlineUserIds((curr) => {
            const next = new Set(curr);
            if (status === "online") {
               next.add(userId.toString());
            } else {
               next.delete(userId.toString());
            }
            return next;
         });
      };

      socket.on("newMessage", handleNewMessage);
      socket.on("messageEdited", handleMessageEdited);
      socket.on("messageDeleted", handleMessageDeleted);
      socket.on("typing", handleTyping);
      socket.on("presenceUpdate", handlePresenceUpdate);

      return () => {
         socket.off("newMessage", handleNewMessage);
         socket.off("messageEdited", handleMessageEdited);
         socket.off("messageDeleted", handleMessageDeleted);
         socket.off("typing", handleTyping);
         socket.off("presenceUpdate", handlePresenceUpdate);
      };
   }, [socket, user]);

   useEffect(() => {
      if (!activeChannel || !socket) return;
      socket.emit("joinChannel", activeChannel._id);
      loadMessages(activeChannel._id);
   }, [activeChannel, socket]);

   const loadMessages = async (channelId) => {
      try {
         const res = await getMessages(channelId);
         setMessages(res.data.messages || []);
      } catch (err) {
         setError("Failed to fetch messages");
      }
   };

   const selectDmChannel = (channel, currentMembers = members) => {
      setActiveChannel(channel);

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
      };

      setMessages((curr) => [...curr, draft]);
      socket.emit("sendMessage", {
         channelId: activeChannel._id,
         text: messageText.trim(),
      });
      setMessageText("");
      socket.emit("typing", { channelId: activeChannel._id, isTyping: false });
   };

   const handleDeleteMsg = async (msgId) => {
      if (!msgId) return;
      // Optimistic local state removal
      setMessages((curr) => curr.filter((m) => normalizeId(m._id) !== normalizeId(msgId)));

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
         if (activeChannel) {
            loadMessages(activeChannel._id);
         }
      }
   };

   const handleDeleteLatestMessage = async () => {
      if (!latestMyMessageId) return;
      await handleDeleteMsg(latestMyMessageId);
   };

   const latestMyMessageId = useMemo(() => {
      const myMsgs = messages.filter((m) => !m.isDeleted && normalizeId(m.user?._id || m.user) === normalizeId(user?._id));
      return myMsgs.length > 0 ? myMsgs[myMsgs.length - 1]._id : null;
   }, [messages, user]);

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
            subtitle="Send direct messages and start private conversations with workspace teammates."
            actions={
               <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/20 bg-black text-xs font-mono font-bold text-white shadow-sm">
                  <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                  <span>{Array.from(onlineUserIds).length} Online</span>
               </div>
            }
         >
            {error && (
               <div className="p-4 mb-4 rounded-xl bg-[#16161a] border border-white/20 text-xs font-bold text-white flex items-center justify-between">
                  <span>{error}</span>
                  <button onClick={() => setError(null)} className="text-neutral-400 hover:text-white">✕</button>
               </div>
            )}

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
               <div className="flex items-center gap-1.5 bg-[#09090b] p-1.5 rounded-xl border border-white/15 w-full sm:w-auto">
                  <button
                     type="button"
                     onClick={() => setContactFilter("all")}
                     className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                        contactFilter === "all" ? "bg-white text-black shadow-sm" : "text-neutral-400 hover:text-white"
                     }`}
                  >
                     All ({members.length - 1})
                  </button>
                  <button
                     type="button"
                     onClick={() => setContactFilter("online")}
                     className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                        contactFilter === "online" ? "bg-white text-black shadow-sm" : "text-neutral-400 hover:text-white"
                     }`}
                  >
                     Online ({Array.from(onlineUserIds).length})
                  </button>
               </div>

               <div className="relative w-full sm:w-80">
                  <HiSearch className="absolute left-3.5 top-3.5 text-neutral-400" size={16} />
                  <input
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     placeholder="Search teammates..."
                     className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/15 bg-[#09090b] text-xs sm:text-sm text-white placeholder:text-neutral-500 outline-none focus:border-white transition"
                  />
               </div>
            </div>

            {/* Teammates Big Cards Grid */}
            {loading ? (
               <div className="py-24 text-center text-sm text-neutral-400 flex flex-col items-center gap-3">
                  <div className="h-7 w-7 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Loading directory...</span>
               </div>
            ) : filteredMembers.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                  {filteredMembers.map((member) => {
                     const memberId = normalizeId(member.userId || member._id);
                     const avatarSrc = getAvatarSrc(member);
                     const isOnline = onlineUserIds.has(memberId);

                     return (
                        <div
                           key={memberId}
                           className="big-card-interactive p-6 flex flex-col justify-between gap-5 group"
                        >
                           <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-4 min-w-0">
                                 <div className="relative shrink-0">
                                    <img
                                       src={avatarSrc}
                                       alt={member.name || member.email}
                                       className="h-14 w-14 rounded-2xl border border-white/20 object-cover shadow-sm"
                                    />
                                    <span
                                       className={`absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-black ${
                                          isOnline ? "bg-white" : "bg-neutral-600"
                                       }`}
                                    />
                                 </div>

                                 <div className="min-w-0 space-y-1">
                                    <h3 className="font-bold text-base text-white group-hover:text-white transition truncate">
                                       {member.name || member.email}
                                    </h3>
                                    <p className="text-xs text-neutral-400 truncate">{member.email}</p>
                                 </div>
                              </div>

                              <span className="badge-bw px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider shrink-0">
                                 {isOnline ? "Online" : "Offline"}
                              </span>
                           </div>

                           <div className="flex items-center justify-between pt-4 border-t border-white/10 text-xs">
                              <span className="text-xs font-mono text-neutral-400 capitalize">
                                 {member.role || "Member"}
                              </span>

                              <button
                                 type="button"
                                 onClick={() => startDmWithUser(member)}
                                 className="btn-white py-2 px-4 rounded-xl transition font-bold text-xs flex items-center gap-1.5"
                              >
                                 <HiChatAlt2 size={14} />
                                 <span>Start Chat</span>
                              </button>
                           </div>
                        </div>
                     );
                  })}
               </div>
            ) : (
               <div className="big-card text-center py-20 p-8 space-y-3">
                  <HiUsers className="mx-auto text-neutral-600" size={48} />
                  <h3 className="text-lg font-bold text-white">No teammates found</h3>
                  <p className="text-xs sm:text-sm text-neutral-400 max-w-sm mx-auto">
                     Invite coworkers to start direct messaging.
                  </p>
               </div>
            )}
         </PageShell>
      );
   }

   // Full-Screen Dedicated DM View (Pure Black & White)
   return (
      <div className="fixed inset-0 z-50 bg-black text-white flex flex-col overflow-hidden">
         {/* Top Header Bar */}
         <header className="h-16 border-b border-white/10 bg-black/95 px-4 sm:px-6 flex items-center justify-between gap-4 backdrop-blur-2xl shrink-0 z-20">
            <div className="flex items-center gap-3 min-w-0 flex-1">
               <button
                  type="button"
                  onClick={backToDirectory}
                  className="btn-dark flex items-center gap-2 px-3.5 py-2 text-xs font-bold shrink-0"
               >
                  <HiArrowLeft size={16} />
                  <span className="hidden sm:inline">Back</span>
               </button>

               <div className="h-5 w-px bg-white/10 hidden sm:block" />

               <div className="flex items-center gap-3.5 min-w-0">
                  <div className="relative shrink-0">
                     <img
                        src={getAvatarSrc(activeRecipient)}
                        alt={activeRecipient.name}
                        className="h-9 w-9 rounded-xl border border-white/20 object-cover"
                     />
                     <span
                        className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-black ${
                           onlineUserIds.has(normalizeId(activeRecipient.userId || activeRecipient._id))
                              ? "bg-white"
                              : "bg-neutral-600"
                        }`}
                     />
                  </div>

                  <div className="min-w-0">
                     <h3 className="truncate text-sm sm:text-base font-bold text-white">
                        {activeRecipient.name || activeRecipient.email}
                     </h3>
                     <p className="text-xs text-neutral-400 truncate font-mono">
                        {onlineUserIds.has(normalizeId(activeRecipient.userId || activeRecipient._id)) ? "• Online" : "• Offline"}
                     </p>
                  </div>
               </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center gap-2 shrink-0">
               {latestMyMessageId && (
                  <button
                     type="button"
                     onClick={handleDeleteLatestMessage}
                     className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/20 bg-white/10 text-white hover:bg-white hover:text-black text-xs font-bold transition"
                     title="Delete your latest direct message"
                  >
                     <HiTrash size={14} />
                     <span className="hidden sm:inline">Delete Last</span>
                  </button>
               )}

               <button
                  type="button"
                  onClick={() => navigate("/people")}
                  className="btn-dark flex items-center gap-2 px-3.5 py-2 text-xs font-bold"
               >
                  <HiUser size={15} />
                  <span className="hidden sm:inline">Team Roster</span>
               </button>
            </div>
         </header>

         {error && (
            <div className="bg-[#141418] border-b border-white/20 px-4 py-2 text-xs font-bold text-white flex items-center justify-between shrink-0">
               <span>{error}</span>
               <button onClick={() => setError(null)} className="text-neutral-400 hover:text-white">
                  <HiX size={15} />
               </button>
            </div>
         )}

         {/* Typing Indicator Bar */}
         {typingUsers.length > 0 && (
            <div className="bg-black border-b border-white/10 px-6 py-2 text-xs font-mono text-neutral-400 shrink-0">
               <span>{activeRecipient.name || "Teammate"} is typing...</span>
            </div>
         )}

         {/* Main DM Messages Body */}
         <div ref={messageListRef} className="flex-1 min-h-0 p-4 sm:p-6 lg:p-8 overflow-y-auto space-y-5 app-grid-bg">
            {messages.length > 0 ? (
               messages.filter((m) => !m.isDeleted).map((msg) => {
                  const isMe = normalizeId(msg.user?._id || msg.user) === normalizeId(user?._id);
                  const isLatestMyMessage = msg._id === latestMyMessageId;

                  return (
                     <div key={msg._id} className={`group flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                        <div className="mb-1.5 flex items-center gap-2 text-xs text-neutral-400 font-mono">
                           <span className="font-bold text-white">{isMe ? "You" : msg.user?.name || activeRecipient.name}</span>
                           <span>•</span>
                           <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>

                        <div className="relative group/bubble max-w-[85%] sm:max-w-[70%]">
                           <div className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-lg ${
                              isMe
                                 ? "bg-white text-black font-semibold rounded-tr-xs"
                                 : "bg-[#0d0d10] border border-white/15 text-white rounded-tl-xs"
                           }`}>
                              {msg.text}
                           </div>

                           {/* Hover Action Bar: Delete (for latest message) */}
                           {isLatestMyMessage && (
                              <div className="absolute -top-8 right-0 hidden group-hover:flex items-center gap-1 bg-black border border-white/20 px-2 py-1 rounded-xl shadow-2xl z-10 text-xs">
                                 <button
                                    type="button"
                                    onClick={() => handleDeleteMsg(msg._id)}
                                    className="p-1 text-neutral-300 hover:text-white flex items-center gap-1 text-xs font-bold"
                                    title="Delete latest message"
                                 >
                                    <HiTrash size={14} />
                                    <span>Delete</span>
                                 </button>
                              </div>
                           )}
                        </div>
                     </div>
                  );
               })
            ) : (
               <div className="py-24 text-center text-sm text-neutral-500">No direct messages yet. Send a message to start!</div>
            )}
            <div ref={messagesEndRef} />
         </div>

         {/* DM Input Footer Bar */}
         <footer className="p-4 sm:p-5 border-t border-white/10 bg-black/95 shrink-0">
            <form onSubmit={handleSendMessage} className="flex gap-3 max-w-5xl mx-auto">
               <input
                  value={messageText}
                  onChange={handleInputChange}
                  placeholder={`Message ${activeRecipient.name || activeRecipient.email}...`}
                  className="flex-1 bg-[#0f0f12] border border-white/15 px-5 py-3 rounded-xl text-xs sm:text-sm text-white placeholder:text-neutral-500 outline-none focus:border-white transition"
               />
               <button
                  type="submit"
                  disabled={!messageText.trim()}
                  className="btn-white px-6 py-3 text-xs font-bold transition disabled:opacity-40"
               >
                  Send
               </button>
            </form>
         </footer>
      </div>
   );
}
