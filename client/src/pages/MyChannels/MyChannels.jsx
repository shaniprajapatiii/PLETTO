import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
   HiPlus,
   HiTrash,
   HiDocumentText,
   HiExclamationCircle,
   HiLockClosed,
   HiGlobeAlt,
   HiArrowsExpand,
   HiSearch,
   HiShieldCheck,
} from "react-icons/hi";
import { getChannels, deleteChannel } from "../../services/chatService";
import { getDocs, deleteDoc } from "../../services/docsService";
import { useAuth } from "../../context/AuthContext";
import { PageShell } from "../../components/common/PageShell";

export default function MyChannels() {
   const { user } = useAuth();
   const navigate = useNavigate();

   const [channels, setChannels] = useState([]);
   const [docs, setDocs] = useState([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState(null);

   const [activeTab, setActiveTab] = useState("all"); // 'all', 'channels', 'docs'
   const [searchQuery, setSearchQuery] = useState("");

   const loadAllData = async () => {
      try {
         setLoading(true);
         const [channelsRes, docsRes] = await Promise.all([
            getChannels({ type: "channel" }),
            getDocs(),
         ]);

         setChannels((channelsRes.data.channels || []).filter((c) => c.type !== "dm"));
         setDocs(docsRes.data.documents || []);
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

   const formatDate = (dateString) => {
      if (!dateString) return "N/A";
      return new Date(dateString).toLocaleDateString("en-US", {
         year: "numeric",
         month: "short",
         day: "numeric",
      });
   };

   const unifiedAssets = useMemo(() => {
      const channelItems = channels.filter((c) => c.type !== "dm").map((c) => ({
         id: c._id,
         type: "channel",
         subType: c.type,
         title: c.name,
         description: c.topic || (c.type === "private" ? "Private channel" : "Public channel"),
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
         description: d.content ? d.content.substring(0, 80) + "..." : "Empty document.",
         updatedAt: d.updatedAt || d.createdAt,
         meta: `${d.content ? d.content.trim().split(/\s+/).length : 0} words`,
         openUrl: `/docs?doc=${d._id}&fullscreen=true`,
         onDelete: () => handleDeleteDocItem(d._id),
      }));

      let combined = [];
      if (activeTab === "all") combined = [...channelItems, ...docItems];
      else if (activeTab === "channels") combined = channelItems;
      else if (activeTab === "docs") combined = docItems;

      if (!searchQuery.trim()) return combined;
      const q = searchQuery.toLowerCase();
      return combined.filter(
         (item) => item.title?.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q)
      );
   }, [channels, docs, activeTab, searchQuery]);

   const stats = useMemo(() => {
      const publicCount = channels.filter((c) => c.type === "public").length;
      const privateCount = channels.filter((c) => c.type === "private").length;
      return {
         publicChannels: publicCount,
         privateChannels: privateCount,
         docsCount: docs.length,
      };
   }, [channels, docs]);

   if (loading) {
      return (
         <div className="flex items-center justify-center py-20 text-xs text-zinc-400">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-zinc-400 border-t-transparent mr-2.5" />
            Loading directory...
         </div>
      );
   }

   return (
      <PageShell
         title="Directory"
         subtitle="Manage and browse workspace channels and documents."
         actions={
            <div className="flex gap-2">
               <button
                  onClick={() => navigate("/chat")}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold rounded-lg transition"
               >
                  <HiPlus size={14} />
                  <span>New Channel</span>
               </button>
               <button
                  onClick={() => navigate("/docs")}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-medium rounded-lg transition"
               >
                  <HiPlus size={14} />
                  <span>New Document</span>
               </button>
            </div>
         }
      >
         {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2.5 text-xs text-red-300">
               <HiExclamationCircle className="text-red-400 shrink-0" size={16} />
               <p>{error}</p>
            </div>
         )}

         {/* Metrics Overview Cards */}
         <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="p-3.5 rounded-xl border border-zinc-800/80 bg-zinc-900/60 backdrop-blur-sm space-y-1">
               <div className="flex items-center justify-between text-zinc-400">
                  <span className="text-[11px] font-medium text-zinc-400">Public Channels</span>
                  <HiGlobeAlt size={16} className="text-zinc-500" />
               </div>
               <div className="text-xl font-bold text-zinc-100 tracking-tight">{stats.publicChannels}</div>
            </div>

            <div className="p-3.5 rounded-xl border border-zinc-800/80 bg-zinc-900/60 backdrop-blur-sm space-y-1">
               <div className="flex items-center justify-between text-zinc-400">
                  <span className="text-[11px] font-medium text-zinc-400">Private Channels</span>
                  <HiLockClosed size={16} className="text-zinc-500" />
               </div>
               <div className="text-xl font-bold text-zinc-100 tracking-tight">{stats.privateChannels}</div>
            </div>

            <div className="p-3.5 rounded-xl border border-zinc-800/80 bg-zinc-900/60 backdrop-blur-sm space-y-1">
               <div className="flex items-center justify-between text-zinc-400">
                  <span className="text-[11px] font-medium text-zinc-400">Documents</span>
                  <HiDocumentText size={16} className="text-zinc-500" />
               </div>
               <div className="text-xl font-bold text-zinc-100 tracking-tight">{stats.docsCount}</div>
            </div>
         </div>

         {/* Filter Tabs & Search */}
         <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-1 bg-zinc-900/80 p-1 rounded-lg border border-zinc-800 w-full sm:w-auto overflow-x-auto text-xs font-medium">
               {[
                  { key: "all", label: `All (${channels.length + docs.length})` },
                  { key: "channels", label: `Channels (${channels.length})` },
                  { key: "docs", label: `Documents (${docs.length})` },
               ].map((tab) => (
                  <button
                     key={tab.key}
                     type="button"
                     onClick={() => setActiveTab(tab.key)}
                     className={`px-3 py-1 rounded-md transition whitespace-nowrap ${
                        activeTab === tab.key
                           ? "bg-zinc-800 text-white font-medium shadow-sm"
                           : "text-zinc-400 hover:text-zinc-200"
                     }`}
                  >
                     {tab.label}
                  </button>
               ))}
            </div>

            <div className="relative w-full sm:w-64">
               <HiSearch className="absolute left-3 top-2.5 text-zinc-500" size={14} />
               <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search assets..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-xs text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-zinc-600 transition"
               />
            </div>
         </div>

         {/* Unified Asset Cards Grid */}
         {unifiedAssets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
               {unifiedAssets.map((item) => (
                  <div
                     key={`${item.type}-${item.id}`}
                     className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/60 hover:border-zinc-700 hover:bg-zinc-900/90 transition flex flex-col justify-between space-y-3.5 backdrop-blur-sm"
                  >
                     <div>
                        {/* Header Badge */}
                        <div className="flex items-center justify-between gap-2 mb-2.5">
                           <div className="flex items-center gap-2 min-w-0">
                              <div className="h-7 w-7 rounded-md flex items-center justify-center text-xs bg-zinc-800 border border-zinc-700/60 text-zinc-300 shrink-0">
                                 {item.type === "channel" ? (
                                    item.subType === "private" ? <HiLockClosed size={13} /> : <HiGlobeAlt size={13} />
                                 ) : (
                                    <HiDocumentText size={13} />
                                 )}
                              </div>

                              <span className="px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider bg-zinc-800/80 border border-zinc-700/50 text-zinc-300">
                                 {item.type === "channel" ? (item.subType === "private" ? "Private" : "Public") : "Doc"}
                              </span>
                           </div>

                           <span className="text-[11px] text-zinc-500">
                              {item.meta}
                           </span>
                        </div>

                        {/* Title & Description */}
                        <h3 className="font-semibold text-xs text-zinc-200 truncate">{item.title}</h3>
                        <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                           {item.description}
                        </p>
                        <p className="text-[10px] text-zinc-500 mt-2">Updated {formatDate(item.updatedAt)}</p>
                     </div>

                     {/* Action Bar */}
                     <div className="flex gap-2 pt-2.5 border-t border-zinc-800/80">
                        <button
                           type="button"
                           onClick={() => navigate(item.openUrl)}
                           className="flex-1 py-1.5 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg transition text-xs font-medium flex items-center justify-center gap-1.5 border border-zinc-700/60"
                        >
                           <HiArrowsExpand size={13} />
                           <span>Open</span>
                        </button>

                        <button
                           type="button"
                           onClick={item.onDelete}
                           className="p-1.5 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 rounded-lg transition"
                           title="Delete asset"
                        >
                           <HiTrash size={14} />
                        </button>
                     </div>
                  </div>
               ))}
            </div>
         ) : (
            <div className="text-center py-16 rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-6 space-y-2">
               <HiShieldCheck className="mx-auto text-zinc-600" size={36} />
               <h3 className="text-sm font-semibold text-zinc-200">No assets found</h3>
               <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  Create channels or documents to populate your workspace directory.
               </p>
            </div>
         )}
      </PageShell>
   );
}
