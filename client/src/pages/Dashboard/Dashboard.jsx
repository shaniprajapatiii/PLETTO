import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { HiArrowRight, HiChatAlt2, HiClock, HiDocumentText, HiLightningBolt, HiSparkles, HiUsers, HiViewBoards, HiViewGrid, HiTrendingUp } from "react-icons/hi";
import { getChannels } from "../../services/chatService";
import { getDocs } from "../../services/docsService";
import { getBoards } from "../../services/whiteboardService";
import { getWorkspaceMembers } from "../../services/workspaceService";
import { PageShell } from "../../components/common/PageShell";

const tabs = [
   { id: "overview", label: "Overview", icon: HiViewGrid },
   { id: "channels", label: "Channels", icon: HiChatAlt2 },
   { id: "documents", label: "Documents", icon: HiDocumentText },
   { id: "whiteboards", label: "Whiteboards", icon: HiViewBoards },
];

export default function Dashboard() {
   const [stats, setStats] = useState({ channels: 0, documents: 0, boards: 0 });
   const [preview, setPreview] = useState({ channels: [], documents: [], boards: [] });
   const [members, setMembers] = useState([]);
   const [activeTab, setActiveTab] = useState("overview");

   useEffect(() => {
      const load = async () => {
         const [channelsRes, docsRes, boardsRes, membersRes] = await Promise.allSettled([
            getChannels(),
            getDocs(),
            getBoards(),
            getWorkspaceMembers(),
         ]);

         const channels = channelsRes.status === "fulfilled" ? channelsRes.value.data.channels : [];
         const documents = docsRes.status === "fulfilled" ? docsRes.value.data.documents : [];
         const boards = boardsRes.status === "fulfilled" ? boardsRes.value.data.whiteboards : [];
         const workspaceMembers = membersRes.status === "fulfilled" ? membersRes.value.data.members || [] : [];

         setStats({ channels: channels.length, documents: documents.length, boards: boards.length });
         setPreview({ channels: channels.slice(0, 4), documents: documents.slice(0, 4), boards: boards.slice(0, 4) });
         setMembers(workspaceMembers);
      };
      load();
   }, []);

   const activity = useMemo(() => {
      return [
         ...preview.channels.map((item) => ({ title: item.name, subtitle: "Active channel", icon: HiChatAlt2, link: `/chat?channel=${item._id}` })),
         ...preview.documents.map((item) => ({ title: item.title, subtitle: "Knowledge document", icon: HiDocumentText, link: "/docs" })),
         ...preview.boards.map((item) => ({ title: item.name, subtitle: "Collaborative whiteboard", icon: HiViewBoards, link: "/whiteboard" })),
      ].slice(0, 6);
   }, [preview]);

   return (
      <div className="space-y-6">
         <PageShell
            title="Workspace Overview"
            subtitle="Real-time pulse of team communications, shared knowledge, and active projects."
            actions={
               <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[rgba(249,235,174,0.3)] bg-[rgba(249,235,174,0.08)] text-xs font-semibold text-[#f9ebae]">
                  <HiSparkles className="h-4 w-4 text-[#f9ebae]" />
                  <span>Workspace Active</span>
               </div>
            }
         >
            {/* Stat Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
               <StatCard title="Active Channels" value={stats.channels} trend="+12%" icon={<HiChatAlt2 className="h-5 w-5 text-[#f9ebae]" />} />
               <StatCard title="Shared Documents" value={stats.documents} trend="+8%" icon={<HiDocumentText className="h-5 w-5 text-[#f9ebae]" />} />
               <StatCard title="Whiteboards" value={stats.boards} trend="+15%" icon={<HiViewBoards className="h-5 w-5 text-[#f9ebae]" />} />
               <StatCard title="Team Members" value={members.length} trend="+4%" icon={<HiUsers className="h-5 w-5 text-[#f9ebae]" />} />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
               {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.id;
                  return (
                     <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                           active ? "bg-[rgba(249,235,174,0.12)] text-[#f9ebae] border border-[rgba(249,235,174,0.35)] font-bold" : "text-zinc-400 hover:text-zinc-200"
                        }`}
                     >
                        <Icon className="h-3.5 w-3.5" />
                        <span>{tab.label}</span>
                     </button>
                  );
               })}
            </div>

            {/* Main Content Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               {/* Activity Feed Column */}
               <div className="lg:col-span-2 space-y-4">
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-5 backdrop-blur-md">
                     <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80">
                        <div>
                           <h2 className="text-base font-bold text-zinc-100">Recent Workspace Activity</h2>
                           <p className="text-xs text-zinc-400">Stream of updates across channels, docs, and whiteboards.</p>
                        </div>
                        <span className="text-[10px] font-bold text-[#f9ebae] uppercase tracking-widest bg-[rgba(249,235,174,0.1)] px-2 py-1 rounded border border-[rgba(249,235,174,0.2)]">
                           Live
                        </span>
                     </div>

                     <div className="mt-4 space-y-2.5">
                        {activity.length > 0 ? (
                           activity.map((item, i) => {
                              const Icon = item.icon;
                              return (
                                 <Link
                                    key={i}
                                    to={item.link}
                                    className="flex items-center justify-between p-3 rounded-lg border border-zinc-800/60 bg-zinc-900/40 hover:bg-zinc-900/80 hover:border-zinc-700 transition group"
                                 >
                                    <div className="flex items-center gap-3">
                                       <div className="p-2 rounded-lg bg-zinc-800/80 text-[#f9ebae] group-hover:bg-[#f9ebae] group-hover:text-zinc-950 transition">
                                          <Icon className="h-4 w-4" />
                                       </div>
                                       <div>
                                          <div className="text-xs font-bold text-zinc-200 group-hover:text-[#f9ebae]">{item.title}</div>
                                          <div className="text-[10px] text-zinc-500">{item.subtitle}</div>
                                       </div>
                                    </div>
                                    <HiArrowRight className="h-4 w-4 text-zinc-600 group-hover:text-[#f9ebae] transition" />
                                 </Link>
                              );
                           })
                        ) : (
                           <div className="py-8 text-center text-xs text-zinc-500">No recent activity detected.</div>
                        )}
                     </div>
                  </div>
               </div>

               {/* Right Quick Links Panel */}
               <div className="space-y-4">
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-5 backdrop-blur-md space-y-3">
                     <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Quick Navigation</h3>
                     <div className="space-y-2">
                        <QuickLink to="/chat" title="Channel Chat" desc="Real-time messaging with channels" />
                        <QuickLink to="/docs" title="Knowledge Docs" desc="Co-author documents & notes" />
                        <QuickLink to="/whiteboard" title="Visual Canvas" desc="Interactive diagram board" />
                        <QuickLink to="/people" title="Team Directory" desc="Find colleagues & status" />
                     </div>
                  </div>
               </div>
            </div>
         </PageShell>
      </div>
   );
}

function StatCard({ title, value, trend, icon }) {
   return (
      <div className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-950/60 flex flex-col justify-between gap-3 backdrop-blur-md">
         <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">{title}</span>
            <div className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800">{icon}</div>
         </div>
         <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-zinc-100">{value}</span>
            <span className="flex items-center text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
               <HiTrendingUp className="h-3 w-3 mr-0.5" />
               {trend}
            </span>
         </div>
      </div>
   );
}

function QuickLink({ to, title, desc }) {
   return (
      <Link to={to} className="block p-3 rounded-lg border border-zinc-800/60 bg-zinc-900/40 hover:bg-zinc-900/90 hover:border-[rgba(249,235,174,0.3)] transition group">
         <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-zinc-200 group-hover:text-[#f9ebae]">{title}</div>
            <HiArrowRight className="h-3.5 w-3.5 text-zinc-500 group-hover:text-[#f9ebae] transition" />
         </div>
         <div className="text-[10px] text-zinc-400 mt-1">{desc}</div>
      </Link>
   );
}
