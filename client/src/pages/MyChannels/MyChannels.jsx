import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
   HiPlus,
   HiTrash,
   HiLockClosed,
   HiGlobeAlt,
   HiArrowRight,
   HiSearch,
   HiChatAlt2,
   HiUsers,
} from "react-icons/hi";
import { getChannels, deleteChannel } from "../../services/chatService";
import { PageShell } from "../../components/common/PageShell";

export default function MyChannels() {
   const navigate = useNavigate();

   const [channels, setChannels] = useState([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState(null);

   const [activeTab, setActiveTab] = useState("all");
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
      if (!window.confirm("Are you sure you want to delete this channel? All messages will be permanently removed.")) return;
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
         <div className="flex flex-col items-center justify-center py-28 text-sm text-neutral-400 gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent" />
            <span>Loading channel directory...</span>
         </div>
      );
   }

   return (
      <PageShell
         title="Channel Directory"
         subtitle="Browse, filter, search, and manage all workspace channels."
         actions={
            <button
               onClick={() => navigate("/chat")}
               className="btn-white px-5 py-2.5 text-xs font-bold flex items-center gap-2 shadow-md"
            >
               <HiPlus size={16} />
               <span>New Channel</span>
            </button>
         }
      >
         {error && (
            <div className="p-4 bg-[#141416] border border-white/30 rounded-xl flex items-center justify-between text-xs text-white">
               <span>{error}</span>
               <button onClick={() => setError(null)} className="text-neutral-400 hover:text-white">✕</button>
            </div>
         )}

         {/* Big Overview Metric Cards */}
         <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6">
            <div className="big-card p-6 flex flex-col justify-between gap-4">
               <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider font-mono">Total Rooms</span>
                  <div className="p-2 rounded-xl bg-white text-black">
                     <HiChatAlt2 size={18} />
                  </div>
               </div>
               <div className="text-3xl sm:text-4xl font-black text-white tracking-tight font-mono">{stats.total}</div>
               <p className="text-xs text-neutral-400">Total discussion channels in this workspace</p>
            </div>

            <div className="big-card p-6 flex flex-col justify-between gap-4">
               <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider font-mono">Public Channels</span>
                  <div className="p-2 rounded-xl bg-white text-black">
                     <HiGlobeAlt size={18} />
                  </div>
               </div>
               <div className="text-3xl sm:text-4xl font-black text-white tracking-tight font-mono">{stats.publicChannels}</div>
               <p className="text-xs text-neutral-400">Open for all team members to join</p>
            </div>

            <div className="big-card p-6 flex flex-col justify-between gap-4">
               <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider font-mono">Private Channels</span>
                  <div className="p-2 rounded-xl bg-white text-black">
                     <HiLockClosed size={18} />
                  </div>
               </div>
               <div className="text-3xl sm:text-4xl font-black text-white tracking-tight font-mono">{stats.privateChannels}</div>
               <p className="text-xs text-neutral-400">Restricted to designated members only</p>
            </div>
         </div>

         {/* Filter Tabs & Search Bar */}
         <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-1.5 bg-[#09090b] p-1.5 rounded-xl border border-white/15 w-full sm:w-auto">
               {[
                  { key: "all", label: `All (${channels.length})` },
                  { key: "public", label: `Public (${stats.publicChannels})` },
                  { key: "private", label: `Private (${stats.privateChannels})` },
               ].map((tab) => (
                  <button
                     key={tab.key}
                     type="button"
                     onClick={() => setActiveTab(tab.key)}
                     className={`px-4 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                        activeTab === tab.key
                           ? "bg-white text-black shadow-sm"
                           : "text-neutral-400 hover:text-white"
                     }`}
                  >
                     {tab.label}
                  </button>
               ))}
            </div>

            <div className="relative w-full sm:w-80">
               <HiSearch className="absolute left-3.5 top-3.5 text-neutral-400" size={16} />
               <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search channels..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/15 bg-[#09090b] text-xs sm:text-sm text-white placeholder:text-neutral-500 outline-none focus:border-white transition"
               />
            </div>
         </div>

         {/* Big Channel Cards Grid */}
         {filteredChannels.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
               {filteredChannels.map((item) => {
                  const isPrivate = item.type === "private";
                  return (
                     <div
                        key={item._id}
                        className="big-card-interactive p-6 flex flex-col justify-between gap-5 relative group"
                     >
                        <div className="space-y-4">
                           {/* Header Badge */}
                           <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                 <div className="h-8 w-8 rounded-xl flex items-center justify-center bg-white text-black font-bold shadow-sm">
                                    {isPrivate ? <HiLockClosed size={15} /> : <HiGlobeAlt size={15} />}
                                 </div>
                                 <span className="badge-bw px-2.5 py-0.5 text-[10px] font-mono uppercase">
                                    {isPrivate ? "Private" : "Public"}
                                 </span>
                              </div>

                              <span className="text-xs font-mono text-neutral-400 flex items-center gap-1.5">
                                 <HiUsers size={14} className="text-neutral-500" />
                                 <span>{item.members?.length || 1} members</span>
                              </span>
                           </div>

                           {/* Title & Description */}
                           <div>
                              <h3 className="font-bold text-base sm:text-lg text-white group-hover:text-white transition truncate">
                                 #{item.name}
                              </h3>
                              <p className="text-xs sm:text-sm text-neutral-400 mt-1.5 line-clamp-2 leading-relaxed">
                                 {item.topic || (isPrivate ? "Restricted private team discussion channel." : "Open workspace discussion channel.")}
                              </p>
                           </div>

                           <div className="text-[11px] font-mono text-neutral-500">
                              Created {formatDate(item.createdAt)}
                           </div>
                        </div>

                        {/* Action Bar */}
                        <div className="flex gap-2.5 pt-4 border-t border-white/10">
                           <button
                              type="button"
                              onClick={() => navigate(`/chat?channel=${item._id}`)}
                              className="btn-white flex-1 py-2.5 px-4 text-xs font-bold flex items-center justify-center gap-2"
                           >
                              <span>Open Channel</span>
                              <HiArrowRight size={14} />
                           </button>

                           <button
                              type="button"
                              onClick={() => handleDeleteChannelItem(item._id)}
                              className="p-2.5 border border-white/15 bg-black hover:border-white/40 hover:bg-white/10 text-neutral-400 hover:text-white rounded-xl transition"
                              title="Delete channel"
                           >
                              <HiTrash size={16} />
                           </button>
                        </div>
                     </div>
                  );
               })}
            </div>
         ) : (
            <div className="big-card text-center py-24 p-8 space-y-3">
               <HiChatAlt2 className="mx-auto text-neutral-600" size={48} />
               <h3 className="text-lg font-bold text-white">No channels found</h3>
               <p className="text-xs sm:text-sm text-neutral-400 max-w-sm mx-auto">
                  Create a new discussion channel to get conversations started.
               </p>
            </div>
         )}
      </PageShell>
   );
}
