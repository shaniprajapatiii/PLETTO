/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { io } from "socket.io-client";
import {
   HiArrowLeft,
   HiCheck,
   HiDocumentText,
   HiEye,
   HiPencil,
   HiPlus,
   HiTrash,
   HiSearch,
   HiArrowsExpand,
   HiCode,
   HiLink,
   HiTable,
   HiViewList,
   HiBookOpen,
   HiViewGrid,
   HiFilter,
   HiSparkles,
   HiClock,
} from "react-icons/hi";
import { createDoc, getDocs, updateDoc, deleteDoc } from "../../services/docsService";
import { useAuth } from "../../context/AuthContext";
import { PageShell } from "../../components/common/PageShell";

function escapeHtml(value = "") {
   return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
}

function renderInlineMarkdown(value = "") {
   let safe = escapeHtml(value);
   // Links [text](url)
   safe = safe.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer" class="text-amber-400 underline font-semibold hover:text-amber-300">$1</a>');
   // Code inline `code`
   safe = safe.replace(/`([^`]+)`/g, '<code class="bg-zinc-800 text-amber-300 px-1.5 py-0.5 rounded font-mono text-xs border border-zinc-700">$1</code>');
   // Bold **text**
   safe = safe.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-extrabold text-zinc-100">$1</strong>');
   // Strikethrough ~~text~~
   safe = safe.replace(/~~([^~]+)~~/g, '<del class="line-through text-zinc-500">$1</del>');
   // Italic *text*
   safe = safe.replace(/\*([^*]+)\*/g, '<em class="italic text-zinc-200">$1</em>');
   return safe;
}

function renderMarkdownToHtml(markdown = "") {
   if (!markdown.trim()) {
      return '<div class="py-12 text-center text-sm text-zinc-500 italic">Document is empty. Type in the editor to build your content.</div>';
   }

   const blocks = [];
   const lines = markdown.split(/\r?\n/);
   let index = 0;

   while (index < lines.length) {
      const line = lines[index];
      const trimmed = line.trim();

      if (!trimmed) {
         blocks.push('<div class="h-3"></div>');
         index += 1;
         continue;
      }

      // Horizontal Rule ---
      if (/^---+$|^\*\*\*+$|^___+$/.test(trimmed)) {
         blocks.push('<hr class="my-6 border-zinc-800" />');
         index += 1;
         continue;
      }

      // Code Block ```
      if (trimmed.startsWith("```")) {
         const lang = trimmed.replace(/^```/, "").trim();
         const codeLines = [];
         index += 1;
         while (index < lines.length && !lines[index].trim().startsWith("```")) {
            codeLines.push(lines[index]);
            index += 1;
         }
         blocks.push(
            `<div class="my-4 rounded-xl border border-zinc-800 bg-zinc-950 p-4 shadow-xl overflow-x-auto"><div class="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800 text-[10px] font-mono text-zinc-500 uppercase tracking-widest"><span>${escapeHtml(lang || "code")}</span></div><pre class="font-mono text-xs text-amber-300 leading-relaxed"><code>${escapeHtml(codeLines.join("\n"))}</code></pre></div>`
         );
         index += 1;
         continue;
      }

      // Blockquotes >
      if (/^>\s+/.test(line)) {
         const quoteLines = [];
         while (index < lines.length && /^>\s+/.test(lines[index])) {
            quoteLines.push(renderInlineMarkdown(lines[index].replace(/^>\s+/, "")));
            index += 1;
         }
         blocks.push(
            `<blockquote class="my-4 border-l-4 border-amber-400 bg-amber-400/5 px-4 py-3 text-sm italic text-zinc-300 rounded-r-xl">${quoteLines.join("<br />")}</blockquote>`
         );
         continue;
      }

      // Table | Col 1 | Col 2 |
      if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
         const tableRows = [];
         while (index < lines.length && lines[index].trim().startsWith("|")) {
            tableRows.push(lines[index].trim());
            index += 1;
         }
         if (tableRows.length >= 2) {
            const parseRow = (row) => row.split("|").slice(1, -1).map((cell) => cell.trim());
            const headerCells = parseRow(tableRows[0]);
            const isSeparator = (row) => row.split("|").slice(1, -1).every((cell) => /^:?-+:?$/.test(cell.trim()));
            const startIndex = isSeparator(tableRows[1]) ? 2 : 1;

            const headerHtml = `<thead><tr class="bg-zinc-900 border-b border-zinc-800">${headerCells
               .map((c) => `<th class="px-4 py-2.5 text-left text-xs font-bold text-zinc-200 border-r border-zinc-800/60">${renderInlineMarkdown(c)}</th>`)
               .join("")}</tr></thead>`;

            const bodyRows = tableRows.slice(startIndex).map((rowStr) => {
               const cells = parseRow(rowStr);
               return `<tr class="border-b border-zinc-800/40 hover:bg-zinc-900/40 transition">${cells
                  .map((c) => `<td class="px-4 py-2 text-xs text-zinc-300 border-r border-zinc-800/40">${renderInlineMarkdown(c)}</td>`)
                  .join("")}</tr>`;
            });

            blocks.push(
               `<div class="my-4 overflow-x-auto rounded-xl border border-zinc-800"><table class="w-full text-left border-collapse">${headerHtml}<tbody>${bodyRows.join("")}</tbody></table></div>`
            );
            continue;
         }
      }

      // Task List [- [ ] or - [x]]
      if (/^[-*]\s+\[[ xX]\]\s+/.test(trimmed)) {
         const taskItems = [];
         while (index < lines.length && /^[-*]\s+\[[ xX]\]\s+/.test(lines[index].trim())) {
            const itemLine = lines[index].trim();
            const checked = /^[-*]\s+\[[xX]\]\s+/.test(itemLine);
            const text = itemLine.replace(/^[-*]\s+\[[ xX]\]\s+/, "");
            taskItems.push(
               `<li class="flex items-center gap-2 text-xs text-zinc-300"><input type="checkbox" ${checked ? "checked" : ""} disabled class="rounded border-zinc-700 bg-zinc-900 text-amber-400 accent-amber-400" /><span class="${checked ? "line-through text-zinc-500" : ""}">${renderInlineMarkdown(text)}</span></li>`
            );
            index += 1;
         }
         blocks.push(`<ul class="my-3 space-y-1.5 pl-1">${taskItems.join("")}</ul>`);
         continue;
      }

      // Unordered List (- or *)
      if (/^[-*]\s+/.test(line)) {
         const items = [];
         while (index < lines.length && /^[-*]\s+/.test(lines[index])) {
            items.push(`<li class="text-xs text-zinc-300 leading-relaxed">${renderInlineMarkdown(lines[index].replace(/^[-*]\s+/, ""))}</li>`);
            index += 1;
         }
         blocks.push(`<ul class="my-3 list-disc list-inside space-y-1 pl-2">${items.join("")}</ul>`);
         continue;
      }

      // Ordered List (1. 2.)
      if (/^\d+\.\s+/.test(line)) {
         const items = [];
         while (index < lines.length && /^\d+\.\s+/.test(lines[index])) {
            items.push(`<li class="text-xs text-zinc-300 leading-relaxed">${renderInlineMarkdown(lines[index].replace(/^\d+\.\s+/, ""))}</li>`);
            index += 1;
         }
         blocks.push(`<ol class="my-3 list-decimal list-inside space-y-1 pl-2">${items.join("")}</ol>`);
         continue;
      }

      // Headings #, ##, ###, ####
      if (/^####\s+/.test(line)) {
         blocks.push(`<h4 class="text-xs font-bold text-zinc-200 uppercase tracking-wider mt-5 mb-2">${renderInlineMarkdown(line.replace(/^####\s+/, ""))}</h4>`);
      } else if (/^###\s+/.test(line)) {
         blocks.push(`<h3 class="text-sm font-extrabold text-amber-300 mt-5 mb-2">${renderInlineMarkdown(line.replace(/^###\s+/, ""))}</h3>`);
      } else if (/^##\s+/.test(line)) {
         blocks.push(`<h2 class="text-base font-extrabold text-zinc-100 border-b border-zinc-800 pb-1 mt-6 mb-3">${renderInlineMarkdown(line.replace(/^##\s+/, ""))}</h2>`);
      } else if (/^#\s+/.test(line)) {
         blocks.push(`<h1 class="text-xl font-black text-white tracking-tight border-b border-amber-400/30 pb-2 mt-6 mb-4">${renderInlineMarkdown(line.replace(/^#\s+/, ""))}</h1>`);
      } else {
         blocks.push(`<p class="text-xs leading-relaxed text-zinc-300 my-1.5">${renderInlineMarkdown(line)}</p>`);
      }

      index += 1;
   }

   return blocks.join("");
}

export default function Docs() {
   const { workspace, user } = useAuth();
   const [searchParams, setSearchParams] = useSearchParams();

   const [docs, setDocs] = useState([]);
   const [active, setActive] = useState(null);
   const [content, setContent] = useState("");
   const [title, setTitle] = useState("");
   const [docType, setDocType] = useState("text");
   const [searchQuery, setSearchQuery] = useState("");
   const [filterType, setFilterType] = useState("all"); // 'all', 'markdown', 'text'
   const [error, setError] = useState(null);
   const [saving, setSaving] = useState(false);
   const [remoteCursor, setRemoteCursor] = useState(null);
   const [collabMessage, setCollabMessage] = useState(null);
   const [viewMode, setViewMode] = useState("edit"); // 'edit', 'split', 'preview'
   const [loading, setLoading] = useState(true);

   const socketRef = useRef(null);
   const textareaRef = useRef(null);
   const activeRef = useRef(active);

   useEffect(() => {
      activeRef.current = active;
   }, [active]);

   const refreshDocs = useCallback(async () => {
      try {
         setLoading(true);
         const res = await getDocs();
         const fetchedDocs = res.data.documents || [];
         setDocs(fetchedDocs);

         const docIdParam = searchParams.get("doc");
         if (docIdParam) {
            const matched = fetchedDocs.find((d) => d._id === docIdParam);
            if (matched) {
               setActive(matched);
               setTitle(matched.title || "Untitled Document");
               setContent(matched.content || "");
               setDocType(matched.type || "text");
            }
         }
      } catch (err) {
         setError(err.response?.data?.message || "Could not load documents");
      } finally {
         setLoading(false);
      }
   }, [searchParams]);

   useEffect(() => {
      refreshDocs();
   }, []);

   useEffect(() => {
      const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
         auth: { token: localStorage.getItem("token") },
      });
      socketRef.current = socket;

      socket.on("docUpdate", (updatedDoc) => {
         const currentActive = activeRef.current;
         if (currentActive && updatedDoc._id === currentActive._id) {
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
   }, []);

   useEffect(() => {
      if (!socketRef.current || !active) return;
      socketRef.current.emit("joinDoc", active._id);
   }, [active]);

   const selectDoc = (doc) => {
      setActive(doc);
      setTitle(doc.title);
      setContent(doc.content);
      setDocType(doc.type || "text");
      setCollabMessage(null);
      setViewMode(doc.type === "markdown" ? "split" : "edit");
      setSearchParams({ doc: doc._id });
   };

   const backToDirectory = () => {
      setActive(null);
      setTitle("");
      setContent("");
      setDocType("text");
      setSearchParams({});
   };

   const handleCreate = async (type = "text") => {
      try {
         const res = await createDoc({
            title: type === "markdown" ? "Untitled Markdown Note" : "Untitled Document",
            content: type === "markdown" ? "# New Document\n\nStart typing markdown content here..." : "",
            type,
         });
         const document = res.data.document;
         setDocs((prev) => [document, ...prev]);
         selectDoc(document);
      } catch (err) {
         setError(err.response?.data?.message || "Could not create document");
      }
   };

   const handleSave = async () => {
      if (!active) return;
      setSaving(true);
      try {
         const res = await updateDoc(active._id, { title, content, type: docType });
         const updated = res.data.document;
         setActive(updated);
         setDocs((prev) => prev.map((d) => (d._id === updated._id ? updated : d)));
         if (socketRef.current) {
            socketRef.current.emit("docUpdate", {
               docId: active._id,
               title,
               content,
               type: docType,
            });
         }
         setCollabMessage("Document saved & synced.");
      } catch (err) {
         setError(err.response?.data?.message || "Could not save document");
      } finally {
         setSaving(false);
      }
   };

   const handleDelete = async (docId) => {
      if (!window.confirm("Are you sure you want to delete this document?")) return;

      try {
         await deleteDoc(docId);
         const nextDocs = docs.filter((d) => d._id !== docId);
         setDocs(nextDocs);
         if (active?._id === docId) {
            backToDirectory();
         }
      } catch (err) {
         setError(err.response?.data?.message || "Could not delete document");
      }
   };

   const insertSnippet = (prefix, suffix = "", placeholder = "text") => {
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
   const charCount = useMemo(() => content.length, [content]);

   const filteredDocs = useMemo(() => {
      let list = docs;
      if (filterType === "markdown") list = list.filter((d) => d.type === "markdown");
      else if (filterType === "text") list = list.filter((d) => d.type !== "markdown");

      if (!searchQuery.trim()) return list;
      const q = searchQuery.toLowerCase();
      return list.filter((d) => d.title?.toLowerCase().includes(q) || d.content?.toLowerCase().includes(q));
   }, [docs, filterType, searchQuery]);

   // Directory Catalog Grid View
   if (!active) {
      return (
         <PageShell
            title="Knowledge Documents"
            subtitle="Browse team specs, technical guides, and collaborative notes. Click any document to edit in focus mode."
            actions={
               <div className="flex gap-2">
                  <button
                     onClick={() => handleCreate("markdown")}
                     className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#f9ebae] hover:bg-[#e6d695] text-zinc-950 text-xs font-bold shadow-md transition"
                  >
                     <HiSparkles size={14} />
                     <span>New Markdown Doc</span>
                  </button>
                  <button
                     onClick={() => handleCreate("text")}
                     className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-semibold transition"
                  >
                     <HiPlus size={14} />
                     <span>New Plain Text</span>
                  </button>
               </div>
            }
         >
            {error && (
               <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300">
                  {error}
               </div>
            )}

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
               <div className="flex items-center gap-1.5 bg-zinc-950 p-1.5 rounded-xl border border-zinc-800/80 w-full sm:w-auto">
                  {[
                     { key: "all", label: `All Docs (${docs.length})` },
                     { key: "markdown", label: `Markdown (${docs.filter((d) => d.type === "markdown").length})` },
                     { key: "text", label: `Plain Text (${docs.filter((d) => d.type !== "markdown").length})` },
                  ].map((tab) => (
                     <button
                        key={tab.key}
                        type="button"
                        onClick={() => setFilterType(tab.key)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                           filterType === tab.key
                              ? "bg-[#f9ebae] text-zinc-950 shadow"
                              : "text-zinc-400 hover:text-white"
                        }`}
                     >
                        {tab.label}
                     </button>
                  ))}
               </div>

               <div className="relative w-full sm:w-80">
                  <HiSearch className="absolute left-3.5 top-2.5 text-zinc-500" size={14} />
                  <input
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     placeholder="Search documents by title or text..."
                     className="w-full pl-9 pr-4 py-1.5 rounded-xl border border-zinc-800 bg-zinc-950 text-xs text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-[#f9ebae] transition"
                  />
               </div>
            </div>

            {/* Document Cards Grid */}
            {loading ? (
               <div className="py-20 text-center text-xs text-zinc-500 flex flex-col items-center gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#f9ebae] border-t-transparent" />
                  <span>Loading team docs…</span>
               </div>
            ) : filteredDocs.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredDocs.map((doc) => {
                     const isMd = doc.type === "markdown";
                     const words = doc.content ? doc.content.trim().split(/\s+/).filter(Boolean).length : 0;

                     return (
                        <div
                           key={doc._id}
                           className="group p-5 rounded-2xl border border-zinc-800/80 bg-zinc-950/70 hover:border-[#f9ebae]/40 hover:bg-zinc-900/60 transition flex flex-col justify-between space-y-4 shadow-xl"
                        >
                           <div>
                              <div className="flex items-center justify-between gap-2 mb-3">
                                 <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                                       isMd
                                          ? "bg-amber-400/10 text-amber-300 border-amber-400/30"
                                          : "bg-indigo-500/10 text-indigo-300 border-indigo-500/30"
                                    }`}
                                 >
                                    {isMd ? "✨ Markdown" : "📄 Plain Text"}
                                 </span>

                                 <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                                    <HiClock size={12} />
                                    {new Date(doc.updatedAt || doc.createdAt).toLocaleDateString()}
                                 </span>
                              </div>

                              <h3 className="font-bold text-sm text-zinc-100 group-hover:text-[#f9ebae] transition truncate">
                                 {doc.title || "Untitled Document"}
                              </h3>

                              <p className="text-xs text-zinc-400 mt-2 line-clamp-3 leading-relaxed font-mono text-[11px] bg-zinc-900/40 p-2.5 rounded-xl border border-zinc-800/40">
                                 {doc.content ? doc.content.substring(0, 140) : "Empty document."}
                              </p>
                           </div>

                           <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80 text-xs">
                              <span className="text-[11px] font-semibold text-zinc-500">{words} words</span>

                              <div className="flex gap-2">
                                 <button
                                    type="button"
                                    onClick={() => selectDoc(doc)}
                                    className="py-1.5 px-3 bg-[#f9ebae] hover:bg-[#e6d695] text-zinc-950 rounded-xl transition font-bold text-xs flex items-center gap-1 shadow-md shadow-[#f9ebae]/10"
                                 >
                                    <HiArrowsExpand size={13} />
                                    <span>Open Focus View</span>
                                 </button>
                                 <button
                                    type="button"
                                    onClick={() => handleDelete(doc._id)}
                                    className="p-1.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl hover:bg-red-500/20 transition"
                                    title="Delete document"
                                 >
                                    <HiTrash size={14} />
                                 </button>
                              </div>
                           </div>
                        </div>
                     );
                  })}
               </div>
            ) : (
               <div className="text-center py-20 rounded-2xl border border-zinc-800/80 bg-zinc-950/40 p-6 space-y-3">
                  <HiDocumentText className="mx-auto text-zinc-600" size={44} />
                  <h3 className="text-base font-bold text-zinc-200">No documents found</h3>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                     Create a markdown note or plain text document to start co-authoring knowledge specs.
                  </p>
               </div>
            )}
         </PageShell>
      );
   }

   // Full-Screen Dedicated Document Editor View
   return (
      <div className="fixed inset-0 z-50 bg-[#09090b] text-zinc-100 flex flex-col overflow-hidden">
         {/* Top Header Bar */}
         <header className="h-14 border-b border-zinc-800/80 bg-zinc-950/90 px-4 sm:px-6 flex items-center justify-between gap-4 backdrop-blur-xl shrink-0">
            <div className="flex items-center gap-3 min-w-0 flex-1">
               <button
                  type="button"
                  onClick={backToDirectory}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-xs font-bold text-zinc-300 transition shrink-0"
               >
                  <HiArrowLeft size={16} />
                  <span className="hidden sm:inline">Back to Documents</span>
               </button>

               <div className="h-4 w-px bg-zinc-800 hidden sm:block" />

               <input
                  className="text-sm sm:text-base font-bold text-zinc-100 bg-transparent border-b border-transparent focus:border-[#f9ebae] outline-none truncate w-full max-w-md"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Document title..."
               />

               <span
                  className={`hidden sm:inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border shrink-0 ${
                     docType === "markdown"
                        ? "bg-amber-400/10 text-amber-300 border-amber-400/30"
                        : "bg-indigo-500/10 text-indigo-300 border-indigo-500/30"
                  }`}
               >
                  {docType === "markdown" ? "Markdown" : "Plain Text"}
               </span>
            </div>

            {/* Action Bar */}
            <div className="flex items-center gap-2 shrink-0">
               <span className="hidden md:inline text-[11px] text-zinc-500 font-mono">
                  {wordCount} words • {charCount} chars
               </span>

               <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#f9ebae] hover:bg-[#e6d695] text-zinc-950 text-xs font-extrabold shadow-md shadow-[#f9ebae]/20 transition disabled:opacity-50"
               >
                  <HiCheck size={16} />
                  <span>{saving ? "Saving..." : "Save"}</span>
               </button>

               <button
                  type="button"
                  onClick={() => handleDelete(active._id)}
                  className="p-2 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition"
                  title="Delete Document"
               >
                  <HiTrash size={16} />
               </button>
            </div>
         </header>

         {/* Mode Switcher & Rich Markdown Toolbar Bar */}
         <div className="bg-zinc-950/80 border-b border-zinc-800/80 px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-3 shrink-0">
            {/* View Mode Tabs */}
            <div className="flex items-center gap-1 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800 text-xs font-bold">
               <button
                  type="button"
                  onClick={() => setViewMode("edit")}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition ${
                     viewMode === "edit" ? "bg-[#f9ebae] text-zinc-950 shadow" : "text-zinc-400 hover:text-white"
                  }`}
               >
                  <HiPencil size={13} />
                  <span>Edit</span>
               </button>

               {docType === "markdown" && (
                  <button
                     type="button"
                     onClick={() => setViewMode("split")}
                     className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition ${
                        viewMode === "split" ? "bg-[#f9ebae] text-zinc-950 shadow" : "text-zinc-400 hover:text-white"
                     }`}
                  >
                     <HiViewGrid size={13} />
                     <span>Split View</span>
                  </button>
               )}

               <button
                  type="button"
                  onClick={() => setViewMode("preview")}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition ${
                     viewMode === "preview" ? "bg-[#f9ebae] text-zinc-950 shadow" : "text-zinc-400 hover:text-white"
                  }`}
               >
                  <HiEye size={13} />
                  <span>Preview</span>
               </button>
            </div>

            {/* Markdown Feature Snippets Toolbar */}
            {docType === "markdown" && (viewMode === "edit" || viewMode === "split") && (
               <div className="flex flex-wrap items-center gap-1 text-[11px] font-mono">
                  <button type="button" onClick={() => insertSnippet("# ", "", "Heading 1")} className="px-2 py-1 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-[#f9ebae] hover:text-[#f9ebae] transition" title="Heading 1">H1</button>
                  <button type="button" onClick={() => insertSnippet("## ", "", "Heading 2")} className="px-2 py-1 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-[#f9ebae] hover:text-[#f9ebae] transition" title="Heading 2">H2</button>
                  <button type="button" onClick={() => insertSnippet("### ", "", "Heading 3")} className="px-2 py-1 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-[#f9ebae] hover:text-[#f9ebae] transition" title="Heading 3">H3</button>
                  <div className="h-4 w-px bg-zinc-800 mx-0.5" />
                  <button type="button" onClick={() => insertSnippet("**", "**", "bold text")} className="px-2 py-1 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-[#f9ebae] hover:text-[#f9ebae] font-bold transition" title="Bold">B</button>
                  <button type="button" onClick={() => insertSnippet("*", "*", "italic text")} className="px-2 py-1 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-[#f9ebae] hover:text-[#f9ebae] italic transition" title="Italic">I</button>
                  <button type="button" onClick={() => insertSnippet("~~", "~~", "strikethrough")} className="px-2 py-1 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-[#f9ebae] hover:text-[#f9ebae] line-through transition" title="Strikethrough">S</button>
                  <div className="h-4 w-px bg-zinc-800 mx-0.5" />
                  <button type="button" onClick={() => insertSnippet("`", "`", "code")} className="px-2 py-1 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-[#f9ebae] hover:text-[#f9ebae] transition" title="Inline Code">&lt;&gt;</button>
                  <button type="button" onClick={() => insertSnippet("```javascript\n", "\n```", "// code block")} className="px-2 py-1 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-[#f9ebae] hover:text-[#f9ebae] transition" title="Code Block">```</button>
                  <button type="button" onClick={() => insertSnippet("> ", "", "Quote text")} className="px-2 py-1 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-[#f9ebae] hover:text-[#f9ebae] transition" title="Quote">&quot;</button>
                  <div className="h-4 w-px bg-zinc-800 mx-0.5" />
                  <button type="button" onClick={() => insertSnippet("- ", "", "List item")} className="px-2 py-1 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-[#f9ebae] hover:text-[#f9ebae] transition" title="Unordered List">• List</button>
                  <button type="button" onClick={() => insertSnippet("1. ", "", "Ordered item")} className="px-2 py-1 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-[#f9ebae] hover:text-[#f9ebae] transition" title="Ordered List">1. List</button>
                  <button type="button" onClick={() => insertSnippet("- [ ] ", "", "Task description")} className="px-2 py-1 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-[#f9ebae] hover:text-[#f9ebae] transition" title="Task List">☑ Task</button>
                  <div className="h-4 w-px bg-zinc-800 mx-0.5" />
                  <button type="button" onClick={() => insertSnippet("[", "](https://example.com)", "Link title")} className="px-2 py-1 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-[#f9ebae] hover:text-[#f9ebae] transition" title="Insert Link">🔗 Link</button>
                  <button type="button" onClick={() => insertSnippet("\n| Header 1 | Header 2 |\n| --- | --- |\n| Cell 1 | Cell 2 |\n", "", "")} className="px-2 py-1 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-[#f9ebae] hover:text-[#f9ebae] transition" title="Insert Table">📊 Table</button>
                  <button type="button" onClick={() => insertSnippet("\n---\n", "", "")} className="px-2 py-1 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-[#f9ebae] hover:text-[#f9ebae] transition" title="Horizontal Divider">― Divider</button>
               </div>
            )}
         </div>

         {/* Sync Banner Status */}
         {collabMessage && (
            <div className="bg-[#f9ebae]/10 border-b border-[#f9ebae]/20 px-4 py-1.5 text-xs text-[#f9ebae] font-semibold flex items-center justify-between shrink-0">
               <span>⚡ {collabMessage}</span>
               <button onClick={() => setCollabMessage(null)} className="text-zinc-400 hover:text-white">✕</button>
            </div>
         )}

         {/* Main Editor Canvas Body */}
         <div className="flex-1 min-h-0 p-4 sm:p-6 overflow-hidden">
            {viewMode === "split" ? (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                  <textarea
                     ref={textareaRef}
                     className="w-full h-full resize-none rounded-2xl border border-zinc-800 bg-zinc-950 p-5 font-mono text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-[#f9ebae] leading-relaxed shadow-2xl"
                     value={content}
                     onChange={(e) => setContent(e.target.value)}
                     placeholder="Type markdown content here..."
                  />
                  <div className="w-full h-full overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5 leading-relaxed shadow-2xl saas-grid-bg">
                     <div dangerouslySetInnerHTML={{ __html: renderMarkdownToHtml(content) }} />
                  </div>
               </div>
            ) : viewMode === "preview" ? (
               <div className="w-full h-full overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950/90 p-6 leading-relaxed max-w-4xl mx-auto shadow-2xl saas-grid-bg">
                  <div dangerouslySetInnerHTML={{ __html: renderMarkdownToHtml(content) }} />
               </div>
            ) : (
               <textarea
                  ref={textareaRef}
                  className="w-full h-full resize-none rounded-2xl border border-zinc-800 bg-zinc-950 p-6 font-mono text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-[#f9ebae] leading-relaxed shadow-2xl max-w-5xl mx-auto"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Type your document content here..."
               />
            )}
         </div>
      </div>
   );
}
