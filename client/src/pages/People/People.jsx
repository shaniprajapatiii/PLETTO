import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HiChatAlt2, HiSearch, HiUserGroup, HiOutlineMail, HiShieldCheck } from "react-icons/hi";
import { PageShell } from "../../components/common/PageShell";
import { getWorkspaceMembers } from "../../services/workspaceService";
import { createChannel } from "../../services/chatService";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { getAvatarSrc } from "../../utils/avatar";

export default function People() {
   const navigate = useNavigate();
   const { user } = useAuth();
   const socket = useSocket();

   const [members, setMembers] = useState([]);
   const [search, setSearch] = useState("");
   const [filterTab, setFilterTab] = useState("all");
   const [busyId, setBusyId] = useState(null);
   const [error, setError] = useState(null);
   const [onlineUserIds, setOnlineUserIds] = useState(new Set());
   const [loading, setLoading] = useState(true);

   const normalizeId = (val) => (val?._id || val)?.toString();

   useEffect(() => {
      const load = async () => {
         try {
            setLoading(true);
            const res = await getWorkspaceMembers();
            setMembers(res.data.members || []);
         } catch (requestError) {
            setError(requestError.response?.data?.message || "Failed to load team members");
         } finally {
            setLoading(false);
         }
      };

      load();
   }, []);

   useEffect(() => {
      if (!socket) return;

      socket.emit("userOnline");

      if (user?._id) {
         setOnlineUserIds((prev) => new Set([...prev, normalizeId(user._id)]));
      }

      const handlePresenceUpdate = ({ userId, status }) => {
         setOnlineUserIds((prev) => {
            const next = new Set(prev);
            if (status === "online") {
               next.add(normalizeId(userId));
            } else {
               next.delete(normalizeId(userId));
            }
            return next;
         });
      };

      socket.on("presenceUpdate", handlePresenceUpdate);

      return () => {
         socket.off("presenceUpdate", handlePresenceUpdate);
      };
   }, [socket, user]);

   const uniqueMembers = useMemo(() => {
      const seen = new Set();
      return members.filter((member) => {
         const id = normalizeId(member.userId || member._id);
         if (!id || seen.has(id)) return false;
         seen.add(id);
         return true;
      });
   }, [members]);

   const onlineCount = useMemo(() => {
      return uniqueMembers.filter((m) => {
         const id = normalizeId(m.userId || m._id);
         return onlineUserIds.has(id) || id === normalizeId(user?._id);
      }).length;
   }, [uniqueMembers, onlineUserIds, user]);

   const filteredMembers = useMemo(() => {
      const q = search.trim().toLowerCase();
      return uniqueMembers.filter((member) => {
         const memberId = normalizeId(member.userId || member._id);
         const isOnline = onlineUserIds.has(memberId) || memberId === normalizeId(user?._id);

         if (filterTab === "online" && !isOnline) return false;
         if (filterTab === "offline" && isOnline) return false;

         if (!q) return true;
         return (
            member.name?.toLowerCase().includes(q) ||
            member.email?.toLowerCase().includes(q) ||
            member.role?.toLowerCase().includes(q)
         );
      });
   }, [uniqueMembers, onlineUserIds, user, search, filterTab]);

   const handleMessage = async (member) => {
      const memberId = normalizeId(member.userId || member._id);
      if (!memberId || busyId) return;

      try {
         setBusyId(memberId);
         const res = await createChannel({
            name: member.name || member.email,
            type: "dm",
            members: [user._id, memberId],
            recipientId: memberId,
         });

         const channel = res.data.channel;
         if (channel?._id) {
            navigate(`/dm?channel=${channel._id}`);
         }
      } catch (err) {
         setError(err.response?.data?.message || "Failed to start direct message");
      } finally {
         setBusyId(null);
      }
   };

   return (
      <PageShell
         title="Team Directory"
         subtitle="Connect with coworkers, review roles, and launch direct messages."
         actions={
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/20 bg-black text-xs font-mono font-bold text-white shadow-sm">
               <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
               <span>{onlineCount} Online Now</span>
            </div>
         }
      >
         <div className="space-y-6 sm:space-y-8">
            {/* Filter Tabs and Large Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
               <div className="flex items-center gap-1.5 bg-[#09090b] p-1.5 rounded-xl border border-white/15 w-full sm:w-auto">
                  <button
                     type="button"
                     onClick={() => setFilterTab("all")}
                     className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                        filterTab === "all" ? "bg-white text-black shadow-sm" : "text-neutral-400 hover:text-white"
                     }`}
                  >
                     All ({uniqueMembers.length})
                  </button>
                  <button
                     type="button"
                     onClick={() => setFilterTab("online")}
                     className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                        filterTab === "online" ? "bg-white text-black shadow-sm" : "text-neutral-400 hover:text-white"
                     }`}
                  >
                     Online ({onlineCount})
                  </button>
                  <button
                     type="button"
                     onClick={() => setFilterTab("offline")}
                     className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                        filterTab === "offline" ? "bg-white text-black shadow-sm" : "text-neutral-400 hover:text-white"
                     }`}
                  >
                     Offline ({uniqueMembers.length - onlineCount})
                  </button>
               </div>

               <div className="relative w-full sm:w-80">
                  <HiSearch className="absolute left-3.5 top-3.5 h-4 w-4 text-neutral-400" />
                  <input
                     value={search}
                     onChange={(e) => setSearch(e.target.value)}
                     placeholder="Search teammates by name or email..."
                     className="w-full rounded-xl border border-white/15 bg-[#09090b] py-2.5 pl-10 pr-4 text-xs sm:text-sm text-white placeholder:text-neutral-500 outline-none focus:border-white transition"
                  />
               </div>
            </div>

            {error && (
               <div className="p-4 rounded-xl border border-white/30 bg-[#16161a] text-xs font-medium text-white flex items-center justify-between">
                  <span>{error}</span>
                  <button onClick={() => setError(null)} className="text-neutral-400 hover:text-white">✕</button>
               </div>
            )}

            {/* Member Big Cards Grid */}
            {loading ? (
               <div className="py-24 text-center text-sm text-neutral-400 flex flex-col items-center justify-center gap-3">
                  <div className="h-7 w-7 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Loading team directory...</span>
               </div>
            ) : filteredMembers.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                  {filteredMembers.map((member) => {
                     const memberId = normalizeId(member.userId || member._id);
                     const isCurrent = memberId === normalizeId(user?._id);
                     const isOnline = onlineUserIds.has(memberId) || isCurrent;
                     const avatarSrc = getAvatarSrc(member);

                     return (
                        <div
                           key={member.email || memberId}
                           className="big-card-interactive p-6 flex flex-col justify-between gap-5 relative group"
                        >
                           {/* Member Header */}
                           <div className="flex items-start gap-4">
                              <div className="relative shrink-0">
                                 <img
                                    src={avatarSrc}
                                    alt={member.name || member.email}
                                    className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl border border-white/20 object-cover shadow-md"
                                 />
                                 <span
                                    className={`absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-black ${
                                       isOnline ? "bg-white" : "bg-neutral-600"
                                    }`}
                                 />
                              </div>

                              <div className="min-w-0 flex-1 space-y-1">
                                 <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="text-base font-bold text-white truncate">
                                       {member.name || member.email}
                                    </h3>
                                    {isCurrent && (
                                       <span className="badge-bw px-2 py-0.5 text-[10px] font-mono">
                                          YOU
                                       </span>
                                    )}
                                 </div>

                                 <p className="text-xs text-neutral-400 truncate flex items-center gap-1.5">
                                    <HiOutlineMail className="h-3.5 w-3.5 shrink-0 text-neutral-500" />
                                    <span>{member.email}</span>
                                 </p>

                                 <div className="pt-1 flex items-center gap-2">
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md border border-white/10 bg-black text-[10px] font-mono uppercase text-neutral-300">
                                       <HiShieldCheck className="h-3 w-3" />
                                       <span>{member.role || "Member"}</span>
                                    </span>
                                    <span className="text-[10px] font-mono text-neutral-400">
                                       {isOnline ? "• Online" : "• Offline"}
                                    </span>
                                 </div>
                              </div>
                           </div>

                           {/* Card Footer / Action */}
                           <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                              <span className="text-[11px] font-mono text-neutral-500">
                                 Workspace Member
                              </span>

                              {!isCurrent ? (
                                 <button
                                    type="button"
                                    onClick={() => handleMessage(member)}
                                    disabled={busyId === memberId}
                                    className="btn-white px-4 py-2 text-xs font-bold transition flex items-center gap-2 disabled:opacity-50"
                                 >
                                    <HiChatAlt2 className="h-3.5 w-3.5" />
                                    <span>{busyId === memberId ? "Connecting..." : "Message"}</span>
                                 </button>
                              ) : (
                                 <span className="text-xs font-semibold text-neutral-400">Your Account</span>
                              )}
                           </div>
                        </div>
                     );
                  })}
               </div>
            ) : (
               <div className="big-card text-center py-20 p-8 space-y-3">
                  <HiUserGroup className="mx-auto text-neutral-600" size={48} />
                  <h3 className="text-lg font-bold text-white">No members found</h3>
                  <p className="text-xs sm:text-sm text-neutral-400 max-w-sm mx-auto">
                     No teammates matched your search filters. Try clearing your query.
                  </p>
               </div>
            )}
         </div>
      </PageShell>
   );
}
