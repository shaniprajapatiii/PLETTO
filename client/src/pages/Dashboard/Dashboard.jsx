import { useEffect, useState } from "react";
import { HiChatAlt2, HiDocumentText, HiViewBoards } from "react-icons/hi";
import { getChannels } from "../../services/chatService";
import { getDocs } from "../../services/docsService";
import { getBoards } from "../../services/whiteboardService";

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

   return (
      <div className="space-y-6">
         <div className="grid gap-6 lg:grid-cols-3">
            <Panel title="Channels" value={stats.channels} description="Active chat channels in your workspace." icon={<HiChatAlt2 className="h-6 w-6" />} />
            <Panel title="Documents" value={stats.documents} description="Docs available for your team." icon={<HiDocumentText className="h-6 w-6" />} />
            <Panel title="Whiteboards" value={stats.boards} description="Live board sessions ready to use." icon={<HiViewBoards className="h-6 w-6" />} />
         </div>

         <div className="grid gap-6 xl:grid-cols-3">
            <PreviewCard title="Recent channels" items={preview.channels.map((item) => item.name)} empty="Create a channel to see it here." />
            <PreviewCard title="Recent docs" items={preview.documents.map((item) => item.title)} empty="Create a document to build your knowledge base." />
            <PreviewCard title="Recent whiteboards" items={preview.boards.map((item) => item.name)} empty="Create a whiteboard to start collaborating." />
         </div>
      </div>
   );
}

function Panel({ title, value, description, icon }) {
   return (
      <div className="rounded-3xl border border-border bg-card/80 p-6 shadow-soft">
         <div className="flex items-center justify-between gap-3">
            <div className="rounded-3xl bg-[rgba(248,181,0,0.12)] p-3 text-gold">{icon}</div>
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
      <div className="rounded-3xl border border-border bg-card/70 p-6 shadow-soft">
         <div className="text-sm uppercase tracking-[0.25em] text-gold">{title}</div>
         <div className="mt-4 space-y-3">
            {items.length > 0 ? (
               items.map((item, index) => (
                  <div key={`${item}-${index}`} className="rounded-3xl border border-border/70 bg-[rgba(255,255,255,0.04)] p-4 text-white">
                     {item}
                  </div>
               ))
            ) : (
               <div className="rounded-3xl border border-dashed border-border/50 bg-[rgba(255,255,255,0.03)] p-5 text-sm text-muted-foreground">{empty}</div>
            )}
         </div>
      </div>
   );
}
