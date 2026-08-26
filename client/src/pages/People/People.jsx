import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HiArrowRight, HiChatAlt2, HiSearch, HiUserGroup, HiUser, HiGlobeAlt } from "react-icons/hi";
import { PageShell } from "../../components/common/PageShell";
import { getWorkspaceMembers } from "../../services/workspaceService";
import { createChannel } from "../../services/chatService";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { getAvatarSrc, getInitials } from "../../utils/avatar";

export default function People() {
   const navigate = useNavigate();
   const { user } = useAuth();
   const socket = useSocket();

   const [members, setMembers] = useState([]);
   const [search, setSearch] = useState("");
   const [filterTab, setFilterTab] = useState("all"); // 'all', 'online', 'offline'
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

   // Socket Presence Listener
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
         const key = member.email || normalizeId(member.userId || member._id);
         if (seen.has(key)) return false;
         seen.add(key);
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
      let list = uniqueMembers;

      if (filterTab === "online") {
         list = list.filter((m) => {
            const id = normalizeId(m.userId || m._id);
            return onlineUserIds.has(id) || id === normalizeId(user?._id);
         });
      } else if (filterTab === "offline") {
         list = list.filter((m) => {
            const id = normalizeId(m.userId || m._id);
            return !onlineUserIds.has(id) && id !== normalizeId(user?._id);
         });
      }

      const query = search.trim().toLowerCase();
      if (!query) return list;
      return list.filter((member) => {
         return [member.name, member.email, member.role, member.bio]
            .filter(Boolean)
            .some((value) => value.toLowerCase().includes(query));
      });
   }, [uniqueMembers, filterTab, search, onlineUserIds, user]);

   const handleMessage = async (member) => {
      const targetUserId = normalizeId(member.userId || member._id);
      if (!user?._id || !targetUserId) return;

      setBusyId(targetUserId);
      setError(null);
      try {
         const response = await createChannel({
            type: "dm",
            members: [targetUserId, user._id],
         });
         const channel = response.data.channel;
         if (channel?._id) {
            navigate(`/dm?channel=${channel._id}`);
         }
      } catch (requestError) {
         setError(requestError.response?.data?.message || "Could not open a direct message");
      } finally {
         setBusyId(null);
      }
   };

   return (
      <PageShell
         title="Team Directory"
         subtitle="Browse teammates across your workspace, view real active online presence, and launch direct messages."
         actions={
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-xs font-extrabold text-emerald-400">
               <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
               <span>{onlineCount} Real Online Members</span>
            </div>
         }
      >
         <div className="space-y-4">
            {/* Filter Tabs and Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
               <div className="flex items-center gap-1.5 bg-zinc-950 p-1.5 rounded-xl border border-zinc-800/80 w-full sm:w-auto">
                  <button
                     type="button"
                     onClick={() => setFilterTab("all")}
                     className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        filterTab === "all" ? "bg-[#f9ebae] text-zinc-950 shadow" : "text-zinc-400 hover:text-white"
                     }`}
                  >
                     All Members ({uniqueMembers.length})
                  </button>
                  <button
                     type="button"
                     onClick={() => setFilterTab("online")}
                     className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        filterTab === "online" ? "bg-emerald-500 text-zinc-950 shadow" : "text-zinc-400 hover:text-white"
                     }`}
                  >
                     🟢 Online Now ({onlineCount})
                  </button>
                  <button
                     type="button"
                     onClick={() => setFilterTab("offline")}
                     className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        filterTab === "offline" ? "bg-zinc-800 text-zinc-200 shadow" : "text-zinc-400 hover:text-white"
                     }`}
                  >
                     ⚪ Offline ({uniqueMembers.length - onlineCount})
                  </button>
               </div>

               <div className="relative w-full sm:w-80">
                  <HiSearch className="absolute left-3.5 top-2.5 h-4 w-4 text-zinc-500" />
                  <input
                     value={search}
                     onChange={(e) => setSearch(e.target.value)}
                     placeholder="Search member name, email, or role..."
                     className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 py-1.5 pl-9 pr-4 text-xs text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-[#f9ebae] transition"
                  />
               </div>
            </div>

            {error && (
               <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-xs text-red-300">
                  {error}
               </div>
            )}

            {/* Member Cards Grid */}
            {loading ? (
               <div className="py-20 text-center text-xs text-zinc-500 flex flex-col items-center gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#f9ebae] border-t-transparent" />
                  <span>Loading workspace directory…</span>
               </div>
            ) : filteredMembers.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredMembers.map((member) => {
                     const memberId = normalizeId(member.userId || member._id);
                     const isCurrent = memberId === normalizeId(user?._id);
                     const isOnline = onlineUserIds.has(memberId) || isCurrent;
                     const avatarSrc = getAvatarSrc(member);

                     return (
                        <div
                           key={member.email || memberId}
                           className="group p-5 rounded-2xl border border-zinc-800/80 bg-zinc-950/70 hover:border-[#f9ebae]/40 hover:bg-zinc-900/60 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl"
                        >
                           <div className="flex items-center gap-3.5 min-w-0">
                              <div className="relative shrink-0">
                                 <img
                                    src={avatarSrc}
                                    alt={member.name || member.email}
                                    className="h-12 w-12 rounded-2xl border border-zinc-800 object-cover shadow-md"
                                 />
                                 <span
                                    className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-zinc-950 ${
                                       isOnline ? "bg-emerald-500 animate-pulse" : "bg-zinc-600"
                                    }`}
                                 />
                              </div>

                              <div className="min-w-0 space-y-0.5">
                                 <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="text-sm font-bold text-zinc-100 group-hover:text-[#f9ebae] transition truncate">
                                       {member.name || member.email}
                                    </h3>

                                    {isCurrent && (
                                       <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-[#f9ebae] text-zinc-950">
                                          You
                                       </span>
                                    )}

                                    <span
                                       className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                                          isOnline
                                             ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                             : "bg-zinc-900 text-zinc-500 border-zinc-800"
                                       }`}
                                    >
                                       {isOnline ? "🟢 Online" : "⚪ Offline"}
                                    </span>
                                 </div>

                                 <p className="text-xs text-zinc-400 truncate">{member.email}</p>
                                 <p className="text-[11px] text-zinc-500 truncate">{member.role || "Member"} • {member.bio || "Team Member"}</p>
                              </div>
                           </div>

                           {!isCurrent && (
                              <button
                                 type="button"
                                 onClick={() => handleMessage(member)}
                                 disabled={busyId === memberId}
                                 className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-[#f9ebae] hover:bg-[#e6d695] text-zinc-950 text-xs font-extrabold transition flex items-center justify-center gap-1.5 shrink-0 shadow-md shadow-[#f9ebae]/10 disabled:opacity-50"
                              >
                                 <HiChatAlt2 size={14} />
                                 <span>Direct Message</span>
                              </button>
                           )}
                        </div>
                     );
                  })}
               </div>
            ) : (
               <div className="text-center py-20 rounded-2xl border border-zinc-800/80 bg-zinc-950/40 p-6 space-y-3">
                  <HiUserGroup className="mx-auto text-zinc-600" size={44} />
                  <h3 className="text-base font-bold text-zinc-200">No members match search</h3>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                     Try adjusting your search terms or status filters.
                  </p>
               </div>
            )}
         </div>
      </PageShell>
   );
}
