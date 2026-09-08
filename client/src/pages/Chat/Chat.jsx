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
            subtitle="Browse workspace channels, join discussions, or create a new room."
            actions={
               <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-medium transition"
               >
                  <HiPlus size={14} />
                  <span>Create Channel</span>
               </button>
            }
         >
            {error && (
               <div className="p-3 mb-4 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-300">
                  {error}
               </div>
            )}

            {/* Filter and Search Control */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
               <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800 w-full sm:w-auto">
                  {[
                     { key: "all", label: `All (${channels.length})` },
                     { key: "public", label: `Public (${channels.filter((c) => c.type === "public").length})` },
                     { key: "private", label: `Private (${channels.filter((c) => c.type === "private").length})` },
                  ].map((tab) => (
                     <button
                        key={tab.key}
                        type="button"
                        onClick={() => setFilterTab(tab.key)}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                           filterTab === tab.key
                              ? "bg-zinc-800 text-zinc-100 shadow-sm"
                              : "text-zinc-400 hover:text-zinc-200"
                        }`}
                     >
                        {tab.label}
                     </button>
                  ))}
               </div>

               <div className="relative w-full sm:w-80">
                  <HiSearch className="absolute left-3 top-2.5 text-zinc-500" size={14} />
                  <input
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     placeholder="Search channels..."
                     className="w-full pl-9 pr-4 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-xs text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-zinc-500 transition"
                  />
               </div>
            </div>

            {/* Channels Cards Grid */}
            {isLoadingChannels ? (
               <div className="py-20 text-center text-xs text-zinc-500 flex flex-col items-center gap-3">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent" />
                  <span>Loading channels...</span>
               </div>
            ) : filteredChannels.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredChannels.map((channel) => {
                     const isPrivate = channel.type === "private";
                     const unreadValue = unreadCounts[channel._id] || 0;

                     return (
                        <div
                           key={channel._id}
                           className="group p-5 rounded-xl border border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/70 transition flex flex-col justify-between space-y-4"
                        >
                           <div>
                              <div className="flex items-center justify-between gap-2 mb-3">
                                 <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-medium border flex items-center gap-1 ${
                                       isPrivate
                                          ? "bg-amber-500/10 text-amber-300 border-amber-500/20"
                                          : "bg-zinc-800 text-zinc-300 border-zinc-700"
                                    }`}
                                 >
                                    {isPrivate ? <HiLockClosed size={10} /> : <HiGlobeAlt size={10} />}
                                    <span>{isPrivate ? "Private" : "Public"}</span>
                                 </span>

                                 {unreadValue > 0 && (
                                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-950">
                                       {unreadValue} unread
                                    </span>
                                 )}
                              </div>

                              <div className="flex items-center gap-2">
                                 <HiHashtag className="text-zinc-400 shrink-0" size={16} />
                                 <h3 className="font-medium text-sm text-zinc-100 group-hover:text-white transition truncate">
                                    {channel.name}
                                 </h3>
                              </div>

                              <p className="text-xs text-zinc-400 mt-2 line-clamp-2 leading-relaxed">
                                 {channel.topic || channel.description || (isPrivate ? "Private channel for restricted members." : "Public channel for open team discussion.")}
                              </p>
                           </div>

                           <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80 text-xs">
                              <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                                 <HiUsers size={12} />
                                 {channel.members?.length || 0} members
                              </span>

                              <button
                                 type="button"
                                 onClick={() => handleSelectChannel(channel)}
                                 className="py-1.5 px-3 bg-zinc-100 hover:bg-white text-zinc-950 rounded-lg transition font-medium text-xs flex items-center gap-1"
                              >
                                 <HiArrowsExpand size={13} />
                                 <span>Open Channel</span>
                              </button>
                           </div>
                        </div>
                     );
                  })}
               </div>
            ) : (
               <div className="text-center py-20 rounded-xl border border-zinc-800/80 bg-zinc-900/20 p-6 space-y-2">
                  <HiChatAlt2 className="mx-auto text-zinc-600" size={36} />
                  <h3 className="text-sm font-medium text-zinc-200">No channels found</h3>
                  <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                     Create a channel to start team conversations.
                  </p>
               </div>
            )}

            {/* Create Channel Modal */}
            {showCreateModal && (
               <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
                  <div className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl space-y-4">
                     <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                        <h3 className="text-sm font-medium text-zinc-100">Create New Channel</h3>
                        <button onClick={() => setShowCreateModal(false)} className="text-zinc-400 hover:text-white">
                           <HiX size={16} />
                        </button>
                     </div>
                     <form onSubmit={handleCreateChannelSubmit} className="space-y-4">
                        <div>
                           <label className="text-xs font-medium text-zinc-300">Channel Name</label>
                           <input
                              value={newChannelName}
                              onChange={(e) => setNewChannelName(e.target.value)}
                              placeholder="e.g. general"
                              required
                              className="mt-1.5 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2 text-sm text-zinc-100 focus:border-zinc-500 outline-none"
                           />
                        </div>
                        <div>
                           <label className="text-xs font-medium text-zinc-300">Privacy</label>
                           <div className="mt-1.5 grid grid-cols-2 gap-2">
                              {["public", "private"].map((p) => (
                                 <button
                                    key={p}
                                    type="button"
                                    onClick={() => setNewChannelType(p)}
                                    className={`py-2 px-3 rounded-lg border text-xs font-medium capitalize transition ${
                                       newChannelType === p
                                          ? "border-zinc-600 bg-zinc-800 text-zinc-100"
                                          : "border-zinc-800 bg-zinc-950 text-zinc-400"
                                    }`}
                                 >
                                    {p === "public" ? "Public" : "Private"}
                                 </button>
                              ))}
                           </div>
                        </div>
                        {newChannelType === "private" && (
                           <div>
                              <label className="text-xs font-medium text-zinc-300 mb-1.5 block">Select Initial Members</label>
                              <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 rounded-lg border border-zinc-800 bg-zinc-950">
                                 {workspaceMembers
                                    .filter((m) => normalizeId(m.userId || m._id) !== normalizeId(user?._id))
                                    .map((m) => {
                                       const id = normalizeId(m.userId || m._id);
                                       const isChecked = selectedMemberIds.includes(id);
                                       return (
                                          <label key={id} className="flex items-center gap-2 p-1.5 rounded hover:bg-zinc-900/60 cursor-pointer text-xs text-zinc-300">
                                             <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={() => {
                                                   setSelectedMemberIds((curr) =>
                                                      isChecked ? curr.filter((i) => i !== id) : [...curr, id]
                                                   );
                                                }}
                                                className="rounded border-zinc-700 bg-zinc-900 text-zinc-100"
                                             />
                                             <span>{m.name || m.email}</span>
                                          </label>
                                       );
                                    })}
                                 {workspaceMembers.length <= 1 && (
                                    <div className="text-[11px] text-zinc-500 p-1">No other teammates in workspace yet.</div>
                                 )}
                              </div>
                           </div>
                        )}
                        <div>
                           <label className="text-xs font-medium text-zinc-300">Topic (Optional)</label>
                           <input
                              value={newChannelTopic}
                              onChange={(e) => setNewChannelTopic(e.target.value)}
                              placeholder="What is this channel about?"
                              className="mt-1.5 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2 text-sm text-zinc-100 focus:border-zinc-500 outline-none"
                           />
                        </div>
                        <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                           <button
                              type="button"
                              onClick={() => setShowCreateModal(false)}
                              className="px-4 py-2 rounded-lg border border-zinc-800 text-xs font-medium text-zinc-400 hover:text-white"
                           >
                              Cancel
                           </button>
                           <button
                              type="submit"
                              className="px-4 py-2 rounded-lg bg-zinc-100 hover:bg-white text-xs font-medium text-zinc-950"
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
      <div className="fixed inset-0 z-50 bg-[#0b0c10] text-zinc-100 flex flex-col overflow-hidden">
         {/* Channel Top Header Bar */}
         <header className="h-14 border-b border-zinc-800/80 bg-zinc-900/90 px-4 sm:px-6 flex items-center justify-between gap-4 backdrop-blur-xl shrink-0">
            <div className="flex items-center gap-3 min-w-0 flex-1">
               <button
                  type="button"
                  onClick={backToDirectory}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-xs font-medium text-zinc-300 transition shrink-0"
               >
                  <HiArrowLeft size={14} />
                  <span className="hidden sm:inline">Back</span>
               </button>

               <div className="h-4 w-px bg-zinc-800 hidden sm:block" />

               <div className="min-w-0">
                  <div className="flex items-center gap-2">
                     <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-1.5 truncate">
                        {activeChannel.type === "private" ? (
                           <HiLockClosed className="text-amber-400" size={14} />
                        ) : (
                           <HiHashtag className="text-zinc-400" size={16} />
                        )}
                        <span>{activeChannel.name}</span>
                     </h2>

                     <span
                        className={`px-2 py-0.5 rounded text-[9px] font-medium uppercase tracking-wider border shrink-0 ${
                           activeChannel.type === "private"
                              ? "bg-amber-500/10 text-amber-300 border-amber-500/20"
                              : "bg-zinc-800 text-zinc-300 border-zinc-700"
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
               {latestMyMessageId && (
                  <button
                     type="button"
                     onClick={handleDeleteLatestMessage}
                     className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 text-xs font-medium transition"
                     title="Delete your latest message in this channel"
                  >
                     <HiTrash size={13} />
                     <span className="hidden sm:inline">Delete last</span>
                  </button>
               )}

               {activeChannel.type === "private" && isCreatorOfActive && (
                  <button
                     type="button"
                     onClick={() => setShowManageMembersModal(true)}
                     className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800 text-xs font-medium text-zinc-200 transition"
                  >
                     <HiUserAdd size={14} />
                     <span className="hidden sm:inline">Manage ({activeChannel.members?.length || 0})</span>
                  </button>
               )}

               <button
                  type="button"
                  onClick={() => setShowDetails(!showDetails)}
                  className="p-2 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-100 transition"
                  title="Toggle Channel Details"
               >
                  <HiUsers size={16} />
               </button>

               {isCreatorOfActive && (
                  <button
                     type="button"
                     onClick={() => handleDeleteChannel(activeChannel._id)}
                     className="p-2 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition"
                     title="Delete Channel"
                  >
                     <HiTrash size={16} />
                  </button>
               )}
            </div>
         </header>

         {error && (
            <div className="bg-red-500/10 border-b border-red-500/30 px-4 py-2 text-xs text-red-300 flex items-center justify-between shrink-0">
               <span>{error}</span>
               <button onClick={() => setError(null)} className="text-red-400 hover:text-red-200">
                  <HiX size={14} />
               </button>
            </div>
         )}

         {/* Channel Info Drawer */}
         {showDetails && (
            <div className="bg-zinc-900 border-b border-zinc-800 p-4 text-xs space-y-2 shrink-0">
               <div className="flex justify-between items-center">
                  <span className="font-medium text-zinc-400 text-xs">Members & Details</span>
                  <button onClick={() => setShowDetails(false)} className="text-zinc-400 hover:text-white"><HiX size={16} /></button>
               </div>
               <p className="text-zinc-400">{activeChannel.topic || activeChannel.description || "Public workspace channel."}</p>
               <div className="flex flex-wrap gap-1.5 pt-1">
                  {(activeChannel.members || []).map((m) => (
                     <span key={m._id || m} className="px-2 py-1 rounded-md bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-300">
                        {m.name || m.email || "Member"}
                     </span>
                  ))}
               </div>
            </div>
         )}

         {/* Main Messages & Thread View */}
         <div className="flex-1 min-h-0 flex overflow-hidden app-grid-bg">
            {/* Messages Feed */}
            <div className="flex-1 min-h-0 flex flex-col p-4 sm:p-6 overflow-y-auto space-y-4">
               {visibleMessages.length > 0 ? (
                  visibleMessages.map((msg) => {
                     const isMe = normalizeId(msg.user?._id || msg.user) === normalizeId(user?._id);
                     const isLatestMyMessage = msg._id === latestMyMessageId;

                     return (
                        <div key={msg._id} className={`group flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                           <div className="mb-1 flex items-center gap-2 text-[10px] text-zinc-500">
                              <span className="font-medium text-zinc-400">{isMe ? "You" : msg.user?.name || "Teammate"}</span>
                              <span>•</span>
                              <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                           </div>

                           <div className="relative group/bubble max-w-[85%] sm:max-w-[70%]">
                              <div className={`p-3 rounded-xl text-xs leading-relaxed ${
                                 isMe ? "bg-zinc-100 text-zinc-950 font-normal rounded-tr-xs" : "bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-tl-xs"
                              }`}>
                                 {msg.text}
                              </div>

                              {/* Hover Action Bar: Reply & Delete (for latest message) */}
                              <div className={`absolute -top-7 ${isMe ? "right-0" : "left-0"} hidden group-hover:flex items-center gap-1 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded-lg shadow-lg z-10 text-xs`}>
                                 <button
                                    type="button"
                                    onClick={() => openThread(msg)}
                                    className="p-1 text-zinc-400 hover:text-zinc-100 flex items-center gap-1 text-[11px] font-medium"
                                    title="Reply to message"
                                 >
                                    <HiAnnotation size={13} />
                                    <span>Reply</span>
                                 </button>
                                 {isLatestMyMessage && (
                                    <button
                                       type="button"
                                       onClick={() => handleDeleteMsg(msg._id)}
                                       className="p-1 text-zinc-400 hover:text-red-400 flex items-center gap-1 text-[11px] font-medium"
                                       title="Delete latest message"
                                    >
                                       <HiTrash size={13} />
                                       <span>Delete</span>
                                    </button>
                                 )}
                              </div>
                           </div>

                           {/* Thread replies button */}
                           {(msg.threadReplyCount || 0) > 0 && (
                              <button
                                 onClick={() => openThread(msg)}
                                 className="mt-1 text-[11px] text-zinc-400 hover:text-zinc-200 flex items-center gap-1.5 transition font-medium"
                              >
                                 <HiAnnotation size={12} />
                                 <span>{msg.threadReplyCount} {msg.threadReplyCount === 1 ? "reply" : "replies"}</span>
                              </button>
                           )}
                        </div>
                     );
                  })
               ) : (
                  <div className="py-20 text-center text-xs text-zinc-500">No messages yet. Start the conversation.</div>
               )}
               <div ref={messagesEndRef} />
            </div>

            {/* Thread Replies Panel */}
            {activeThread && (
               <div className="w-80 border-l border-zinc-800 bg-zinc-900/90 p-4 flex flex-col h-full shrink-0">
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                     <span className="text-xs font-medium text-zinc-200 flex items-center gap-1.5"><HiAnnotation className="text-zinc-400" /> Thread Replies</span>
                     <button onClick={() => setActiveThread(null)} className="text-zinc-400 hover:text-white"><HiX size={16} /></button>
                  </div>

                  <div className="flex-1 overflow-y-auto my-3 space-y-2">
                     <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200">
                        <strong className="text-zinc-100 block mb-1 font-medium">{activeThread.user?.name}:</strong>
                        {activeThread.text}
                     </div>

                     {threadReplies.map((r) => (
                        <div key={r._id} className="p-2.5 rounded-lg border border-zinc-800 bg-zinc-950/50 text-xs text-zinc-300">
                           <strong className="text-zinc-100 block mb-0.5 font-medium">{r.user?.name}:</strong>
                           {r.text}
                        </div>
                     ))}
                     <div ref={threadEndRef} />
                  </div>

                  <form onSubmit={handleThreadReplySubmit} className="flex gap-2 pt-2 border-t border-zinc-800">
                     <input
                        value={threadReplyText}
                        onChange={(e) => setThreadReplyText(e.target.value)}
                        placeholder="Reply to thread..."
                        className="flex-1 bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded-lg text-xs text-zinc-100 outline-none focus:border-zinc-500"
                     />
                     <button type="submit" className="px-3 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-medium rounded-lg">Send</button>
                  </form>
               </div>
            )}
         </div>

         {/* Typing Indicator Bar */}
         {typingUsers.length > 0 && (
            <div className="bg-zinc-900 border-b border-zinc-800 px-5 py-2 text-xs text-zinc-400 shrink-0">
               <span>{typingUsers.map((u) => u.name).join(", ")} {typingUsers.length > 1 ? "are" : "is"} typing...</span>
            </div>
         )}

         {/* Message Input Footer Bar */}
         <footer className="p-4 border-t border-zinc-800/80 bg-zinc-900/90 shrink-0">
            <form onSubmit={handleSendMessage} className="flex gap-2 max-w-5xl mx-auto">
               <input
                  value={messageText}
                  onChange={handleInputChange}
                  placeholder={`Message #${activeChannel.name}...`}
                  className="flex-1 bg-zinc-950 border border-zinc-800 px-4 py-2.5 rounded-lg text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-zinc-500 transition"
               />
               <button
                  type="submit"
                  disabled={!messageText.trim()}
                  className="px-4 py-2.5 bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-medium rounded-lg transition disabled:opacity-50"
               >
                  Send
               </button>
            </form>
         </footer>

         {/* Manage Members Modal */}
         {showManageMembersModal && activeChannel && (
            <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
               <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                     <div>
                        <h3 className="text-sm font-medium text-zinc-100">Manage Members</h3>
                        <p className="text-xs text-zinc-400">Add or remove teammates from #{activeChannel.name}</p>
                     </div>
                     <button onClick={() => setShowManageMembersModal(false)} className="text-zinc-400 hover:text-white">
                        <HiX size={16} />
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
                           <div key={memberId} className="flex items-center justify-between p-2 rounded-lg bg-zinc-950 border border-zinc-800/80 text-xs">
                              <div className="flex items-center gap-2">
                                 <div className="w-6 h-6 rounded-full bg-zinc-800 text-zinc-300 font-medium grid place-items-center text-[10px]">
                                    {(member.name || member.email || "U").charAt(0).toUpperCase()}
                                 </div>
                                 <div>
                                    <span className="text-zinc-200 font-medium block">{member.name || member.email}</span>
                                    <span className="text-[10px] text-zinc-500">{member.email}</span>
                                 </div>
                              </div>
                              {isCreator ? (
                                 <span className="text-[10px] text-zinc-500 px-2 py-1 rounded bg-zinc-900 border border-zinc-800">Creator</span>
                              ) : (
                                 <button
                                    type="button"
                                    onClick={() => handleToggleMember(memberId)}
                                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                                       isCurrentMember
                                          ? "border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20"
                                          : "bg-zinc-100 hover:bg-white text-zinc-950"
                                    }`}
                                 >
                                    {isCurrentMember ? "Remove" : "Add"}
                                 </button>
                              )}
                           </div>
                        );
                     })}
                  </div>
                  <div className="flex justify-end pt-2 border-t border-zinc-800">
                     <button
                        type="button"
                        onClick={() => setShowManageMembersModal(false)}
                        className="px-4 py-2 rounded-lg bg-zinc-800 text-xs font-medium text-zinc-200 hover:bg-zinc-700 transition"
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
