import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
   HiArrowRight,
   HiChatAlt2,
   HiUsers,
   HiViewGrid,
   HiPlus,
   HiHashtag,
   HiLockClosed,
   HiGlobeAlt,
   HiSparkles,
   HiShieldCheck,
   HiOutlineLightningBolt,
} from "react-icons/hi";
import { getChannels } from "../../services/chatService";
import { getWorkspaceMembers } from "../../services/workspaceService";
import { PageShell } from "../../components/common/PageShell";
import { useAuth } from "../../context/AuthContext";
import { getAvatarSrc } from "../../utils/avatar";

export default function Dashboard() {
   const { user, workspace } = useAuth();
   const navigate = useNavigate();

   const [stats, setStats] = useState({ channels: 0, members: 0, dmChannels: 0 });
   const [channels, setChannels] = useState([]);
   const [members, setMembers] = useState([]);
   const [filterTab, setFilterTab] = useState("all");
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      const load = async () => {
         try {
            setLoading(true);
            const [channelsRes, membersRes] = await Promise.allSettled([
               getChannels(),
               getWorkspaceMembers(),
            ]);

            const allChannels = channelsRes.status === "fulfilled" ? channelsRes.value.data.channels || [] : [];
            const regularChannels = allChannels.filter((c) => c.type !== "dm");
            const dmChannels = allChannels.filter((c) => c.type === "dm");
            const workspaceMembers = membersRes.status === "fulfilled" ? membersRes.value.data.members || [] : [];

            setStats({
               channels: regularChannels.length,
               members: workspaceMembers.length,
               dmChannels: dmChannels.length,
            });
            setChannels(regularChannels);
            setMembers(workspaceMembers);
         } finally {
            setLoading(false);
         }
      };
      load();
   }, []);

   const filteredChannels = useMemo(() => {
      if (filterTab === "public") return channels.filter((c) => c.type === "public");
      if (filterTab === "private") return channels.filter((c) => c.type === "private");
      return channels;
   }, [channels, filterTab]);

   return (
      <div className="space-y-8 pb-12">
         {/* Welcome Big Hero Banner Card */}
         <div className="big-card p-6 sm:p-8 lg:p-10 relative overflow-hidden bg-gradient-to-b from-[#0f0f12] to-[#070708] border-white/15">
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
               <div className="max-w-2xl space-y-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/20 bg-black text-xs font-mono text-neutral-300">
                     <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                     <span>SYSTEM OPERATIONAL</span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                     Welcome, {user?.name || "Member"}
                  </h1>
                  <p className="text-sm sm:text-base text-neutral-400 font-normal leading-relaxed">
                     Workspace <span className="text-white font-semibold">{workspace?.name || "PLETTO"}</span> is active. Collaborate across real-time channels, share instant updates, and direct message your teammates.
                  </p>
               </div>

               {/* Quick Action Buttons */}
               <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <button
                     onClick={() => navigate("/chat")}
                     className="btn-white px-5 py-3 text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg"
                  >
                     <HiPlus className="h-4 w-4" />
                     <span>Join Channels</span>
                  </button>
                  <button
                     onClick={() => navigate("/dm")}
                     className="btn-dark px-5 py-3 text-xs sm:text-sm font-bold flex items-center gap-2"
                  >
                     <HiChatAlt2 className="h-4 w-4" />
                     <span>Direct Messages</span>
                  </button>
               </div>
            </div>

            {/* Subtle Monochrome Corner Accent */}
            <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-white/[0.02] rounded-full blur-3xl pointer-events-none" />
         </div>

         {/* 4 Big Stat Metric Cards */}
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <BigStatCard
               title="Discussion Channels"
               value={stats.channels}
               badge="Realtime Rooms"
               description="Public and private collaboration channels"
               icon={<HiChatAlt2 className="h-6 w-6 text-black" />}
            />
            <BigStatCard
               title="Team Members"
               value={stats.members}
               badge="Active Roster"
               description="Registered workspace collaborators"
               icon={<HiUsers className="h-6 w-6 text-black" />}
            />
            <BigStatCard
               title="Direct Messages"
               value={stats.dmChannels}
               badge="Private Convos"
               description="One-on-one encrypted chat rooms"
               icon={<HiViewGrid className="h-6 w-6 text-black" />}
            />
            <BigStatCard
               title="Workspace Status"
               value="Online"
               badge="99.99% Uptime"
               description="Socket gateway and real-time syncing"
               icon={<HiOutlineLightningBolt className="h-6 w-6 text-black" />}
            />
         </div>

         {/* Main Content Layout (Big Cards Grid) */}
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Left Column: Big Channel Activity Card */}
            <div className="lg:col-span-2 space-y-6">
               <div className="big-card p-6 sm:p-8 space-y-6">
                  {/* Card Header & Filter Tabs */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/10">
                     <div>
                        <h2 className="text-xl font-bold text-white tracking-tight">Active Channels</h2>
                        <p className="text-xs sm:text-sm text-neutral-400 mt-1">Jump directly into ongoing workspace discussions</p>
                     </div>

                     <div className="flex items-center gap-1.5 p-1 rounded-xl border border-white/15 bg-black">
                        {[
                           { id: "all", label: `All (${channels.length})` },
                           { id: "public", label: "Public" },
                           { id: "private", label: "Private" },
                        ].map((tab) => (
                           <button
                              key={tab.id}
                              onClick={() => setFilterTab(tab.id)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                                 filterTab === tab.id
                                    ? "bg-white text-black shadow-sm"
                                    : "text-neutral-400 hover:text-white"
                              }`}
                           >
                              {tab.label}
                           </button>
                        ))}
                     </div>
                  </div>

                  {/* Channel List Big Rows */}
                  <div className="space-y-3">
                     {loading ? (
                        <div className="py-16 text-center text-sm text-neutral-400 flex flex-col items-center gap-3">
                           <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                           <span>Loading workspace channels...</span>
                        </div>
                     ) : filteredChannels.length > 0 ? (
                        filteredChannels.slice(0, 5).map((channel) => {
                           const isPrivate = channel.type === "private";
                           return (
                              <div
                                 key={channel._id}
                                 className="big-card-interactive p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                              >
                                 <div className="flex items-start gap-4 min-w-0">
                                    <div className="h-10 w-10 shrink-0 rounded-xl bg-white text-black flex items-center justify-center font-bold shadow-sm">
                                       {isPrivate ? <HiLockClosed className="h-5 w-5" /> : <HiHashtag className="h-5 w-5" />}
                                    </div>
                                    <div className="min-w-0 space-y-1">
                                       <div className="flex items-center gap-2.5">
                                          <h3 className="text-sm sm:text-base font-bold text-white truncate">
                                             {channel.name}
                                          </h3>
                                          <span className="badge-bw px-2.5 py-0.5 text-[10px] font-mono uppercase">
                                             {isPrivate ? "Private" : "Public"}
                                          </span>
                                       </div>
                                       <p className="text-xs text-neutral-400 truncate max-w-md">
                                          {channel.topic || channel.description || "General collaborative team discussions."}
                                       </p>
                                    </div>
                                 </div>

                                 <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-white/10">
                                    <span className="text-xs font-mono text-neutral-400">
                                       {channel.members?.length || 1} members
                                    </span>
                                    <Link
                                       to={`/chat?channel=${channel._id}`}
                                       className="btn-white px-4 py-2 text-xs font-bold flex items-center gap-1.5"
                                    >
                                       <span>Enter</span>
                                       <HiArrowRight className="h-3.5 w-3.5" />
                                    </Link>
                                 </div>
                              </div>
                           );
                        })
                     ) : (
                        <div className="py-12 text-center text-sm text-neutral-500">
                           No channels match the selected filter.
                        </div>
                     )}
                  </div>

                  <div className="pt-2 text-center sm:text-left">
                     <Link
                        to="/chat"
                        className="inline-flex items-center gap-2 text-xs font-bold text-neutral-300 hover:text-white transition"
                     >
                        <span>View all channels directory</span>
                        <HiArrowRight className="h-3.5 w-3.5" />
                     </Link>
                  </div>
               </div>
            </div>

            {/* Right Column: Big Quick Navigation & Team Hub */}
            <div className="space-y-6">
               {/* Quick Shortcuts Big Card */}
               <div className="big-card p-6 sm:p-7 space-y-5">
                  <div className="pb-3 border-b border-white/10">
                     <h3 className="text-base font-bold text-white tracking-tight">Quick Navigation</h3>
                     <p className="text-xs text-neutral-400 mt-0.5">Shortcuts to primary workspace modules</p>
                  </div>

                  <div className="space-y-3">
                     <QuickShortcutCard
                        to="/chat"
                        title="Channels Hub"
                        desc="Explore discussions, join or create rooms"
                        icon={<HiHashtag className="h-5 w-5" />}
                     />
                     <QuickShortcutCard
                        to="/dm"
                        title="Direct Messaging"
                        desc="Start 1-on-1 private conversations"
                        icon={<HiChatAlt2 className="h-5 w-5" />}
                     />
                     <QuickShortcutCard
                        to="/people"
                        title="Team Directory"
                        desc="View members, roles and online presence"
                        icon={<HiUsers className="h-5 w-5" />}
                     />
                     <QuickShortcutCard
                        to="/settings"
                        title="Workspace Settings"
                        desc="Manage members and invitations"
                        icon={<HiShieldCheck className="h-5 w-5" />}
                     />
                  </div>
               </div>

               {/* Teammates Snapshot Big Card */}
               <div className="big-card p-6 sm:p-7 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                     <div>
                        <h3 className="text-base font-bold text-white tracking-tight">Team Snapshot</h3>
                        <p className="text-xs text-neutral-400 mt-0.5">{members.length} registered members</p>
                     </div>
                     <Link to="/people" className="text-xs font-bold text-neutral-300 hover:text-white">
                        See All
                     </Link>
                  </div>

                  <div className="space-y-2.5">
                     {members.slice(0, 4).map((member) => (
                        <div
                           key={member._id || member.email}
                           className="flex items-center justify-between p-2.5 rounded-xl border border-white/10 bg-black/60 hover:bg-white/5 transition"
                        >
                           <div className="flex items-center gap-3 min-w-0">
                              <img
                                 src={getAvatarSrc(member)}
                                 alt={member.name || member.email}
                                 className="h-8 w-8 rounded-lg border border-white/20 object-cover"
                              />
                              <div className="min-w-0">
                                 <div className="text-xs font-bold text-white truncate">
                                    {member.name || member.email}
                                 </div>
                                 <div className="text-[10px] text-neutral-400 truncate font-mono">
                                    {member.role || "Member"}
                                 </div>
                              </div>
                           </div>
                           <Link
                              to={`/dm?user=${member.userId || member._id}`}
                              className="px-2.5 py-1 rounded-lg border border-white/20 text-[11px] font-bold text-white hover:bg-white hover:text-black transition shrink-0"
                           >
                              DM
                           </Link>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
}

function BigStatCard({ title, value, badge, description, icon }) {
   return (
      <div className="big-card p-6 sm:p-7 flex flex-col justify-between gap-5 relative overflow-hidden group hover:border-white/30 transition-all">
         <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider font-mono">{title}</span>
            <div className="p-2 rounded-xl bg-white shadow-md">
               {icon}
            </div>
         </div>

         <div className="space-y-1">
            <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight font-mono">
               {value}
            </div>
            <div className="flex items-center gap-2 pt-1">
               <span className="badge-bw px-2 py-0.5 text-[10px] font-mono">
                  {badge}
               </span>
            </div>
         </div>

         <p className="text-xs text-neutral-400 font-normal leading-relaxed pt-2 border-t border-white/10">
            {description}
         </p>
      </div>
   );
}

function QuickShortcutCard({ to, title, desc, icon }) {
   return (
      <Link
         to={to}
         className="big-card-interactive p-4 flex items-center justify-between gap-3 group"
      >
         <div className="flex items-center gap-3.5 min-w-0">
            <div className="p-2.5 rounded-xl border border-white/15 bg-black text-white group-hover:bg-white group-hover:text-black transition-colors shrink-0">
               {icon}
            </div>
            <div className="min-w-0">
               <div className="text-xs sm:text-sm font-bold text-white group-hover:text-white truncate">
                  {title}
               </div>
               <div className="text-[11px] text-neutral-400 truncate mt-0.5">{desc}</div>
            </div>
         </div>
         <HiArrowRight className="h-4 w-4 text-neutral-500 group-hover:text-white group-hover:translate-x-1 transition-all shrink-0" />
      </Link>
   );
}
