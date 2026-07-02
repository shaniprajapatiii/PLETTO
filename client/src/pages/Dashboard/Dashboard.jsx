import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { HiArrowRight, HiChatAlt2, HiClock, HiDocumentText, HiLightningBolt, HiSparkles, HiUsers, HiViewBoards } from "react-icons/hi";
import { getChannels } from "../../services/chatService";
import { getDocs } from "../../services/docsService";
import { getBoards } from "../../services/whiteboardService";
import { getWorkspaceMembers } from "../../services/workspaceService";
import { PageShell } from "../../components/common/PageShell";

export default function Dashboard() {
   const [stats, setStats] = useState({ channels: 0, documents: 0, boards: 0 });
   const [preview, setPreview] = useState({ channels: [], documents: [], boards: [] });
   const [members, setMembers] = useState([]);

   useEffect(() => {
      const load = async () => {
         const [channelsRes, docsRes, boardsRes, membersRes] = await Promise.allSettled([
            getChannels(),
            getDocs(),
            getBoards(),
            getWorkspaceMembers(),
         ]);

         const channels = channelsRes.status === "fulfilled" ? channelsRes.value.data.channels : [];
         const documents = docsRes.status === "fulfilled" ? docsRes.value.data.documents : [];
         const boards = boardsRes.status === "fulfilled" ? boardsRes.value.data.whiteboards : [];
         const workspaceMembers = membersRes.status === "fulfilled" ? membersRes.value.data.members || [] : [];

         setStats({ channels: channels.length, documents: documents.length, boards: boards.length });
         setPreview({ channels: channels.slice(0, 3), documents: documents.slice(0, 3), boards: boards.slice(0, 3) });
         setMembers(workspaceMembers);
      };
      load();
   }, []);

   const activity = useMemo(() => {
      const items = [
         ...preview.channels.map((item) => ({ title: item.name, subtitle: "New channel", icon: HiChatAlt2 })),
         ...preview.documents.map((item) => ({ title: item.title, subtitle: "Updated doc", icon: HiDocumentText })),
         ...preview.boards.map((item) => ({ title: item.name, subtitle: "Live board", icon: HiViewBoards })),
      ].slice(0, 6);
      return items;
   }, [preview]);

   return (
      <div className="space-y-5">
         <PageShell
            title="Mission control"
            subtitle="A simpler overview of what matters most right now."
            actions={
               <div className="inline-flex items-center gap-2 rounded-[1.2rem] border border-gold/20 bg-[rgba(248,181,0,0.08)] px-3 py-2 text-sm text-gold">
                  <HiSparkles className="h-4 w-4" />
                  Live workspace
               </div>
            }
         >
            <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
               <div className="space-y-5">
                  <div className="grid gap-4 lg:grid-cols-3">
                     <Panel title="Channels" value={stats.channels} description="Active rooms for your team." icon={<HiChatAlt2 className="h-6 w-6" />} />
                     <Panel title="Documents" value={stats.documents} description="Shared knowledge in your workspace." icon={<HiDocumentText className="h-6 w-6" />} />
                     <Panel title="Whiteboards" value={stats.boards} description="Live boards ready for ideation." icon={<HiViewBoards className="h-6 w-6" />} />
                  </div>

                  <div className="rounded-[24px] border border-white/10 bg-white/[0.025] p-5">
                     <div className="flex items-center justify-between gap-3">
                        <div>
                           <div className="text-[11px] uppercase tracking-[0.28em] text-gold">Recent activity</div>
                           <h3 className="mt-2 text-xl font-semibold text-white">What changed lately</h3>
                        </div>
                        <div className="rounded-full border border-gold/20 bg-[rgba(245,181,50,0.08)] px-3 py-1 text-xs uppercase tracking-[0.22em] text-gold">Streaming</div>
                     </div>
                     <div className="mt-4 space-y-3">
                        {activity.length > 0 ? activity.map((item, index) => {
                           const Icon = item.icon;
                           return (
                              <div key={`${item.title}-${index}`} className="flex items-center gap-3 rounded-[16px] border border-white/10 bg-[rgba(2,6,23,0.65)] px-4 py-3">
                                 <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgba(245,181,50,0.14)] text-gold">
                                    <Icon className="h-4 w-4" />
                                 </div>
                                 <div className="min-w-0 flex-1">
                                    <div className="truncate text-sm font-medium text-white">{item.title}</div>
                                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                       <HiClock className="h-3.5 w-3.5" />
                                       {item.subtitle}
                                    </div>
                                 </div>
                              </div>
                           );
                        }) : (
                           <div className="rounded-[16px] border border-dashed border-white/10 bg-white/[0.03] p-5 text-sm text-muted-foreground">Create a room, document, or board to populate this feed.</div>
                        )}
                     </div>
                  </div>
               </div>

               <div className="space-y-5">
                  <div className="rounded-[24px] border border-white/10 bg-white/[0.025] p-5">
                     <div className="flex items-center gap-2 text-gold">
                        <HiUsers className="h-4 w-4" />
                        Active collaborators
                     </div>
                     <div className="mt-4 flex flex-wrap gap-2">
                        {members.length > 0 ? members.map((member) => (
                           <div key={member._id || member.email} className="rounded-full border border-gold/20 bg-[rgba(245,181,50,0.08)] px-3 py-2 text-sm text-white">
                              {member.name || member.email || "Member"}
                           </div>
                        )) : (
                           <div className="rounded-[16px] border border-dashed border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-muted-foreground">No collaborators to display yet.</div>
                        )}
                     </div>
                  </div>

                  <div className="rounded-[24px] border border-white/10 bg-white/[0.025] p-5">
                     <div className="flex items-center gap-2 text-gold">
                        <HiLightningBolt className="h-4 w-4" />
                        Quick access
                     </div>
                     <div className="mt-4 grid gap-3">
                        <QuickLink to="/chat" title="Open chat" description="Jump into the active room and continue the conversation." />
                        <QuickLink to="/docs" title="Open docs" description="Review shared notes and the latest updates." />
                        <QuickLink to="/whiteboard" title="Open whiteboard" description="Move from discussion to visual planning." />
                     </div>
                  </div>
               </div>
            </div>
         </PageShell>
      </div>
   );
}

function Panel({ title, value, description, icon }) {
   return (
      <div className="rounded-[20px] border border-white/10 bg-[rgba(2,6,23,0.7)] p-5">
         <div className="flex items-center justify-between gap-3">
            <div className="rounded-[1.25rem] bg-[rgba(245,181,50,0.12)] p-3 text-gold">{icon}</div>
            <span className="text-xs uppercase tracking-[0.25em] text-gold">Live</span>
         </div>
         <div className="mt-8">
            <div className="text-5xl font-semibold text-white">{value}</div>
            <p className="mt-3 text-sm text-muted-foreground">{title}</p>
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
         </div>
      </div>
   );
}

function QuickLink({ to, title, description }) {
   return (
      <Link to={to} className="flex items-center justify-between rounded-[16px] border border-white/10 bg-[rgba(2,6,23,0.65)] px-4 py-3 text-left transition hover:border-gold/20 hover:bg-[rgba(245,181,50,0.08)]">
         <div>
            <div className="text-sm font-medium text-white">{title}</div>
            <div className="mt-1 text-sm text-muted-foreground">{description}</div>
         </div>
         <HiArrowRight className="h-4 w-4 text-gold" />
      </Link>
   );
}
