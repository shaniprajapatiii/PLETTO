import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { HiSparkles, HiUsers, HiTrash, HiPencil, HiEmojiHappy, HiXCircle, HiReply } from "react-icons/hi";
import {
   getChannels,
   getMessages,
   editMessage,
   deleteMessage,
   pinMessage,
   unpinMessage,
   getPinnedMessages,
   addReaction,
   removeReaction,
} from "../../services/chatService";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";

const EMOJI_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🔥", "🎉", "✨"];

export default function Chat() {
   const { user } = useAuth();
   const socket = useSocket();
   const [channels, setChannels] = useState([]);
   const [activeChannel, setActiveChannel] = useState(null);
   const [messages, setMessages] = useState([]);
   const [pinnedMessages, setPinnedMessages] = useState([]);
   const [messageText, setMessageText] = useState("");
   const [error, setError] = useState(null);
   const [, setSocketError] = useState(null);
   const [searchParams, setSearchParams] = useSearchParams();
   const [typingUsers, setTypingUsers] = useState([]);
   const [onlineUsers, setOnlineUsers] = useState([]);
   const [editingMessageId, setEditingMessageId] = useState(null);
   const [editingText, setEditingText] = useState("");
   const [showPinned, setShowPinned] = useState(false);
   const [replyingTo, setReplyingTo] = useState(null);
   const [showEmojiPicker, setShowEmojiPicker] = useState(null);

   const socketRef = useRef(socket);
   const activeChannelRef = useRef(null);
   const userRef = useRef(user);
   const typingTimeoutRef = useRef(null);
   const messagesEndRef = useRef(null);

   const refreshChannels = async () => {
      try {
         const res = await getChannels();
         const nextChannels = res.data.channels || [];
         setChannels(nextChannels);
         return nextChannels;
      } catch (error) {
         setError(error.response?.data?.message || "Failed to load channels");
         return [];
      }
   };

   const refreshMessages = async (channelId) => {
      try {
         const res = await getMessages(channelId);
         setMessages(res.data.messages);
      } catch {
         setError("Failed to load messages");
      }
   };

   const loadPinnedMessages = async (channelId) => {
      try {
         const res = await getPinnedMessages(channelId);
         setPinnedMessages(res.data.pinnedMessages);
      } catch {
         // ignore
      }
   };

   // Auto-scroll to latest message
   const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
   };

   useEffect(() => {
      scrollToBottom();
   }, [messages]);

   useEffect(() => {
      const initialize = async () => {
         const nextChannels = await refreshChannels();
         if (!activeChannel && nextChannels.length) {
            const channelId = searchParams.get("channel");
            const fallback = nextChannels.find((channel) => channel._id === channelId) || nextChannels[0];
            if (fallback) {
               const nextParams = new URLSearchParams(searchParams);
               nextParams.set("channel", fallback._id);
               setSearchParams(nextParams);
               setActiveChannel(fallback);
            }
         }
      };
      initialize();
   }, [activeChannel, searchParams, setSearchParams]);

   useEffect(() => {
      activeChannelRef.current = activeChannel;
   }, [activeChannel]);

   useEffect(() => {
      userRef.current = user;
   }, [user]);

   useEffect(() => {
      if (!socket) return;
      socketRef.current = socket;

      socket.on("connect", () => {
         console.log("Socket connected");
         socket.emit("userOnline");
      });

      socket.on("connect_error", (err) => {
         setSocketError(err.message || "Socket connection failed");
      });

      // Message events
      socket.on("newMessage", (newMessage) => {
         const currentChannel = activeChannelRef.current;
         if (!currentChannel || newMessage.channel !== currentChannel._id) return;
         setMessages((current) => {
            if (current.some((item) => item._id === newMessage._id)) {
               return current;
            }
            return [...current, newMessage];
         });
      });

      socket.on("messageEdited", (editedMessage) => {
         const currentChannel = activeChannelRef.current;
         if (!currentChannel || editedMessage.channel !== currentChannel._id) return;
         setMessages((current) =>
            current.map((msg) => (msg._id === editedMessage._id ? editedMessage : msg))
         );
      });

      socket.on("messageDeleted", ({ messageId }) => {
         setMessages((current) => current.filter((msg) => msg._id !== messageId));
      });

      // Reaction events
      socket.on("reactionAdded", (message) => {
         setMessages((current) =>
            current.map((msg) => (msg._id === message._id ? message : msg))
         );
      });

      socket.on("reactionRemoved", (message) => {
         setMessages((current) =>
            current.map((msg) => (msg._id === message._id ? message : msg))
         );
      });

      // Pin events
      socket.on("messagePinned", (message) => {
         setPinnedMessages((current) => [...current, message]);
         setMessages((current) =>
            current.map((msg) => (msg._id === message._id ? message : msg))
         );
      });

      socket.on("messageUnpinned", ({ messageId }) => {
         setPinnedMessages((current) => current.filter((msg) => msg._id !== messageId));
         setMessages((current) =>
            current.map((msg) => (msg._id === messageId ? { ...msg, isPinned: false } : msg))
         );
      });

      // Typing events
      socket.on("typing", ({ channelId, isTyping, user: typingUser }) => {
         const currentChannel = activeChannelRef.current;
         const currentUser = userRef.current;
         if (!currentChannel || channelId !== currentChannel._id) return;
         if (!typingUser || typingUser.id === currentUser?._id) return;

         setTypingUsers((current) => {
            if (!isTyping) {
               return current.filter((item) => item.id !== typingUser.id);
            }
            if (current.some((item) => item.id === typingUser.id)) {
               return current;
            }
            return [...current, typingUser].slice(-3);
         });
      });

      // Presence events
      socket.on("presenceUpdate", ({ userId, status, name, avatar, color }) => {
         setOnlineUsers((current) => {
            const filtered = current.filter((u) => u.id !== userId);
            if (status === "online") {
               return [...filtered, { id: userId, name, avatar, color, status }];
            }
            return filtered;
         });
      });

      // User join/leave channel
      socket.on("userJoinedChannel", ({ name }) => {
         console.log(`${name} joined`);
      });

      socket.on("userLeftChannel", ({ name }) => {
         console.log(`${name} left`);
      });

      // Channel real-time events
      socket.on("channelCreated", (newChannel) => {
         setChannels((current) => {
            if (current.some((ch) => ch._id === newChannel._id)) {
               return current;
            }
            return [newChannel, ...current];
         });
      });

      socket.on("channelUpdated", (updatedChannel) => {
         setChannels((current) =>
            current.map((ch) => (ch._id === updatedChannel._id ? updatedChannel : ch))
         );
      });

      socket.on("channelDeleted", ({ channelId }) => {
         setChannels((current) => current.filter((ch) => ch._id !== channelId));
         if (activeChannelRef.current?._id === channelId) {
            setActiveChannel(null);
         }
      });

      return () => {
         socket.off("connect");
         socket.off("connect_error");
         socket.off("newMessage");
         socket.off("messageEdited");
         socket.off("messageDeleted");
         socket.off("reactionAdded");
         socket.off("reactionRemoved");
         socket.off("messagePinned");
         socket.off("messageUnpinned");
         socket.off("typing");
         socket.off("presenceUpdate");
         socket.off("userJoinedChannel");
         socket.off("userLeftChannel");
         socket.off("channelCreated");
         socket.off("channelUpdated");
         socket.off("channelDeleted");
      };
   }, [socket]);

   useEffect(() => {
      if (!activeChannel || !socketRef.current) return;
      socketRef.current.emit("joinChannel", activeChannel._id);
      refreshMessages(activeChannel._id);
      loadPinnedMessages(activeChannel._id);
   }, [activeChannel]);


   const selectChannel = (channel) => {
      setActiveChannel(channel);
      setShowPinned(false);
      setEditingMessageId(null);
      setReplyingTo(null);
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set("channel", channel._id);
      setSearchParams(nextParams);
   };

   const handleMessageChange = (e) => {
      const nextValue = e.target.value;
      setMessageText(nextValue);

      // Emit typing indicator
      if (socketRef.current && activeChannelRef.current) {
         clearTimeout(typingTimeoutRef.current);
         socketRef.current.emit("typing", {
            channelId: activeChannelRef.current._id,
            isTyping: true,
         });

         // Stop typing after 3 seconds of inactivity
         typingTimeoutRef.current = setTimeout(() => {
            if (socketRef.current && activeChannelRef.current) {
               socketRef.current.emit("typing", {
                  channelId: activeChannelRef.current._id,
                  isTyping: false,
               });
            }
         }, 3000);
      }

      if (socketRef.current && activeChannel) {
         const typing = Boolean(nextValue.trim());
         socketRef.current.emit("typing", {
            channelId: activeChannel._id,
            isTyping: typing,
         });
      }

      if (typingTimeoutRef.current) {
         window.clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = window.setTimeout(() => {
         if (socketRef.current && activeChannel) {
            socketRef.current.emit("typing", {
               channelId: activeChannel._id,
               isTyping: false,
            });
         }
      }, 1200);
   };

   const handleSendMessage = (e) => {
      e.preventDefault();
      if (!messageText.trim() || !activeChannel || !socketRef.current) return;

      socketRef.current.emit("sendMessage", {
         channelId: activeChannel._id,
         text: messageText.trim(),
      });
      setMessageText("");
      setReplyingTo(null);
   };

   const handleEditMessage = async (messageId, newText) => {
      try {
         await editMessage(messageId, newText);
         if (socketRef.current && activeChannelRef.current) {
            socketRef.current.emit("editMessage", {
               messageId,
               channelId: activeChannelRef.current._id,
               text: newText,
            });
         }
         setEditingMessageId(null);
         setEditingText("");
      } catch {
         setError("Failed to edit message");
      }
   };

   const handleDeleteMessage = async (messageId) => {
      try {
         await deleteMessage(messageId);
         if (socketRef.current && activeChannelRef.current) {
            socketRef.current.emit("deleteMessage", {
               messageId,
               channelId: activeChannelRef.current._id,
            });
         }
      } catch {
         setError("Failed to delete message");
      }
   };

   const handlePinMessage = async (messageId) => {
      try {
         await pinMessage(messageId);
      } catch {
         setError("Failed to pin message");
      }
   };

   const handleUnpinMessage = async (messageId) => {
      try {
         await unpinMessage(messageId);
      } catch {
         setError("Failed to unpin message");
      }
   };

   const handleAddReaction = async (messageId, emoji) => {
      try {
         await addReaction(messageId, emoji);
         setShowEmojiPicker(null);
      } catch {
         console.error("Failed to add reaction");
      }
   };

   const handleRemoveReaction = async (messageId, emoji) => {
      try {
         await removeReaction(messageId, emoji);
      } catch {
         console.error("Failed to remove reaction");
      }
   };

   return (
      <div className="flex flex-col gap-5">
         {/* Main Chat */}
         <div className="flex min-h-[680px] flex-col rounded-[24px] border border-white/10 bg-[#060606]/85 p-4 shadow-[0_16px_50px_rgba(0,0,0,0.24)]">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-800">
               <div>
                  <span className="text-[10px] font-bold text-[#f9ebae] uppercase tracking-widest">Active Channel</span>
                  <h2 className="text-lg font-bold text-zinc-100 mt-0.5">{activeChannel?.name ? `# ${activeChannel.name}` : "Choose a channel"}</h2>
               </div>
               <div className="flex items-center gap-2">
                  {pinnedMessages.length > 0 && (
                     <button
                        onClick={() => setShowPinned(!showPinned)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[rgba(249,235,174,0.3)] bg-[rgba(249,235,174,0.1)] text-xs font-semibold text-[#f9ebae] hover:bg-[rgba(249,235,174,0.2)] transition"
                     >
                        <span>📌 {pinnedMessages.length} Pinned</span>
                     </button>
                  )}
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-[11px] font-semibold text-emerald-400">
                     <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                     <span>{onlineUsers.length} Online</span>
                  </span>
               </div>
            </div>

            {/* Typing Indicator Bar */}
            {typingUsers.length > 0 && (
               <div className="mt-2 text-xs text-[#f9ebae] italic">
                  {typingUsers.map((u) => u.name).join(", ")} is typing…
               </div>
            )}

            {/* Pinned Messages Panel */}
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
                           <button onClick={() => handleUnpinMessage(msg._id)} className="text-[10px] text-zinc-500 hover:text-[#f9ebae]">
                              Unpin
                           </button>
                        </div>
                     ))}
                  </div>
               </div>
            )}

            {/* Message Feed Canvas */}
            <div className="mt-3 flex-1 overflow-y-auto rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-4 space-y-3 min-h-[450px]">
               {messages.length > 0 ? (
                  messages
                     .filter((msg) => !msg.isDeleted)
                     .map((msg) => (
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
                                 <button onClick={() => handlePinMessage(msg._id)} className="p-1 text-zinc-400 hover:text-[#f9ebae]" title="Pin message">
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
                                       <button onClick={() => handleDeleteMessage(msg._id)} className="p-1 text-zinc-400 hover:text-red-400">
                                          <HiTrash className="h-4 w-4" />
                                       </button>
                                    </>
                                 )}
                              </div>
                           </div>

                           {/* Emoji Picker Popup */}
                           {showEmojiPicker === msg._id && (
                              <div className="mt-1 flex gap-1 p-1.5 rounded-lg border border-zinc-800 bg-zinc-950">
                                 {EMOJI_REACTIONS.map((emoji) => (
                                    <button key={emoji} onClick={() => handleAddReaction(msg._id, emoji)} className="p-1 hover:bg-zinc-800 rounded text-sm">
                                       {emoji}
                                    </button>
                                 ))}
                                 <button onClick={() => setShowEmojiPicker(null)} className="p-1 text-zinc-500 hover:text-white">
                                    <HiXCircle className="h-4 w-4" />
                                 </button>
                              </div>
                           )}

                           {/* Edit mode */}
                           {editingMessageId === msg._id ? (
                              <form onSubmit={(e) => { e.preventDefault(); handleEditMessage(msg._id, editingText); }} className="flex gap-2 mt-2">
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
                                                   handleRemoveReaction(msg._id, r.emoji);
                                                } else {
                                                   handleAddReaction(msg._id, r.emoji);
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
                     {activeChannel ? "No messages in this channel yet. Start the conversation!" : "Select a channel to begin messaging."}
                  </div>
               )}
            </div>

            {/* Message Input Box */}
            <form onSubmit={handleSendMessage} className="mt-3 flex gap-2">
               <input
                  className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-xs text-zinc-100 outline-none focus:border-[#f9ebae] placeholder:text-zinc-600 transition"
                  placeholder="Type a message..."
                  value={messageText}
                  onChange={handleMessageChange}
                  disabled={!activeChannel}
               />
               <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#f9ebae] hover:bg-[#e6d695] text-zinc-950 font-bold text-xs shadow-md shadow-[#f9ebae]/20 transition disabled:opacity-50"
                  disabled={!activeChannel || !messageText.trim()}
               >
                  Send
               </button>
            </form>

            {error && <div className="mt-2 p-2.5 rounded-lg border border-red-500/30 bg-red-500/10 text-xs text-red-300">{error}</div>}
         </div>
      </div>
   );
}


