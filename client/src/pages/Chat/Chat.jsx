import { useEffect, useRef, useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
   HiHashtag,
   HiLockClosed,
   HiPlus,
   HiTrash,
   HiUsers,
   HiUserAdd,
   HiSearch,
   HiChatAlt2,
   HiGlobeAlt,
   HiAnnotation,
   HiArrowLeft,
   HiArrowsExpand,
   HiX,
} from "react-icons/hi";
import {
   getChannels,
   createChannel,
   deleteChannel,
   addMember,
   removeMember,
   getMessages,
   deleteMessage,
   deleteLatestMessage,
   getThreadReplies,
   sendThreadReply,
} from "../../services/chatService";
import { getWorkspaceMembers } from "../../services/workspaceService";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { PageShell } from "../../components/common/PageShell";

export default function Chat() {
   const { user } = useAuth();
   const socket = useSocket();
   const navigate = useNavigate();
   const [searchParams, setSearchParams] = useSearchParams();

   const [channels, setChannels] = useState([]);
   const [activeChannel, setActiveChannel] = useState(null);
   const [messages, setMessages] = useState([]);
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
   const activeThreadRef = useRef(activeThread);
   const typingTimeoutRef = useRef(null);
   const messagesEndRef = useRef(null);
   const threadEndRef = useRef(null);

   useEffect(() => {
      activeThreadRef.current = activeThread;
   }, [activeThread]);

   useEffect(() => {
      threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
   }, [threadReplies]);

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
            if (newMessage.isThreadReply) {
               if (activeThreadRef.current && normalizeId(activeThreadRef.current._id) === normalizeId(newMessage.threadParent)) {
                  setThreadReplies((curr) => {
                     if (curr.some((r) => normalizeId(r._id) === normalizeId(newMessage._id))) return curr;
                     return [...curr, newMessage];
                  });
               }
               setMessages((curr) =>
                  curr.map((m) =>
                     normalizeId(m._id) === normalizeId(newMessage.threadParent)
                        ? { ...m, threadReplyCount: (m.threadReplyCount || 0) + 1 }
                        : m
                  )
               );
            } else {
               setMessages((curr) => {
                  if (curr.some((m) => normalizeId(m._id) === normalizeId(newMessage._id))) return curr;
                  return [...curr, newMessage];
               });
            }
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
         setThreadReplies((curr) => curr.filter((m) => normalizeId(m._id) !== normalizeId(messageId)));
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
         if (newChannel.type === "private") {
            const myId = normalizeId(userRef.current?._id);
            const isMember = newChannel.members?.some((m) => normalizeId(m._id || m) === myId);
            const isCreator = normalizeId(newChannel.createdBy?._id || newChannel.createdBy) === myId;
            if (!isMember && !isCreator) return;
         }
         setChannels((curr) => {
            if (curr.some((c) => normalizeId(c._id) === normalizeId(newChannel._id))) return curr;
            return [newChannel, ...curr];
         });
      });

      socket.on("channelUpdated", (updatedChannel) => {
         if (updatedChannel.type === "dm") return;
         if (updatedChannel.type === "private") {
            const myId = normalizeId(userRef.current?._id);
            const isMember = updatedChannel.members?.some((m) => normalizeId(m._id || m) === myId);
            const isCreator = normalizeId(updatedChannel.createdBy?._id || updatedChannel.createdBy) === myId;
            if (!isMember && !isCreator) {
               setChannels((curr) => curr.filter((c) => normalizeId(c._id) !== normalizeId(updatedChannel._id)));
               if (normalizeId(activeChannelRef.current?._id) === normalizeId(updatedChannel._id)) {
                  backToDirectory();
               }
               return;
            }
         }
         setChannels((curr) =>
            curr.map((c) => (normalizeId(c._id) === normalizeId(updatedChannel._id) ? updatedChannel : c))
         );
         if (normalizeId(activeChannelRef.current?._id) === normalizeId(updatedChannel._id)) {
            setActiveChannel(updatedChannel);
         }
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
         socket.off("typing");
         socket.off("presenceUpdate");
         socket.off("channelCreated");
         socket.off("channelUpdated");
         socket.off("channelDeleted");
      };
   }, [socket]);

   useEffect(() => {
      if (!activeChannel || !socketRef.current) return;
      socketRef.current.emit("joinChannel", activeChannel._id);
      refreshMessages(activeChannel._id);
      setUnreadCounts((curr) => ({ ...curr, [activeChannel._id]: 0 }));
   }, [activeChannel]);

   const handleSelectChannel = (channel) => {
      setActiveChannel(channel);
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

   const handleDeleteMsg = async (msgId) => {
      if (!msgId) return;
      // Optimistic local state removal
      setMessages((curr) => curr.filter((m) => normalizeId(m._id) !== normalizeId(msgId)));
      setThreadReplies((curr) => curr.filter((m) => normalizeId(m._id) !== normalizeId(msgId)));

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
         if (activeChannelRef.current) {
            refreshMessages(activeChannelRef.current._id);
         }
      }
   };

   const handleDeleteLatestMessage = async () => {
      if (!latestMyMessageId) return;
      await handleDeleteMsg(latestMyMessageId);
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

   const latestMyMessageId = useMemo(() => {
      const myMsgs = visibleMessages.filter((m) => normalizeId(m.user?._id || m.user) === normalizeId(user?._id));
      return myMsgs.length > 0 ? myMsgs[myMsgs.length - 1]._id : null;
   }, [visibleMessages, user]);

   const isCreatorOfActive = useMemo(() => {
      if (!activeChannel || !user) return false;
      const creatorId = activeChannel.createdBy?._id || activeChannel.createdBy;
      return normalizeId(creatorId) === normalizeId(user._id);
   }, [activeChannel, user]);

   // Directory Catalog View (Default)
   if (!activeChannel) {
      return (
         <PageShell
            title="Channels"
            subtitle="Browse workspace discussion rooms, join ongoing threads, or launch a new channel."
            actions={
               <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  className="btn-white flex items-center gap-2 px-5 py-2.5 text-xs font-bold shadow-md"
               >
                  <HiPlus size={16} />
                  <span>Create Channel</span>
               </button>
            }
         >
            {error && (
               <div className="p-4 mb-4 rounded-xl bg-[#16161a] border border-white/20 text-xs text-white flex items-center justify-between">
                  <span>{error}</span>
                  <button onClick={() => setError(null)} className="text-neutral-400 hover:text-white">✕</button>
               </div>
            )}

            {/* Filter and Search Control */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
               <div className="flex items-center gap-1.5 bg-[#09090b] p-1.5 rounded-xl border border-white/15 w-full sm:w-auto">
                  {[
                     { key: "all", label: `All (${channels.length})` },
                     { key: "public", label: `Public (${channels.filter((c) => c.type === "public").length})` },
                     { key: "private", label: `Private (${channels.filter((c) => c.type === "private").length})` },
                  ].map((tab) => (
                     <button
                        key={tab.key}
                        type="button"
                        onClick={() => setFilterTab(tab.key)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                           filterTab === tab.key
                              ? "bg-white text-black shadow-sm"
                              : "text-neutral-400 hover:text-white"
                        }`}
                     >
                        {tab.label}
                     </button>
                  ))}
               </div>

               <div className="relative w-full sm:w-80">
                  <HiSearch className="absolute left-3.5 top-3.5 text-neutral-400" size={16} />
                  <input
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     placeholder="Search channels..."
                     className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/15 bg-[#09090b] text-xs sm:text-sm text-white placeholder:text-neutral-500 outline-none focus:border-white transition"
                  />
               </div>
            </div>

            {/* Channels Big Cards Grid */}
            {isLoadingChannels ? (
               <div className="py-24 text-center text-sm text-neutral-400 flex flex-col items-center gap-3">
                  <div className="h-7 w-7 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Loading channels...</span>
               </div>
            ) : filteredChannels.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                  {filteredChannels.map((channel) => {
                     const isPrivate = channel.type === "private";
                     const unreadValue = unreadCounts[channel._id] || 0;

                     return (
                        <div
                           key={channel._id}
                           className="big-card-interactive p-6 flex flex-col justify-between gap-5 group"
                        >
                           <div className="space-y-4">
                              <div className="flex items-center justify-between gap-2">
                                 <span className="badge-bw px-2.5 py-1 text-[10px] font-mono flex items-center gap-1.5 uppercase">
                                    {isPrivate ? <HiLockClosed size={12} /> : <HiGlobeAlt size={12} />}
                                    <span>{isPrivate ? "Private" : "Public"}</span>
                                 </span>

                                 {unreadValue > 0 && (
                                    <span className="rounded-full bg-white px-2.5 py-0.5 text-[10px] font-bold text-black font-mono">
                                       {unreadValue} NEW
                                    </span>
                                 )}
                              </div>

                              <div>
                                 <div className="flex items-center gap-2">
                                    <HiHashtag className="text-neutral-400 shrink-0" size={18} />
                                    <h3 className="font-bold text-base sm:text-lg text-white group-hover:text-white transition truncate">
                                       {channel.name}
                                    </h3>
                                 </div>

                                 <p className="text-xs sm:text-sm text-neutral-400 mt-2 line-clamp-2 leading-relaxed">
                                    {channel.topic || channel.description || (isPrivate ? "Private channel for designated members." : "Public channel for open team discussion.")}
                                 </p>
                              </div>
                           </div>

                           <div className="flex items-center justify-between pt-4 border-t border-white/10 text-xs">
                              <span className="text-xs font-mono text-neutral-400 flex items-center gap-1.5">
                                 <HiUsers size={14} className="text-neutral-500" />
                                 <span>{channel.members?.length || 1} members</span>
                              </span>

                              <button
                                 type="button"
                                 onClick={() => handleSelectChannel(channel)}
                                 className="btn-white py-2 px-4 rounded-xl transition font-bold text-xs flex items-center gap-1.5"
                              >
                                 <HiArrowsExpand size={13} />
                                 <span>Open Room</span>
                              </button>
                           </div>
                        </div>
                     );
                  })}
               </div>
            ) : (
               <div className="big-card text-center py-20 p-8 space-y-3">
                  <HiChatAlt2 className="mx-auto text-neutral-600" size={48} />
                  <h3 className="text-lg font-bold text-white">No channels found</h3>
                  <p className="text-xs sm:text-sm text-neutral-400 max-w-sm mx-auto">
                     Create a channel to start team conversations.
                  </p>
               </div>
            )}

            {/* Create Channel Modal */}
            {showCreateModal && (
               <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
                  <div className="w-full max-w-lg rounded-2xl border border-white/20 bg-[#09090b] p-6 shadow-2xl space-y-5 ring-1 ring-white/10">
                     <div className="flex items-center justify-between border-b border-white/10 pb-3">
                        <h3 className="text-base font-bold text-white">Create New Channel</h3>
                        <button onClick={() => setShowCreateModal(false)} className="rounded-lg p-1 text-neutral-400 hover:text-white hover:bg-white/10">
                           <HiX size={18} />
                        </button>
                     </div>
                     <form onSubmit={handleCreateChannelSubmit} className="space-y-4">
                        <div>
                           <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider font-mono">Channel Name</label>
                           <input
                              value={newChannelName}
                              onChange={(e) => setNewChannelName(e.target.value)}
                              placeholder="e.g. project-apollo"
                              required
                              className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#121214] px-4 py-2.5 text-sm text-white focus:border-white outline-none"
                           />
                        </div>
                        <div>
                           <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider font-mono">Channel Privacy</label>
                           <div className="mt-1.5 grid grid-cols-2 gap-3">
                              {["public", "private"].map((p) => (
                                 <button
                                    key={p}
                                    type="button"
                                    onClick={() => setNewChannelType(p)}
                                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold capitalize transition ${
                                       newChannelType === p
                                          ? "border-white bg-white text-black"
                                          : "border-white/15 bg-[#121214] text-neutral-400"
                                    }`}
                                 >
                                    {p === "public" ? "Public" : "Private"}
                                 </button>
                              ))}
                           </div>
                        </div>
                        {newChannelType === "private" && (
                           <div>
                              <label className="text-xs font-bold text-neutral-300 mb-1.5 block uppercase tracking-wider font-mono">Initial Members</label>
                              <div className="max-h-40 overflow-y-auto space-y-1.5 p-2 rounded-xl border border-white/15 bg-[#121214]">
                                 {workspaceMembers
                                    .filter((m) => normalizeId(m.userId || m._id) !== normalizeId(user?._id))
                                    .map((m) => {
                                       const id = normalizeId(m.userId || m._id);
                                       const isChecked = selectedMemberIds.includes(id);
                                       return (
                                          <label key={id} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/10 cursor-pointer text-xs text-neutral-200">
                                             <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={() => {
                                                   setSelectedMemberIds((curr) =>
                                                      isChecked ? curr.filter((x) => x !== id) : [...curr, id]
                                                   );
                                                }}
                                                className="accent-white"
                                             />
                                             <span className="font-medium">{m.name || m.email}</span>
                                          </label>
                                       );
                                    })}
                              </div>
                           </div>
                        )}
                        <div>
                           <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider font-mono">Topic / Description</label>
                           <input
                              value={newChannelTopic}
                              onChange={(e) => setNewChannelTopic(e.target.value)}
                              placeholder="What is this channel about?"
                              className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#121214] px-4 py-2.5 text-sm text-white focus:border-white outline-none"
                           />
                        </div>
                        <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                           <button
                              type="button"
                              onClick={() => setShowCreateModal(false)}
                              className="px-4 py-2 rounded-xl border border-white/15 text-xs font-bold text-neutral-400 hover:text-white"
                           >
                              Cancel
                           </button>
                           <button
                              type="submit"
                              className="btn-white px-5 py-2 text-xs font-bold"
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

   // Full-Screen Dedicated Chat View (Pure Black & White)
   return (
      <div className="fixed inset-0 z-50 bg-black text-white flex flex-col overflow-hidden">
         {/* Channel Top Header Bar */}
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

               <div className="min-w-0">
                  <div className="flex items-center gap-2.5">
                     <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2 truncate">
                        {activeChannel.type === "private" ? (
                           <HiLockClosed className="text-white" size={16} />
                        ) : (
                           <HiHashtag className="text-neutral-400" size={18} />
                        )}
                        <span>{activeChannel.name}</span>
                     </h2>

                     <span className="badge-bw px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider shrink-0">
                        {activeChannel.type === "private" ? "Private" : "Public"}
                     </span>
                  </div>
                  {activeChannel.topic && (
                     <p className="text-xs text-neutral-400 truncate mt-0.5">{activeChannel.topic}</p>
                  )}
               </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center gap-2 shrink-0">
               {latestMyMessageId && (
                  <button
                     type="button"
                     onClick={handleDeleteLatestMessage}
                     className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/20 bg-white/10 text-white hover:bg-white hover:text-black text-xs font-bold transition"
                     title="Delete your latest message in this channel"
                  >
                     <HiTrash size={14} />
                     <span className="hidden sm:inline">Delete Last</span>
                  </button>
               )}

               {activeChannel.type === "private" && isCreatorOfActive && (
                  <button
                     type="button"
                     onClick={() => setShowManageMembersModal(true)}
                     className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/20 bg-[#121214] text-xs font-bold text-white hover:border-white transition"
                  >
                     <HiUserAdd size={15} />
                     <span className="hidden sm:inline">Manage ({activeChannel.members?.length || 0})</span>
                  </button>
               )}

               <button
                  type="button"
                  onClick={() => setShowDetails(!showDetails)}
                  className="p-2 rounded-xl border border-white/15 bg-[#121214] text-neutral-300 hover:text-white hover:border-white transition"
                  title="Toggle Channel Details"
               >
                  <HiUsers size={18} />
               </button>

               {isCreatorOfActive && (
                  <button
                     type="button"
                     onClick={() => handleDeleteChannel(activeChannel._id)}
                     className="p-2 rounded-xl border border-white/20 bg-white/10 text-white hover:bg-white hover:text-black transition"
                     title="Delete Channel"
                  >
                     <HiTrash size={18} />
                  </button>
               )}
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

         {/* Channel Info Drawer */}
         {showDetails && (
            <div className="bg-[#09090b] border-b border-white/10 p-5 text-xs space-y-3 shrink-0">
               <div className="flex justify-between items-center">
                  <span className="font-bold text-white uppercase tracking-wider font-mono">Members & Channel Info</span>
                  <button onClick={() => setShowDetails(false)} className="text-neutral-400 hover:text-white"><HiX size={18} /></button>
               </div>
               <p className="text-neutral-300">{activeChannel.topic || activeChannel.description || "Workspace discussion room."}</p>
               <div className="flex flex-wrap gap-2 pt-1">
                  {(activeChannel.members || []).map((m) => (
                     <span key={m._id || m} className="badge-bw px-3 py-1 text-xs">
                        {m.name || m.email || "Member"}
                     </span>
                  ))}
               </div>
            </div>
         )}

         {/* Main Messages & Thread View */}
         <div className="flex-1 min-h-0 flex overflow-hidden app-grid-bg">
            {/* Messages Feed */}
            <div className="flex-1 min-h-0 flex flex-col p-4 sm:p-6 lg:p-8 overflow-y-auto space-y-5">
               {visibleMessages.length > 0 ? (
                  visibleMessages.map((msg) => {
                     const isMe = normalizeId(msg.user?._id || msg.user) === normalizeId(user?._id);
                     const isLatestMyMessage = msg._id === latestMyMessageId;

                     return (
                        <div key={msg._id} className={`group flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                           <div className="mb-1.5 flex items-center gap-2 text-xs text-neutral-400 font-mono">
                              <span className="font-bold text-white">{isMe ? "You" : msg.user?.name || "Teammate"}</span>
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

                              {/* Hover Action Bar: Reply & Delete (for latest message) */}
                              <div className={`absolute -top-8 ${isMe ? "right-0" : "left-0"} hidden group-hover:flex items-center gap-1.5 bg-black border border-white/20 px-2 py-1 rounded-xl shadow-2xl z-10 text-xs`}>
                                 <button
                                    type="button"
                                    onClick={() => openThread(msg)}
                                    className="p-1 text-neutral-300 hover:text-white flex items-center gap-1 text-xs font-bold"
                                    title="Reply to message"
                                 >
                                    <HiAnnotation size={14} />
                                    <span>Reply</span>
                                 </button>
                                 {isLatestMyMessage && (
                                    <button
                                       type="button"
                                       onClick={() => handleDeleteMsg(msg._id)}
                                       className="p-1 text-neutral-300 hover:text-white flex items-center gap-1 text-xs font-bold"
                                       title="Delete latest message"
                                    >
                                       <HiTrash size={14} />
                                       <span>Delete</span>
                                    </button>
                                 )}
                              </div>
                           </div>

                           {/* Thread replies button */}
                           {(msg.threadReplyCount || 0) > 0 && (
                              <button
                                 onClick={() => openThread(msg)}
                                 className="mt-1.5 text-xs text-neutral-400 hover:text-white flex items-center gap-1.5 transition font-bold"
                              >
                                 <HiAnnotation size={14} />
                                 <span>{msg.threadReplyCount} {msg.threadReplyCount === 1 ? "reply" : "replies"}</span>
                              </button>
                           )}
                        </div>
                     );
                  })
               ) : (
                  <div className="py-24 text-center text-sm text-neutral-500">No messages in this channel yet. Send a message to start!</div>
               )}
               <div ref={messagesEndRef} />
            </div>

            {/* Thread Replies Panel */}
            {activeThread && (
               <div className="w-80 sm:w-96 border-l border-white/10 bg-[#070709] p-5 flex flex-col h-full shrink-0">
                  <div className="flex items-center justify-between pb-4 border-b border-white/10">
                     <span className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                        <HiAnnotation className="text-neutral-400" /> Thread Replies
                     </span>
                     <button onClick={() => setActiveThread(null)} className="rounded-lg p-1 text-neutral-400 hover:text-white hover:bg-white/10"><HiX size={18} /></button>
                  </div>

                  <div className="flex-1 overflow-y-auto my-4 space-y-3 pr-1">
                     <div className="p-4 rounded-xl bg-black border border-white/15 text-xs text-white">
                        <strong className="text-white block mb-1 font-bold">{activeThread.user?.name}:</strong>
                        {activeThread.text}
                     </div>

                     {threadReplies.map((r) => (
                        <div key={r._id} className="p-3.5 rounded-xl border border-white/10 bg-[#121214] text-xs text-neutral-200">
                           <strong className="text-white block mb-1 font-bold">{r.user?.name}:</strong>
                           {r.text}
                        </div>
                     ))}
                     <div ref={threadEndRef} />
                  </div>

                  <form onSubmit={handleThreadReplySubmit} className="flex gap-2 pt-3 border-t border-white/10">
                     <input
                        value={threadReplyText}
                        onChange={(e) => setThreadReplyText(e.target.value)}
                        placeholder="Reply to thread..."
                        className="flex-1 bg-black border border-white/15 px-3.5 py-2.5 rounded-xl text-xs text-white outline-none focus:border-white"
                     />
                     <button type="submit" className="btn-white px-4 py-2.5 text-xs font-bold">Reply</button>
                  </form>
               </div>
            )}
         </div>

         {/* Typing Indicator Bar */}
         {typingUsers.length > 0 && (
            <div className="bg-black border-t border-white/10 px-6 py-2 text-xs font-mono text-neutral-400 shrink-0">
               <span>{typingUsers.map((u) => u.name).join(", ")} {typingUsers.length > 1 ? "are" : "is"} typing...</span>
            </div>
         )}

         {/* Message Input Footer Bar */}
         <footer className="p-4 sm:p-5 border-t border-white/10 bg-black/95 shrink-0">
            <form onSubmit={handleSendMessage} className="flex gap-3 max-w-5xl mx-auto">
               <input
                  value={messageText}
                  onChange={handleInputChange}
                  placeholder={`Message #${activeChannel.name}...`}
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

         {/* Manage Members Modal */}
         {showManageMembersModal && activeChannel && (
            <div className="fixed inset-0 z-50 grid place-items-center bg-black/85 p-4 backdrop-blur-md">
               <div className="w-full max-w-md rounded-2xl border border-white/20 bg-[#09090b] p-6 shadow-2xl space-y-5 ring-1 ring-white/10">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                     <div>
                        <h3 className="text-base font-bold text-white">Manage Members</h3>
                        <p className="text-xs text-neutral-400">Add or remove teammates from #{activeChannel.name}</p>
                     </div>
                     <button onClick={() => setShowManageMembersModal(false)} className="text-neutral-400 hover:text-white">
                        <HiX size={18} />
                     </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                     {workspaceMembers.map((member) => {
                        const memberId = normalizeId(member.userId || member._id || member);
                        const isCurrentMember = activeChannel.members?.some(
                           (m) => normalizeId(m._id || m) === memberId
                        );
                        const isCreator = normalizeId(activeChannel.createdBy?._id || activeChannel.createdBy) === memberId;

                        return (
                           <div key={memberId} className="flex items-center justify-between p-3 rounded-xl bg-[#121214] border border-white/10 text-xs">
                              <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 rounded-lg bg-white text-black font-extrabold grid place-items-center text-xs">
                                    {(member.name || member.email || "U").charAt(0).toUpperCase()}
                                 </div>
                                 <div>
                                    <span className="text-white font-bold block">{member.name || member.email}</span>
                                    <span className="text-[10px] text-neutral-400 font-mono">{member.email}</span>
                                 </div>
                              </div>
                              {isCreator ? (
                                 <span className="text-[10px] font-mono text-neutral-400 px-2 py-1 rounded-md bg-black border border-white/10">Creator</span>
                              ) : (
                                 <button
                                    type="button"
                                    onClick={() => handleToggleMember(memberId)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                                       isCurrentMember
                                          ? "border border-white/30 bg-black text-white hover:bg-white/10"
                                          : "btn-white"
                                    }`}
                                 >
                                    {isCurrentMember ? "Remove" : "Add"}
                                 </button>
                              )}
                           </div>
                        );
                     })}
                  </div>
                  <div className="flex justify-end pt-3 border-t border-white/10">
                     <button
                        type="button"
                        onClick={() => setShowManageMembersModal(false)}
                        className="btn-dark px-5 py-2 text-xs font-bold"
                     >
                        Done
                     </button>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
}
