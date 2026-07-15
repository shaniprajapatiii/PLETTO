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
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
               <div>
                  <div className="text-[10px] uppercase tracking-[0.24em] text-gold">Active room</div>
                  <div className="mt-1 text-xl font-semibold text-white">{activeChannel?.name || "Choose a room"}</div>
               </div>
               <div className="flex gap-2">
                  {pinnedMessages.length > 0 && (
                     <button
                        onClick={() => setShowPinned(!showPinned)}
                        className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-[rgba(245,181,50,0.08)] px-3 py-2 text-sm text-gold hover:bg-[rgba(245,181,50,0.12)]"
                     >
                        📌 {pinnedMessages.length}
                     </button>
                  )}
                  <div className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-[rgba(245,181,50,0.08)] px-3 py-2 text-sm text-gold">
                     <HiSparkles className="h-4 w-4" />
                     Realtime
                  </div>
               </div>
            </div>

            {/* Status */}
            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-[16px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm">
               <div className="flex items-center gap-2 text-gold">
                  <HiUsers className="h-4 w-4" />
                  {onlineUsers.length} online
               </div>
               <div className="rounded-full border border-gold/20 bg-[rgba(245,181,50,0.08)] px-3 py-1 text-xs uppercase tracking-[0.22em] text-gold">
                  Live sync
               </div>
               {typingUsers.length > 0 && (
                  <div className="text-sm text-white">
                     {typingUsers.map((u) => u.name).join(", ")} is typing…
                  </div>
               )}
            </div>

            {/* Pinned Messages Panel */}
            {showPinned && pinnedMessages.length > 0 && (
               <div className="mt-4 rounded-[16px] border border-gold/20 bg-[rgba(245,181,50,0.08)] p-4">
                  <div className="mb-3 flex items-center justify-between">
                     <span className="font-semibold text-white">Pinned Messages</span>
                     <button onClick={() => setShowPinned(false)} className="text-muted-foreground hover:text-white">
                        <HiXCircle className="h-5 w-5" />
                     </button>
                  </div>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                     {pinnedMessages.map((msg) => (
                        <div key={msg._id} className="rounded-[12px] border border-white/10 bg-white/[0.05] p-3">
                           <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-medium text-gold">{msg.user?.name}</span>
                              <button
                                 onClick={() => handleUnpinMessage(msg._id)}
                                 className="text-xs text-muted-foreground hover:text-white"
                              >
                                 Unpin
                              </button>
                           </div>
                           <p className="mt-1 text-sm text-white">{msg.text}</p>
                        </div>
                     ))}
                  </div>
               </div>
            )}

            {/* Messages */}
            <div className="mt-4 flex-1 overflow-auto rounded-[20px] border border-white/10 bg-[rgba(255,255,255,0.025)] p-4">
               {messages.length > 0 ? (
                  <div className="space-y-3">
                     {messages
                        .filter((msg) => !msg.isDeleted)
                        .map((msg) => (
                           <div
                              key={msg._id}
                              className="group rounded-[16px] border border-white/10 bg-[rgba(255,255,255,0.05)] p-4 transition hover:border-gold/20 hover:bg-[rgba(255,255,255,0.08)]"
                           >
                              <div className="flex items-center justify-between gap-3">
                                 <div className="flex items-center gap-3 flex-1">
                                    <div className="text-sm font-semibold text-white">{msg.user?.name || "Unknown"}</div>
                                    <span className="text-xs text-muted-foreground">
                                       {new Date(msg.createdAt).toLocaleTimeString([], {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                       })}
                                    </span>
                                    {msg.isEdited && <span className="text-xs text-muted-foreground">(edited)</span>}
                                    {msg.isPinned && <span className="text-xs text-gold">📌</span>}
                                 </div>
                                 <div className="hidden gap-2 group-hover:flex">
                                    <button
                                       onClick={() => handlePinMessage(msg._id)}
                                       className="p-1 text-muted-foreground hover:text-gold"
                                       title="Pin message"
                                    >
                                       📌
                                    </button>
                                    <button
                                       onClick={() => setShowEmojiPicker(msg._id)}
                                       className="p-1 text-muted-foreground hover:text-gold"
                                       title="Add reaction"
                                    >
                                       <HiEmojiHappy className="h-4 w-4" />
                                    </button>
                                    {msg.user?._id === user?._id && (
                                       <>
                                          <button
                                             onClick={() => {
                                                setEditingMessageId(msg._id);
                                                setEditingText(msg.text);
                                             }}
                                             className="p-1 text-muted-foreground hover:text-gold"
                                             title="Edit"
                                          >
                                             <HiPencil className="h-4 w-4" />
                                          </button>
                                          <button
                                             onClick={() => handleDeleteMessage(msg._id)}
                                             className="p-1 text-muted-foreground hover:text-red-400"
                                             title="Delete"
                                          >
                                             <HiTrash className="h-4 w-4" />
                                          </button>
                                       </>
                                    )}
                                 </div>
                              </div>

                              {/* Emoji picker */}
                              {showEmojiPicker === msg._id && (
                                 <div className="mt-2 flex gap-1 rounded-[12px] border border-white/10 bg-white/[0.05] p-2">
                                    {EMOJI_REACTIONS.map((emoji) => (
                                       <button
                                          key={emoji}
                                          onClick={() => handleAddReaction(msg._id, emoji)}
                                          className="p-1 hover:bg-white/[0.1] rounded transition"
                                       >
                                          {emoji}
                                       </button>
                                    ))}
                                    <button
                                       onClick={() => setShowEmojiPicker(null)}
                                       className="p-1 text-muted-foreground hover:text-white"
                                    >
                                       <HiXCircle className="h-4 w-4" />
                                    </button>
                                 </div>
                              )}

                              {/* Edit mode */}
                              {editingMessageId === msg._id ? (
                                 <form
                                    onSubmit={(e) => {
                                       e.preventDefault();
                                       handleEditMessage(msg._id, editingText);
                                    }}
                                    className="mt-2 flex gap-2"
                                 >
                                    <input
                                       type="text"
                                       value={editingText}
                                       onChange={(e) => setEditingText(e.target.value)}
                                       className="flex-1 rounded-[12px] border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none"
                                    />
                                    <button
                                       type="submit"
                                       className="rounded-[12px] bg-gold px-3 py-2 text-sm font-semibold text-[var(--noir-900)]"
                                    >
                                       Save
                                    </button>
                                    <button
                                       type="button"
                                       onClick={() => setEditingMessageId(null)}
                                       className="rounded-[12px] border border-white/10 px-3 py-2 text-sm text-white"
                                    >
                                       Cancel
                                    </button>
                                 </form>
                              ) : (
                                 <>
                                    <p className="mt-2 text-sm leading-6 text-white">{msg.text}</p>

                                    {/* Reactions display */}
                                    {msg.reactions && msg.reactions.length > 0 && (
                                       <div className="mt-2 flex flex-wrap gap-1">
                                          {msg.reactions.map((reaction) => (
                                             <button
                                                key={reaction.emoji}
                                                onClick={() => {
                                                   if (reaction.users?.some((u) => u._id === user?._id)) {
                                                      handleRemoveReaction(msg._id, reaction.emoji);
                                                   } else {
                                                      handleAddReaction(msg._id, reaction.emoji);
                                                   }
                                                }}
                                                className={`rounded-full px-2 py-1 text-xs flex items-center gap-1 transition ${
                                                   reaction.users?.some((u) => u._id === user?._id)
                                                      ? "border-gold/50 bg-[rgba(245,181,50,0.12)]"
                                                      : "border border-white/10 bg-white/[0.05] hover:bg-white/[0.1]"
                                                }`}
                                                title={reaction.users?.map((u) => u.name).join(", ")}
                                             >
                                                {reaction.emoji} {reaction.users?.length || 0}
                                             </button>
                                          ))}
                                       </div>
                                    )}
                                 </>
                              )}
                           </div>
                        ))}
                     <div ref={messagesEndRef} />
                  </div>
               ) : (
                  <div className="grid h-full place-items-center text-center text-sm text-muted-foreground">
                     {activeChannel ? "No messages yet. Start the conversation." : "Pick a room to begin."}
                  </div>
               )}
            </div>

            {/* Reply indicator */}
            {replyingTo && (
               <div className="mt-2 flex items-center justify-between rounded-[12px] border border-gold/20 bg-[rgba(245,181,50,0.08)] px-3 py-2">
                  <div className="flex items-center gap-2">
                     <HiReply className="h-4 w-4 text-gold" />
                     <span className="text-sm text-white">Replying to {replyingTo.user?.name}</span>
                  </div>
                  <button onClick={() => setReplyingTo(null)} className="text-muted-foreground hover:text-white">
                     <HiXCircle className="h-4 w-4" />
                  </button>
               </div>
            )}

            {/* Message input */}
            <form onSubmit={handleSendMessage} className="mt-4 flex flex-col gap-3 sm:flex-row">
               <input
                  className="flex-1 rounded-[16px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-gold/40"
                  placeholder="Type your message…"
                  value={messageText}
                  onChange={handleMessageChange}
                  disabled={!activeChannel}
               />
               <button
                  type="submit"
                  className="rounded-[16px] bg-gradient-gold px-5 py-3 text-sm font-semibold text-[var(--noir-900)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!activeChannel || !messageText.trim()}
               >
                  Send
               </button>
            </form>

            {error && (
               <div className="mt-4 rounded-[16px] border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
                  {error}
               </div>
            )}
         </div>
      </div>
   );
}
