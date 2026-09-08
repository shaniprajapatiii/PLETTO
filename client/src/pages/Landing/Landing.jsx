import { useState } from "react";
import { Link } from "react-router-dom";
import {
   HiArrowRight,
   HiDocumentText,
   HiChatAlt2,
   HiMenu,
   HiX,
   HiUsers,
   HiChevronDown,
   HiViewGrid,
} from "react-icons/hi";
import { Logo } from "../../components/brand/Logo";

const sections = [
   { label: "Features", href: "#features" },
   { label: "Preview", href: "#preview" },
   { label: "Comparison", href: "#comparison" },
   { label: "FAQ", href: "#faq" },
];

export default function Landing() {
   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
   const [activeTab, setActiveTab] = useState("docs");
   const [openFaq, setOpenFaq] = useState(0);

   return (
      <div className="min-h-screen bg-[#0b0c10] text-zinc-100 app-grid-bg flex flex-col">
         {/* Navigation Bar */}
         <header className="sticky top-0 z-40 px-4 py-4 sm:px-6 lg:px-8 border-b border-zinc-800/80 bg-[#0b0c10]/80 backdrop-blur-md">
            <div className="mx-auto max-w-7xl flex items-center justify-between gap-4">
               <Link to="/" className="flex items-center gap-3 text-white">
                  <Logo />
               </Link>

               <nav className="hidden items-center gap-6 lg:flex">
                  {sections.map((section) => (
                     <a
                        key={section.href}
                        href={section.href}
                        className="text-xs font-medium text-zinc-400 transition hover:text-zinc-100"
                     >
                        {section.label}
                     </a>
                  ))}
               </nav>

               <div className="hidden items-center gap-3 md:flex">
                  <Link
                     to="/login"
                     className="rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
                  >
                     Sign In
                  </Link>
                  <Link
                     to="/register"
                     className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-100 hover:bg-white px-3.5 py-1.5 text-xs font-medium text-zinc-950 transition"
                  >
                     <span>Get Started</span>
                     <HiArrowRight className="h-3.5 w-3.5" />
                  </Link>
               </div>

               <button
                  type="button"
                  onClick={() => setMobileMenuOpen((value) => !value)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 transition hover:text-white md:hidden"
                  aria-label="Toggle navigation"
               >
                  {mobileMenuOpen ? <HiX className="h-5 w-5" /> : <HiMenu className="h-5 w-5" />}
               </button>
            </div>

            {/* Mobile Dropdown */}
            {mobileMenuOpen && (
               <div className="mt-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4 md:hidden space-y-3">
                  <nav className="flex flex-col gap-2">
                     {sections.map((section) => (
                        <a
                           key={section.href}
                           href={section.href}
                           onClick={() => setMobileMenuOpen(false)}
                           className="text-xs font-medium text-zinc-300 hover:text-white py-1"
                        >
                           {section.label}
                        </a>
                     ))}
                  </nav>
                  <div className="pt-2 border-t border-zinc-800 flex flex-col gap-2">
                     <Link
                        to="/login"
                        onClick={() => setMobileMenuOpen(false)}
                        className="rounded-lg border border-zinc-800 bg-zinc-950 py-2 text-center text-xs font-medium text-zinc-200"
                     >
                        Sign In
                     </Link>
                     <Link
                        to="/register"
                        onClick={() => setMobileMenuOpen(false)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-zinc-100 py-2 text-xs font-medium text-zinc-950"
                     >
                        <span>Get Started</span>
                        <HiArrowRight className="h-3.5 w-3.5" />
                     </Link>
                  </div>
               </div>
            )}
         </header>

         {/* Hero Section */}
         <main className="flex-1">
            <section className="px-4 pt-16 pb-20 sm:px-6 lg:px-8 text-center">
               <div className="mx-auto max-w-4xl space-y-6">
                  <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/80 px-3.5 py-1 text-xs font-medium text-zinc-300">
                     <span>Team Workspace Platform</span>
                  </div>

                  <h1 className="text-4xl font-semibold tracking-tight text-zinc-100 sm:text-6xl leading-tight">
                     A unified workspace built for speed and clarity
                  </h1>

                  <p className="mx-auto max-w-2xl text-sm sm:text-base leading-relaxed text-zinc-400">
                     Real-time channels, technical documentation, and direct messaging in one clean, responsive application.
                  </p>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                     <Link
                        to="/register"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-100 hover:bg-white px-5 py-2.5 text-xs font-medium text-zinc-950 transition"
                     >
                        <span>Start Free</span>
                        <HiArrowRight className="h-4 w-4" />
                     </Link>

                     <Link
                        to="/login"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 px-5 py-2.5 text-xs font-medium text-zinc-300 hover:text-white transition hover:bg-zinc-900"
                     >
                        <span>Sign In</span>
                     </Link>
                  </div>

                  {/* Stats Bar */}
                  <div className="pt-10 max-w-3xl mx-auto">
                     <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl border border-zinc-800/80 bg-zinc-900/40">
                        {[
                           { label: "Socket Sync", value: "Realtime" },
                           { label: "Markdown", value: "Live Preview" },
                           { label: "Messaging", value: "Channels & DM" },
                           { label: "Data Store", value: "MongoDB Atlas" },
                        ].map((stat) => (
                           <div key={stat.label} className="p-2.5 text-center">
                              <div className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">{stat.label}</div>
                              <div className="text-sm font-medium text-zinc-200 mt-1">{stat.value}</div>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            </section>

            {/* Interactive Feature Simulator Section */}
            <section id="preview" className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
               <div className="text-center space-y-2 mb-8">
                  <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Preview</div>
                  <h2 className="text-2xl sm:text-3xl font-semibold text-zinc-100">Explore the Interface</h2>
                  <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto">
                     Switch between tabs to see the core components of the platform.
                  </p>

                  <div className="flex flex-wrap items-center justify-center gap-1.5 pt-3">
                     {[
                        { id: "docs", label: "Docs", icon: <HiDocumentText size={14} /> },
                        { id: "chat", label: "Channels", icon: <HiChatAlt2 size={14} /> },
                        { id: "dm", label: "Direct Messages", icon: <HiUsers size={14} /> },
                     ].map((tab) => (
                        <button
                           key={tab.id}
                           type="button"
                           onClick={() => setActiveTab(tab.id)}
                           className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                              activeTab === tab.id
                                 ? "bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-sm"
                                 : "border border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-zinc-200"
                           }`}
                        >
                           {tab.icon}
                           <span>{tab.label}</span>
                        </button>
                     ))}
                  </div>
               </div>

               {/* Mockup Preview Shell */}
               <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 sm:p-6 shadow-xl">
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-800 text-xs">
                     <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
                        <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
                        <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
                        <span className="font-mono text-zinc-500 text-[11px] ml-2">app/{activeTab}</span>
                     </div>
                     <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-medium">
                        Live Preview
                     </span>
                  </div>

                  <div className="pt-4 min-h-[300px]">
                     {activeTab === "docs" && (
                        <div className="space-y-3">
                           <div className="flex items-center justify-between">
                              <h3 className="font-medium text-sm text-zinc-100">Architecture Overview.md</h3>
                              <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 text-[10px] font-medium">Markdown</span>
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="p-3.5 rounded-lg border border-zinc-800 bg-zinc-950 font-mono text-xs text-zinc-300 leading-relaxed space-y-1.5">
                                 <div className="text-zinc-400 font-semibold"># System Architecture</div>
                                 <p className="text-zinc-500">PLETTO connects real-time messaging with Markdown specs.</p>
                                 <div className="text-zinc-400 font-semibold">## Capabilities</div>
                                 <p className="text-zinc-500">- Group Channels & Threads</p>
                                 <p className="text-zinc-500">- Split Markdown Editor</p>
                              </div>
                              <div className="p-3.5 rounded-lg border border-zinc-800 bg-zinc-950 text-xs leading-relaxed space-y-2">
                                 <h2 className="text-sm font-semibold text-zinc-100 border-b border-zinc-800 pb-1">System Architecture</h2>
                                 <p className="text-zinc-400">PLETTO connects real-time messaging with Markdown specs.</p>
                                 <ul className="list-disc pl-4 space-y-0.5 text-zinc-400">
                                    <li>Group Channels & Threads</li>
                                    <li>Split Markdown Editor</li>
                                 </ul>
                              </div>
                           </div>
                        </div>
                     )}

                     {activeTab === "chat" && (
                        <div className="space-y-3">
                           <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                              <h3 className="font-medium text-xs text-zinc-200"># engineering</h3>
                              <span className="text-[11px] text-zinc-500">8 members</span>
                           </div>
                           <div className="space-y-2">
                              {[
                                 { user: "Sarah Chen", text: "The new API endpoints are deployed to staging.", time: "10:42 AM" },
                                 { user: "Marcus Vance", text: "Verified. Testing the websocket sync now.", time: "10:44 AM" },
                              ].map((m) => (
                                 <div key={m.user} className="p-3 rounded-lg border border-zinc-800 bg-zinc-950 text-xs space-y-1">
                                    <div className="flex justify-between font-medium text-zinc-300">
                                       <span>{m.user}</span>
                                       <span className="text-[10px] text-zinc-500 font-normal">{m.time}</span>
                                    </div>
                                    <p className="text-zinc-400">{m.text}</p>
                                 </div>
                              ))}
                           </div>
                        </div>
                     )}

                     {activeTab === "dm" && (
                        <div className="space-y-3">
                           <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
                              <span className="h-2 w-2 rounded-full bg-emerald-500" />
                              <h3 className="font-medium text-xs text-zinc-200">Alex Morgan</h3>
                              <span className="text-[10px] text-zinc-500">Online</span>
                           </div>
                           <div className="space-y-2">
                              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 max-w-md">
                                 Can you check the latest pull request when you get a chance?
                              </div>
                              <div className="p-3 rounded-lg bg-zinc-100 text-zinc-950 text-xs font-normal max-w-md ml-auto">
                                 Reviewing it right now. Looks clean.
                              </div>
                           </div>
                        </div>
                     )}
                  </div>
               </div>
            </section>

            {/* Features Section */}
            <section id="features" className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
               <div className="text-center space-y-2 mb-10">
                  <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Features</div>
                  <h2 className="text-2xl sm:text-3xl font-semibold text-zinc-100">Everything Needed for Team Collaboration</h2>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                     {
                        icon: <HiDocumentText className="text-zinc-400" size={20} />,
                        title: "Docs",
                        desc: "Full Markdown support with live split preview, headings, code blocks, task lists, and syntax blocks.",
                     },
                     {
                        icon: <HiChatAlt2 className="text-zinc-400" size={20} />,
                        title: "Channels",
                        desc: "Public and private discussion rooms with message threads, pinned items, and real-time updates.",
                     },
                     {
                        icon: <HiUsers className="text-zinc-400" size={20} />,
                        title: "Direct Messages",
                        desc: "1-on-1 conversations with live presence indicators, typing status, and teammate search.",
                     },
                  ].map((card) => (
                     <div
                        key={card.title}
                        className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/60 transition space-y-2.5"
                     >
                        <div className="p-2 rounded-lg bg-zinc-800 w-fit">{card.icon}</div>
                        <h3 className="font-medium text-base text-zinc-100">{card.title}</h3>
                        <p className="text-xs text-zinc-400 leading-relaxed">{card.desc}</p>
                     </div>
                  ))}
               </div>
            </section>

            {/* Comparison Section */}
            <section id="comparison" className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
               <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-8">
                  <div className="text-center space-y-2 mb-6">
                     <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Comparison</div>
                     <h2 className="text-xl sm:text-2xl font-semibold text-zinc-100">Unified vs Fragmented Apps</h2>
                  </div>

                  <div className="overflow-x-auto">
                     <table className="w-full text-left border-collapse text-xs">
                        <thead>
                           <tr className="border-b border-zinc-800 text-zinc-400 font-medium">
                              <th className="py-2.5 px-3">Feature</th>
                              <th className="py-2.5 px-3 text-zinc-100 font-semibold bg-zinc-800/40 rounded-t-lg">PLETTO</th>
                              <th className="py-2.5 px-3 text-zinc-500">Separate Tools</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/60 text-zinc-400">
                           {[
                              { feature: "Workspace Integration", pletto: "Unified (Docs, Channels, DMs in one app)", legacy: "Multiple browser tabs & apps" },
                              { feature: "Markdown Authoring", pletto: "Built-in split preview editor", legacy: "Separate documentation SaaS" },
                              { feature: "Realtime Sync", pletto: "Instant WebSocket communication", legacy: "Polling or delayed sync" },
                              { feature: "Setup Overhead", pletto: "Instant zero-configuration access", legacy: "Multiple logins & integrations" },
                           ].map((row) => (
                              <tr key={row.feature} className="hover:bg-zinc-900/30 transition">
                                 <td className="py-3 px-3 text-zinc-300 font-medium">{row.feature}</td>
                                 <td className="py-3 px-3 text-zinc-100 bg-zinc-800/20 font-medium">{row.pletto}</td>
                                 <td className="py-3 px-3 text-zinc-500">{row.legacy}</td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>
            </section>

            {/* FAQ Section */}
            <section id="faq" className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8 space-y-4">
               <div className="text-center space-y-2 mb-6">
                  <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider">FAQ</div>
                  <h2 className="text-xl sm:text-2xl font-semibold text-zinc-100">Frequently Asked Questions</h2>
               </div>

               <div className="space-y-2">
                  {[
                     {
                        q: "What is PLETTO?",
                        a: "PLETTO is a real-time collaborative workspace combining technical documentation, team channels, and direct messaging.",
                     },
                     {
                        q: "Does PLETTO support Markdown editing?",
                        a: "Yes. It includes a built-in Markdown editor with a live split preview, table insertion, headings, code formatting, and task checkboxes.",
                     },
                     {
                        q: "How are channels organized?",
                        a: "Workspaces support both public channels (visible to all members) and private channels with restricted access.",
                     },
                  ].map((faq, idx) => (
                     <div
                        key={faq.q}
                        className="rounded-lg border border-zinc-800 bg-zinc-900/40 overflow-hidden"
                     >
                        <button
                           type="button"
                           onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                           className="w-full p-3.5 text-left text-xs font-medium text-zinc-200 flex items-center justify-between gap-4"
                        >
                           <span>{faq.q}</span>
                           <HiChevronDown className={`transition-transform text-zinc-500 ${openFaq === idx ? "rotate-180" : ""}`} size={16} />
                        </button>
                        {openFaq === idx && (
                           <div className="px-3.5 pb-3 text-xs text-zinc-400 leading-relaxed border-t border-zinc-800/60 pt-2.5">
                              {faq.a}
                           </div>
                        )}
                     </div>
                  ))}
               </div>
            </section>

            {/* Bottom Call to Action */}
            <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
               <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-8 sm:p-12 text-center space-y-4">
                  <h2 className="text-2xl sm:text-3xl font-semibold text-zinc-100">Ready to get started?</h2>
                  <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto">
                     Create your free workspace in seconds and start collaborating with your team.
                  </p>
                  <div className="pt-2">
                     <Link
                        to="/register"
                        className="inline-flex items-center gap-2 rounded-lg bg-zinc-100 hover:bg-white px-5 py-2.5 text-xs font-medium text-zinc-950 transition"
                     >
                        <span>Create Workspace</span>
                        <HiArrowRight className="h-4 w-4" />
                     </Link>
                  </div>
               </div>
            </section>
         </main>

         {/* Footer */}
         <footer className="border-t border-zinc-800 bg-zinc-950 py-8">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
               <div className="flex items-center gap-2">
                  <Logo />
               </div>
               <div>© {new Date().getFullYear()} PLETTO. All rights reserved.</div>
            </div>
         </footer>
      </div>
   );
}
