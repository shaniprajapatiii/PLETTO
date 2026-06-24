import { useEffect, useState } from "react";
import { HiUsers } from "react-icons/hi";
import { getWorkspaceMembers, inviteWorkspaceMember } from "../../services/workspaceService";

export default function Settings() {
   const [members, setMembers] = useState([]);
   const [inviteEmail, setInviteEmail] = useState("");
   const [message, setMessage] = useState(null);
   const [error, setError] = useState(null);

   useEffect(() => {
      const load = async () => {
         try {
            const res = await getWorkspaceMembers();
            setMembers(res.data.members || []);
         } catch (err) {
            setError(err.response?.data?.message || "Failed to load members");
         }
      };
      load();
   }, []);

   const refreshMembers = async () => {
      try {
         const res = await getWorkspaceMembers();
         setMembers(res.data.members || []);
      } catch (err) {
         setError(err.response?.data?.message || "Failed to refresh members");
      }
   };

   const handleInvite = async (e) => {
      e.preventDefault();
      setError(null);
      setMessage(null);

      if (!inviteEmail.trim()) {
         setError("Enter an email address to invite a teammate.");
         return;
      }

      try {
         await inviteWorkspaceMember(inviteEmail.trim());
         setInviteEmail("");
         setMessage("Invite sent successfully. The member has been added to the workspace.");
         await refreshMembers();
      } catch (err) {
         setError(err.response?.data?.message || "Unable to invite member.");
      }
   };

   return (
      <div className="space-y-6">
         <div className="rounded-3xl border border-border bg-card/80 p-6 shadow-soft">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
               <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-3xl bg-[rgba(248,181,0,0.14)] text-gold">
                     <HiUsers className="h-6 w-6" />
                  </div>
                  <div>
                     <div className="text-xs uppercase tracking-[0.28em] text-gold">Workspace members</div>
                     <h2 className="mt-3 text-2xl font-semibold text-white">Team directory</h2>
                     <p className="mt-2 text-sm text-muted-foreground">Invite teammates and keep your workspace roster up to date.</p>
                  </div>
               </div>
               <form onSubmit={handleInvite} className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <input
                     className="min-w-[220px] rounded-3xl border border-border bg-[rgba(255,255,255,0.06)] px-4 py-3 text-sm text-white outline-none focus:border-gold"
                     placeholder="Invite by email"
                     value={inviteEmail}
                     onChange={(e) => setInviteEmail(e.target.value)}
                  />
                  <button className="rounded-3xl bg-gradient-gold px-5 py-3 text-sm font-semibold text-[var(--noir-900)] transition hover:-translate-y-0.5">
                     Invite
                  </button>
               </form>
            </div>
            {message && <div className="mt-5 rounded-3xl border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-100">{message}</div>}
         </div>

         {error && <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>}

         <div className="grid gap-4 lg:grid-cols-2">
            {members.length > 0 ? (
               members.map((member) => (
                  <div key={member._id} className="rounded-3xl border border-border bg-card/70 p-6 shadow-soft">
                     <div className="flex items-center justify-between gap-4">
                        <div>
                           <h3 className="text-lg font-semibold text-white">{member.name}</h3>
                           <p className="mt-1 text-sm text-muted-foreground">{member.email}</p>
                        </div>
                        <span className="rounded-full border border-gold/30 bg-[rgba(248,181,0,0.1)] px-3 py-1 text-xs uppercase tracking-[0.2em] text-gold">
                           {member.role}
                        </span>
                     </div>
                  </div>
               ))
            ) : (
               <div className="rounded-3xl border border-dashed border-border/60 bg-[rgba(255,255,255,0.03)] p-8 text-center text-sm text-muted-foreground">
                  No members are available yet. Add colleagues in the workspace once you invite your team.
               </div>
            )}
         </div>
      </div>
   );
}
