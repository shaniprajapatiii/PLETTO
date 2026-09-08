import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
   HiPlus,
   HiTrash,
   HiExclamationCircle,
   HiLockClosed,
   HiGlobeAlt,
   HiArrowsExpand,
   HiSearch,
   HiChatAlt2,
} from "react-icons/hi";
import { getChannels, deleteChannel } from "../../services/chatService";
import { PageShell } from "../../components/common/PageShell";

export default function MyChannels() {
   const navigate = useNavigate();

   const [channels, setChannels] = useState([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState(null);

   const [activeTab, setActiveTab] = useState("all"); // 'all', 'public', 'private'
   const [searchQuery, setSearchQuery] = useState("");

   const loadChannels = async () => {
      try {
         setLoading(true);
         const channelsRes = await getChannels({ type: "channel" });
         setChannels((channelsRes.data.channels || []).filter((c) => c.type !== "dm"));
         setError(null);
      } catch (err) {
         setError(err.response?.data?.message || "Failed to load workspace channels");
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      loadChannels();
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

   const formatDate = (dateString) => {
      if (!dateString) return "N/A";
      return new Date(dateString).toLocaleDateString("en-US", {
         year: "numeric",
         month: "short",
         day: "numeric",
      });
   };

   const stats = useMemo(() => {
      const publicCount = channels.filter((c) => c.type === "public").length;
      const privateCount = channels.filter((c) => c.type === "private").length;
      return {
         total: channels.length,
         publicChannels: publicCount,
         privateChannels: privateCount,
      };
   }, [channels]);

   const filteredChannels = useMemo(() => {
      let list = channels;
      if (activeTab === "public") list = list.filter((c) => c.type === "public");
      else if (activeTab === "private") list = list.filter((c) => c.type === "private");

      if (!searchQuery.trim()) return list;
      const q = searchQuery.toLowerCase();
      return list.filter(
         (item) => item.name?.toLowerCase().includes(q) || item.topic?.toLowerCase().includes(q)
      );
   }, [channels, activeTab, searchQuery]);

   if (loading) {
      return (
         <div className="flex items-center justify-center py-20 text-xs text-zinc-400">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-zinc-400 border-t-transparent mr-2.5" />
            Loading channel directory...
         </div>
      );
   }

   return (
      <PageShell
         title="Channel Directory"
         subtitle="Browse, filter, and manage workspace discussion channels."
         actions={
            <button
               onClick={() => navigate("/chat")}
               className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold rounded-lg transition"
            >
               <HiPlus size={14} />
               <span>New Channel</span>
            </button>
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
                  <span className="text-[11px] font-medium text-zinc-400">Total Channels</span>
                  <HiChatAlt2 size={16} className="text-zinc-500" />
               </div>
               <div className="text-xl font-bold text-zinc-100 tracking-tight">{stats.total}</div>
            </div>

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
         </div>

         {/* Filter Tabs & Search */}
         <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-1 bg-zinc-900/80 p-1 rounded-lg border border-zinc-800 w-full sm:w-auto overflow-x-auto text-xs font-medium">
               {[
                  { key: "all", label: `All (${channels.length})` },
                  { key: "public", label: `Public (${stats.publicChannels})` },
                  { key: "private", label: `Private (${stats.privateChannels})` },
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
                  placeholder="Search channels..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-xs text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-zinc-600 transition"
               />
            </div>
         </div>

         {/* Channels Grid */}
         {filteredChannels.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
               {filteredChannels.map((item) => (
                  <div
                     key={item._id}
                     className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/60 hover:border-zinc-700 hover:bg-zinc-900/90 transition flex flex-col justify-between space-y-3.5 backdrop-blur-sm"
                  >
                     <div>
                        {/* Header Badge */}
                        <div className="flex items-center justify-between gap-2 mb-2.5">
                           <div className="flex items-center gap-2 min-w-0">
                              <div className="h-7 w-7 rounded-md flex items-center justify-center text-xs bg-zinc-800 border border-zinc-700/60 text-zinc-300 shrink-0">
                                 {item.type === "private" ? <HiLockClosed size={13} /> : <HiGlobeAlt size={13} />}
                              </div>

                              <span className="px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider bg-zinc-800/80 border border-zinc-700/50 text-zinc-300">
                                 {item.type === "private" ? "Private" : "Public"}
                              </span>
                           </div>

                           <span className="text-[11px] text-zinc-500">
                              {item.members?.length || 0} members
                           </span>
                        </div>

                        {/* Title & Description */}
                        <h3 className="font-semibold text-xs text-zinc-200 truncate">#{item.name}</h3>
                        <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                           {item.topic || (item.type === "private" ? "Private team channel" : "General workspace channel")}
                        </p>
                        <p className="text-[10px] text-zinc-500 mt-2">Updated {formatDate(item.updatedAt || item.createdAt)}</p>
                     </div>

                     {/* Action Bar */}
                     <div className="flex gap-2 pt-2.5 border-t border-zinc-800/80">
                        <button
                           type="button"
                           onClick={() => navigate(`/chat?channel=${item._id}`)}
                           className="flex-1 py-1.5 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg transition text-xs font-medium flex items-center justify-center gap-1.5 border border-zinc-700/60"
                        >
                           <HiArrowsExpand size={13} />
                           <span>Open</span>
                        </button>

                        <button
                           type="button"
                           onClick={() => handleDeleteChannelItem(item._id)}
                           className="p-1.5 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 rounded-lg transition"
                           title="Delete channel"
                        >
                           <HiTrash size={14} />
                        </button>
                     </div>
                  </div>
               ))}
            </div>
         ) : (
            <div className="text-center py-16 rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-6 space-y-2">
               <HiChatAlt2 className="mx-auto text-zinc-600" size={36} />
               <h3 className="text-sm font-semibold text-zinc-200">No channels found</h3>
               <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  Create a new public or private channel to start collaborating with your team.
               </p>
            </div>
         )}
      </PageShell>
   );
}
