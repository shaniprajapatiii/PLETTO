import { useEffect, useState } from "react";
import { HiMail, HiUsers, HiShieldCheck, HiCog } from "react-icons/hi";
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
         setMessage("Invite sent successfully! The member has been added.");
         await refreshMembers();
      } catch (err) {
         setError(err.response?.data?.message || "Unable to invite member.");
      }
   };

   return (
      <PageShell
         title="Workspace Settings"
         subtitle="Manage workspace access, invite teammates, and view member roles."
         actions={
            <form onSubmit={handleInvite} className="flex items-center gap-2">
               <div className="relative">
                  <HiMail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                  <input
                     className="rounded-lg border border-zinc-800 bg-zinc-900 py-2 pl-9 pr-3 text-xs text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-[#f9ebae] w-48 sm:w-64"
                     placeholder="colleague@company.com"
                     value={inviteEmail}
                     onChange={(e) => setInviteEmail(e.target.value)}
                  />
               </div>
               <button className="px-3.5 py-2 rounded-lg bg-[#f9ebae] hover:bg-[#e6d695] text-zinc-950 text-xs font-bold shadow-md transition">
                  Invite
               </button>
            </form>
         }
      >
         <div className="space-y-6">
            <div className="p-4 rounded-xl border border-[rgba(249,235,174,0.3)] bg-[rgba(249,235,174,0.05)] flex items-center gap-3 text-xs text-[#f9ebae]">
               <HiShieldCheck className="h-5 w-5 text-[#f9ebae] shrink-0" />
               <span>Enterprise security enabled. Member roles determine permissions across channels, docs, and whiteboards.</span>
            </div>

            {message ? <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-xs text-emerald-300">{message}</div> : null}
            {error ? <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-xs text-red-300">{error}</div> : null}

            {/* Member List */}
            <div className="space-y-3">
               <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Active Workspace Roster</h3>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {members.length > 0 ? (
                     members.map((member) => (
                        <div key={member._id} className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-950/60 flex items-center justify-between gap-4">
                           <div className="min-w-0">
                              <h4 className="text-sm font-bold text-zinc-100 truncate">{member.name}</h4>
                              <p className="text-xs text-zinc-400 truncate mt-0.5">{member.email}</p>
                           </div>
                           <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded bg-[rgba(249,235,174,0.1)] text-[#f9ebae] border border-[rgba(249,235,174,0.2)] shrink-0">
                              {member.role || "member"}
                           </span>
                        </div>
                     ))
                  ) : (
                     <div className="col-span-full py-10 border border-dashed border-zinc-800 rounded-xl text-center text-xs text-zinc-500">
                        No team members loaded. Use the invite input above to add teammates.
                     </div>
                  )}
               </div>
            </div>
         </div>
      </PageShell>
   );
}

