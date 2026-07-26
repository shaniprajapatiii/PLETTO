import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
   HiPlus,
   HiTrash,
   HiUsers,
   HiDocumentText,
   HiExclamationCircle,
   HiHashtag,
   HiLockClosed,
   HiGlobeAlt,
   HiOutlinePresentationChartBar,
   HiArrowsExpand,
   HiExternalLink,
   HiSearch,
   HiShieldCheck,
} from "react-icons/hi";
import { getChannels, deleteChannel } from "../../services/chatService";
import { getDocs, deleteDoc } from "../../services/docsService";
import { getBoards, deleteBoard } from "../../services/whiteboardService";
import { useAuth } from "../../context/AuthContext";
import { PageShell } from "../../components/common/PageShell";

export default function MyChannels() {
   const { user } = useAuth();
   const navigate = useNavigate();

   const [channels, setChannels] = useState([]);
   const [docs, setDocs] = useState([]);
   const [whiteboards, setWhiteboards] = useState([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState(null);

   const [activeTab, setActiveTab] = useState("all"); // 'all', 'channels', 'docs', 'whiteboards'
   const [searchQuery, setSearchQuery] = useState("");

   const loadAllData = async () => {
      try {
         setLoading(true);
         const [channelsRes, docsRes, boardsRes] = await Promise.all([
            getChannels({ type: "channel" }),
            getDocs(),
            getBoards(),
         ]);

         setChannels((channelsRes.data.channels || []).filter((c) => c.type !== "dm"));
         setDocs(docsRes.data.documents || []);
         setWhiteboards(boardsRes.data.whiteboards || []);
         setError(null);
      } catch (err) {
         setError(err.response?.data?.message || "Failed to load workspace resources");
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      loadAllData();
   }, []);

   // Asset deletion handlers
   const handleDeleteChannelItem = async (channelId) => {
      if (!window.confirm("Are you sure you want to delete this channel? All messages will be removed.")) return;
      try {
         await deleteChannel(channelId);
         setChannels((prev) => prev.filter((c) => c._id !== channelId));
      } catch (err) {
         setError(err.response?.data?.message || "Only the channel creator can delete this channel.");
      }
   };

   const handleDeleteDocItem = async (docId) => {
      if (!window.confirm("Are you sure you want to delete this document?")) return;
      try {
         await deleteDoc(docId);
         setDocs((prev) => prev.filter((d) => d._id !== docId));
      } catch (err) {
         setError(err.response?.data?.message || "Failed to delete document.");
      }
   };

   const handleDeleteBoardItem = async (boardId) => {
      if (!window.confirm("Are you sure you want to delete this whiteboard?")) return;
      try {
         await deleteBoard(boardId);
         setWhiteboards((prev) => prev.filter((b) => b._id !== boardId));
      } catch (err) {
         setError(err.response?.data?.message || "Failed to delete whiteboard.");
      }
   };

   // Format date helper
   const formatDate = (dateString) => {
      if (!dateString) return "N/A";
      return new Date(dateString).toLocaleDateString("en-US", {
         year: "numeric",
         month: "short",
         day: "numeric",
      });
   };

   // Unified items list
   const unifiedAssets = useMemo(() => {
      const channelItems = channels.filter((c) => c.type !== "dm").map((c) => ({
         id: c._id,
         type: "channel",
         subType: c.type, // 'public', 'private'
         title: c.name,
         description: c.topic || (c.type === "private" ? "Private Workspace Room" : "Public Workspace Channel"),
         updatedAt: c.updatedAt || c.createdAt,
         meta: `${c.members?.length || 0} members`,
         openUrl: `/chat?channel=${c._id}`,
         onDelete: () => handleDeleteChannelItem(c._id),
      }));

      const docItems = docs.map((d) => ({
         id: d._id,
         type: "doc",
         subType: d.type || "text",
         title: d.title || "Untitled Document",
         description: d.content ? d.content.substring(0, 80) + "..." : "Empty document note.",
         updatedAt: d.updatedAt || d.createdAt,
         meta: `${d.content ? d.content.trim().split(/\s+/).length : 0} words`,
         openUrl: `/docs?doc=${d._id}&fullscreen=true`,
         onDelete: () => handleDeleteDocItem(d._id),
      }));

      const boardItems = whiteboards.map((b) => ({
         id: b._id,
         type: "whiteboard",
         subType: "canvas",
         title: b.name || "Untitled Whiteboard",
         description: "Interactive visual collaboration canvas.",
         updatedAt: b.updatedAt || b.createdAt,
         meta: `${b.data?.strokes?.length || 0} strokes`,
         openUrl: `/whiteboard?board=${b._id}&fullscreen=true`,
         onDelete: () => handleDeleteBoardItem(b._id),
      }));

      let combined = [];
      if (activeTab === "all") combined = [...channelItems, ...docItems, ...boardItems];
      else if (activeTab === "channels") combined = channelItems;
      else if (activeTab === "docs") combined = docItems;
      else if (activeTab === "whiteboards") combined = boardItems;

      if (!searchQuery.trim()) return combined;
      const q = searchQuery.toLowerCase();
      return combined.filter(
         (item) => item.title?.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q)
      );
   }, [channels, docs, whiteboards, activeTab, searchQuery]);

   const stats = useMemo(() => {
      const publicCount = channels.filter((c) => c.type === "public").length;
      const privateCount = channels.filter((c) => c.type === "private").length;
      return {
         publicChannels: publicCount,
         privateChannels: privateCount,
         docsCount: docs.length,
         boardsCount: whiteboards.length,
      };
   }, [channels, docs, whiteboards]);

   if (loading) {
      return (
         <div className="flex items-center justify-center py-20 text-xs text-zinc-400">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#f9ebae] border-t-transparent mr-3" />
            Loading Workspace Admin Panel...
         </div>
      );
   }

   return (
      <PageShell
         title="Workspace Control Center"
         subtitle="Manage, monitor, and launch all public/private channels, documents, and whiteboards in full screen."
         actions={
            <div className="flex gap-2">
               <button
                  onClick={() => navigate("/chat")}
                  className="flex items-center gap-1.5 px-3 py-2 bg-[#f9ebae] hover:bg-[#e6d695] text-zinc-950 text-xs font-bold rounded-lg shadow-md transition"
               >
                  <HiPlus size={14} />
                  <span>New Channel</span>
               </button>
               <button
                  onClick={() => navigate("/docs")}
                  className="flex items-center gap-1.5 px-3 py-2 border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-semibold rounded-lg transition"
               >
                  <HiPlus size={14} />
                  <span>New Doc</span>
               </button>
               <button
                  onClick={() => navigate("/whiteboard")}
                  className="flex items-center gap-1.5 px-3 py-2 border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-semibold rounded-lg transition"
               >
                  <HiPlus size={14} />
                  <span>New Board</span>
               </button>
            </div>
         }
      >
         {error && (
            <div className="p-3 mb-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-xs text-red-300">
               <HiExclamationCircle className="text-red-400 shrink-0" size={18} />
               <p>{error}</p>
            </div>
         )}

         {/* Workspace Metrics Overview Cards */}
         <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 space-y-1">
               <div className="flex items-center justify-between text-emerald-400">
                  <HiGlobeAlt size={20} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Public Rooms</span>
               </div>
               <div className="text-2xl font-extrabold text-white">{stats.publicChannels}</div>
               <p className="text-[10px] text-zinc-400">Open to workspace</p>
            </div>

            <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 space-y-1">
               <div className="flex items-center justify-between text-amber-400">
                  <HiLockClosed size={20} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Private Groups</span>
               </div>
               <div className="text-2xl font-extrabold text-white">{stats.privateChannels}</div>
               <p className="text-[10px] text-zinc-400">Allowed members only</p>
            </div>

            <div className="p-4 rounded-2xl border border-indigo-500/30 bg-indigo-500/5 space-y-1">
               <div className="flex items-center justify-between text-indigo-400">
                  <HiDocumentText size={20} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Documents</span>
               </div>
               <div className="text-2xl font-extrabold text-white">{stats.docsCount}</div>
               <p className="text-[10px] text-zinc-400">Notes & specs</p>
            </div>

            <div className="p-4 rounded-2xl border border-purple-500/30 bg-purple-500/5 space-y-1">
               <div className="flex items-center justify-between text-purple-400">
                  <HiOutlinePresentationChartBar size={20} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Whiteboards</span>
               </div>
               <div className="text-2xl font-extrabold text-white">{stats.boardsCount}</div>
               <p className="text-[10px] text-zinc-400">Visual canvases</p>
            </div>
         </div>

         {/* Filter Tabs & Search Control */}
         <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-1.5 bg-zinc-950 p-1.5 rounded-xl border border-zinc-800/80 w-full sm:w-auto overflow-x-auto text-xs font-bold">
               {[
                  { key: "all", label: `All Assets (${channels.length + docs.length + whiteboards.length})` },
                  { key: "channels", label: `Channels (${channels.length})` },
                  { key: "docs", label: `Docs (${docs.length})` },
                  { key: "whiteboards", label: `Whiteboards (${whiteboards.length})` },
               ].map((tab) => (
                  <button
                     key={tab.key}
                     type="button"
                     onClick={() => setActiveTab(tab.key)}
                     className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                        activeTab === tab.key
                           ? "bg-[#f9ebae] text-zinc-950 font-extrabold shadow"
                           : "text-zinc-400 hover:text-white"
                     }`}
                  >
                     {tab.label}
                  </button>
               ))}
            </div>

            <div className="relative w-full sm:w-72">
               <HiSearch className="absolute left-3.5 top-2.5 text-zinc-500" size={14} />
               <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search workspace assets..."
                  className="w-full pl-9 pr-4 py-1.5 rounded-xl border border-zinc-800 bg-zinc-950 text-xs text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-[#f9ebae] transition"
               />
            </div>
         </div>

         {/* Unified Asset Cards Grid */}
         {unifiedAssets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {unifiedAssets.map((item) => (
                  <div
                     key={`${item.type}-${item.id}`}
                     className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-950/70 hover:border-zinc-700 hover:bg-zinc-900/60 transition flex flex-col justify-between space-y-4 shadow-xl"
                  >
                     <div>
                        {/* Header Badge */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                           <div className="flex items-center gap-2">
                              <div
                                 className={`h-9 w-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
                                    item.type === "channel"
                                       ? item.subType === "private"
                                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                                          : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                       : item.type === "doc"
                                       ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/30"
                                       : "bg-purple-500/10 text-purple-400 border border-purple-500/30"
                                 }`}
                              >
                                 {item.type === "channel" ? (
                                    item.subType === "private" ? <HiLockClosed size={16} /> : <HiGlobeAlt size={16} />
                                 ) : item.type === "doc" ? (
                                    <HiDocumentText size={16} />
                                 ) : (
                                    <HiOutlinePresentationChartBar size={16} />
                                 )}
                              </div>

                              <div>
                                 <span
                                    className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                                       item.type === "channel"
                                          ? item.subType === "private"
                                             ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                                             : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                          : item.type === "doc"
                                          ? "bg-indigo-500/10 text-indigo-300 border-indigo-500/30"
                                          : "bg-purple-500/10 text-purple-300 border-purple-500/30"
                                    }`}
                                 >
                                    {item.type === "channel"
                                       ? item.subType === "private"
                                          ? "Private Group"
                                          : "Public Room"
                                       : item.type === "doc"
                                       ? "Document"
                                       : "Whiteboard"}
                                 </span>
                                 <p className="text-[10px] text-zinc-500 mt-0.5">Updated {formatDate(item.updatedAt)}</p>
                              </div>
                           </div>

                           <span className="text-[10px] font-semibold text-zinc-400 bg-zinc-900 px-2 py-1 rounded-lg border border-zinc-800">
                              {item.meta}
                           </span>
                        </div>

                        {/* Title & Description */}
                        <h3 className="font-bold text-sm text-zinc-100 truncate">{item.title}</h3>
                        <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                           {item.description}
                        </p>
                     </div>

                     {/* Action Bar */}
                     <div className="flex gap-2 pt-3 border-t border-zinc-800/80">
                        <button
                           type="button"
                           onClick={() => navigate(item.openUrl)}
                           className="flex-1 py-2 px-3 bg-[#f9ebae] hover:bg-[#e6d695] text-zinc-950 rounded-xl transition text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-[#f9ebae]/10"
                        >
                           <HiArrowsExpand size={14} />
                           <span>Open Full Screen</span>
                        </button>

                        <button
                           type="button"
                           onClick={item.onDelete}
                           className="p-2 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 rounded-xl transition"
                           title="Delete asset"
                        >
                           <HiTrash size={14} />
                        </button>
                     </div>
                  </div>
               ))}
            </div>
         ) : (
            <div className="text-center py-16 rounded-2xl border border-zinc-800/80 bg-zinc-950/40 p-6 space-y-3">
               <HiShieldCheck className="mx-auto text-zinc-600" size={44} />
               <h3 className="text-base font-bold text-zinc-200">No assets found</h3>
               <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  Create public or private channels, knowledge documents, or whiteboards to populate your workspace control panel.
               </p>
            </div>
         )}
      </PageShell>
   );
}
