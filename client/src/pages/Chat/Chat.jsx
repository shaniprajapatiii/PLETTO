import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useSearchParams } from "react-router-dom";
import { HiHashtag, HiPlus, HiSparkles, HiUsers } from "react-icons/hi";
import { createChannel, getChannels, getMessages } from "../../services/chatService";
import { getWorkspaceMembers } from "../../services/workspaceService";
import { useAuth } from "../../context/AuthContext";

export default function Chat() {
   const { workspace, user } = useAuth();
   const [channels, setChannels] = useState([]);
   const [activeChannel, setActiveChannel] = useState(null);
   const [messages, setMessages] = useState([]);
   const [name, setName] = useState("");
   const [message, setMessage] = useState("");
   const [members, setMembers] = useState([]);
   const [selectedMemberId, setSelectedMemberId] = useState("");
   const [error, setError] = useState(null);
   const [socketError, setSocketError] = useState(null);
   const [searchParams, setSearchParams] = useSearchParams();
   const [isTyping, setIsTyping] = useState(false);
   const [typingUsers, setTypingUsers] = useState([]);
   const socketRef = useRef(null);
   const typingTimeoutRef = useRef(null);

   const socket = useMemo(() => {
      if (!workspace) return null;
      return io("http://localhost:5000", {
         auth: {
            token: localStorage.getItem("token"),
         },
      });
   }, [workspace]);

   useEffect(() => {
      const initialize = async () => {
         await refreshChannels();
         if (user) {
            try {
               const response = await getWorkspaceMembers();
               const memberList = response.data.members || [];
               setMembers(memberList.filter((member) => member.userId !== user._id));
            } catch {
               // ignore member loading failures for now
            }
         }
      };
      initialize();
   }, [user]);

   useEffect(() => {
      if (!activeChannel && channels.length) {
         const channelId = searchParams.get("channel");
         const fallback = channels.find((channel) => channel._id === channelId) || channels[0];
         if (fallback) {
            setActiveChannel(fallback);
         }
      }
   }, [activeChannel, channels, searchParams]);

   useEffect(() => {
      if (!socket) return;
      socketRef.current = socket;

      socket.on("connect_error", (err) => {
         setSocketError(err.message || "Socket connection failed");
      });

      socket.on("newMessage", (newMessage) => {
         if (!activeChannel || newMessage.channel !== activeChannel._id) return;
         setMessages((current) => {
            if (current.some((item) => item._id === newMessage._id)) {
               return current;
            }
            return [...current, newMessage];
         });
      });

      socket.on("typing", ({ channelId, isTyping, user: typingUser }) => {
         if (!activeChannel || channelId !== activeChannel._id) return;
         if (!typingUser || typingUser.id === user?._id) return;

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

      return () => {
         socket.disconnect();
      };
   }, [socket, activeChannel, user]);

   useEffect(() => {
      if (!activeChannel || !socketRef.current) return;
      socketRef.current.emit("joinChannel", activeChannel._id);
      refreshMessages(activeChannel._id);
   }, [activeChannel]);

   const refreshChannels = async () => {
      try {
         const res = await getChannels();
         const nextChannels = res.data.channels || [];
         setChannels(nextChannels);
         if (!activeChannel && nextChannels.length) {
            const channelId = searchParams.get("channel");
            const fallback = nextChannels.find((channel) => channel._id === channelId) || nextChannels[0];
            setActiveChannel(fallback);
         }
      } catch (err) {
         setError(err.response?.data?.message || "Failed to load channels");
      }
   };

   const refreshMessages = async (channelId) => {
      try {
         const res = await getMessages(channelId);
         setMessages(res.data.messages);
      } catch (err) {
         setError(err.response?.data?.message || "Failed to load chat history");
      }
   };

   const handleCreate = async (e) => {
      e.preventDefault();
      if (!name.trim()) return;
      try {
         await createChannel({ name: name.trim(), type: "public" });
         setName("");
         await refreshChannels();
      } catch (err) {
         setError(err.response?.data?.message || "Could not create channel");
      }
   };

   const handleCreateDirect = async (e) => {
      e.preventDefault();
      if (!selectedMemberId || !user?._id) return;
      try {
         const res = await createChannel({
            type: "dm",
            members: [selectedMemberId, user._id],
         });
         const channel = res.data.channel;
         setSelectedMemberId("");
         await refreshChannels();
         if (channel) {
            setActiveChannel(channel);
         }
      } catch (err) {
         setError(err.response?.data?.message || "Could not create direct chat");
      }
   };

   const selectChannel = (channel) => {
      setActiveChannel(channel);
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set("channel", channel._id);
      setSearchParams(nextParams);
   };

   const handleMessageChange = (e) => {
      const nextValue = e.target.value;
      setMessage(nextValue);
      const typing = Boolean(nextValue.trim());
      setIsTyping(typing);
      if (socketRef.current && activeChannel) {
         socketRef.current.emit("typing", {
            channelId: activeChannel._id,
            isTyping: typing,
         });
      }
      if (typingTimeoutRef.current) {
         window.clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = window.setTimeout(() => {
         setIsTyping(false);
         if (socketRef.current && activeChannel) {
            socketRef.current.emit("typing", {
               channelId: activeChannel._id,
               isTyping: false,
            });
         }
      }, 1200);
   };

   const handleSend = (e) => {
      e.preventDefault();
      if (!message.trim() || !activeChannel || !socketRef.current) return;
      socketRef.current.emit("sendMessage", {
         channelId: activeChannel._id,
         text: message.trim(),
      });
      setMessage("");
   };

   return (
      <div className="grid gap-5 2xl:grid-cols-[300px_minmax(0,1fr)]">
         <div className="rounded-[24px] border border-white/10 bg-[#060606]/85 p-4 shadow-[0_16px_50px_rgba(0,0,0,0.24)]">
            <div className="flex items-center justify-between gap-3">
               <div>
                  <div className="text-[10px] uppercase tracking-[0.24em] text-gold">Rooms</div>
                  <div className="mt-1 text-lg font-semibold text-white">Channels</div>
               </div>
               <button className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-[rgba(245,181,50,0.08)] px-3 py-2 text-sm font-medium text-gold">
                  <HiPlus className="h-4 w-4" />
                  New
               </button>
            </div>

            <form onSubmit={handleCreate} className="mt-4 flex flex-col gap-2 rounded-[18px] border border-white/10 bg-white/[0.03] p-3">
               <input
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-muted-foreground"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Create a room"
               />
               <button className="rounded-[14px] bg-gradient-gold px-4 py-2 text-sm font-semibold text-[var(--noir-900)] transition hover:-translate-y-0.5">
                  Create room
               </button>
            </form>
            {members.length > 0 && (
               <form onSubmit={handleCreateDirect} className="mt-4 rounded-[18px] border border-white/10 bg-white/[0.03] p-3">
                  <label className="mb-2 block text-sm font-medium text-white">Start a direct message</label>
                  <select
                     className="w-full rounded-[14px] border border-white/10 bg-transparent px-3 py-2 text-sm text-white outline-none"
                     value={selectedMemberId}
                     onChange={(e) => setSelectedMemberId(e.target.value)}
                  >
                     <option value="">Pick a teammate</option>
                     {members.map((member) => (
                        <option key={member.userId} value={member.userId}>
                           {member.name || member.email}
                        </option>
                     ))}
                  </select>
                  <button type="submit" className="mt-3 w-full rounded-[14px] bg-gold px-4 py-2 text-sm font-semibold text-[var(--noir-900)] transition hover:-translate-y-0.5">
                     Start direct chat
                  </button>
               </form>
            )}

            <div className="mt-4 space-y-2">
               {channels.map((channel) => (
                  <button
                     key={channel._id}
                     type="button"
                     onClick={() => selectChannel(channel)}
                     className={`flex w-full items-center gap-3 rounded-[16px] border px-3 py-3 text-left transition ${activeChannel?._id === channel._id ? "border-gold/30 bg-[rgba(245,181,50,0.12)]" : "border-white/10 bg-white/[0.025] hover:border-gold/20 hover:bg-white/[0.04]"}`}
                  >
                     <div className="grid h-10 w-10 place-items-center rounded-[12px] bg-[rgba(245,181,50,0.14)] text-gold">
                        <HiHashtag className="h-5 w-5" />
                     </div>
                     <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-white">{channel.name}</div>
                        <div className="truncate text-xs text-muted-foreground">{new Date(channel.createdAt).toLocaleDateString()}</div>
                     </div>
                  </button>
               ))}
            </div>
         </div>

         <div className="flex min-h-[680px] flex-col rounded-[24px] border border-white/10 bg-[#060606]/85 p-4 shadow-[0_16px_50px_rgba(0,0,0,0.24)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
               <div>
                  <div className="text-[10px] uppercase tracking-[0.24em] text-gold">Active room</div>
                  <div className="mt-1 text-xl font-semibold text-white">{activeChannel?.name || "Choose a room"}</div>
               </div>
               <div className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-[rgba(245,181,50,0.08)] px-3 py-2 text-sm text-gold">
                  <HiSparkles className="h-4 w-4" />
                  Realtime ready
               </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-[16px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-muted-foreground">
               <div className="flex items-center gap-2 text-gold">
                  <HiUsers className="h-4 w-4" />
                  Presence aware
               </div>
               <div className="rounded-full border border-gold/20 bg-[rgba(245,181,50,0.08)] px-3 py-1 text-xs uppercase tracking-[0.22em] text-gold">Live sync</div>
               {typingUsers.length > 0 ? (
                  <div className="text-sm text-white">{typingUsers.map((user) => user.name).join(", ")} is typing…</div>
               ) : (
                  <div>Messages sync instantly across your workspace.</div>
               )}
            </div>

            <div className="mt-4 flex-1 overflow-auto rounded-[20px] border border-white/10 bg-[rgba(255,255,255,0.025)] p-4">
               {messages.length > 0 ? (
                  <div className="space-y-3">
                     {messages.map((msg) => (
                        <div key={msg._id} className="rounded-[16px] border border-white/10 bg-[rgba(255,255,255,0.05)] p-4">
                           <div className="flex items-center gap-3">
                              <div className="text-sm font-semibold text-white">{msg.user?.name || "Unknown"}</div>
                              <span className="text-xs text-muted-foreground">{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                           </div>
                           <p className="mt-2 text-sm leading-6 text-white">{msg.text}</p>
                        </div>
                     ))}
                  </div>
               ) : (
                  <div className="grid h-full place-items-center text-center text-sm text-muted-foreground">
                     {activeChannel ? "No messages yet. Start the conversation." : "Pick a room or create a new one to begin."}
                  </div>
               )}
            </div>

            <form onSubmit={handleSend} className="mt-4 flex flex-col gap-3 sm:flex-row">
               <input
                  className="flex-1 rounded-[16px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-gold/40"
                  placeholder="Type your message…"
                  value={message}
                  onChange={handleMessageChange}
                  disabled={!activeChannel}
               />
               <button
                  type="submit"
                  className="rounded-[16px] bg-gradient-gold px-5 py-3 text-sm font-semibold text-[var(--noir-900)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!activeChannel || !message.trim()}
               >
                  Send
               </button>
            </form>
            {error ? <div className="mt-4 rounded-[16px] border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">{error}</div> : null}
         </div>
      </div>
   );
}
