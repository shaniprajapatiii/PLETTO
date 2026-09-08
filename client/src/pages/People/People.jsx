import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HiChatAlt2, HiSearch, HiUserGroup } from "react-icons/hi";
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
         title="Team"
         subtitle="Browse team members and start direct conversations."
         actions={
            <div className="flex items-center gap-2 px-3 py-1 rounded-lg border border-zinc-800 bg-zinc-900/60 text-xs text-zinc-300">
               <span className="h-2 w-2 rounded-full bg-emerald-500" />
               <span>{onlineCount} online</span>
            </div>
         }
      >
         <div className="space-y-4">
            {/* Filter Tabs and Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
               <div className="flex items-center gap-1 bg-zinc-900/80 p-1 rounded-lg border border-zinc-800 w-full sm:w-auto text-xs font-medium">
                  <button
                     type="button"
                     onClick={() => setFilterTab("all")}
                     className={`px-3 py-1 rounded-md transition ${
                        filterTab === "all" ? "bg-zinc-800 text-white font-medium shadow-sm" : "text-zinc-400 hover:text-zinc-200"
                     }`}
                  >
                     All ({uniqueMembers.length})
                  </button>
                  <button
                     type="button"
                     onClick={() => setFilterTab("online")}
                     className={`px-3 py-1 rounded-md transition ${
                        filterTab === "online" ? "bg-zinc-800 text-white font-medium shadow-sm" : "text-zinc-400 hover:text-zinc-200"
                     }`}
                  >
                     Online ({onlineCount})
                  </button>
                  <button
                     type="button"
                     onClick={() => setFilterTab("offline")}
                     className={`px-3 py-1 rounded-md transition ${
                        filterTab === "offline" ? "bg-zinc-800 text-white font-medium shadow-sm" : "text-zinc-400 hover:text-zinc-200"
                     }`}
                  >
                     Offline ({uniqueMembers.length - onlineCount})
                  </button>
               </div>

               <div className="relative w-full sm:w-72">
                  <HiSearch className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
                  <input
                     value={search}
                     onChange={(e) => setSearch(e.target.value)}
                     placeholder="Search members..."
                     className="w-full rounded-lg border border-zinc-800 bg-zinc-900 py-1.5 pl-8 pr-3 text-xs text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-zinc-600 transition"
                  />
               </div>
            </div>

            {error && (
               <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/10 text-xs text-red-300">
                  {error}
               </div>
            )}

            {/* Member Cards Grid */}
            {loading ? (
               <div className="py-20 text-center text-xs text-zinc-400 flex items-center justify-center gap-2.5">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent" />
                  <span>Loading team directory...</span>
               </div>
            ) : filteredMembers.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredMembers.map((member) => {
                     const memberId = normalizeId(member.userId || member._id);
                     const isCurrent = memberId === normalizeId(user?._id);
                     const isOnline = onlineUserIds.has(memberId) || isCurrent;
                     const avatarSrc = getAvatarSrc(member);

                     return (
                        <div
                           key={member.email || memberId}
                           className="p-3.5 rounded-xl border border-zinc-800/80 bg-zinc-900/60 hover:border-zinc-700/80 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 backdrop-blur-sm"
                        >
                           <div className="flex items-center gap-3 min-w-0">
                              <div className="relative shrink-0">
                                 <img
                                    src={avatarSrc}
                                    alt={member.name || member.email}
                                    className="h-10 w-10 rounded-lg border border-zinc-800 object-cover"
                                 />
                                 <span
                                    className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-zinc-900 ${
                                       isOnline ? "bg-emerald-500" : "bg-zinc-600"
                                    }`}
                                 />
                              </div>

                              <div className="min-w-0 space-y-0.5">
                                 <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="text-xs font-semibold text-zinc-200 truncate">
                                       {member.name || member.email}
                                    </h3>

                                    {isCurrent && (
                                       <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                                          You
                                       </span>
                                    )}
                                 </div>

                                 <p className="text-[11px] text-zinc-400 truncate">{member.email}</p>
                                 <p className="text-[10px] text-zinc-500 truncate">{member.role || "Member"}</p>
                              </div>
                           </div>

                           {!isCurrent && (
                              <button
                                 type="button"
                                 onClick={() => handleMessage(member)}
                                 disabled={busyId === memberId}
                                 className="w-full sm:w-auto px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition flex items-center justify-center gap-1.5 shrink-0 border border-zinc-700/60 disabled:opacity-50"
                              >
                                 <HiChatAlt2 size={13} />
                                 <span>Message</span>
                              </button>
                           )}
                        </div>
                     );
                  })}
               </div>
            ) : (
               <div className="text-center py-16 rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-6 space-y-2">
                  <HiUserGroup className="mx-auto text-zinc-600" size={36} />
                  <h3 className="text-sm font-semibold text-zinc-200">No members found</h3>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                     Try adjusting your search terms or filters.
                  </p>
               </div>
            )}
         </div>
      </PageShell>
   );
}
