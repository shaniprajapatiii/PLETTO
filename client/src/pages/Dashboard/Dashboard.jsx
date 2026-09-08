import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { HiArrowRight, HiChatAlt2, HiDocumentText, HiUsers, HiViewGrid } from "react-icons/hi";
import { getChannels } from "../../services/chatService";
import { getDocs } from "../../services/docsService";
import { getWorkspaceMembers } from "../../services/workspaceService";
import { PageShell } from "../../components/common/PageShell";

const tabs = [
   { id: "overview", label: "Overview", icon: HiViewGrid },
   { id: "channels", label: "Channels", icon: HiChatAlt2 },
   { id: "documents", label: "Documents", icon: HiDocumentText },
];

export default function Dashboard() {
   const [stats, setStats] = useState({ channels: 0, documents: 0 });
   const [preview, setPreview] = useState({ channels: [], documents: [] });
   const [members, setMembers] = useState([]);
   const [activeTab, setActiveTab] = useState("overview");

   useEffect(() => {
      const load = async () => {
         const [channelsRes, docsRes, membersRes] = await Promise.allSettled([
            getChannels(),
            getDocs(),
            getWorkspaceMembers(),
         ]);

         const channels = channelsRes.status === "fulfilled" ? channelsRes.value.data.channels : [];
         const documents = docsRes.status === "fulfilled" ? docsRes.value.data.documents : [];
         const workspaceMembers = membersRes.status === "fulfilled" ? membersRes.value.data.members || [] : [];

         setStats({ channels: channels.length, documents: documents.length });
         setPreview({ channels: channels.slice(0, 5), documents: documents.slice(0, 5) });
         setMembers(workspaceMembers);
      };
      load();
   }, []);

   const activity = useMemo(() => {
      return [
         ...preview.channels.map((item) => ({ title: item.name, subtitle: "Channel", icon: HiChatAlt2, link: `/chat?channel=${item._id}` })),
         ...preview.documents.map((item) => ({ title: item.title, subtitle: "Document", icon: HiDocumentText, link: "/docs" })),
      ].slice(0, 6);
   }, [preview]);

   return (
      <div className="space-y-6">
         <PageShell
            title="Dashboard"
            subtitle="Overview of your workspace channels, documents, and team members."
         >
            {/* Stat Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
               <StatCard title="Active Channels" value={stats.channels} icon={<HiChatAlt2 className="h-4 w-4 text-zinc-300" />} />
               <StatCard title="Documents" value={stats.documents} icon={<HiDocumentText className="h-4 w-4 text-zinc-300" />} />
               <StatCard title="Team Members" value={members.length} icon={<HiUsers className="h-4 w-4 text-zinc-300" />} />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 border-b border-zinc-800 pb-2.5">
               {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.id;
                  return (
                     <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                           active ? "bg-zinc-800 text-zinc-100 border border-zinc-700/60" : "text-zinc-400 hover:text-zinc-200"
                        }`}
                     >
                        <Icon className="h-3.5 w-3.5" />
                        <span>{tab.label}</span>
                     </button>
                  );
               })}
            </div>

            {/* Main Content Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
               {/* Activity Feed Column */}
               <div className="lg:col-span-2 space-y-4">
                  <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-4 sm:p-5 backdrop-blur-sm">
                     <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
                        <div>
                           <h2 className="text-sm font-semibold text-zinc-100">Recent Workspace Activity</h2>
                           <p className="text-xs text-zinc-400 mt-0.5">Recent updates across channels and documents</p>
                        </div>
                     </div>

                     <div className="mt-3.5 space-y-2">
                        {activity.length > 0 ? (
                           activity.map((item, i) => {
                              const Icon = item.icon;
                              return (
                                 <Link
                                    key={i}
                                    to={item.link}
                                    className="flex items-center justify-between p-2.5 rounded-lg border border-zinc-800/80 bg-zinc-950/40 hover:bg-zinc-800/50 hover:border-zinc-700/80 transition group"
                                 >
                                    <div className="flex items-center gap-3 min-w-0">
                                       <div className="p-1.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300">
                                          <Icon className="h-4 w-4" />
                                       </div>
                                       <div className="min-w-0">
                                          <div className="text-xs font-medium text-zinc-200 group-hover:text-white truncate">{item.title}</div>
                                          <div className="text-[11px] text-zinc-500">{item.subtitle}</div>
                                       </div>
                                    </div>
                                    <HiArrowRight className="h-3.5 w-3.5 text-zinc-500 group-hover:text-zinc-300 transition shrink-0" />
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
                  <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-4 sm:p-5 backdrop-blur-sm space-y-3">
                     <h3 className="text-xs font-medium text-zinc-400">Quick Navigation</h3>
                     <div className="space-y-1.5">
                        <QuickLink to="/chat" title="Channels" desc="Team messaging rooms" />
                        <QuickLink to="/dm" title="Direct Messages" desc="1-on-1 conversations" />
                        <QuickLink to="/docs" title="Documents" desc="Markdown notes and specs" />
                        <QuickLink to="/people" title="Team Directory" desc="Members and online status" />
                     </div>
                  </div>
               </div>
            </div>
         </PageShell>
      </div>
   );
}

function StatCard({ title, value, icon }) {
   return (
      <div className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/60 flex flex-col justify-between gap-3 backdrop-blur-sm">
         <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">{title}</span>
            <div className="p-1.5 rounded-md bg-zinc-900 border border-zinc-800/80">{icon}</div>
         </div>
         <div className="text-2xl font-bold text-zinc-100 tracking-tight">{value}</div>
      </div>
   );
}

function QuickLink({ to, title, desc }) {
   return (
      <Link to={to} className="block p-2.5 rounded-lg border border-zinc-800/70 bg-zinc-950/40 hover:bg-zinc-800/50 hover:border-zinc-700/80 transition group">
         <div className="flex items-center justify-between">
            <div className="text-xs font-medium text-zinc-200 group-hover:text-white">{title}</div>
            <HiArrowRight className="h-3 w-3 text-zinc-500 group-hover:text-zinc-300 transition" />
         </div>
         <div className="text-[11px] text-zinc-400 mt-0.5">{desc}</div>
      </Link>
   );
}
