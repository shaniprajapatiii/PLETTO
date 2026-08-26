import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
   HiArrowRight,
   HiDocumentText,
   HiChatAlt2,
   HiViewBoards,
   HiWifi,
   HiShieldCheck,
   HiCollection,
   HiTrendingUp,
   HiMenu,
   HiX,
   HiSparkles,
   HiCheck,
   HiUsers,
   HiLockClosed,
   HiPencil,
   HiEye,
   HiOutlinePresentationChartBar,
   HiChevronDown,
} from "react-icons/hi";
import { Logo } from "../../components/brand/Logo";

const sections = [
   { label: "Product", href: "#product" },
   { label: "Simulator", href: "#simulator" },
   { label: "Comparison", href: "#comparison" },
   { label: "FAQ", href: "#faq" },
];

export default function Landing() {
   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
   const [activeTab, setActiveTab] = useState("docs"); // 'docs', 'chat', 'dm', 'whiteboard'
   const [openFaq, setOpenFaq] = useState(0);

   return (
      <div
         className="relative min-h-screen overflow-x-hidden bg-[#050507] text-zinc-100"
         style={{
            backgroundImage:
               "radial-gradient(circle at 15% 15%, rgba(249, 235, 174, 0.12), transparent 35%), radial-gradient(circle at 85% 45%, rgba(56, 189, 248, 0.08), transparent 40%), linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)",
            backgroundSize: "auto, auto, 40px 40px, 40px 40px",
         }}
      >
         {/* Navigation Bar */}
         <header className="sticky top-0 z-40 px-4 py-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl rounded-full border border-zinc-800/80 bg-zinc-950/85 px-5 py-3 shadow-2xl backdrop-blur-2xl">
               <div className="flex items-center justify-between gap-4">
                  <Link to="/" className="flex items-center gap-3 text-white">
                     <Logo className="h-8" />
                     <div className="hidden sm:block">
                        <div className="text-xs font-black tracking-widest text-[#f9ebae] uppercase">PLETTO</div>
                        <div className="text-[10px] text-zinc-400 font-medium">Workspace Operating System</div>
                     </div>
                  </Link>

                  <nav className="hidden items-center gap-1 lg:flex">
                     {sections.map((section) => (
                        <a
                           key={section.href}
                           href={section.href}
                           className="rounded-full px-4 py-1.5 text-xs font-semibold text-zinc-300 transition hover:bg-zinc-900 hover:text-[#f9ebae]"
                        >
                           {section.label}
                        </a>
                     ))}
                  </nav>

                  <div className="hidden items-center gap-3 md:flex">
                     <Link
                        to="/login"
                        className="rounded-full border border-zinc-800 bg-zinc-900/90 px-4 py-2 text-xs font-semibold text-zinc-200 transition hover:border-[#f9ebae]/40 hover:text-white"
                     >
                        Login
                     </Link>
                     <Link
                        to="/register"
                        className="inline-flex items-center gap-2 rounded-full bg-[#f9ebae] hover:bg-[#e6d695] px-5 py-2 text-xs font-extrabold text-zinc-950 shadow-md shadow-[#f9ebae]/20 transition hover:-translate-y-0.5"
                     >
                        <span>Start Free</span>
                        <HiArrowRight className="h-3.5 w-3.5" />
                     </Link>
                  </div>

                  <button
                     type="button"
                     onClick={() => setMobileMenuOpen((value) => !value)}
                     className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 text-zinc-300 transition hover:text-white md:hidden"
                     aria-label="Toggle navigation"
                  >
                     {mobileMenuOpen ? <HiX className="h-5 w-5" /> : <HiMenu className="h-5 w-5" />}
                  </button>
               </div>

               {/* Mobile Dropdown */}
               {mobileMenuOpen && (
                  <div className="mt-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 md:hidden space-y-3">
                     <nav className="flex flex-col gap-1">
                        {sections.map((section) => (
                           <a
                              key={section.href}
                              href={section.href}
                              onClick={() => setMobileMenuOpen(false)}
                              className="rounded-xl px-3 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-900 hover:text-[#f9ebae]"
                           >
                              {section.label}
                           </a>
                        ))}
                     </nav>
                     <div className="pt-2 border-t border-zinc-800 flex flex-col gap-2">
                        <Link
                           to="/login"
                           onClick={() => setMobileMenuOpen(false)}
                           className="rounded-xl border border-zinc-800 bg-zinc-900 py-2.5 text-center text-xs font-semibold text-zinc-200"
                        >
                           Login
                        </Link>
                        <Link
                           to="/register"
                           onClick={() => setMobileMenuOpen(false)}
                           className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#f9ebae] py-2.5 text-xs font-extrabold text-zinc-950"
                        >
                           <span>Start Free</span>
                           <HiArrowRight className="h-3.5 w-3.5" />
                        </Link>
                     </div>
                  </div>
               )}
            </div>
         </header>

         {/* Hero Section */}
         <main>
            <section className="relative overflow-hidden px-4 pt-12 pb-20 sm:px-6 lg:px-8">
               <div className="mx-auto max-w-7xl text-center space-y-8">
                  {/* Badge Pill */}
                  <div className="inline-flex items-center gap-2 rounded-full border border-[#f9ebae]/30 bg-[#f9ebae]/10 px-4 py-1.5 text-xs font-extrabold text-[#f9ebae] shadow-lg shadow-[#f9ebae]/10">
                     <HiSparkles size={14} />
                     <span>PLETTO 2.0 • Workspace Operating System</span>
                  </div>

                  {/* Hero Headline */}
                  <h1 className="mx-auto max-w-4xl text-4xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl leading-tight">
                     A unified workspace built for{" "}
                     <span className="bg-gradient-to-r from-[#f9ebae] via-amber-200 to-[#38bdf8] bg-clip-text text-transparent">
                        speed, clarity & momentum
                     </span>
                     .
                  </h1>

                  <p className="mx-auto max-w-2xl text-sm sm:text-base leading-relaxed text-zinc-400">
                     PLETTO merges real-time knowledge docs, channel chat rooms, direct 1-on-1 messaging, and interactive whiteboards into one hyper-efficient operating system.
                  </p>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                     <Link
                        to="/register"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-2xl bg-[#f9ebae] hover:bg-[#e6d695] px-7 py-3.5 text-sm font-extrabold text-zinc-950 shadow-xl shadow-[#f9ebae]/20 transition hover:-translate-y-0.5"
                     >
                        <span>Launch Workspace Free</span>
                        <HiArrowRight className="h-4 w-4" />
                     </Link>

                     <Link
                        to="/login"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-950/80 px-7 py-3.5 text-sm font-bold text-zinc-200 hover:text-white transition hover:border-[#f9ebae]/40"
                     >
                        <span>Sign In to Existing Workspace</span>
                     </Link>
                  </div>

                  {/* Stats Bar */}
                  <div className="pt-8 max-w-4xl mx-auto">
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-2xl border border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl">
                        {[
                           { label: "Realtime Latency", value: "< 40ms" },
                           { label: "Workspace Capacity", value: "Unlimited" },
                           { label: "Security Standard", value: "SOC-2 Ready" },
                           { label: "Sync Engine", value: "100% Live" },
                        ].map((stat) => (
                           <div key={stat.label} className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/40 text-center">
                              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{stat.label}</div>
                              <div className="text-sm font-black text-white mt-1">{stat.value}</div>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            </section>

            {/* Interactive Feature Simulator Section */}
            <section id="simulator" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
               <div className="text-center space-y-3 mb-8">
                  <div className="text-xs font-black uppercase tracking-widest text-[#f9ebae]">Interactive Preview</div>
                  <h2 className="text-2xl sm:text-4xl font-extrabold text-white">Experience the PLETTO Suite</h2>
                  <p className="text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto">
                     Click between workspace modules below to preview how teams collaborate in real time.
                  </p>

                  {/* Simulator Tab Switcher */}
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
                     {[
                        { id: "docs", label: "📄 Knowledge Docs", icon: <HiDocumentText size={16} /> },
                        { id: "chat", label: "💬 Team Channels", icon: <HiChatAlt2 size={16} /> },
                        { id: "dm", label: "✉️ Direct Messages", icon: <HiUsers size={16} /> },
                        { id: "whiteboard", label: "🎨 Visual Whiteboard", icon: <HiViewBoards size={16} /> },
                     ].map((tab) => (
                        <button
                           key={tab.id}
                           type="button"
                           onClick={() => setActiveTab(tab.id)}
                           className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-extrabold transition shadow-lg ${
                              activeTab === tab.id
                                 ? "bg-[#f9ebae] text-zinc-950 shadow-[#f9ebae]/20"
                                 : "bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white"
                           }`}
                        >
                           {tab.label}
                        </button>
                     ))}
                  </div>
               </div>

               {/* Mockup Preview Shell */}
               <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6 shadow-2xl saas-grid-bg">
                  <div className="flex items-center justify-between pb-4 border-b border-zinc-800 text-xs">
                     <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-red-500/80" />
                        <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
                        <span className="h-3 w-3 rounded-full bg-green-500/80" />
                        <span className="font-mono text-zinc-500 text-[11px] ml-2">app.pletto.io/{activeTab}</span>
                     </div>
                     <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                        ● LIVE SIMULATOR
                     </span>
                  </div>

                  <div className="pt-6 min-h-[360px]">
                     {activeTab === "docs" && (
                        <div className="space-y-4">
                           <div className="flex items-center justify-between">
                              <h3 className="font-black text-lg text-white"># Q3 Product Architecture Spec.md</h3>
                              <span className="px-2.5 py-1 rounded bg-amber-400/10 text-amber-300 border border-amber-400/30 text-[10px] font-bold">✨ Markdown</span>
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 font-mono text-xs text-zinc-300 leading-relaxed space-y-2">
                                 <div className="text-amber-300 font-bold"># System Overview</div>
                                 <p>PLETTO uses WebSocket state synchronization with Mongo persistence.</p>
                                 <div className="text-amber-300 font-bold">## Core Services</div>
                                 <p>- Live Chat Channels & Threads</p>
                                 <p>- Full-Screen Markdown & Plain Text</p>
                              </div>
                              <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/90 text-xs leading-relaxed space-y-3">
                                 <h2 className="text-base font-extrabold text-white border-b border-zinc-800 pb-1">System Overview</h2>
                                 <p className="text-zinc-300">PLETTO uses WebSocket state synchronization with Mongo persistence.</p>
                                 <ul className="list-disc pl-4 space-y-1 text-zinc-400">
                                    <li>Live Chat Channels & Threads</li>
                                    <li>Full-Screen Markdown & Plain Text</li>
                                 </ul>
                              </div>
                           </div>
                        </div>
                     )}

                     {activeTab === "chat" && (
                        <div className="space-y-4">
                           <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                              <h3 className="font-bold text-base text-white flex items-center gap-1.5">
                                 <span className="text-[#f9ebae]">#</span> product-roadmap
                              </h3>
                              <span className="text-xs text-zinc-500">14 Members Online</span>
                           </div>
                           <div className="space-y-3">
                              {[
                                 { user: "Alex Rivers", text: "Just finalized the full-screen whiteboard layout updates!", time: "10:42 AM" },
                                 { user: "Sarah Chen", text: "Awesome! The live markdown preview editor works cleanly too.", time: "10:44 AM" },
                              ].map((m) => (
                                 <div key={m.user} className="p-3 rounded-2xl border border-zinc-800 bg-zinc-900/70 text-xs space-y-1">
                                    <div className="flex justify-between font-bold text-zinc-300">
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
                        <div className="space-y-4">
                           <div className="flex items-center gap-3 pb-3 border-b border-zinc-800">
                              <span className="h-3 w-3 rounded-full bg-emerald-500" />
                              <h3 className="font-bold text-base text-white">Direct Message with Marcus Vance</h3>
                              <span className="text-xs text-emerald-400 font-semibold">Online</span>
                           </div>
                           <div className="space-y-3">
                              <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 max-w-md">
                                 Marcus: Hey! Can we review the API route schema before staging deployment?
                              </div>
                              <div className="p-3 rounded-2xl bg-[#f9ebae] text-zinc-950 text-xs font-medium max-w-md ml-auto">
                                 You: Absolutely! Opening the specs document in full-screen mode now.
                              </div>
                           </div>
                        </div>
                     )}

                     {activeTab === "whiteboard" && (
                        <div className="space-y-4">
                           <div className="flex items-center justify-between">
                              <h3 className="font-bold text-base text-white">Visual Architecture Whiteboard</h3>
                              <div className="flex gap-2">
                                 <span className="px-2 py-1 rounded bg-amber-400/20 text-amber-300 text-[10px] font-bold">Sticky Notes</span>
                                 <span className="px-2 py-1 rounded bg-sky-400/20 text-sky-300 text-[10px] font-bold">Flowchart Boxes</span>
                              </div>
                           </div>
                           <div className="h-48 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 flex items-center justify-around">
                              <div className="p-4 rounded-2xl bg-[#fef08a] text-zinc-950 text-xs font-bold w-36 shadow-xl rotate-[-2deg]">
                                 📌 Frontend Client (Vite React)
                              </div>
                              <span className="text-amber-400 font-bold text-lg">➔</span>
                              <div className="p-4 rounded-2xl bg-[#bae6fd] text-zinc-950 text-xs font-bold w-36 shadow-xl rotate-[2deg]">
                                 ⚡ Socket.IO Event Engine
                              </div>
                           </div>
                        </div>
                     )}
                  </div>
               </div>
            </section>

            {/* Core Pillars Feature Grid */}
            <section id="product" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
               <div className="text-center space-y-3 mb-12">
                  <div className="text-xs font-black uppercase tracking-widest text-[#f9ebae]">Platform Architecture</div>
                  <h2 className="text-3xl sm:text-5xl font-extrabold text-white">Built for High-Velocity Teams</h2>
                  <p className="text-sm text-zinc-400 max-w-xl mx-auto">
                     Stop toggling between five disconnected browser apps. PLETTO unifies your team's workflow in one interface.
                  </p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                     {
                        icon: <HiDocumentText className="text-[#f9ebae]" size={28} />,
                        title: "Knowledge Docs",
                        desc: "Full-screen Markdown & Plain Text editor with live split preview, code syntax blocks, and tables.",
                     },
                     {
                        icon: <HiChatAlt2 className="text-[#f9ebae]" size={28} />,
                        title: "Team Channels",
                        desc: "Public and private channel rooms with threaded replies, pinned messages, reactions, and socket events.",
                     },
                     {
                        icon: <HiUsers className="text-[#f9ebae]" size={28} />,
                        title: "Direct Messages",
                        desc: "1-on-1 team messaging with presence indicators, typing status, and teammate directory search.",
                     },
                     {
                        icon: <HiViewBoards className="text-[#f9ebae]" size={28} />,
                        title: "Visual Whiteboard",
                        desc: "Interactive canvas with freehand drawing, highlighter, sticky notes, flowchart boxes, and PNG export.",
                     },
                  ].map((card) => (
                     <div
                        key={card.title}
                        className="p-6 rounded-3xl border border-zinc-800/80 bg-zinc-950/70 hover:border-[#f9ebae]/40 hover:bg-zinc-900/60 transition space-y-3 shadow-xl"
                     >
                        <div className="p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 w-fit">{card.icon}</div>
                        <h3 className="font-extrabold text-lg text-white">{card.title}</h3>
                        <p className="text-xs text-zinc-400 leading-relaxed">{card.desc}</p>
                     </div>
                  ))}
               </div>
            </section>

            {/* Comparison Matrix Section */}
            <section id="comparison" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
               <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 sm:p-10 shadow-2xl">
                  <div className="text-center space-y-3 mb-8">
                     <div className="text-xs font-black uppercase tracking-widest text-[#f9ebae]">Why PLETTO</div>
                     <h2 className="text-2xl sm:text-4xl font-extrabold text-white">PLETTO vs Legacy Fragmented Tools</h2>
                  </div>

                  <div className="overflow-x-auto">
                     <table className="w-full text-left border-collapse text-xs">
                        <thead>
                           <tr className="border-b border-zinc-800 text-zinc-400 font-bold uppercase tracking-wider">
                              <th className="py-3 px-4">Feature Capability</th>
                              <th className="py-3 px-4 text-[#f9ebae] bg-[#f9ebae]/10 rounded-t-xl">⚡ PLETTO OS</th>
                              <th className="py-3 px-4 text-zinc-500">Legacy Separate Apps</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/60 text-zinc-300 font-medium">
                           {[
                              { feature: "Unified Single Window Workspace", pletto: "Yes — Docs, Chat, DM & Canvas", legacy: "No — 4 separate browser apps" },
                              { feature: "Directory Catalog -> Dedicated Focus View", pletto: "Yes — Dedicated focus canvas", legacy: "Cluttered split panes" },
                              { feature: "Live Markdown Split Preview", pletto: "Yes — Realtime side-by-side", legacy: "Basic plain text only" },
                              { feature: "Visual Whiteboard PNG Export", pletto: "Yes — High-res 1-click download", legacy: "Requires paid add-ons" },
                              { feature: "Sub-40ms Socket Sync Engine", pletto: "Yes — Realtime WebSockets", legacy: "Polling delay" },
                           ].map((row, idx) => (
                              <tr key={row.feature} className="hover:bg-zinc-900/40 transition">
                                 <td className="py-3.5 px-4 font-semibold text-white">{row.feature}</td>
                                 <td className="py-3.5 px-4 text-[#f9ebae] font-extrabold bg-[#f9ebae]/5">{row.pletto}</td>
                                 <td className="py-3.5 px-4 text-zinc-500">{row.legacy}</td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>
            </section>

            {/* FAQ Accordion Section */}
            <section id="faq" className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 space-y-6">
               <div className="text-center space-y-3 mb-8">
                  <div className="text-xs font-black uppercase tracking-widest text-[#f9ebae]">Frequently Asked Questions</div>
                  <h2 className="text-3xl font-extrabold text-white">Everything You Need to Know</h2>
               </div>

               <div className="space-y-3">
                  {[
                     {
                        q: "What is PLETTO?",
                        a: "PLETTO is a real-time team collaboration operating system combining Knowledge Documents, Channel Chat, 1-on-1 Direct Messages, and Interactive Whiteboards into one high-performance web platform.",
                     },
                     {
                        q: "Can I use Markdown for writing documentation?",
                        a: "Yes! PLETTO includes full Markdown support with toolbar snippets (H1-H3, code blocks, tables, task checkboxes) and live side-by-side split rendering.",
                     },
                     {
                        q: "How does the Whiteboard canvas work?",
                        a: "Our whiteboard provides pen tools, marker highlighters, sticky notes, flowchart boxes, arrows, text labels, undo/redo history, and 1-click PNG image export.",
                     },
                     {
                        q: "Is PLETTO free to use?",
                        a: "Yes! You can register a free account and start creating workspaces immediately.",
                     },
                  ].map((faq, idx) => (
                     <div
                        key={faq.q}
                        className="rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden transition"
                     >
                        <button
                           type="button"
                           onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                           className="w-full p-4 text-left text-sm font-bold text-white flex items-center justify-between gap-4"
                        >
                           <span>{faq.q}</span>
                           <HiChevronDown className={`transition-transform ${openFaq === idx ? "rotate-180 text-[#f9ebae]" : "text-zinc-500"}`} size={18} />
                        </button>
                        {openFaq === idx && (
                           <div className="px-4 pb-4 text-xs text-zinc-400 leading-relaxed border-t border-zinc-800/60 pt-3">
                              {faq.a}
                           </div>
                        )}
                     </div>
                  ))}
               </div>
            </section>

            {/* Bottom Call to Action Hero Banner */}
            <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
               <div className="rounded-3xl border border-[#f9ebae]/30 bg-gradient-to-r from-[#f9ebae]/10 via-zinc-950 to-zinc-950 p-8 sm:p-12 text-center space-y-6 shadow-2xl">
                  <h2 className="text-3xl sm:text-5xl font-black text-white">Ready to elevate your team's workflow?</h2>
                  <p className="text-sm text-zinc-400 max-w-xl mx-auto">
                     Join thousands of teams moving at high velocity with PLETTO. Launch your workspace in seconds.
                  </p>
                  <div className="pt-2">
                     <Link
                        to="/register"
                        className="inline-flex items-center gap-2 rounded-2xl bg-[#f9ebae] hover:bg-[#e6d695] px-8 py-4 text-sm font-black text-zinc-950 shadow-xl shadow-[#f9ebae]/20 transition hover:-translate-y-0.5"
                     >
                        <span>Create Free Workspace</span>
                        <HiArrowRight className="h-4 w-4" />
                     </Link>
                  </div>
               </div>
            </section>
         </main>

         {/* Footer */}
         <footer className="border-t border-zinc-800 bg-zinc-950 py-10">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
               <div className="flex items-center gap-3">
                  <Logo className="h-6" />
                  <span className="font-semibold text-zinc-300">PLETTO Workspace OS</span>
               </div>
               <div>© {new Date().getFullYear()} PLETTO. All rights reserved.</div>
            </div>
         </footer>
      </div>
   );
}
