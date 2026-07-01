import { useEffect, useState } from "react";
import { HiMail, HiUsers } from "react-icons/hi";
import { getWorkspaceMembers, inviteWorkspaceMember } from "../../services/workspaceService";
import { PageShell } from "../../components/common/PageShell";

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
         <PageShell title="Team directory" subtitle="Invite teammates and keep your workspace roster up to date." actions={
            <form onSubmit={handleInvite} className="flex flex-col gap-3 sm:flex-row sm:items-center">
               <label className="flex items-center gap-2 rounded-[1.2rem] border border-border bg-[rgba(255,255,255,0.06)] px-3 py-2.5 text-sm text-muted-foreground">
                  <HiMail className="h-4 w-4 text-gold" />
                  <input
                     className="w-full bg-transparent text-sm text-white outline-none sm:min-w-[220px]"
                     placeholder="Invite by email"
                     value={inviteEmail}
                     onChange={(e) => setInviteEmail(e.target.value)}
                  />
               </label>
               <button className="rounded-[1.2rem] bg-gradient-gold px-5 py-3 text-sm font-semibold text-[var(--noir-900)] transition hover:-translate-y-0.5">
                  Invite
               </button>
            </form>
         }>
            <div className="flex items-center gap-3 rounded-[1.3rem] border border-gold/20 bg-[rgba(248,181,0,0.08)] p-4 text-sm text-muted-foreground">
               <HiUsers className="h-5 w-5 text-gold" />
               Keep your team close with a clear roster, role visibility, and fast invites.
            </div>
            {message ? <div className="mt-4 rounded-[1.2rem] border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-100">{message}</div> : null}
            {error ? <div className="mt-4 rounded-[1.2rem] border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">{error}</div> : null}

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
               {members.length > 0 ? (
                  members.map((member) => (
                     <div key={member._id} className="rounded-[1.4rem] border border-border/70 bg-[rgba(255,255,255,0.04)] p-6">
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
                  <div className="rounded-[1.4rem] border border-dashed border-border/60 bg-[rgba(255,255,255,0.03)] p-8 text-center text-sm text-muted-foreground lg:col-span-2">
                     No members are available yet. Add colleagues in the workspace once you invite your team.
                  </div>
               )}
            </div>
         </PageShell>
      </div>
   );
}
