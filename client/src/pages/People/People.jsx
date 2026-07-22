import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HiArrowRight, HiChatAlt2, HiSearch, HiUserGroup } from "react-icons/hi";
import { PageShell } from "../../components/common/PageShell";
import { getWorkspaceMembers } from "../../services/workspaceService";
import { createChannel } from "../../services/chatService";
import { useAuth } from "../../context/AuthContext";
import { getAvatarSrc, getInitials } from "../../utils/avatar";

export default function People() {
   const navigate = useNavigate();
   const { user } = useAuth();
   const [members, setMembers] = useState([]);
   const [search, setSearch] = useState("");
   const [busyId, setBusyId] = useState(null);
   const [error, setError] = useState(null);

   useEffect(() => {
      const load = async () => {
         try {
            const res = await getWorkspaceMembers();
            setMembers(res.data.members || []);
         } catch (requestError) {
            setError(requestError.response?.data?.message || "Failed to load people");
         }
      };

      load();
   }, []);

   const filteredMembers = useMemo(() => {
      const seen = new Set();
      const uniqueMembers = members.filter((member) => {
         if (seen.has(member.email)) return false;
         seen.add(member.email);
         return true;
      });

      const query = search.trim().toLowerCase();
      if (!query) return uniqueMembers;
      return uniqueMembers.filter((member) => {
         return [member.name, member.email, member.role, member.bio]
            .filter(Boolean)
            .some((value) => value.toLowerCase().includes(query));
      });
   }, [members, search]);

   const handleMessage = async (member) => {
      if (!user?._id || !member?.userId) return;

      setBusyId(member.userId);
      setError(null);
      try {
         const response = await createChannel({
            type: "dm",
            members: [member.userId, user._id],
         });
         const channel = response.data.channel;
         if (channel?._id) {
            navigate(`/chat?channel=${channel._id}`);
         }
      } catch (requestError) {
         setError(requestError.response?.data?.message || "Could not open a private message");
      } finally {
         setBusyId(null);
      }
   };

   return (
      <PageShell
         title="Team Directory"
         subtitle="Browse teammates across your workspace, view profiles, and send direct messages."
         actions={
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[rgba(249,235,174,0.3)] bg-[rgba(249,235,174,0.08)] text-xs font-semibold text-[#f9ebae]">
               <HiUserGroup className="h-4 w-4 text-[#f9ebae]" />
               <span>{members.length} Members</span>
            </div>
         }
      >
         <div className="space-y-4">
            {/* Search Control */}
            <div className="relative">
               <HiSearch className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
               <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search members by name, email, or role..."
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 py-2.5 pl-10 pr-4 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-[#f9ebae] transition"
               />
            </div>

            {error ? <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-xs text-red-300">{error}</div> : null}

            {/* Member Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {filteredMembers.length > 0 ? (
                  filteredMembers.map((member) => {
                     const avatarSrc = getAvatarSrc(member);
                     return (
                        <div key={member.email || member.userId || member._id} className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-950/60 hover:bg-zinc-900/60 hover:border-zinc-700 transition flex items-center justify-between gap-4">
                           <div className="flex items-center gap-3.5 min-w-0">
                              <div className="relative shrink-0">
                                 <img src={avatarSrc} alt={member.name || member.email} className="h-12 w-12 rounded-lg border border-zinc-800 object-cover" />
                                 <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-emerald-500 border-2 border-zinc-950" />
                              </div>
                              <div className="min-w-0">
                                 <div className="flex items-center gap-2">
                                    <h3 className="text-sm font-bold text-zinc-100 truncate">{member.name || member.email}</h3>
                                    <span className={`px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded ${member.role === "owner" ? "bg-[rgba(249,235,174,0.12)] text-[#f9ebae] border border-[rgba(249,235,174,0.3)]" : "bg-zinc-900 text-zinc-400 border border-zinc-800"}`}>
                                       {member.role || "member"}
                                    </span>
                                 </div>
                                 <p className="text-xs text-zinc-400 truncate mt-0.5">{member.email}</p>
                                 <p className="text-[11px] text-zinc-500 truncate mt-1">{member.bio || "Team Member"}</p>
                              </div>
                           </div>

                           <button
                              type="button"
                              onClick={() => handleMessage(member)}
                              disabled={busyId === member._id}
                              className="px-3 py-1.5 rounded-lg bg-[#f9ebae] hover:bg-[#e6d695] text-zinc-950 text-xs font-bold transition flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                           >
                              <HiChatAlt2 size={14} />
                              <span>Direct Message</span>
                           </button>
                        </div>
                     );
                  })
               ) : (
                  <div className="col-span-2 py-12 text-center text-xs text-zinc-500">
                     No members match "{search}".
                  </div>
               )}
            </div>
         </div>
      </PageShell>
   );
}

