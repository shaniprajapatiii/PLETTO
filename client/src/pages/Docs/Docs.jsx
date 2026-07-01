import { useEffect, useMemo, useState } from "react";
import { HiCheck, HiDocumentText, HiLightningBolt, HiPlus, HiSparkles, HiUsers } from "react-icons/hi";
import { createDoc, getDocs, updateDoc } from "../../services/docsService";
import { PageShell } from "../../components/common/PageShell";

export default function Docs() {
   const [docs, setDocs] = useState([]);
   const [active, setActive] = useState(null);
   const [content, setContent] = useState("");
   const [title, setTitle] = useState("");
   const [error, setError] = useState(null);
   const [saving, setSaving] = useState(false);

   useEffect(() => {
      refreshDocs();
   }, []);

   const refreshDocs = async () => {
      try {
         const res = await getDocs();
         const fetchedDocs = res.data.documents || [];
         setDocs(fetchedDocs);
         if (!active && fetchedDocs.length) {
            setActive(fetchedDocs[0]);
            setTitle(fetchedDocs[0].title);
            setContent(fetchedDocs[0].content);
         }
      } catch (err) {
         setError(err.response?.data?.message || "Failed to load documents");
      }
   };

   const handleCreate = async () => {
      try {
         const res = await createDoc();
         const document = res.data.document;
         setDocs((prev) => [document, ...prev]);
         setActive(document);
         setTitle(document.title);
         setContent(document.content);
      } catch (err) {
         setError(err.response?.data?.message || "Could not create document");
      }
   };

   const handleSave = async () => {
      if (!active) return;
      setSaving(true);
      try {
         const res = await updateDoc(active._id, { title, content });
         setActive(res.data.document);
      } catch (err) {
         setError(err.response?.data?.message || "Could not save document");
      } finally {
         setSaving(false);
      }
   };

   const selectDoc = (doc) => {
      setActive(doc);
      setTitle(doc.title);
      setContent(doc.content);
   };

   const wordCount = useMemo(() => content.trim().split(/\s+/).filter(Boolean).length, [content]);
   const lastUpdated = active?.updatedAt ? new Date(active.updatedAt).toLocaleDateString() : "Not yet saved";

   return (
      <div className="grid gap-6 2xl:grid-cols-[320px_minmax(0,1fr)]">
         <PageShell title="Workspace notes" subtitle="Capture decisions, plans, and knowledge in one shared editor." compact className="p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
               <div className="rounded-[1.2rem] border border-gold/20 bg-[rgba(248,181,0,0.08)] px-3 py-2 text-sm text-gold">
                  <div className="flex items-center gap-2">
                     <HiSparkles className="h-4 w-4" />
                     Live collaboration ready
                  </div>
               </div>
               <button onClick={handleCreate} className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-gold text-[var(--noir-900)]">
                  <HiPlus className="h-4 w-4" />
               </button>
            </div>
            <div className="mt-6 space-y-3">
               {docs.length > 0 ? (
                  docs.map((doc) => (
                     <button
                        key={doc._id}
                        onClick={() => selectDoc(doc)}
                        className={`w-full text-left rounded-[1.2rem] border px-4 py-4 transition ${active?._id === doc._id ? "border-gold bg-[rgba(248,181,0,0.1)]" : "border-border bg-[rgba(255,255,255,0.03)] hover:border-gold/30 hover:bg-[rgba(255,255,255,0.05)]"}`}
                     >
                        <div className="flex items-center gap-2 text-sm font-semibold text-white">
                           <HiDocumentText className="h-4 w-4 text-gold" />
                           {doc.title}
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">Updated {new Date(doc.updatedAt).toLocaleDateString()}</div>
                     </button>
                  ))
               ) : (
                  <div className="rounded-[1.2rem] border border-dashed border-border/60 bg-[rgba(255,255,255,0.02)] p-5 text-sm text-muted-foreground">
                     No documents yet. Create one to capture your team’s knowledge.
                  </div>
               )}
            </div>
         </PageShell>

         <PageShell title={active?.title || "Live document"} subtitle="Collaborative drafting with presence-aware context and instant saving." actions={<div className="inline-flex items-center gap-2 rounded-[1.2rem] border border-gold/20 bg-[rgba(248,181,0,0.08)] px-3 py-2 text-sm text-gold"><HiUsers className="h-4 w-4" />Presence-aware editing</div>} className="p-5 sm:p-6">
            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
               <div className="space-y-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                     <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <span>Updated {lastUpdated}</span>
                        <span>•</span>
                        <span>{wordCount} words</span>
                     </div>
                     <button
                        onClick={handleSave}
                        disabled={saving || !active}
                        className="inline-flex items-center gap-2 rounded-[1.2rem] bg-gradient-gold px-5 py-3 text-sm font-semibold text-[var(--noir-900)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                     >
                        {saving ? "Saving..." : <><HiCheck className="h-4 w-4" /> Save changes</>}
                     </button>
                  </div>
                  <input
                     className="w-full rounded-[1.25rem] border border-border bg-[rgba(255,255,255,0.06)] px-4 py-3 text-lg text-white outline-none focus:border-gold"
                     value={title}
                     onChange={(e) => setTitle(e.target.value)}
                     placeholder="Document title"
                  />
                  <textarea
                     className="min-h-[520px] w-full rounded-[1.6rem] border border-border bg-[rgba(255,255,255,0.05)] p-5 text-sm text-white outline-none focus:border-gold"
                     value={content}
                     onChange={(e) => setContent(e.target.value)}
                     placeholder="Start writing your document..."
                  />
               </div>

               <div className="space-y-4">
                  <div className="rounded-[1.5rem] border border-border bg-[rgba(255,255,255,0.04)] p-5">
                     <div className="flex items-center gap-2 text-gold">
                        <HiLightningBolt className="h-4 w-4" />
                        Collaboration context
                     </div>
                     <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                        <div className="rounded-[1.1rem] border border-border/70 bg-[rgba(2,6,23,0.65)] px-3 py-2">Mina is reviewing the launch timeline.</div>
                        <div className="rounded-[1.1rem] border border-border/70 bg-[rgba(2,6,23,0.65)] px-3 py-2">The latest notes are already synced to the workspace.</div>
                        <div className="rounded-[1.1rem] border border-border/70 bg-[rgba(2,6,23,0.65)] px-3 py-2">AI can surface next actions from this draft.</div>
                     </div>
                  </div>
                  <div className="rounded-[1.5rem] border border-border bg-[rgba(255,255,255,0.04)] p-5">
                     <div className="text-[11px] uppercase tracking-[0.28em] text-gold">Suggested moves</div>
                     <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                        <div className="rounded-[1.1rem] border border-border/70 bg-[rgba(2,6,23,0.65)] px-3 py-2">Add a short summary block for the next sync.</div>
                        <div className="rounded-[1.1rem] border border-border/70 bg-[rgba(2,6,23,0.65)] px-3 py-2">Link related whiteboard ideas to keep context together.</div>
                     </div>
                  </div>
               </div>
            </div>
            {error && <div className="mt-6 rounded-[1.2rem] border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>}
         </PageShell>
      </div>
   );
}
