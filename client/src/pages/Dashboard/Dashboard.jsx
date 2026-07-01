import { useEffect, useMemo, useState } from "react";
import { HiChatAlt2, HiChevronRight, HiChip, HiClock, HiDocumentText, HiLightningBolt, HiSparkles, HiUsers, HiViewBoards } from "react-icons/hi";
import { getChannels } from "../../services/chatService";
import { getDocs } from "../../services/docsService";
import { getBoards } from "../../services/whiteboardService";
import { PageShell } from "../../components/common/PageShell";

export default function Dashboard() {
   const [stats, setStats] = useState({ channels: 0, documents: 0, boards: 0 });
   const [preview, setPreview] = useState({ channels: [], documents: [], boards: [] });

   useEffect(() => {
      const load = async () => {
         const [channelsRes, docsRes, boardsRes] = await Promise.allSettled([
            getChannels(),
            getDocs(),
            getBoards(),
         ]);

         const channels = channelsRes.status === "fulfilled" ? channelsRes.value.data.channels : [];
         const documents = docsRes.status === "fulfilled" ? docsRes.value.data.documents : [];
         const boards = boardsRes.status === "fulfilled" ? boardsRes.value.data.whiteboards : [];

         setStats({ channels: channels.length, documents: documents.length, boards: boards.length });
         setPreview({ channels: channels.slice(0, 3), documents: documents.slice(0, 3), boards: boards.slice(0, 3) });
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
      <div className="space-y-6">
         <PageShell
            title="Mission control"
            subtitle="A realtime overview of your channels, docs, and boards in one immersive workspace."
            actions={
               <div className="inline-flex items-center gap-2 rounded-[1.2rem] border border-gold/20 bg-[rgba(248,181,0,0.08)] px-3 py-2 text-sm text-gold">
                  <HiSparkles className="h-4 w-4" />
                  AI orchestration ready
               </div>
            }
         >
            <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
               <div className="space-y-6">
                  <div className="grid gap-4 lg:grid-cols-3">
                     <Panel title="Channels" value={stats.channels} description="Active chat channels in your workspace." icon={<HiChatAlt2 className="h-6 w-6" />} />
                     <Panel title="Documents" value={stats.documents} description="Docs available for your team." icon={<HiDocumentText className="h-6 w-6" />} />
                     <Panel title="Whiteboards" value={stats.boards} description="Live board sessions ready to use." icon={<HiViewBoards className="h-6 w-6" />} />
                  </div>

                  <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
                     <div className="rounded-[1.6rem] border border-border bg-[rgba(255,255,255,0.04)] p-5">
                        <div className="flex items-center justify-between gap-3">
                           <div>
                              <div className="text-[11px] uppercase tracking-[0.28em] text-gold">Live activity</div>
                              <h3 className="mt-2 text-xl font-semibold text-white">What is happening right now</h3>
                           </div>
                           <div className="rounded-full border border-gold/20 bg-[rgba(248,181,0,0.08)] px-3 py-1 text-xs uppercase tracking-[0.22em] text-gold">Streaming</div>
                        </div>
                        <div className="mt-5 space-y-3">
                           {activity.length > 0 ? activity.map((item, index) => {
                              const Icon = item.icon;
                              return (
                                 <div key={`${item.title}-${index}`} className="flex items-center gap-3 rounded-[1.2rem] border border-border/70 bg-[rgba(2,6,23,0.65)] px-4 py-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgba(248,181,0,0.16)] text-gold">
                                       <Icon className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                       <div className="truncate text-sm font-medium text-white">{item.title}</div>
                                       <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                          <HiClock className="h-3.5 w-3.5" />
                                          {item.subtitle}
                                       </div>
                                    </div>
                                    <HiChevronRight className="h-4 w-4 text-muted-foreground" />
                                 </div>
                              );
                           }) : (
                              <div className="rounded-[1.2rem] border border-dashed border-border/60 bg-[rgba(255,255,255,0.03)] p-5 text-sm text-muted-foreground">Create a channel, document, or board to fill this feed.</div>
                           )}
                        </div>
                     </div>

                     <div className="space-y-4">
                        <div className="rounded-[1.6rem] border border-border bg-[rgba(255,255,255,0.04)] p-5">
                           <div className="flex items-center gap-2 text-gold">
                              <HiLightningBolt className="h-4 w-4" />
                              Quick start
                           </div>
                           <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                              <div className="rounded-[1.2rem] border border-border/70 bg-[rgba(2,6,23,0.65)] p-4">Open a channel and keep team conversations flowing.</div>
                              <div className="rounded-[1.2rem] border border-border/70 bg-[rgba(2,6,23,0.65)] p-4">Create a document to capture decisions and notes.</div>
                              <div className="rounded-[1.2rem] border border-border/70 bg-[rgba(2,6,23,0.65)] p-4">Sketch and share ideas instantly on a whiteboard.</div>
                           </div>
                        </div>

                        <div className="rounded-[1.6rem] border border-border bg-[rgba(255,255,255,0.04)] p-5">
                           <div className="flex items-center gap-2 text-gold">
                              <HiChip className="h-4 w-4" />
                              AI workspace assistant
                           </div>
                           <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                              <div className="rounded-[1.1rem] border border-border/70 bg-[rgba(2,6,23,0.65)] px-3 py-2">Summarize this week’s work in one click.</div>
                              <div className="rounded-[1.1rem] border border-border/70 bg-[rgba(2,6,23,0.65)] px-3 py-2">Draft action items from recent discussions.</div>
                              <div className="rounded-[1.1rem] border border-border/70 bg-[rgba(2,6,23,0.65)] px-3 py-2">Surface the most relevant workspace context.</div>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="space-y-4">
                  <div className="rounded-[1.6rem] border border-border bg-[rgba(255,255,255,0.04)] p-5">
                     <div className="flex items-center gap-2 text-gold">
                        <HiUsers className="h-4 w-4" />
                        Active collaborators
                     </div>
                     <div className="mt-4 flex items-center gap-3">
                        {['M', 'A', 'K'].map((letter) => (
                           <div key={letter} className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/30 bg-[rgba(248,181,0,0.14)] text-sm font-semibold text-gold">
                              {letter}
                           </div>
                        ))}
                     </div>
                     <p className="mt-4 text-sm text-muted-foreground">Presence awareness is visible across docs, chat, and boards so every session feels shared.</p>
                  </div>

                  <div className="rounded-[1.6rem] border border-border bg-[rgba(255,255,255,0.04)] p-5">
                     <div className="text-[11px] uppercase tracking-[0.28em] text-gold">Snapshots</div>
                     <div className="mt-4 space-y-3">
                        <PreviewCard title="Recent channels" items={preview.channels.map((item) => item.name)} empty="Create a channel to see it here." />
                        <PreviewCard title="Recent docs" items={preview.documents.map((item) => item.title)} empty="Create a document to build your knowledge base." />
                        <PreviewCard title="Recent whiteboards" items={preview.boards.map((item) => item.name)} empty="Create a whiteboard to start collaborating." />
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
      <div className="rounded-[1.4rem] border border-border bg-[rgba(2,6,23,0.7)] p-5">
         <div className="flex items-center justify-between gap-3">
            <div className="rounded-[1.25rem] bg-[rgba(248,181,0,0.12)] p-3 text-gold">{icon}</div>
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

function PreviewCard({ title, items, empty }) {
   return (
      <div className="rounded-[1.2rem] border border-border/70 bg-[rgba(2,6,23,0.65)] p-4">
         <div className="text-[11px] uppercase tracking-[0.22em] text-gold">{title}</div>
         <div className="mt-3 space-y-2">
            {items.length > 0 ? (
               items.map((item, index) => (
                  <div key={`${item}-${index}`} className="rounded-[1rem] border border-border/70 bg-[rgba(255,255,255,0.04)] px-3 py-2.5 text-sm text-white">
                     {item}
                  </div>
               ))
            ) : (
               <div className="rounded-[1rem] border border-dashed border-border/50 bg-[rgba(255,255,255,0.03)] p-3 text-sm text-muted-foreground">{empty}</div>
            )}
         </div>
      </div>
   );
}
