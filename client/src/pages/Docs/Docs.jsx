/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { HiCheck, HiDocumentText, HiLightningBolt, HiPlus, HiSparkles, HiUsers } from "react-icons/hi";
import { createDoc, getDocs, updateDoc } from "../../services/docsService";
import { useAuth } from "../../context/AuthContext";
import { PageShell } from "../../components/common/PageShell";

function escapeHtml(value) {
   return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
}

function renderInlineMarkdown(value) {
   let safe = escapeHtml(value);
   safe = safe.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
   safe = safe.replace(/`([^`]+)`/g, "<code>$1</code>");
   safe = safe.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
   safe = safe.replace(/\*([^*]+)\*/g, "<em>$1</em>");
   return safe;
}

function renderMarkdownToHtml(markdown = "") {
   if (!markdown.trim()) {
      return '<p class="text-sm text-muted-foreground">Start typing to build a polished note.</p>';
   }

   const blocks = [];
   const lines = markdown.split(/\n/);
   let index = 0;

   while (index < lines.length) {
      const line = lines[index];
      if (!line.trim()) {
         blocks.push('<div class="h-3"></div>');
         index += 1;
         continue;
      }

      if (line.trim().startsWith("```")) {
         const codeLines = [];
         index += 1;
         while (index < lines.length && !lines[index].trim().startsWith("```")) {
            codeLines.push(lines[index]);
            index += 1;
         }
         blocks.push(`<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
         index += 1;
         continue;
      }

      if (/^>\s+/.test(line)) {
         const quoteLines = [];
         while (index < lines.length && /^>\s+/.test(lines[index])) {
            quoteLines.push(renderInlineMarkdown(lines[index].replace(/^>\s+/, "")));
            index += 1;
         }
         blocks.push(`<blockquote>${quoteLines.join("<br />")}</blockquote>`);
         continue;
      }

      if (/^[-*]\s+/.test(line)) {
         const items = [];
         while (index < lines.length && /^[-*]\s+/.test(lines[index])) {
            items.push(`<li>${renderInlineMarkdown(lines[index].replace(/^[-*]\s+/, ""))}</li>`);
            index += 1;
         }
         blocks.push(`<ul>${items.join("")}</ul>`);
         continue;
      }

      if (/^###\s+/.test(line)) {
         blocks.push(`<h3>${renderInlineMarkdown(line.replace(/^###\s+/, ""))}</h3>`);
      } else if (/^##\s+/.test(line)) {
         blocks.push(`<h2>${renderInlineMarkdown(line.replace(/^##\s+/, ""))}</h2>`);
      } else if (/^#\s+/.test(line)) {
         blocks.push(`<h1>${renderInlineMarkdown(line.replace(/^#\s+/, ""))}</h1>`);
      } else {
         blocks.push(`<p>${renderInlineMarkdown(line)}</p>`);
      }

      index += 1;
   }

   return blocks.join("");
}

export default function Docs() {
   const { workspace, user } = useAuth();
   const [docs, setDocs] = useState([]);
   const [active, setActive] = useState(null);
   const [content, setContent] = useState("");
   const [title, setTitle] = useState("");
   const [docType, setDocType] = useState("text");
   const [error, setError] = useState(null);
   const [saving, setSaving] = useState(false);
   const [remoteCursor, setRemoteCursor] = useState(null);
   const [collabMessage, setCollabMessage] = useState(null);
   const [viewMode, setViewMode] = useState("edit");
   const [collaborators, setCollaborators] = useState([]);
   const socketRef = useRef(null);
   const activeDocRef = useRef(null);
   const userRef = useRef(user);
   const textareaRef = useRef(null);
   const liveUpdateTimerRef = useRef(null);

   const refreshDocs = useCallback(async () => {
      try {
         const res = await getDocs();
         const fetchedDocs = res.data.documents || [];
         setDocs(fetchedDocs);
         if (!active && fetchedDocs.length) {
            setActive(fetchedDocs[0]);
            setTitle(fetchedDocs[0].title);
            setContent(fetchedDocs[0].content);
            setDocType(fetchedDocs[0].type || "text");
         }
      } catch (err) {
         setError(err.response?.data?.message || "Failed to load documents");
      }
   }, [active]);

   useEffect(() => {
      void refreshDocs();
   }, [refreshDocs]);

   useEffect(() => {
      activeDocRef.current = active;
   }, [active]);

   useEffect(() => {
      userRef.current = user;
   }, [user]);

   const socket = useMemo(() => {
      if (!workspace) return null;
      const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const socketBase = apiBase.replace(/\/api\/?$/, "");
      return io(socketBase, {
         auth: {
            token: localStorage.getItem("token"),
         },
      });
   }, [workspace]);

   useEffect(() => {
      if (!socket) return;
      socketRef.current = socket;
      socket.on("connect_error", (err) => setError(err.message || "Socket connection failed"));

      socket.on("docUpdate", ({ document, user: sender }) => {
         const currentDoc = activeDocRef.current;
         if (!currentDoc || document._id !== currentDoc._id) return;
         setActive(document);
         setTitle(document.title);
         setContent(document.content);
         setDocType(document.type || "text");
         setCollabMessage(`${sender.name || "A teammate"} updated this document`);
         setCollaborators((current) => {
            const next = current.filter((item) => item.id !== sender.id);
            return [{ id: sender.id, name: sender.name || "Teammate" }, ...next].slice(0, 4);
         });
      });

      socket.on("docCursor", ({ docId, cursor, user: sender }) => {
         const currentDoc = activeDocRef.current;
         const currentUser = userRef.current;
         if (!currentDoc || docId !== currentDoc._id || sender.id === currentUser?._id) return;
         setRemoteCursor({ name: sender.name, position: cursor });
         setCollaborators((current) => {
            const next = current.filter((item) => item.id !== sender.id);
            return [{ id: sender.id, name: sender.name || "Teammate" }, ...next].slice(0, 4);
         });
      });

      return () => {
         socket.off("connect_error");
         socket.off("docUpdate");
         socket.off("docCursor");
         socket.disconnect();
      };
   }, [socket]);

   useEffect(() => {
      if (!socketRef.current || !active) return;
      socketRef.current.emit("joinDoc", active._id);
   }, [active]);

   useEffect(() => {
      if (!active || !socketRef.current) return;
      if (liveUpdateTimerRef.current) {
         clearTimeout(liveUpdateTimerRef.current);
      }
      liveUpdateTimerRef.current = window.setTimeout(() => {
         socketRef.current.emit("docUpdate", {
            docId: active._id,
            title,
            content,
            type: docType,
         });
      }, 450);

      return () => {
         if (liveUpdateTimerRef.current) {
            clearTimeout(liveUpdateTimerRef.current);
         }
      };
   }, [active?._id, title, content, docType]);

   const handleCreate = async (type = "text") => {
      try {
         const res = await createDoc({ title: "Untitled document", content: "", type });
         const document = res.data.document;
         setDocs((prev) => [document, ...prev]);
         setActive(document);
         setTitle(document.title);
         setContent(document.content);
         setDocType(document.type || "text");
         setCollabMessage("New document ready for live editing.");
      } catch (err) {
         setError(err.response?.data?.message || "Could not create document");
      }
   };

   const handleSave = async () => {
      if (!active) return;
      setSaving(true);
      try {
         const res = await updateDoc(active._id, { title, content, type: docType });
         setActive(res.data.document);
         if (socketRef.current) {
            socketRef.current.emit("docUpdate", {
               docId: active._id,
               title,
               content,
               type: docType,
            });
         }
         setCollabMessage("Saved and synced with the workspace.");
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
      setDocType(doc.type || "text");
      setRemoteCursor(null);
      setCollabMessage(null);
      setViewMode("edit");
      if (socketRef.current) {
         socketRef.current.emit("joinDoc", doc._id);
      }
   };

   const insertMarkdownSnippet = (prefix, suffix = "", placeholder = "text") => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selection = content.slice(start, end);
      const inserted = `${prefix}${selection || placeholder}${suffix}`;
      const nextValue = content.slice(0, start) + inserted + content.slice(end);
      setContent(nextValue);
      requestAnimationFrame(() => {
         textarea.focus();
         const cursorStart = start + prefix.length;
         const cursorEnd = cursorStart + (selection ? selection.length : placeholder.length);
         textarea.setSelectionRange(cursorStart, cursorEnd);
      });
   };

   const wordCount = useMemo(() => content.trim().split(/\s+/).filter(Boolean).length, [content]);
   const lastUpdated = active?.updatedAt ? new Date(active.updatedAt).toLocaleDateString() : "Not yet saved";

   return (
      <div className="grid gap-6 2xl:grid-cols-[320px_minmax(0,1fr)]">
         <PageShell title="Workspace notes" subtitle="Capture decisions, plans, and knowledge in one collaborative editor." compact className="p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
               <div className="rounded-[1.2rem] border border-gold/20 bg-[rgba(248,181,0,0.08)] px-3 py-2 text-sm text-gold">
                  <div className="flex items-center gap-2">
                     <HiSparkles className="h-4 w-4" />
                     Live collaboration ready
                  </div>
               </div>
               <div className="flex gap-2">
                  <button onClick={() => handleCreate("text")} className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-gold text-[var(--noir-900)]">
                     <HiPlus className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleCreate("markdown")} className="rounded-[1.2rem] border border-gold/20 bg-[rgba(248,181,0,0.08)] px-4 py-2 text-sm font-semibold text-gold">
                     New markdown
                  </button>
               </div>
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
            <div className="grid gap-6 xl:grid-cols-[1.45fr_0.55fr]">
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
                     className="w-full rounded-[1.25rem] border border-border bg-[rgba(255,255,255,0.08)] px-4 py-3 text-lg text-slate-100 outline-none placeholder:text-slate-400 focus:border-gold"
                     value={title}
                     onChange={(e) => setTitle(e.target.value)}
                     placeholder="Document title"
                  />
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                     <button type="button" onClick={() => setDocType("text")} className={`rounded-full px-4 py-2 ${docType === "text" ? "bg-gold text-[var(--noir-900)]" : "bg-white/[0.04] text-white"}`}>
                        Text
                     </button>
                     <button type="button" onClick={() => setDocType("markdown")} className={`rounded-full px-4 py-2 ${docType === "markdown" ? "bg-gold text-[var(--noir-900)]" : "bg-white/[0.04] text-white"}`}>
                        Markdown
                     </button>
                     <button type="button" onClick={() => setViewMode("edit")} className={`rounded-full px-4 py-2 ${viewMode === "edit" ? "bg-gold text-[var(--noir-900)]" : "bg-white/[0.04] text-white"}`}>
                        Edit
                     </button>
                     <button type="button" onClick={() => setViewMode("preview")} className={`rounded-full px-4 py-2 ${viewMode === "preview" ? "bg-gold text-[var(--noir-900)]" : "bg-white/[0.04] text-white"}`}>
                        Preview
                     </button>
                     <span className="text-xs text-muted-foreground">Current document: {docType === "markdown" ? "Markdown" : "Plain text"}</span>
                  </div>

                  {docType === "markdown" ? (
                     <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => insertMarkdownSnippet("# ", "", "Heading")} className="rounded-[0.9rem] border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white">Heading</button>
                        <button type="button" onClick={() => insertMarkdownSnippet("**", "**", "bold") } className="rounded-[0.9rem] border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white">Bold</button>
                        <button type="button" onClick={() => insertMarkdownSnippet("*", "*", "italic")} className="rounded-[0.9rem] border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white">Italic</button>
                        <button type="button" onClick={() => insertMarkdownSnippet("- ", "", "item")} className="rounded-[0.9rem] border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white">List</button>
                        <button type="button" onClick={() => insertMarkdownSnippet("```\n", "\n```", "code")} className="rounded-[0.9rem] border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white">Code block</button>
                     </div>
                  ) : null}

                  {viewMode === "preview" ? (
                     <div className="min-h-[78vh] rounded-[1.6rem] border border-white/10 bg-[rgba(255,255,255,0.09)] p-5 text-sm leading-7 text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                        <div className="space-y-3" dangerouslySetInnerHTML={{ __html: renderMarkdownToHtml(content) }} />
                     </div>
                  ) : (
                     <textarea
                        ref={textareaRef}
                        className="min-h-[78vh] w-full resize-y rounded-[1.6rem] border border-white/10 bg-[rgba(255,255,255,0.09)] p-5 text-[15px] leading-7 text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] outline-none placeholder:text-slate-400 focus:border-gold"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder={docType === "markdown" ? "Write markdown here..." : "Start writing your document..."}
                        onSelect={(e) => {
                           const textarea = e.target;
                           if (socketRef.current && active) {
                              socketRef.current.emit("docCursor", {
                                 docId: active._id,
                                 cursor: {
                                    selectionStart: textarea.selectionStart,
                                    selectionEnd: textarea.selectionEnd,
                                 },
                              });
                           }
                        }}
                     />
                  )}
                  {remoteCursor ? (
                     <div className="mt-2 rounded-[1.2rem] border border-gold/20 bg-[rgba(248,181,0,0.08)] px-4 py-3 text-sm text-gold">
                        {remoteCursor.name} is editing around position {remoteCursor.position?.selectionStart || 0}.
                     </div>
                  ) : null}
               </div>

               <div className="space-y-4">
                  <div className="rounded-[1.5rem] border border-border bg-[rgba(255,255,255,0.04)] p-5">
                     <div className="flex items-center gap-2 text-gold">
                        <HiLightningBolt className="h-4 w-4" />
                        Collaboration context
                     </div>
                     <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                        <div className="rounded-[1.1rem] border border-border/70 bg-[rgba(2,6,23,0.65)] px-3 py-2">{collabMessage || "Your team can edit this document together in real time."}</div>
                        <div className="rounded-[1.1rem] border border-border/70 bg-[rgba(2,6,23,0.65)] px-3 py-2">Document type: {docType === "markdown" ? "Markdown" : "Plain text"}</div>
                        <div className="rounded-[1.1rem] border border-border/70 bg-[rgba(2,6,23,0.65)] px-3 py-2">
                           Active collaborators: {collaborators.length > 0 ? collaborators.map((item) => item.name).join(", ") : "Only you for now"}
                        </div>
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
