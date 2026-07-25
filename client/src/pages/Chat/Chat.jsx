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
   HiShieldCheck,
   HiExclamation,
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
} from "../../services/chatService";
import { getWorkspaceMembers } from "../../services/workspaceService";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { getAvatarSrc } from "../../utils/avatar";

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
   const [filterTab, setFilterTab] = useState("all"); // 'all', 'public', 'private', 'dm'
   const [searchQuery, setSearchQuery] = useState("");

   const [typingUsers, setTypingUsers] = useState([]);
   const [onlineUsers, setOnlineUsers] = useState([]);
   const isMountedRef = useRef(true);

   const [editingMessageId, setEditingMessageId] = useState(null);
   const [editingText, setEditingText] = useState("");
   const [showPinned, setShowPinned] = useState(false);
   const [showEmojiPicker, setShowEmojiPicker] = useState(null);

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

   const refreshChannels = async () => {
      try {
         const res = await getChannels();
         const nextChannels = res.data.channels || [];
         if (isMountedRef.current) {
            setChannels(nextChannels);
         }
         return nextChannels;
      } catch (err) {
         if (isMountedRef.current) {
            setError(err.response?.data?.message || "Failed to load channels");
         }
         return [];
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
      try {
         const res = await getMessages(channelId);
         if (isMountedRef.current) {
            setMessages(res.data.messages || []);
         }
      } catch {
         if (isMountedRef.current) {
            setError("Failed to load messages");
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

   // Scroll to bottom when messages update
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
            const target = nextChannels.find((ch) => ch._id === channelIdParam);
            if (target) {
               setActiveChannel(target);
               return;
            }
         }

         if (nextChannels.length > 0) {
            const defaultChannel = nextChannels.find((c) => c.type === "public") || nextChannels[0];
            setActiveChannel(defaultChannel);
            setSearchParams({ channel: defaultChannel._id });
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

   // Socket events setup
   useEffect(() => {
      if (!socket) return;
      socketRef.current = socket;

      socket.emit("userOnline");

      socket.on("newMessage", (newMessage) => {
         if (activeChannelRef.current?._id === newMessage.channel) {
            setMessages((curr) => {
               if (curr.some((m) => m._id === newMessage._id)) return curr;
               return [...curr, newMessage];
            });
         }
      });

      socket.on("messageEdited", (editedMessage) => {
         if (activeChannelRef.current?._id === editedMessage.channel) {
            setMessages((curr) => curr.map((m) => (m._id === editedMessage._id ? editedMessage : m)));
         }
      });

      socket.on("messageDeleted", ({ messageId }) => {
         setMessages((curr) => curr.filter((m) => m._id !== messageId));
      });

      socket.on("reactionAdded", (message) => {
         if (activeChannelRef.current?._id === message.channel) {
            setMessages((curr) => curr.map((m) => (m._id === message._id ? message : m)));
         }
      });

      socket.on("reactionRemoved", (message) => {
         if (activeChannelRef.current?._id === message.channel) {
            setMessages((curr) => curr.map((m) => (m._id === message._id ? message : m)));
         }
      });

      socket.on("messagePinned", (message) => {
         if (activeChannelRef.current?._id === message.channel) {
            setPinnedMessages((curr) => [...curr, message]);
            setMessages((curr) => curr.map((m) => (m._id === message._id ? message : m)));
         }
      });

      socket.on("messageUnpinned", ({ messageId }) => {
         setPinnedMessages((curr) => curr.filter((m) => m._id !== messageId));
         setMessages((curr) => curr.map((m) => (m._id === messageId ? { ...m, isPinned: false } : m)));
      });

      socket.on("typing", ({ channelId, isTyping, user: typingUser }) => {
         if (activeChannelRef.current?._id !== channelId) return;
         if (typingUser.id === userRef.current?._id) return;

         setTypingUsers((curr) => {
            if (!isTyping) return curr.filter((u) => u.id !== typingUser.id);
            if (curr.some((u) => u.id === typingUser.id)) return curr;
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
         setChannels((curr) => {
            if (curr.some((c) => c._id === newChannel._id)) return curr;
            return [newChannel, ...curr];
         });
      });

      socket.on("channelUpdated", (updatedChannel) => {
         setChannels((curr) => curr.map((c) => (c._id === updatedChannel._id ? updatedChannel : c)));
         if (activeChannelRef.current?._id === updatedChannel._id) {
            setActiveChannel(updatedChannel);
         }
      });

      socket.on("channelDeleted", ({ channelId }) => {
         setChannels((curr) => curr.filter((c) => c._id !== channelId));
         if (activeChannelRef.current?._id === channelId) {
            setActiveChannel(null);
         }
      });

      socket.on("channelAccessDenied", ({ message }) => {
         setError(message || "Access denied to private channel");
         setActiveChannel(null);
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
         socket.off("channelUpdated");
         socket.off("channelDeleted");
         socket.off("channelAccessDenied");
      };
   }, [socket]);

   useEffect(() => {
      if (!activeChannel || !socketRef.current) return;
      socketRef.current.emit("joinChannel", activeChannel._id);
      refreshMessages(activeChannel._id);
      loadPinnedMessages(activeChannel._id);
   }, [activeChannel]);

   const handleSelectChannel = (channel) => {
      setActiveChannel(channel);
      setShowPinned(false);
      setEditingMessageId(null);
      setError(null);
      setSearchParams({ channel: channel._id });
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
            setChannels((prev) => [created, ...prev.filter((c) => c._id !== created._id)]);
            setActiveChannel(created);
            setSearchParams({ channel: created._id });
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
         setChannels((curr) => curr.filter((c) => c._id !== channelId));
         if (activeChannel?._id === channelId) {
            setActiveChannel(null);
         }
      } catch (err) {
         setError(err.response?.data?.message || "Only the channel creator can delete this channel.");
      }
   };

   const handleToggleMember = async (targetUserId) => {
      if (!activeChannel) return;
      const isMember = activeChannel.members?.some(
         (m) => (m._id || m) === targetUserId
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

   // Filter channels based on selected tab and search query
   const filteredChannels = useMemo(() => {
      let list = channels;
      if (filterTab === "public") list = list.filter((c) => c.type === "public");
      else if (filterTab === "private") list = list.filter((c) => c.type === "private");
      else if (filterTab === "dm") list = list.filter((c) => c.type === "dm");

      if (!searchQuery.trim()) return list;
      const q = searchQuery.toLowerCase();
      return list.filter((c) => c.name?.toLowerCase().includes(q) || c.topic?.toLowerCase().includes(q));
   }, [channels, filterTab, searchQuery]);

   const visibleMessages = useMemo(() => messages.filter((msg) => !msg.isDeleted), [messages]);

   const isCreatorOfActive = useMemo(() => {
      if (!activeChannel || !user) return false;
      const creatorId = activeChannel.createdBy?._id || activeChannel.createdBy;
      return creatorId?.toString() === user._id?.toString();
   }, [activeChannel, user]);

   return (
      <div className="h-[calc(100vh-6rem)] flex gap-4">
         {/* Sidebar: Channel Room Navigation */}
         <div className="w-80 rounded-2xl border border-zinc-800/80 bg-zinc-950/90 backdrop-blur-xl p-4 flex flex-col shrink-0 shadow-2xl">
            {/* Sidebar Top: Action Bar & Search */}
            <div className="space-y-3 pb-3 border-b border-zinc-800/80">
               <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#f9ebae] uppercase tracking-widest flex items-center gap-1.5">
                     <HiChatAlt2 size={16} />
                     <span>Channels & Rooms</span>
                  </span>
                  <button
                     type="button"
                     onClick={() => setShowCreateModal(true)}
                     className="px-2.5 py-1.5 rounded-lg bg-[#f9ebae] hover:bg-[#e6d695] text-zinc-950 text-xs font-bold transition flex items-center gap-1 shadow-md shadow-[#f9ebae]/20"
                  >
                     <HiPlus size={14} />
                     <span>Create</span>
                  </button>
               </div>

               {/* Search box */}
               <div className="relative">
                  <HiSearch className="absolute left-3 top-2.5 text-zinc-500" size={14} />
                  <input
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     placeholder="Search rooms..."
                     className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-zinc-800 bg-zinc-900/80 text-xs text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-[#f9ebae] transition"
                  />
               </div>

               {/* Filter Tabs */}
               <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-zinc-900/80 border border-zinc-800/60 text-[10px] font-bold">
                  {[
                     { key: "all", label: "All" },
                     { key: "public", label: "# Public" },
                     { key: "private", label: "🔒 Private" },
                     { key: "dm", label: "💬 DMs" },
                  ].map((tab) => (
                     <button
                        key={tab.key}
                        type="button"
                        onClick={() => setFilterTab(tab.key)}
                        className={`py-1 rounded-lg transition ${
                           filterTab === tab.key
                              ? "bg-[#f9ebae] text-zinc-950 font-extrabold shadow"
                              : "text-zinc-400 hover:text-white"
                        }`}
                     >
                        {tab.label}
                     </button>
                  ))}
               </div>
            </div>

            {/* Channels List */}
            <div className="flex-1 overflow-y-auto mt-3 space-y-1 pr-1">
               {filteredChannels.length > 0 ? (
                  filteredChannels.map((channel) => {
                     const isSelected = activeChannel?._id === channel._id;
                     const isPrivate = channel.type === "private";
                     const isDm = channel.type === "dm";

                     return (
                        <button
                           key={channel._id}
                           type="button"
                           onClick={() => handleSelectChannel(channel)}
                           className={`w-full p-2.5 rounded-xl flex items-center justify-between transition text-left ${
                              isSelected
                                 ? "bg-[#f9ebae]/12 border border-[#f9ebae]/40 text-white font-bold"
                                 : "hover:bg-zinc-900/70 border border-transparent text-zinc-400 hover:text-zinc-200"
                           }`}
                        >
                           <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                 className={`h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                                    isSelected
                                       ? "bg-[#f9ebae] text-zinc-950"
                                       : isPrivate
                                       ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                                       : isDm
                                       ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/30"
                                       : "bg-zinc-900 text-zinc-400 border border-zinc-800"
                                 }`}
                              >
                                 {isPrivate ? <HiLockClosed size={12} /> : isDm ? "💬" : <HiHashtag size={14} />}
                              </div>
                              <div className="min-w-0">
                                 <div className="text-xs truncate font-semibold">
                                    {isDm ? channel.name : channel.name}
                                 </div>
                                 <div className="text-[10px] text-zinc-500 truncate">
                                    {isPrivate
                                       ? `${channel.members?.length || 0} allowed members`
                                       : isDm
                                       ? "Direct chat"
                                       : "Public workspace room"}
                                 </div>
                              </div>
                           </div>

                           {isPrivate && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                                 Private
                              </span>
                           )}
                        </button>
                     );
                  })
               ) : (
                  <div className="py-12 text-center text-xs text-zinc-500">
                     No channels found matching "{searchQuery}".
                  </div>
               )}
            </div>
         </div>

         {/* Main Chat Canvas */}
         <div className="flex-1 rounded-2xl border border-zinc-800/80 bg-zinc-950/90 backdrop-blur-xl p-5 flex flex-col shadow-2xl min-w-0">
            {activeChannel ? (
               <>
                  {/* Channel Top Header Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-800/80 shrink-0">
                     <div>
                        <div className="flex items-center gap-2">
                           <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                              {activeChannel.type === "private" ? (
                                 <HiLockClosed className="text-amber-400" size={18} />
                              ) : activeChannel.type === "dm" ? (
                                 "💬"
                              ) : (
                                 <HiHashtag className="text-[#f9ebae]" size={18} />
                              )}
                              <span>{activeChannel.name}</span>
                           </h2>

                           {/* Privacy Badge */}
                           {activeChannel.type === "private" ? (
                              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                                 <HiLockClosed size={10} /> Private Group
                              </span>
                           ) : activeChannel.type === "public" ? (
                              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                                 <HiGlobeAlt size={10} /> Public Room
                              </span>
                           ) : (
                              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 text-[10px] font-bold">
                                 Direct Message
                              </span>
                           )}
                        </div>

                        {activeChannel.topic && (
                           <p className="text-xs text-zinc-400 mt-1">{activeChannel.topic}</p>
                        )}
                     </div>

                     <div className="flex items-center gap-2">
                        {/* Manage Members button for Channel Creator on Private Channels */}
                        {activeChannel.type === "private" && isCreatorOfActive && (
                           <button
                              type="button"
                              onClick={() => setShowManageMembersModal(true)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition"
                           >
                              <HiUserAdd size={14} />
                              <span>Manage Members ({activeChannel.members?.length || 0})</span>
                           </button>
                        )}

                        {/* Pinned Messages Badge */}
                        {pinnedMessages.length > 0 && (
                           <button
                              type="button"
                              onClick={() => setShowPinned(!showPinned)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[rgba(249,235,174,0.3)] bg-[rgba(249,235,174,0.1)] text-xs font-semibold text-[#f9ebae] hover:bg-[rgba(249,235,174,0.2)] transition"
                           >
                              <span>📌 {pinnedMessages.length} Pinned</span>
                           </button>
                        )}

                        {/* Online status indicator */}
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] font-semibold text-emerald-400">
                           <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                           <span>{onlineUsers.length || 1} Online</span>
                        </span>

                        {/* Delete Channel Button (Only for Creator) */}
                        {isCreatorOfActive && activeChannel.type !== "dm" && (
                           <button
                              type="button"
                              onClick={() => handleDeleteChannel(activeChannel._id)}
                              className="p-2 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition"
                              title="Delete channel"
                           >
                              <HiTrash size={14} />
                           </button>
                        )}
                     </div>
                  </div>

                  {/* Typing Indicator */}
                  {typingUsers.length > 0 && (
                     <div className="mt-2 px-3 py-1.5 rounded-lg bg-[#f9ebae]/10 text-xs text-[#f9ebae] italic flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#f9ebae] animate-ping" />
                        <span>{typingUsers.map((u) => u.name).join(", ")} is typing…</span>
                     </div>
                  )}

                  {/* Pinned Messages Drawer */}
                  {showPinned && pinnedMessages.length > 0 && (
                     <div className="mt-3 p-3.5 rounded-xl border border-[rgba(249,235,174,0.3)] bg-[rgba(249,235,174,0.05)] space-y-2">
                        <div className="flex items-center justify-between">
                           <span className="text-xs font-bold text-[#f9ebae]">Pinned Messages</span>
                           <button onClick={() => setShowPinned(false)} className="text-zinc-400 hover:text-white">
                              <HiXCircle className="h-4 w-4" />
                           </button>
                        </div>
                        <div className="space-y-1.5 max-h-40 overflow-y-auto">
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
                  <div className="mt-3 flex-1 overflow-y-auto rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-4 space-y-3 min-h-[350px]">
                     {visibleMessages.length > 0 ? (
                        visibleMessages.map((msg) => (
                              <div
                                 key={msg._id}
                                 className="group p-3.5 rounded-xl border border-zinc-800/60 bg-zinc-900/40 hover:bg-zinc-900/80 hover:border-zinc-700 transition space-y-1.5"
                              >
                                 <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                       <span className="text-xs font-bold text-zinc-200">{msg.user?.name || "Member"}</span>
                                       <span className="text-[10px] text-zinc-500">
                                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                       </span>
                                       {msg.isEdited && <span className="text-[10px] text-zinc-500">(edited)</span>}
                                       {msg.isPinned && <span className="text-xs text-[#f9ebae]">📌</span>}
                                    </div>

                                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition">
                                       <button onClick={() => pinMessage(msg._id)} className="p-1 text-zinc-400 hover:text-[#f9ebae]" title="Pin message">
                                          📌
                                       </button>
                                       <button onClick={() => setShowEmojiPicker(msg._id)} className="p-1 text-zinc-400 hover:text-[#f9ebae]" title="Reaction">
                                          <HiEmojiHappy className="h-4 w-4" />
                                       </button>
                                       {msg.user?._id === user?._id && (
                                          <>
                                             <button onClick={() => { setEditingMessageId(msg._id); setEditingText(msg.text); }} className="p-1 text-zinc-400 hover:text-[#f9ebae]">
                                                <HiPencil className="h-4 w-4" />
                                             </button>
                                             <button onClick={() => handleDeleteMsg(msg._id)} className="p-1 text-zinc-400 hover:text-red-400">
                                                <HiTrash className="h-4 w-4" />
                                             </button>
                                          </>
                                       )}
                                    </div>
                                 </div>

                                 {/* Emoji Reaction Popup */}
                                 {showEmojiPicker === msg._id && (
                                    <div className="mt-1 flex gap-1 p-1.5 rounded-lg border border-zinc-800 bg-zinc-950">
                                       {EMOJI_REACTIONS.map((emoji) => (
                                          <button key={emoji} onClick={() => { addReaction(msg._id, emoji); setShowEmojiPicker(null); }} className="p-1 hover:bg-zinc-800 rounded text-sm">
                                             {emoji}
                                          </button>
                                       ))}
                                       <button onClick={() => setShowEmojiPicker(null)} className="p-1 text-zinc-500 hover:text-white">
                                          <HiXCircle className="h-4 w-4" />
                                       </button>
                                    </div>
                                 )}

                                 {/* Edit Mode */}
                                 {editingMessageId === msg._id ? (
                                    <form onSubmit={(e) => { e.preventDefault(); handleEdit(msg._id, editingText); }} className="flex gap-2 mt-2">
                                       <input
                                          type="text"
                                          value={editingText}
                                          onChange={(e) => setEditingText(e.target.value)}
                                          className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-100 outline-none focus:border-[#f9ebae]"
                                       />
                                       <button type="submit" className="px-3 py-1.5 rounded-lg bg-[#f9ebae] text-zinc-950 text-xs font-bold">Save</button>
                                       <button type="button" onClick={() => setEditingMessageId(null)} className="px-3 py-1.5 rounded-lg border border-zinc-800 text-xs text-zinc-400">Cancel</button>
                                    </form>
                                 ) : (
                                    <>
                                       <p className="text-xs text-zinc-200 leading-relaxed">{msg.text}</p>
                                       {msg.reactions && msg.reactions.length > 0 && (
                                          <div className="flex flex-wrap gap-1 mt-1.5">
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
                                                         ? "border-[rgba(249,235,174,0.4)] bg-[rgba(249,235,174,0.15)] text-[#f9ebae] font-bold"
                                                         : "border-zinc-800 bg-zinc-900 text-zinc-400"
                                                   }`}
                                                >
                                                   {r.emoji} {r.users?.length || 0}
                                                </button>
                                             ))}
                                          </div>
                                       )}
                                    </>
                                 )}
                              </div>
                           ))
                     ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center py-20 text-xs text-zinc-500">
                           No messages in this channel yet. Start the conversation!
                        </div>
                     )}
                     <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input Box */}
                  <form onSubmit={handleSendMessage} className="mt-3 flex gap-2">
                     <input
                        className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-xs text-zinc-100 outline-none focus:border-[#f9ebae] placeholder:text-zinc-600 transition"
                        placeholder={`Message #${activeChannel.name}...`}
                        value={messageText}
                        onChange={handleInputChange}
                     />
                     <button
                        type="submit"
                        disabled={!messageText.trim()}
                        className="px-5 py-2.5 rounded-xl bg-[#f9ebae] hover:bg-[#e6d695] text-zinc-950 font-bold text-xs shadow-md shadow-[#f9ebae]/20 transition disabled:opacity-50"
                     >
                        Send
                     </button>
                  </form>
               </>
            ) : (
               <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3">
                  <HiHashtag size={48} className="text-zinc-700 mx-auto" />
                  <h3 className="text-base font-bold text-zinc-200">No Channel Selected</h3>
                  <p className="text-xs text-zinc-400 max-w-sm">
                     Select a channel from the left room list or create a new public or private channel to start chatting.
                  </p>
               </div>
            )}

            {error && (
               <div className="mt-2 p-2.5 rounded-lg border border-red-500/30 bg-red-500/10 text-xs text-red-300">
                  {error}
               </div>
            )}
         </div>

         {/* Modal: Create Channel (Public or Private) */}
         {showCreateModal && (
            <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4 backdrop-blur-sm">
               <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                     <h3 className="text-base font-bold text-zinc-100">Create New Channel</h3>
                     <button onClick={() => setShowCreateModal(false)} className="text-zinc-400 hover:text-white">
                        <HiXCircle size={20} />
                     </button>
                  </div>

                  <form onSubmit={handleCreateChannelSubmit} className="space-y-4">
                     <div>
                        <label className="text-xs font-semibold text-zinc-300">Channel Name</label>
                        <input
                           required
                           value={newChannelName}
                           onChange={(e) => setNewChannelName(e.target.value)}
                           placeholder="e.g. engineering, announcements"
                           className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs text-zinc-100 outline-none focus:border-[#f9ebae]"
                        />
                     </div>

                     <div>
                        <label className="text-xs font-semibold text-zinc-300">Privacy Type</label>
                        <div className="grid grid-cols-2 gap-2 mt-1">
                           <button
                              type="button"
                              onClick={() => setNewChannelType("public")}
                              className={`p-3 rounded-xl border text-left text-xs transition ${
                                 newChannelType === "public"
                                    ? "border-[#f9ebae] bg-[#f9ebae]/10 text-[#f9ebae] font-bold"
                                    : "border-zinc-800 bg-zinc-900 text-zinc-400"
                              }`}
                           >
                              <div className="flex items-center gap-1.5 font-bold">
                                 <HiGlobeAlt size={14} /> Public
                              </div>
                              <div className="text-[10px] text-zinc-500 mt-1">Anyone in workspace can see & message</div>
                           </button>

                           <button
                              type="button"
                              onClick={() => setNewChannelType("private")}
                              className={`p-3 rounded-xl border text-left text-xs transition ${
                                 newChannelType === "private"
                                    ? "border-amber-400 bg-amber-400/10 text-amber-300 font-bold"
                                    : "border-zinc-800 bg-zinc-900 text-zinc-400"
                              }`}
                           >
                              <div className="flex items-center gap-1.5 font-bold">
                                 <HiLockClosed size={14} /> Private
                              </div>
                              <div className="text-[10px] text-zinc-500 mt-1">Only invited members can access & message</div>
                           </button>
                        </div>
                     </div>

                     {/* Member selection for Private Channel */}
                     {newChannelType === "private" && (
                        <div>
                           <label className="text-xs font-semibold text-zinc-300">
                              Allow Members ({selectedMemberIds.length} selected)
                           </label>
                           <div className="mt-1.5 max-h-40 overflow-y-auto space-y-1 rounded-xl border border-zinc-800 bg-zinc-900/60 p-2">
                              {workspaceMembers
                                 .filter((m) => (m.userId || m._id) !== user?._id)
                                 .map((m) => {
                                    const mId = m.userId || m._id;
                                    const isChecked = selectedMemberIds.includes(mId);
                                    return (
                                       <label
                                          key={mId}
                                          className="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-800/80 cursor-pointer text-xs"
                                       >
                                          <div className="flex items-center gap-2">
                                             <img src={getAvatarSrc(m)} alt={m.name} className="h-6 w-6 rounded-full" />
                                             <span className="text-zinc-200 font-medium">{m.name || m.email}</span>
                                          </div>
                                          <input
                                             type="checkbox"
                                             checked={isChecked}
                                             onChange={() => {
                                                if (isChecked) {
                                                   setSelectedMemberIds((prev) => prev.filter((id) => id !== mId));
                                                } else {
                                                   setSelectedMemberIds((prev) => [...prev, mId]);
                                                }
                                             }}
                                             className="accent-[#f9ebae]"
                                          />
                                       </label>
                                    );
                                 })}
                           </div>
                        </div>
                     )}

                     <div>
                        <label className="text-xs font-semibold text-zinc-300">Topic / Description (Optional)</label>
                        <input
                           value={newChannelTopic}
                           onChange={(e) => setNewChannelTopic(e.target.value)}
                           placeholder="What is this channel about?"
                           className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs text-zinc-100 outline-none focus:border-[#f9ebae]"
                        />
                     </div>

                     <div className="flex justify-end gap-2 pt-2">
                        <button
                           type="button"
                           onClick={() => setShowCreateModal(false)}
                           className="px-4 py-2 rounded-xl border border-zinc-800 text-xs text-zinc-400 hover:text-white"
                        >
                           Cancel
                        </button>
                        <button
                           type="submit"
                           className="px-5 py-2 rounded-xl bg-[#f9ebae] text-zinc-950 text-xs font-bold hover:bg-[#e6d695] transition"
                        >
                           Create Channel
                        </button>
                     </div>
                  </form>
               </div>
            </div>
         )}

         {/* Modal: Manage Private Channel Members */}
         {showManageMembersModal && activeChannel && (
            <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4 backdrop-blur-sm">
               <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                     <div>
                        <h3 className="text-base font-bold text-zinc-100 flex items-center gap-1.5">
                           <HiLockClosed className="text-amber-400" size={16} />
                           <span>Manage Private Members</span>
                        </h3>
                        <p className="text-xs text-zinc-400">#{activeChannel.name}</p>
                     </div>
                     <button onClick={() => setShowManageMembersModal(false)} className="text-zinc-400 hover:text-white">
                        <HiXCircle size={20} />
                     </button>
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-1.5 p-1">
                     {workspaceMembers
                        .filter((m) => (m.userId || m._id) !== user?._id)
                        .map((m) => {
                           const targetId = m.userId || m._id;
                           const isMember = activeChannel.members?.some(
                              (mem) => (mem._id || mem) === targetId
                           );

                           return (
                              <div
                                 key={targetId}
                                 className="flex items-center justify-between p-2.5 rounded-xl border border-zinc-800 bg-zinc-900/60"
                              >
                                 <div className="flex items-center gap-2.5">
                                    <img src={getAvatarSrc(m)} alt={m.name} className="h-7 w-7 rounded-lg border border-zinc-700 object-cover" />
                                    <div>
                                       <h5 className="text-xs font-bold text-zinc-200">{m.name || m.email}</h5>
                                       <p className="text-[10px] text-zinc-500">{m.email}</p>
                                    </div>
                                 </div>

                                 <button
                                    type="button"
                                    onClick={() => handleToggleMember(targetId)}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                                       isMember
                                          ? "bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20"
                                          : "bg-amber-400 text-zinc-950 hover:bg-amber-300"
                                    }`}
                                 >
                                    {isMember ? "Remove" : "Add"}
                                 </button>
                              </div>
                           );
                        })}
                  </div>

                  <div className="flex justify-end pt-2">
                     <button
                        type="button"
                        onClick={() => setShowManageMembersModal(false)}
                        className="px-5 py-2 rounded-xl bg-zinc-800 text-xs font-bold text-zinc-200 hover:bg-zinc-700"
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
