import { useEffect, useState } from "react";
import { HiMail, HiUsers, HiShieldCheck, HiPlus, HiOutlineSparkles } from "react-icons/hi";
import { getWorkspaceMembers, inviteWorkspaceMember } from "../../services/workspaceService";
import { PageShell } from "../../components/common/PageShell";

export default function Settings() {
   const [members, setMembers] = useState([]);
   const [inviteEmail, setInviteEmail] = useState("");
   const [message, setMessage] = useState(null);
   const [error, setError] = useState(null);
   const [submitting, setSubmitting] = useState(false);

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

      setSubmitting(true);
      try {
         await inviteWorkspaceMember(inviteEmail.trim());
         setInviteEmail("");
         setMessage("Invite sent successfully! The member has been added to the workspace.");
         await refreshMembers();
      } catch (err) {
         setError(err.response?.data?.message || "Unable to invite member.");
      } finally {
         setSubmitting(false);
      }
   };

   return (
      <PageShell
         title="Workspace Settings"
         subtitle="Manage workspace invitations, team member roles, and system permissions."
      >
         <div className="space-y-6 sm:space-y-8">
            {/* Big Invite Banner Card */}
            <div className="big-card p-6 sm:p-8 space-y-6">
               <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/10">
                  <div className="space-y-1">
                     <h2 className="text-xl font-bold text-white tracking-tight">Invite Teammates</h2>
                     <p className="text-xs sm:text-sm text-neutral-400">Add collaborators to participate in channels and documents.</p>
                  </div>

                  <form onSubmit={handleInvite} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                     <div className="relative min-w-[280px]">
                        <HiMail className="absolute left-3.5 top-3.5 h-4 w-4 text-neutral-400" />
                        <input
                           className="w-full rounded-xl border border-white/15 bg-[#121214] py-2.5 pl-10 pr-4 text-xs sm:text-sm text-white placeholder:text-neutral-500 outline-none focus:border-white transition"
                           placeholder="colleague@company.com"
                           type="email"
                           value={inviteEmail}
                           onChange={(e) => setInviteEmail(e.target.value)}
                        />
                     </div>
                     <button
                        type="submit"
                        disabled={submitting}
                        className="btn-white px-5 py-2.5 text-xs font-bold flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
                     >
                        <HiPlus size={16} />
                        <span>{submitting ? "Inviting..." : "Send Invite"}</span>
                     </button>
                  </form>
               </div>

               <div className="flex items-center gap-3 text-xs text-neutral-300">
                  <HiShieldCheck className="h-5 w-5 text-white shrink-0" />
                  <span>Invited members will receive full workspace permissions to view channels and participate in chats.</span>
               </div>
            </div>

            {message ? (
               <div className="p-4 rounded-xl border border-white/30 bg-white/10 text-xs font-bold text-white flex items-center justify-between">
                  <span>{message}</span>
                  <button onClick={() => setMessage(null)} className="text-neutral-400 hover:text-white">✕</button>
               </div>
            ) : null}

            {error ? (
               <div className="p-4 rounded-xl border border-white/30 bg-[#18181c] text-xs font-bold text-white flex items-center justify-between">
                  <span>{error}</span>
                  <button onClick={() => setError(null)} className="text-neutral-400 hover:text-white">✕</button>
               </div>
            ) : null}

            {/* Member List Big Cards */}
            <div className="space-y-4">
               <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider font-mono">
                     Roster ({members.length} Members)
                  </h3>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {members.length > 0 ? (
                     members.map((member) => (
                        <div
                           key={member._id}
                           className="big-card-interactive p-5 sm:p-6 flex items-center justify-between gap-4"
                        >
                           <div className="flex items-center gap-3.5 min-w-0">
                              <div className="h-11 w-11 rounded-xl bg-white text-black font-extrabold flex items-center justify-center text-sm shadow-sm shrink-0">
                                 {(member.name || member.email || "U").charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                 <h4 className="text-sm sm:text-base font-bold text-white truncate">{member.name || member.email}</h4>
                                 <p className="text-xs text-neutral-400 truncate mt-0.5 font-mono">{member.email}</p>
                              </div>
                           </div>

                           <span className="badge-bw px-3 py-1 text-[10px] font-mono uppercase tracking-wider shrink-0">
                              {member.role || "member"}
                           </span>
                        </div>
                     ))
                  ) : (
                     <div className="col-span-full big-card py-16 text-center text-xs text-neutral-500">
                        No team members loaded. Use the invite form above to add teammates.
                     </div>
                  )}
               </div>
            </div>
         </div>
      </PageShell>
   );
}
