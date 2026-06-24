import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { HiHashtag } from "react-icons/hi";
import { createChannel, getChannels, getMessages } from "../../services/chatService";
import { useAuth } from "../../context/AuthContext";

export default function Chat() {
   const { workspace } = useAuth();
   const [channels, setChannels] = useState([]);
   const [activeChannel, setActiveChannel] = useState(null);
   const [messages, setMessages] = useState([]);
   const [name, setName] = useState("");
   const [message, setMessage] = useState("");
   const [error, setError] = useState(null);
   const [socketError, setSocketError] = useState(null);
   const socketRef = useRef(null);

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
      };
      initialize();
   }, []);

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

      return () => {
         socket.disconnect();
      };
   }, [socket, activeChannel]);

   useEffect(() => {
      if (!activeChannel || !socketRef.current) return;
      socketRef.current.emit("joinChannel", activeChannel._id);
      refreshMessages(activeChannel._id);
   }, [activeChannel]);

   const refreshChannels = async () => {
      try {
         const res = await getChannels();
         setChannels(res.data.channels);
         if (!activeChannel && res.data.channels.length) {
            setActiveChannel(res.data.channels[0]);
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
         await createChannel(name.trim());
         setName("");
         await refreshChannels();
      } catch (err) {
         setError(err.response?.data?.message || "Could not create channel");
      }
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
      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
         <section className="rounded-3xl border border-border bg-card/80 p-6 shadow-soft">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
               <div>
                  <div className="text-xs uppercase tracking-[0.28em] text-gold">Channels</div>
                  <h2 className="mt-3 text-2xl font-semibold text-white">Workspace rooms</h2>
                  <p className="mt-2 text-sm text-muted-foreground">Create rooms for every focus area and drop in instantly.</p>
               </div>
            </div>

            <form onSubmit={handleCreate} className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
               <input
                  className="min-w-[220px] flex-1 rounded-3xl border border-border bg-[rgba(255,255,255,0.06)] px-4 py-3 text-sm text-white outline-none focus:border-gold"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="New channel name"
               />
               <button className="rounded-3xl bg-gradient-gold px-5 py-3 text-sm font-semibold text-[var(--noir-900)] transition hover:-translate-y-0.5">
                  Create
               </button>
            </form>

            <div className="mt-6 space-y-3">
               {channels.map((channel) => (
                  <button
                     key={channel._id}
                     type="button"
                     onClick={() => setActiveChannel(channel)}
                     className={`w-full rounded-3xl border px-4 py-4 text-left transition ${activeChannel?._id === channel._id ? "border-gold bg-[rgba(248,181,0,0.12)]" : "border-border bg-[rgba(255,255,255,0.03)] hover:border-gold/30 hover:bg-[rgba(255,255,255,0.05)]"}`}
                  >
                     <div className="flex items-center gap-3">
                        <div className="grid h-12 w-12 place-items-center rounded-3xl bg-[rgba(248,181,0,0.14)] text-gold">
                           <HiHashtag className="h-6 w-6" />
                        </div>
                        <div>
                           <div className="font-semibold text-white">{channel.name}</div>
                           <div className="text-xs text-muted-foreground">Created {new Date(channel.createdAt).toLocaleDateString()}</div>
                        </div>
                     </div>
                  </button>
               ))}
            </div>
         </section>

         <section className="rounded-3xl border border-border bg-card/80 p-6 shadow-soft">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
               <div>
                  <div className="text-xs uppercase tracking-[0.28em] text-gold">Live chat</div>
                  <h2 className="mt-3 text-2xl font-semibold text-white">{activeChannel?.name || "Select a channel"}</h2>
               </div>
               <div className="text-sm text-muted-foreground">{socketError || (workspace ? "Realtime chat is running" : "Connect to see live chat")}</div>
            </div>

            <div className="mt-6 min-h-[420px] rounded-[2rem] border border-border bg-[rgba(255,255,255,0.025)] p-5">
               {messages.length > 0 ? (
                  <div className="space-y-4">
                     {messages.map((msg) => (
                        <div key={msg._id} className="rounded-3xl border border-border/70 bg-[rgba(255,255,255,0.06)] p-4">
                           <div className="flex items-center gap-3">
                              <div className="text-sm font-semibold text-white">{msg.user?.name || "Unknown"}</div>
                              <span className="text-xs text-muted-foreground">{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                           </div>
                           <p className="mt-2 text-sm text-white">{msg.text}</p>
                        </div>
                     ))}
                  </div>
               ) : (
                  <div className="grid h-[330px] place-items-center text-center text-sm text-muted-foreground">
                     {activeChannel ? "No messages yet. Start the discussion." : "Pick a channel or create a new room to begin."}
                  </div>
               )}
            </div>

            <form onSubmit={handleSend} className="mt-6 flex flex-col gap-3 sm:flex-row">
               <input
                  className="flex-1 rounded-3xl border border-border bg-[rgba(255,255,255,0.06)] px-4 py-3 text-sm text-white outline-none focus:border-gold"
                  placeholder="Type your message…"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={!activeChannel}
               />
               <button
                  type="submit"
                  className="rounded-3xl bg-gradient-gold px-5 py-3 text-sm font-semibold text-[var(--noir-900)] transition hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!activeChannel || !message.trim()}
               >
                  Send
               </button>
            </form>
            {error && <div className="mt-4 rounded-3xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>}
         </section>
      </div>
   );
}
