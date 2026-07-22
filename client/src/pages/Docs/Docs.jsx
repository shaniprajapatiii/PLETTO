/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { HiCheck, HiDocumentText, HiEye, HiLightningBolt, HiPencil, HiPlus, HiSparkles, HiUsers } from "react-icons/hi";
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

   const socketRef = useRef(null);
   const textareaRef = useRef(null);

   const refreshDocs = useCallback(async () => {
      try {
         const res = await getDocs();
         const fetchedDocs = res.data.documents || [];
         setDocs(fetchedDocs);
         if (!active && fetchedDocs.length > 0) {
            const first = fetchedDocs[0];
            setActive(first);
            setTitle(first.title || "Untitled Document");
            setContent(first.content || "");
            setDocType(first.type || "text");
         }
      } catch (err) {
         setError(err.response?.data?.message || "Could not load documents");
      }
   }, [active]);

   useEffect(() => {
      refreshDocs();
   }, []);

   useEffect(() => {
      const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
         auth: { token: localStorage.getItem("token") },
      });
      socketRef.current = socket;

      socket.on("docUpdate", (updatedDoc) => {
         if (active && updatedDoc._id === active._id) {
            setTitle(updatedDoc.title);
            setContent(updatedDoc.content);
            setDocType(updatedDoc.type || "text");
            setCollabMessage("Live update received from a teammate.");
         }
         setDocs((prev) => prev.map((d) => (d._id === updatedDoc._id ? updatedDoc : d)));
      });

      socket.on("docCursor", ({ user: cursorUser, cursor }) => {
         setRemoteCursor({ name: cursorUser?.name || "Collaborator", position: cursor });
      });
      return () => {
         socket.off("docUpdate");
         socket.off("docCursor");
         socket.disconnect();
      };
   }, [active]);

   useEffect(() => {
      if (!socketRef.current || !active) return;
      socketRef.current.emit("joinDoc", active._id);
   }, [active]);



   const handleCreate = async (type = "text") => {
      try {
         const res = await createDoc({ title: "Untitled document", content: "", type });
         const document = res.data.document;
         setDocs((prev) => [document, ...prev]);
         setActive(document);
         setTitle(document.title);
         setContent(document.content);
         setDocType(document.type || "text");
         setCollabMessage("New document ready for co-authoring.");
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
         setCollabMessage("Saved & synced with workspace.");
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
      setCollabMessage(null);
      setViewMode("edit");
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
   const lastUpdated = active?.updatedAt ? new Date(active.updatedAt).toLocaleDateString() : "Not saved";

   return (
      <PageShell
         title="Knowledge Documents"
         subtitle="Create, co-author, and share workspace documentation and team notes."
         actions={
            <div className="flex gap-2">
               <button
                  onClick={() => handleCreate("text")}
                  className="flex items-center gap-1.5 px-3 py-2 bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-bold rounded-lg shadow-md transition"
               >
                  <HiPlus size={14} />
                  <span>New Doc</span>
               </button>
               <button
                  onClick={() => handleCreate("markdown")}
                  className="flex items-center gap-1.5 px-3 py-2 border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold rounded-lg transition"
               >
                  <span>Markdown</span>
               </button>
            </div>
         }
      >
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-4 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 space-y-3">
               <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Document List ({docs.length})</span>
               </div>

               <div className="space-y-1.5 max-h-[70vh] overflow-y-auto">
                  {docs.length > 0 ? (
                     docs.map((doc) => (
                        <button
                           key={doc._id}
                           onClick={() => selectDoc(doc)}
                           className={`w-full p-3 rounded-lg border text-left transition flex items-center gap-3 ${
                              active?._id === doc._id
                                 ? "border-amber-400/50 bg-amber-400/10 text-amber-300 font-semibold"
                                 : "border-zinc-800/60 bg-zinc-900/40 text-zinc-400 hover:bg-zinc-900/80 hover:text-zinc-200"
                           }`}
                        >
                           <HiDocumentText className={`h-4 w-4 shrink-0 ${active?._id === doc._id ? "text-amber-300" : "text-zinc-500"}`} />
                           <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold truncate text-zinc-200">{doc.title || "Untitled Document"}</div>
                              <div className="text-[10px] text-zinc-500 truncate mt-0.5">Updated {new Date(doc.updatedAt).toLocaleDateString()}</div>
                           </div>
                        </button>
                     ))
                  ) : (
                     <div className="py-8 text-center text-xs text-zinc-500">No documents yet. Create one to begin.</div>
                  )}
               </div>
            </div>

            <div className="lg:col-span-8 rounded-xl border border-zinc-800 bg-zinc-950/60 p-5 space-y-4">
               {active ? (
                  <>
                     <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-zinc-800">
                        <input
                           className="text-lg font-bold text-zinc-100 bg-transparent border-b border-transparent focus:border-amber-400 outline-none w-full sm:w-2/3"
                           value={title}
                           onChange={(e) => setTitle(e.target.value)}
                           placeholder="Document Title..."
                        />

                        <div className="flex items-center gap-2 shrink-0">
                           <span className="text-[11px] text-zinc-500">{wordCount} words • {lastUpdated}</span>
                           <button
                              onClick={handleSave}
                              disabled={saving}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-bold shadow-md transition disabled:opacity-50"
                           >
                              <HiCheck size={14} />
                              <span>{saving ? "Saving..." : "Save"}</span>
                           </button>
                        </div>
                     </div>

                     <div className="flex flex-wrap items-center justify-between gap-2 bg-zinc-900/60 p-2 rounded-lg border border-zinc-800">
                        <div className="flex items-center gap-1">
                           <button
                              onClick={() => setViewMode("edit")}
                              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition ${viewMode === "edit" ? "bg-amber-400 text-zinc-950 font-bold" : "text-zinc-400 hover:text-white"}`}
                           >
                              <HiPencil size={12} />
                              <span>Edit</span>
                           </button>
                           <button
                              onClick={() => setViewMode("preview")}
                              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition ${viewMode === "preview" ? "bg-amber-400 text-zinc-950 font-bold" : "text-zinc-400 hover:text-white"}`}
                           >
                              <HiEye size={12} />
                              <span>Preview</span>
                           </button>
                        </div>

                        {docType === "markdown" && viewMode === "edit" ? (
                           <div className="flex flex-wrap gap-1">
                              <button type="button" onClick={() => insertMarkdownSnippet("# ", "", "Heading")} className="px-2 py-0.5 rounded border border-zinc-800 bg-zinc-900 text-[11px] text-zinc-300 hover:bg-zinc-800"># Heading</button>
                              <button type="button" onClick={() => insertMarkdownSnippet("**", "**", "bold")} className="px-2 py-0.5 rounded border border-zinc-800 bg-zinc-900 text-[11px] text-zinc-300 hover:bg-zinc-800">**Bold**</button>
                              <button type="button" onClick={() => insertMarkdownSnippet("*", "*", "italic")} className="px-2 py-0.5 rounded border border-zinc-800 bg-zinc-900 text-[11px] text-zinc-300 hover:bg-zinc-800">*Italic*</button>
                              <button type="button" onClick={() => insertMarkdownSnippet("- ", "", "item")} className="px-2 py-0.5 rounded border border-zinc-800 bg-zinc-900 text-[11px] text-zinc-300 hover:bg-zinc-800">- List</button>
                              <button type="button" onClick={() => insertMarkdownSnippet("```\n", "\n```", "code")} className="px-2 py-0.5 rounded border border-zinc-800 bg-zinc-900 text-[11px] text-zinc-300 hover:bg-zinc-800">Code</button>
                           </div>
                        ) : null}
                     </div>

                     {viewMode === "preview" ? (
                        <div className="min-h-[50vh] p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 overflow-y-auto">
                           <div dangerouslySetInnerHTML={{ __html: renderMarkdownToHtml(content) }} />
                        </div>
                     ) : (
                        <textarea
                           ref={textareaRef}
                           className="min-h-[50vh] w-full resize-y rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-amber-400 leading-relaxed"
                           value={content}
                           onChange={(e) => setContent(e.target.value)}
                           placeholder="Type your document content here..."
                        />
                     )}

                     {collabMessage ? (
                        <div className="p-2 rounded bg-amber-400/10 border border-amber-400/20 text-[11px] text-amber-300 font-medium">
                           {collabMessage}
                        </div>
                     ) : null}
                  </>
               ) : (
                  <div className="py-20 text-center text-xs text-zinc-500">
                     Select a document from the list or create a new one.
                  </div>
               )}
            </div>
         </div>
      </PageShell>
   );
}
