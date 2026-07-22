import { useEffect, useState } from "react";
import {
   HiPlus,
   HiTrash,
   HiPencil,
   HiUsers,
   HiDocumentText,
   HiExclamationCircle,
   HiHashtag,
} from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import { getCreatedChannels, deleteChannel } from "../../services/chatService";
import { useAuth } from "../../context/AuthContext";
import { PageShell } from "../../components/common/PageShell";

export default function MyChannels() {
   const { user } = useAuth();
   const navigate = useNavigate();
   const [channels, setChannels] = useState([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState(null);
   const [selectedChannelId, setSelectedChannelId] = useState(null);

   const fetchChannels = async () => {
      try {
         setLoading(true);
         const res = await getCreatedChannels();
         setChannels(res.data.channels || []);
         setError(null);
      } catch (err) {
         setError(err.response?.data?.message || "Failed to load channels");
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      fetchChannels();
   }, []);

   const handleDeleteChannel = async (channelId) => {
      if (!window.confirm("Are you sure you want to delete this channel? This action cannot be undone.")) {
         return;
      }

      try {
         await deleteChannel(channelId);
         setChannels((current) => current.filter((ch) => ch._id !== channelId));
         setSelectedChannelId(null);
      } catch (err) {
         setError(err.response?.data?.message || "Failed to delete channel");
      }
   };

   const handleViewChannel = (channelId) => {
      navigate(`/chat?channel=${channelId}`);
   };

   const handleEditChannel = (channelId) => {
      navigate(`/chat?channel=${channelId}&edit=true`);
   };

   const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString("en-US", {
         year: "numeric",
         month: "short",
         day: "numeric",
      });
   };

   if (loading) {
      return (
         <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent" />
         </div>
      );
   }

   return (
      <PageShell
         title="Channel Directory"
         subtitle={`Manage the workspace communication rooms you created (${channels.length}).`}
         actions={
            <button
               onClick={() => navigate("/chat")}
               className="flex items-center gap-2 px-4 py-2 bg-[#f9ebae] hover:bg-[#e6d695] text-zinc-950 text-xs font-bold rounded-lg shadow-md shadow-[#f9ebae]/20 transition"
            >
               <HiPlus size={16} />
               <span>New Channel</span>
            </button>
         }
      >
         {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3 text-xs text-red-300">
               <HiExclamationCircle className="text-red-400 shrink-0" size={18} />
               <p>{error}</p>
            </div>
         )}

         {channels.length === 0 ? (
            <div className="text-center py-16 rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-6 space-y-3">
               <HiHashtag className="mx-auto text-zinc-600" size={40} />
               <h3 className="text-base font-bold text-zinc-200">No channels created yet</h3>
               <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  Start creating channels to collaborate with your team in structured rooms.
               </p>
               <button
                  onClick={() => navigate("/chat")}
                  className="px-4 py-2 bg-[#f9ebae] hover:bg-[#e6d695] text-zinc-950 text-xs font-bold rounded-lg shadow-md transition"
               >
                  Create Channel
               </button>
            </div>
         ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {channels.map((channel) => (
                  <div
                     key={channel._id}
                     onClick={() => setSelectedChannelId(channel._id)}
                     className={`p-5 rounded-xl border transition-all ${
                        selectedChannelId === channel._id
                           ? "border-[#f9ebae] bg-zinc-900"
                           : "border-zinc-800/80 bg-zinc-950/60 hover:border-zinc-700 hover:bg-zinc-900/60"
                     }`}
                  >
                     <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-[rgba(249,235,174,0.12)] border border-[rgba(249,235,174,0.3)] flex items-center justify-center text-[#f9ebae] font-bold text-sm shrink-0">
                           #
                        </div>
                        <div className="min-w-0 flex-1">
                           <h3 className="font-bold text-sm text-zinc-100 truncate">
                              {channel.name}
                           </h3>
                           <p className="text-[10px] text-zinc-400">
                              Created {formatDate(channel.createdAt)}
                           </p>
                        </div>
                     </div>

                     {channel.description && (
                        <p className="text-xs text-zinc-400 mb-4 line-clamp-2 leading-relaxed">
                           {channel.description}
                        </p>
                     )}

                     <div className="grid grid-cols-2 gap-2 mb-4">
                        <div className="bg-zinc-900/80 border border-zinc-800 p-2 rounded-lg">
                           <div className="flex items-center gap-1.5 text-zinc-400 text-xs">
                              <HiUsers size={14} />
                              <span className="font-semibold text-zinc-200">{channel.members?.length || 0}</span>
                           </div>
                           <p className="text-[10px] text-zinc-400 mt-0.5">Members</p>
                        </div>
                        <div className="bg-zinc-900/80 border border-zinc-800 p-2 rounded-lg">
                           <div className="flex items-center gap-1.5 text-zinc-400 text-xs">
                              <HiDocumentText size={14} />
                              <span className="font-semibold text-zinc-200">{channel.messageCount || 0}</span>
                           </div>
                           <p className="text-[10px] text-zinc-400 mt-0.5">Messages</p>
                        </div>
                     </div>

                     <div className="flex gap-2 pt-3 border-t border-zinc-800/80">
                        <button
                           onClick={() => handleViewChannel(channel._id)}
                           className="flex-1 py-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition text-xs font-semibold"
                        >
                           Open Channel
                        </button>
                        <button
                           onClick={() => handleEditChannel(channel._id)}
                           className="p-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 rounded-lg transition"
                           title="Edit channel"
                        >
                           <HiPencil size={14} />
                        </button>
                        <button
                           onClick={() => handleDeleteChannel(channel._id)}
                           className="p-2 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 rounded-lg transition"
                           title="Delete channel"
                        >
                           <HiTrash size={14} />
                        </button>
                     </div>
                  </div>
               ))}
            </div>
         )}
      </PageShell>
   );
}

