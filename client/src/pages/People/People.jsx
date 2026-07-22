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
      // Deduplicate by email first
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
         title="People"
         subtitle="Everyone in your workspace, with fast private messaging and profile details."
         actions={
            <div className="inline-flex items-center gap-2 rounded-[1.2rem] border border-gold/20 bg-[rgba(249,235,174,0.08)] px-4 py-2 text-sm text-gold">
               <HiUserGroup className="h-5 w-5" />
               {members.length} members
            </div>
         }
      >
         <div className="space-y-5">
            <div className="rounded-[1.75rem] border border-white/[0.06] bg-[rgba(255,255,255,0.03)] p-4">
               <div className="relative">
                  <HiSearch className="absolute left-4 top-3.5 h-4 w-4 text-gold/60" />
                  <input
                     value={search}
                     onChange={(event) => setSearch(event.target.value)}
                     placeholder="Search by name, email, or role"
                     className="w-full rounded-[1.1rem] border border-white/[0.06] bg-[rgba(255,255,255,0.05)] py-3 pl-10 pr-4 text-sm text-white outline-none transition focus:border-gold/30"
                  />
               </div>
            </div>

            {error ? <div className="rounded-[1.2rem] border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">{error}</div> : null}

            <div className="space-y-3">
               {filteredMembers.length > 0 ? (
                  filteredMembers.map((member) => {
                     const avatarSrc = getAvatarSrc(member);
                     const initials = getInitials(member.name, member.email);
                     return (
                        <article key={member.email || member.userId || member._id} className="flex items-center justify-between gap-4 rounded-[26px] border border-white/10 bg-[rgba(255,255,255,0.03)] p-5 shadow-[0_16px_50px_rgba(0,0,0,0.2)] transition hover:border-white/20 hover:bg-[rgba(255,255,255,0.06)]">
                           <div className="flex min-w-0 flex-1 items-center gap-4">
                              <img src={avatarSrc} alt={member.name || member.email || "Member"} className="h-20 w-20 flex-shrink-0 rounded-[1.1rem] border border-white/10 object-cover" />
                              <div className="min-w-0 flex-1">
                                 <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="truncate text-lg font-semibold text-white">{member.name || member.email || "Member"}</h3>
                                    <span className={`rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.2em] ${member.role === "owner" ? "bg-gold/15 text-gold" : "bg-white/5 text-muted-foreground"}`}>
                                       {member.role || "member"}
                                    </span>
                                 </div>
                                 <p className="mt-1 truncate text-sm text-muted-foreground">{member.email || "No email available"}</p>
                                 {member.bio ? <p className="mt-2 line-clamp-1 text-sm text-slate-300">{member.bio}</p> : <p className="mt-2 text-sm text-muted-foreground">No bio shared yet.</p>}
                              </div>
                           </div>

                           <button
                              type="button"
                              onClick={() => handleMessage(member)}
                              disabled={busyId === member.userId}
                              className="flex-shrink-0 inline-flex items-center gap-2 rounded-full bg-gradient-gold px-4 py-2 text-sm font-semibold text-[var(--noir-900)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
                           >
                              <HiChatAlt2 className="h-4 w-4" />
                              {busyId === member.userId ? "Opening..." : "Message"}
                              <HiArrowRight className="h-4 w-4" />
                           </button>
                        </article>
                     );
                  })
               ) : (
                  <div className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.03] p-6 text-sm text-muted-foreground">
                     No workspace members match your search.
                  </div>
               )}
            </div>
         </div>
      </PageShell>
   );
}
