import { useEffect, useRef, useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
   HiHashtag,
   HiLockClosed,
   HiPlus,
   HiTrash,
   HiPencil,
   HiEmojiHappy,
   HiXCircle,
   HiUsers,
   HiUserAdd,
   HiSearch,
   HiChatAlt2,
   HiGlobeAlt,
   HiPaperClip,
   HiAnnotation,
   HiClock,
   HiArrowLeft,
   HiArrowsExpand,
   HiSparkles,
   HiCheck,
   HiX,
} from "react-icons/hi";
import {
   getChannels,
   createChannel,
   deleteChannel,
   addMember,
   removeMember,
   getMessages,
   editMessage,
   deleteMessage,
   pinMessage,
   unpinMessage,
   getPinnedMessages,
   addReaction,
   removeReaction,
   getThreadReplies,
   sendThreadReply,
} from "../../services/chatService";
import { getWorkspaceMembers } from "../../services/workspaceService";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { PageShell } from "../../components/common/PageShell";

const EMOJI_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🔥", "🎉", "✨"];

export default function Chat() {
   const { user } = useAuth();
   const socket = useSocket();
   const navigate = useNavigate();
   const [searchParams, setSearchParams] = useSearchParams();

   const [channels, setChannels] = useState([]);
   const [activeChannel, setActiveChannel] = useState(null);
   const [messages, setMessages] = useState([]);
   const [pinnedMessages, setPinnedMessages] = useState([]);
   const [workspaceMembers, setWorkspaceMembers] = useState([]);
   const [messageText, setMessageText] = useState("");
   const [error, setError] = useState(null);
   const [filterTab, setFilterTab] = useState("all"); // 'all', 'public', 'private'
   const [searchQuery, setSearchQuery] = useState("");

   const [typingUsers, setTypingUsers] = useState([]);
   const [onlineUsers, setOnlineUsers] = useState([]);
   const [isLoadingChannels, setIsLoadingChannels] = useState(true);
   const [isLoadingMessages, setIsLoadingMessages] = useState(false);
   const [showDetails, setShowDetails] = useState(false);
   const [unreadCounts, setUnreadCounts] = useState({});
   const [activeThread, setActiveThread] = useState(null);
   const [threadReplies, setThreadReplies] = useState([]);
   const [threadReplyText, setThreadReplyText] = useState("");
   const [threadLoading, setThreadLoading] = useState(false);
   const isMountedRef = useRef(true);

   const [editingMessageId, setEditingMessageId] = useState(null);
   const [editingText, setEditingText] = useState("");
   const [showPinned, setShowPinned] = useState(false);

   // Modal States
   const [showCreateModal, setShowCreateModal] = useState(false);
   const [newChannelName, setNewChannelName] = useState("");
   const [newChannelType, setNewChannelType] = useState("public"); // 'public' or 'private'
   const [newChannelTopic, setNewChannelTopic] = useState("");
   const [selectedMemberIds, setSelectedMemberIds] = useState([]);
   const [showManageMembersModal, setShowManageMembersModal] = useState(false);

   const socketRef = useRef(socket);
   const activeChannelRef = useRef(null);
   const userRef = useRef(user);
   const typingTimeoutRef = useRef(null);
   const messagesEndRef = useRef(null);

   const normalizeId = (val) => (val?._id || val)?.toString();

   const refreshChannels = async () => {
      setIsLoadingChannels(true);
      try {
         const res = await getChannels({ type: "channel" });
         const nextChannels = (res.data.channels || []).filter((c) => c.type !== "dm");
         if (isMountedRef.current) {
            setChannels(nextChannels);
         }
         return nextChannels;
      } catch (err) {
         if (isMountedRef.current) {
            setError(err.response?.data?.message || "Failed to load channels");
         }
         return [];
      } finally {
         if (isMountedRef.current) {
            setIsLoadingChannels(false);
         }
      }
   };

   const refreshWorkspaceMembers = async () => {
      try {
         const res = await getWorkspaceMembers();
         if (isMountedRef.current) {
            setWorkspaceMembers(res.data.members || []);
         }
      } catch {
         // ignore
      }
   };

   const refreshMessages = async (channelId) => {
      setIsLoadingMessages(true);
      setMessages([]);
      try {
         const res = await getMessages(channelId);
         if (isMountedRef.current) {
            setMessages(res.data.messages || []);
         }
      } catch {
         if (isMountedRef.current) {
            setError("Failed to load messages");
         }
      } finally {
         if (isMountedRef.current) {
            setIsLoadingMessages(false);
         }
      }
   };

   const loadPinnedMessages = async (channelId) => {
      try {
         const res = await getPinnedMessages(channelId);
         if (isMountedRef.current) {
            setPinnedMessages(res.data.pinnedMessages || []);
         }
      } catch {
         // ignore
      }
   };

   useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
   }, [messages]);

   useEffect(() => {
      isMountedRef.current = true;
      return () => {
         isMountedRef.current = false;
      };
   }, []);

   useEffect(() => {
      const initialize = async () => {
         refreshWorkspaceMembers();
         const nextChannels = await refreshChannels();

         const channelIdParam = searchParams.get("channel");
         if (channelIdParam) {
            const target = nextChannels.find((ch) => normalizeId(ch._id) === channelIdParam);
            if (target) {
               setActiveChannel(target);
            }
         }
      };

      initialize();
   }, []);

   useEffect(() => {
      activeChannelRef.current = activeChannel;
   }, [activeChannel]);

   useEffect(() => {
      userRef.current = user;
   }, [user]);

   // Socket Listeners
   useEffect(() => {
      if (!socket) return;
      socketRef.current = socket;

      socket.emit("userOnline");

      socket.on("newMessage", (newMessage) => {
         const currentId = normalizeId(activeChannelRef.current?._id);
         const targetId = normalizeId(newMessage.channel);
         if (currentId && targetId && currentId === targetId) {
            setMessages((curr) => {
               if (curr.some((m) => normalizeId(m._id) === normalizeId(newMessage._id))) return curr;
               return [...curr, newMessage];
            });
         } else if (targetId) {
            setUnreadCounts((curr) => ({
               ...curr,
               [targetId]: (curr[targetId] || 0) + 1,
            }));
         }
      });

      socket.on("messageEdited", (editedMessage) => {
         if (normalizeId(activeChannelRef.current?._id) === normalizeId(editedMessage.channel)) {
            setMessages((curr) => curr.map((m) => (normalizeId(m._id) === normalizeId(editedMessage._id) ? editedMessage : m)));
         }
      });

      socket.on("messageDeleted", ({ messageId }) => {
         setMessages((curr) => curr.filter((m) => normalizeId(m._id) !== normalizeId(messageId)));
      });

      socket.on("reactionAdded", (message) => {
         if (normalizeId(activeChannelRef.current?._id) === normalizeId(message.channel)) {
            setMessages((curr) => curr.map((m) => (normalizeId(m._id) === normalizeId(message._id) ? message : m)));
         }
      });

      socket.on("reactionRemoved", (message) => {
         if (normalizeId(activeChannelRef.current?._id) === normalizeId(message.channel)) {
            setMessages((curr) => curr.map((m) => (normalizeId(m._id) === normalizeId(message._id) ? message : m)));
         }
      });

      socket.on("messagePinned", (message) => {
         if (normalizeId(activeChannelRef.current?._id) === normalizeId(message.channel)) {
            setPinnedMessages((curr) => [...curr.filter((p) => normalizeId(p._id) !== normalizeId(message._id)), message]);
            setMessages((curr) => curr.map((m) => (normalizeId(m._id) === normalizeId(message._id) ? message : m)));
         }
      });

      socket.on("messageUnpinned", ({ messageId }) => {
         setPinnedMessages((curr) => curr.filter((m) => normalizeId(m._id) !== normalizeId(messageId)));
         setMessages((curr) => curr.map((m) => (normalizeId(m._id) === normalizeId(messageId) ? { ...m, isPinned: false } : m)));
      });

      socket.on("typing", ({ channelId, isTyping, user: typingUser }) => {
         if (normalizeId(activeChannelRef.current?._id) !== normalizeId(channelId)) return;
         if (normalizeId(typingUser?.id || typingUser?._id) === normalizeId(userRef.current?._id)) return;

         setTypingUsers((curr) => {
            const typingId = normalizeId(typingUser?.id || typingUser?._id);
            if (!isTyping) return curr.filter((u) => normalizeId(u.id || u._id) !== typingId);
            if (curr.some((u) => normalizeId(u.id || u._id) === typingId)) return curr;
            return [...curr, typingUser];
         });
      });

      socket.on("presenceUpdate", ({ userId, status, name, avatar, color }) => {
         setOnlineUsers((curr) => {
            const filtered = curr.filter((u) => u.id !== userId);
            if (status === "online") return [...filtered, { id: userId, name, avatar, color, status }];
            return filtered;
         });
      });

      socket.on("channelCreated", (newChannel) => {
         if (newChannel.type === "dm") return;
         setChannels((curr) => {
            if (curr.some((c) => normalizeId(c._id) === normalizeId(newChannel._id))) return curr;
            return [newChannel, ...curr];
         });
      });

      socket.on("channelDeleted", ({ channelId }) => {
         setChannels((curr) => curr.filter((c) => normalizeId(c._id) !== normalizeId(channelId)));
         if (normalizeId(activeChannelRef.current?._id) === normalizeId(channelId)) {
            backToDirectory();
         }
      });

      return () => {
         socket.off("newMessage");
         socket.off("messageEdited");
         socket.off("messageDeleted");
         socket.off("reactionAdded");
         socket.off("reactionRemoved");
         socket.off("messagePinned");
         socket.off("messageUnpinned");
         socket.off("typing");
         socket.off("presenceUpdate");
         socket.off("channelCreated");
         socket.off("channelDeleted");
      };
   }, [socket]);

   useEffect(() => {
      if (!activeChannel || !socketRef.current) return;
      socketRef.current.emit("joinChannel", activeChannel._id);
      refreshMessages(activeChannel._id);
      loadPinnedMessages(activeChannel._id);
      setUnreadCounts((curr) => ({ ...curr, [activeChannel._id]: 0 }));
   }, [activeChannel]);

   const handleSelectChannel = (channel) => {
      setActiveChannel(channel);
      setShowPinned(false);
      setEditingMessageId(null);
      setError(null);
      setActiveThread(null);
      setThreadReplies([]);
      setThreadReplyText("");
      setUnreadCounts((curr) => ({ ...curr, [channel._id]: 0 }));
      setSearchParams({ channel: channel._id });
   };

   const backToDirectory = () => {
      setActiveChannel(null);
      setMessages([]);
      setSearchParams({});
   };

   const handleCreateChannelSubmit = async (e) => {
      e.preventDefault();
      if (!newChannelName.trim()) return;

      try {
         const membersToInclude = newChannelType === "private" ? selectedMemberIds : [];
         if (!membersToInclude.includes(user._id)) {
            membersToInclude.push(user._id);
         }

         const res = await createChannel({
            name: newChannelName.trim(),
            type: newChannelType,
            topic: newChannelTopic,
            members: membersToInclude,
         });

         const created = res.data.channel;
         if (created) {
            setChannels((prev) => [created, ...prev.filter((c) => normalizeId(c._id) !== normalizeId(created._id))]);
            handleSelectChannel(created);
         }

         setShowCreateModal(false);
         setNewChannelName("");
         setNewChannelType("public");
         setNewChannelTopic("");
         setSelectedMemberIds([]);
      } catch (err) {
         setError(err.response?.data?.message || "Failed to create channel");
      }
   };

   const handleDeleteChannel = async (channelId) => {
      if (!window.confirm("Are you sure you want to delete this channel? All messages will be permanently removed.")) {
         return;
      }

      try {
         await deleteChannel(channelId);
         setChannels((curr) => curr.filter((c) => normalizeId(c._id) !== normalizeId(channelId)));
         if (normalizeId(activeChannel?._id) === normalizeId(channelId)) {
            backToDirectory();
         }
      } catch (err) {
         setError(err.response?.data?.message || "Only the channel creator can delete this channel.");
      }
   };

   const handleToggleMember = async (targetUserId) => {
      if (!activeChannel) return;
      const isMember = activeChannel.members?.some(
         (m) => normalizeId(m._id || m) === normalizeId(targetUserId)
      );

      try {
         if (isMember) {
            const res = await removeMember(activeChannel._id, targetUserId);
            setActiveChannel(res.data.channel);
         } else {
            const res = await addMember(activeChannel._id, targetUserId);
            setActiveChannel(res.data.channel);
         }
      } catch (err) {
         setError(err.response?.data?.message || "Failed to update channel member");
      }
   };

   const handleInputChange = (e) => {
      const val = e.target.value;
      setMessageText(val);

      if (socketRef.current && activeChannelRef.current) {
         socketRef.current.emit("typing", {
            channelId: activeChannelRef.current._id,
            isTyping: val.trim().length > 0,
         });

         clearTimeout(typingTimeoutRef.current);
         typingTimeoutRef.current = setTimeout(() => {
            if (socketRef.current && activeChannelRef.current) {
               socketRef.current.emit("typing", {
                  channelId: activeChannelRef.current._id,
                  isTyping: false,
               });
            }
         }, 2500);
      }
   };

   const handleSendMessage = (e) => {
      e.preventDefault();
      if (!messageText.trim() || !activeChannel || !socketRef.current) return;

      socketRef.current.emit("sendMessage", {
         channelId: activeChannel._id,
         text: messageText.trim(),
      });
      setMessageText("");
      socketRef.current.emit("typing", { channelId: activeChannel._id, isTyping: false });
   };

   const openThread = async (message) => {
      if (!message) return;
      setActiveThread(message);
      setThreadLoading(true);
      setThreadReplies([]);
      try {
         const res = await getThreadReplies(message._id);
         setThreadReplies(res.data.threadReplies || []);
      } catch {
         setError("Failed to load thread replies");
      } finally {
         setThreadLoading(false);
      }
   };

   const handleThreadReplySubmit = async (e) => {
      e.preventDefault();
      if (!threadReplyText.trim() || !activeThread || !activeChannel) return;

      try {
         const res = await sendThreadReply(activeChannel._id, threadReplyText.trim(), activeThread._id);
         const nextReply = res.data.message;
         if (nextReply) {
            setThreadReplies((curr) => [...curr, nextReply]);
            setMessages((curr) =>
               curr.map((msg) => (msg._id === activeThread._id ? { ...msg, threadReplyCount: (msg.threadReplyCount || 0) + 1 } : msg))
            );
            setActiveThread((curr) => (curr ? { ...curr, threadReplyCount: (curr.threadReplyCount || 0) + 1 } : curr));
         }
         setThreadReplyText("");
      } catch {
         setError("Failed to send thread reply");
      }
   };

   const handleEdit = async (msgId, text) => {
      try {
         await editMessage(msgId, text);
         if (socketRef.current && activeChannelRef.current) {
            socketRef.current.emit("editMessage", {
               messageId: msgId,
               channelId: activeChannelRef.current._id,
               text,
            });
         }
         setEditingMessageId(null);
         setEditingText("");
      } catch {
         setError("Failed to edit message");
      }
   };

   const handleDeleteMsg = async (msgId) => {
      try {
         await deleteMessage(msgId);
         if (socketRef.current && activeChannelRef.current) {
            socketRef.current.emit("deleteMessage", {
               messageId: msgId,
               channelId: activeChannelRef.current._id,
            });
         }
      } catch {
         setError("Failed to delete message");
      }
   };

   const filteredChannels = useMemo(() => {
      let list = channels.filter((c) => c.type !== "dm");
      if (filterTab === "public") list = list.filter((c) => c.type === "public");
      else if (filterTab === "private") list = list.filter((c) => c.type === "private");

      if (!searchQuery.trim()) return list;
      const q = searchQuery.toLowerCase();
      return list.filter((c) => c.name?.toLowerCase().includes(q) || c.topic?.toLowerCase().includes(q));
   }, [channels, filterTab, searchQuery]);

   const visibleMessages = useMemo(() => messages.filter((msg) => !msg.isDeleted), [messages]);

   const isCreatorOfActive = useMemo(() => {
      if (!activeChannel || !user) return false;
      const creatorId = activeChannel.createdBy?._id || activeChannel.createdBy;
      return normalizeId(creatorId) === normalizeId(user._id);
   }, [activeChannel, user]);

   // Directory Catalog View (Default)
   if (!activeChannel) {
      return (
         <PageShell
            title="Channels & Rooms"
            subtitle="Browse workspace channels, join discussion groups, or create a new public or private room."
            actions={
               <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#f9ebae] hover:bg-[#e6d695] text-zinc-950 text-xs font-bold shadow-md transition"
               >
                  <HiPlus size={14} />
                  <span>Create Channel</span>
               </button>
            }
         >
            {error && (
               <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300">
                  {error}
               </div>
            )}

            {/* Filter and Search Control */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
               <div className="flex items-center gap-1.5 bg-zinc-950 p-1.5 rounded-xl border border-zinc-800/80 w-full sm:w-auto">
                  {[
                     { key: "all", label: `All Rooms (${channels.length})` },
                     { key: "public", label: `# Public (${channels.filter((c) => c.type === "public").length})` },
                     { key: "private", label: `🔒 Private (${channels.filter((c) => c.type === "private").length})` },
                  ].map((tab) => (
                     <button
                        key={tab.key}
                        type="button"
                        onClick={() => setFilterTab(tab.key)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                           filterTab === tab.key
                              ? "bg-[#f9ebae] text-zinc-950 shadow"
                              : "text-zinc-400 hover:text-white"
                        }`}
                     >
                        {tab.label}
                     </button>
                  ))}
               </div>

               <div className="relative w-full sm:w-80">
                  <HiSearch className="absolute left-3.5 top-2.5 text-zinc-500" size={14} />
                  <input
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     placeholder="Search rooms by name or topic..."
                     className="w-full pl-9 pr-4 py-1.5 rounded-xl border border-zinc-800 bg-zinc-950 text-xs text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-[#f9ebae] transition"
                  />
               </div>
            </div>

            {/* Channels Cards Grid */}
            {isLoadingChannels ? (
               <div className="py-20 text-center text-xs text-zinc-500 flex flex-col items-center gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#f9ebae] border-t-transparent" />
                  <span>Loading channels…</span>
               </div>
            ) : filteredChannels.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredChannels.map((channel) => {
                     const isPrivate = channel.type === "private";
                     const unreadValue = unreadCounts[channel._id] || 0;

                     return (
                        <div
                           key={channel._id}
                           className="group p-5 rounded-2xl border border-zinc-800/80 bg-zinc-950/70 hover:border-[#f9ebae]/40 hover:bg-zinc-900/60 transition flex flex-col justify-between space-y-4 shadow-xl"
                        >
                           <div>
                              <div className="flex items-center justify-between gap-2 mb-3">
                                 <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1 ${
                                       isPrivate
                                          ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                                          : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                    }`}
                                 >
                                    {isPrivate ? <HiLockClosed size={10} /> : <HiGlobeAlt size={10} />}
                                    <span>{isPrivate ? "Private Group" : "Public Room"}</span>
                                 </span>

                                 {unreadValue > 0 && (
                                    <span className="rounded-full bg-[#f9ebae] px-2 py-0.5 text-[10px] font-black text-zinc-950">
                                       {unreadValue} unread
                                    </span>
                                 )}
                              </div>

                              <div className="flex items-center gap-2">
                                 <HiHashtag className="text-[#f9ebae] shrink-0" size={18} />
                                 <h3 className="font-bold text-sm text-zinc-100 group-hover:text-[#f9ebae] transition truncate">
                                    {channel.name}
                                 </h3>
                              </div>

                              <p className="text-xs text-zinc-400 mt-2 line-clamp-2 leading-relaxed">
                                 {channel.topic || channel.description || (isPrivate ? "Private team group for restricted members." : "Public channel for open team discussion.")}
                              </p>
                           </div>

                           <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80 text-xs">
                              <span className="text-[11px] font-semibold text-zinc-500 flex items-center gap-1">
                                 <HiUsers size={12} />
                                 {channel.members?.length || 0} members
                              </span>

                              <button
                                 type="button"
                                 onClick={() => handleSelectChannel(channel)}
                                 className="py-1.5 px-3.5 bg-[#f9ebae] hover:bg-[#e6d695] text-zinc-950 rounded-xl transition font-bold text-xs flex items-center gap-1 shadow-md shadow-[#f9ebae]/10"
                              >
                                 <HiArrowsExpand size={13} />
                                 <span>Open Focus Chat</span>
                              </button>
                           </div>
                        </div>
                     );
                  })}
               </div>
            ) : (
               <div className="text-center py-20 rounded-2xl border border-zinc-800/80 bg-zinc-950/40 p-6 space-y-3">
                  <HiChatAlt2 className="mx-auto text-zinc-600" size={44} />
                  <h3 className="text-base font-bold text-zinc-200">No channels found</h3>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                     Create a channel to start team conversations.
                  </p>
               </div>
            )}

            {/* Create Channel Modal */}
            {showCreateModal && (
               <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4 backdrop-blur-sm">
                  <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-4">
                     <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                        <h3 className="text-base font-bold text-zinc-100">Create New Channel</h3>
                        <button onClick={() => setShowCreateModal(false)} className="text-zinc-400 hover:text-white">
                           <HiX size={18} />
                        </button>
                     </div>
                     <form onSubmit={handleCreateChannelSubmit} className="space-y-4">
                        <div>
                           <label className="text-xs font-semibold text-zinc-300">Channel Name</label>
                           <input
                              value={newChannelName}
                              onChange={(e) => setNewChannelName(e.target.value)}
                              placeholder="e.g. product-roadmap"
                              required
                              className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-sm text-zinc-100 focus:border-[#f9ebae] outline-none"
                           />
                        </div>
                        <div>
                           <label className="text-xs font-semibold text-zinc-300">Privacy</label>
                           <div className="mt-1.5 grid grid-cols-2 gap-2">
                              {["public", "private"].map((p) => (
                                 <button
                                    key={p}
                                    type="button"
                                    onClick={() => setNewChannelType(p)}
                                    className={`py-2 px-3 rounded-xl border text-xs font-bold capitalize transition ${
                                       newChannelType === p
                                          ? "border-[#f9ebae] bg-[#f9ebae]/10 text-[#f9ebae]"
                                          : "border-zinc-800 bg-zinc-900 text-zinc-400"
                                    }`}
                                 >
                                    {p === "public" ? "🌐 Public Room" : "🔒 Private Group"}
                                 </button>
                              ))}
                           </div>
                        </div>
                        <div>
                           <label className="text-xs font-semibold text-zinc-300">Topic / Purpose (Optional)</label>
                           <input
                              value={newChannelTopic}
                              onChange={(e) => setNewChannelTopic(e.target.value)}
                              placeholder="What is this channel about?"
                              className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-sm text-zinc-100 focus:border-[#f9ebae] outline-none"
                           />
                        </div>
                        <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                           <button
                              type="button"
                              onClick={() => setShowCreateModal(false)}
                              className="px-4 py-2 rounded-xl border border-zinc-800 text-xs font-semibold text-zinc-400 hover:text-white"
                           >
                              Cancel
                           </button>
                           <button
                              type="submit"
                              className="px-4 py-2 rounded-xl bg-[#f9ebae] hover:bg-[#e6d695] text-xs font-extrabold text-zinc-950 shadow-md"
                           >
                              Create Channel
                           </button>
                        </div>
                     </form>
                  </div>
               </div>
            )}
         </PageShell>
      );
   }

   // Full-Screen Dedicated Chat View
   return (
      <div className="fixed inset-0 z-50 bg-[#09090b] text-zinc-100 flex flex-col overflow-hidden">
         {/* Channel Top Header Bar */}
         <header className="h-16 border-b border-zinc-800/80 bg-zinc-950/90 px-4 sm:px-6 flex items-center justify-between gap-4 backdrop-blur-xl shrink-0">
            <div className="flex items-center gap-3 min-w-0 flex-1">
               <button
                  type="button"
                  onClick={backToDirectory}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-xs font-bold text-zinc-300 transition shrink-0"
               >
                  <HiArrowLeft size={16} />
                  <span className="hidden sm:inline">Back to Channels</span>
               </button>

               <div className="h-4 w-px bg-zinc-800 hidden sm:block" />

               <div className="min-w-0">
                  <div className="flex items-center gap-2">
                     <h2 className="text-base font-extrabold text-zinc-100 flex items-center gap-1.5 truncate">
                        {activeChannel.type === "private" ? (
                           <HiLockClosed className="text-amber-400" size={16} />
                        ) : (
                           <HiHashtag className="text-[#f9ebae]" size={18} />
                        )}
                        <span>{activeChannel.name}</span>
                     </h2>

                     <span
                        className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border shrink-0 ${
                           activeChannel.type === "private"
                              ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        }`}
                     >
                        {activeChannel.type === "private" ? "Private" : "Public"}
                     </span>
                  </div>
                  {activeChannel.topic && (
                     <p className="text-xs text-zinc-400 truncate mt-0.5">{activeChannel.topic}</p>
                  )}
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

               {activeChannel.type === "private" && isCreatorOfActive && (
                  <button
                     type="button"
                     onClick={() => setShowManageMembersModal(true)}
                     className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs font-bold text-amber-300 transition"
                  >
                     <HiUserAdd size={14} />
                     <span className="hidden sm:inline">Manage ({activeChannel.members?.length || 0})</span>
                  </button>
               )}

               <button
                  type="button"
                  onClick={() => setShowDetails(!showDetails)}
                  className="p-2 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white transition"
                  title="Toggle Channel Details"
               >
                  <HiUsers size={16} />
               </button>

               {isCreatorOfActive && (
                  <button
                     type="button"
                     onClick={() => handleDeleteChannel(activeChannel._id)}
                     className="p-2 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition"
                     title="Delete Channel"
                  >
                     <HiTrash size={16} />
                  </button>
               )}
            </div>
         </header>

         {/* Pinned Messages Drawer */}
         {showPinned && pinnedMessages.length > 0 && (
            <div className="bg-zinc-950 border-b border-zinc-800 p-4 space-y-2 shrink-0">
               <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#f9ebae]">📌 Pinned Channel Messages</span>
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

         {/* Channel Info Drawer */}
         {showDetails && (
            <div className="bg-zinc-900/90 border-b border-zinc-800 p-4 text-xs space-y-2 shrink-0">
               <div className="flex justify-between items-center">
                  <span className="font-bold text-zinc-200 uppercase tracking-widest text-[10px]">Channel Roster & Description</span>
                  <button onClick={() => setShowDetails(false)} className="text-zinc-400 hover:text-white"><HiX size={16} /></button>
               </div>
               <p className="text-zinc-400">{activeChannel.topic || activeChannel.description || "Public workspace chat room."}</p>
               <div className="flex flex-wrap gap-2 pt-1">
                  {(activeChannel.members || []).map((m) => (
                     <span key={m._id || m} className="px-2 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-[10px] text-zinc-300 font-semibold">
                        {m.name || m.email || "Member"}
                     </span>
                  ))}
               </div>
            </div>
         )}

         {/* Main Messages & Thread View */}
         <div className="flex-1 min-h-0 flex overflow-hidden saas-grid-bg">
            {/* Messages Feed */}
            <div className="flex-1 min-h-0 flex flex-col p-4 sm:p-6 overflow-y-auto space-y-4">
               {visibleMessages.length > 0 ? (
                  visibleMessages.map((msg) => {
                     const isMe = normalizeId(msg.user?._id || msg.user) === normalizeId(user?._id);

                     return (
                        <div key={msg._id} className={`group flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                           <div className="mb-1 flex items-center gap-2 text-[10px] text-zinc-500">
                              <span className="font-bold text-zinc-300">{isMe ? "You" : msg.user?.name || "Teammate"}</span>
                              <span>•</span>
                              <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                           </div>

                           <div className={`relative max-w-[85%] sm:max-w-[70%] p-3.5 rounded-2xl text-xs leading-relaxed shadow-xl ${
                              isMe ? "bg-[#f9ebae] text-zinc-950 font-medium rounded-tr-xs" : "bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-tl-xs"
                           }`}>
                              {msg.text}
                           </div>

                           {/* Thread replies button */}
                           <button
                              onClick={() => openThread(msg)}
                              className="mt-1 text-[10px] font-bold text-[#f9ebae] hover:underline flex items-center gap-1"
                           >
                              <HiAnnotation size={12} />
                              <span>{msg.threadReplyCount || 0} replies</span>
                           </button>
                        </div>
                     );
                  })
               ) : (
                  <div className="py-20 text-center text-xs text-zinc-500">No messages yet. Start the conversation!</div>
               )}
               <div ref={messagesEndRef} />
            </div>

            {/* Thread Replies Panel */}
            {activeThread && (
               <div className="w-80 border-l border-zinc-800 bg-zinc-950 p-4 flex flex-col h-full shrink-0">
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                     <span className="text-xs font-bold text-zinc-100 flex items-center gap-1.5"><HiAnnotation className="text-[#f9ebae]" /> Thread Replies</span>
                     <button onClick={() => setActiveThread(null)} className="text-zinc-400 hover:text-white"><HiX size={16} /></button>
                  </div>

                  <div className="flex-1 overflow-y-auto my-3 space-y-3">
                     <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200">
                        <strong className="text-[#f9ebae] block mb-1">{activeThread.user?.name}:</strong>
                        {activeThread.text}
                     </div>

                     {threadReplies.map((r) => (
                        <div key={r._id} className="p-2.5 rounded-xl border border-zinc-800 bg-zinc-900/50 text-xs text-zinc-300">
                           <strong className="text-zinc-100 block mb-0.5">{r.user?.name}:</strong>
                           {r.text}
                        </div>
                     ))}
                  </div>

                  <form onSubmit={handleThreadReplySubmit} className="flex gap-2 pt-2 border-t border-zinc-800">
                     <input
                        value={threadReplyText}
                        onChange={(e) => setThreadReplyText(e.target.value)}
                        placeholder="Reply to thread..."
                        className="flex-1 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-xl text-xs text-zinc-100 outline-none focus:border-[#f9ebae]"
                     />
                     <button type="submit" className="px-3 py-1.5 bg-[#f9ebae] text-zinc-950 text-xs font-bold rounded-xl">Send</button>
                  </form>
               </div>
            )}
         </div>

         {/* Message Input Footer Bar */}
         <footer className="p-4 border-t border-zinc-800/80 bg-zinc-950/90 shrink-0">
            <form onSubmit={handleSendMessage} className="flex gap-2 max-w-5xl mx-auto">
               <input
                  value={messageText}
                  onChange={handleInputChange}
                  placeholder={`Message #${activeChannel.name}...`}
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
