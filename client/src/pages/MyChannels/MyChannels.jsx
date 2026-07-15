import { useEffect, useState } from "react";
import {
   HiPlus,
   HiTrash,
   HiPencil,
   HiUsers,
   HiDocumentText,
   HiExclamationCircle,
} from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import { getCreatedChannels, deleteChannel } from "../../services/chatService";
import { useAuth } from "../../context/AuthContext";

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
         <div className="flex items-center justify-center h-screen bg-slate-900">
            <div className="text-center">
               <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
               <p className="text-slate-400">Loading your channels...</p>
            </div>
         </div>
      );
   }

   return (
      <div className="bg-slate-900 min-h-screen text-slate-100 p-4 md:p-8">
         <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
               <div>
                  <h1 className="text-3xl font-bold mb-2">My Channels</h1>
                  <p className="text-slate-400">
                     Manage channels you created ({channels.length})
                  </p>
               </div>
               <button
                  onClick={() => navigate("/chat")}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
               >
                  <HiPlus size={20} />
                  New Channel
               </button>
            </div>

            {/* Error Message */}
            {error && (
               <div className="mb-6 p-4 bg-red-900/30 border border-red-600 rounded-lg flex items-gap-3">
                  <HiExclamationCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                  <p className="text-red-200">{error}</p>
               </div>
            )}

            {/* Empty State */}
            {channels.length === 0 ? (
               <div className="text-center py-12 bg-slate-800 rounded-lg border border-slate-700">
                  <HiDocumentText className="mx-auto mb-4 text-slate-500" size={48} />
                  <h3 className="text-xl font-semibold mb-2">No channels created yet</h3>
                  <p className="text-slate-400 mb-6">
                     Start creating channels to collaborate with your team
                  </p>
                  <button
                     onClick={() => navigate("/chat")}
                     className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                  >
                     Create Channel
                  </button>
               </div>
            ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {channels.map((channel) => (
                     <div
                        key={channel._id}
                        onClick={() => setSelectedChannelId(channel._id)}
                        className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${selectedChannelId === channel._id
                              ? "border-blue-500 bg-slate-800"
                              : "border-slate-700 bg-slate-800/50 hover:bg-slate-800 hover:border-slate-600"
                           }`}
                     >
                        {/* Channel Header */}
                        <div className="flex items-start justify-between mb-4">
                           <div className="flex items-center gap-3 flex-1">
                              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                 {channel.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1">
                                 <h3 className="font-semibold text-lg truncate">
                                    #{channel.name}
                                 </h3>
                                 <p className="text-sm text-slate-400">
                                    Created {formatDate(channel.createdAt)}
                                 </p>
                              </div>
                           </div>
                        </div>

                        {/* Channel Description */}
                        {channel.description && (
                           <p className="text-slate-300 text-sm mb-4 line-clamp-2">
                              {channel.description}
                           </p>
                        )}

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                           <div className="bg-slate-700/50 p-2 rounded">
                              <div className="flex items-center gap-2 text-slate-400 text-sm">
                                 <HiUsers size={16} />
                                 <span>{channel.members?.length || 0}</span>
                              </div>
                              <p className="text-xs text-slate-500 mt-1">Members</p>
                           </div>
                           <div className="bg-slate-700/50 p-2 rounded">
                              <div className="flex items-center gap-2 text-slate-400 text-sm">
                                 <HiDocumentText size={16} />
                                 <span>{channel.messageCount || 0}</span>
                              </div>
                              <p className="text-xs text-slate-500 mt-1">Messages</p>
                           </div>
                        </div>

                        {/* Members Preview */}
                        {channel.members && channel.members.length > 0 && (
                           <div className="mb-4">
                              <p className="text-xs text-slate-400 mb-2">Members:</p>
                              <div className="flex flex-wrap gap-1">
                                 {channel.members.slice(0, 3).map((member, idx) => (
                                    <span
                                       key={idx}
                                       className="text-xs px-2 py-1 bg-slate-700 rounded text-slate-300"
                                    >
                                       {member.name}
                                    </span>
                                 ))}
                                 {channel.members.length > 3 && (
                                    <span className="text-xs px-2 py-1 bg-slate-700 rounded text-slate-300">
                                       +{channel.members.length - 3}
                                    </span>
                                 )}
                              </div>
                           </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 pt-4 border-t border-slate-700">
                           <button
                              onClick={() => handleViewChannel(channel._id)}
                              className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors text-sm font-medium"
                           >
                              View Channel
                           </button>
                           <button
                              onClick={() => handleEditChannel(channel._id)}
                              className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded transition-colors"
                              title="Edit channel"
                           >
                              <HiPencil size={18} />
                           </button>
                           <button
                              onClick={() => handleDeleteChannel(channel._id)}
                              className="px-3 py-2 bg-red-900/30 hover:bg-red-900/50 rounded transition-colors"
                              title="Delete channel"
                           >
                              <HiTrash size={18} />
                           </button>
                        </div>
                     </div>
                  ))}
               </div>
            )}
         </div>
      </div>
   );
}
