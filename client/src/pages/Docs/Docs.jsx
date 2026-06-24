import { useEffect, useState } from "react";
import { HiDocumentText } from "react-icons/hi";
import { createDoc, getDocs, updateDoc } from "../../services/docsService";

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

   return (
      <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
         <aside className="rounded-3xl border border-border bg-card/80 p-6 shadow-soft">
            <div className="flex items-center justify-between gap-3">
               <div>
                  <div className="text-xs uppercase tracking-[0.28em] text-gold">Documents</div>
                  <h2 className="mt-3 text-2xl font-semibold text-white">Workspace notes</h2>
               </div>
               <button onClick={handleCreate} className="rounded-3xl bg-gradient-gold px-4 py-2 text-sm font-semibold text-[var(--noir-900)]">
                  New
               </button>
            </div>
            <div className="mt-6 space-y-3">
               {docs.length > 0 ? (
                  docs.map((doc) => (
                     <button
                        key={doc._id}
                        onClick={() => selectDoc(doc)}
                        className={`w-full text-left rounded-3xl border px-4 py-4 transition ${active?._id === doc._id ? "border-gold bg-[rgba(248,181,0,0.1)]" : "border-border bg-[rgba(255,255,255,0.03)] hover:border-gold/30 hover:bg-[rgba(255,255,255,0.05)]"}`}
                     >
                        <div className="text-sm font-semibold text-white">{doc.title}</div>
                        <div className="mt-2 text-xs text-muted-foreground">Updated {new Date(doc.updatedAt).toLocaleDateString()}</div>
                     </button>
                  ))
               ) : (
                  <div className="rounded-3xl border border-dashed border-border/60 bg-[rgba(255,255,255,0.02)] p-5 text-sm text-muted-foreground">
                     No documents yet. Create one to capture your team’s knowledge.
                  </div>
               )}
            </div>
         </aside>

         <section className="rounded-3xl border border-border bg-card/80 p-6 shadow-soft">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
               <div>
                  <div className="text-xs uppercase tracking-[0.28em] text-gold">Editor</div>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Live document</h2>
               </div>
               <button
                  onClick={handleSave}
                  disabled={saving || !active}
                  className="rounded-3xl bg-gradient-gold px-5 py-3 text-sm font-semibold text-[var(--noir-900)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
               >
                  {saving ? "Saving..." : "Save changes"}
               </button>
            </div>
            <div className="mt-6 space-y-4">
               <input
                  className="w-full rounded-3xl border border-border bg-[rgba(255,255,255,0.06)] px-4 py-3 text-lg text-white outline-none focus:border-gold"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Document title"
               />
               <textarea
                  className="min-h-[520px] w-full rounded-[2rem] border border-border bg-[rgba(255,255,255,0.05)] p-5 text-sm text-white outline-none focus:border-gold"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Start writing your document..."
               />
            </div>
            {error && <div className="mt-6 rounded-3xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>}
         </section>
      </div>
   );
}
