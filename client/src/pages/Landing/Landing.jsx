import { useState } from "react";
import { Link } from "react-router-dom";
import {
   HiArrowRight,
   HiChatAlt2,
   HiMenu,
   HiX,
   HiUsers,
   HiChevronDown,
   HiViewGrid,
   HiShieldCheck,
   HiLockClosed,
   HiSparkles,
   HiOutlineLightningBolt,
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
   const [activeTab, setActiveTab] = useState("chat");
   const [openFaq, setOpenFaq] = useState(0);

   return (
      <div className="min-h-screen bg-black text-white app-grid-bg flex flex-col">
         {/* Floating Monochromatic Top Nav Bar */}
         <header className="sticky top-4 sm:top-6 z-50 px-4 sm:px-8 w-full flex flex-col items-center pointer-events-none">
            <div className="pointer-events-auto mx-auto w-full max-w-6xl rounded-2xl border border-white/20 bg-black/90 px-5 sm:px-8 py-3.5 flex items-center justify-between gap-4 backdrop-blur-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] ring-1 ring-white/10 transition-all">
               <Link to="/" className="flex items-center gap-3 text-white">
                  <Logo />
               </Link>

               <nav className="hidden items-center gap-2 lg:flex">
                  {sections.map((section) => (
                     <a
                        key={section.href}
                        href={section.href}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-400 transition hover:text-white hover:bg-white/10"
                     >
                        {section.label}
                     </a>
                  ))}
               </nav>

               <div className="hidden items-center gap-3 md:flex">
                  <Link
                     to="/login"
                     className="btn-dark px-5 py-2 text-xs font-bold"
                  >
                     Sign In
                  </Link>
                  <Link
                     to="/register"
                     className="btn-white px-5 py-2 text-xs font-bold flex items-center gap-1.5"
                  >
                     <span>Get Started</span>
                     <HiArrowRight className="h-4 w-4" />
                  </Link>
               </div>

               <button
                  type="button"
                  onClick={() => setMobileMenuOpen((value) => !value)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-[#121214] text-white transition hover:bg-white/15 md:hidden"
                  aria-label="Toggle navigation"
               >
                  {mobileMenuOpen ? <HiX className="h-5 w-5" /> : <HiMenu className="h-5 w-5" />}
               </button>
            </div>

            {/* Mobile Dropdown */}
            {mobileMenuOpen && (
               <div className="pointer-events-auto mt-2 w-full max-w-md rounded-2xl border border-white/20 bg-black p-5 shadow-2xl backdrop-blur-2xl md:hidden space-y-4">
                  <nav className="flex flex-col gap-1.5">
                     {sections.map((section) => (
                        <a
                           key={section.href}
                           href={section.href}
                           onClick={() => setMobileMenuOpen(false)}
                           className="rounded-xl px-4 py-2.5 text-xs font-bold text-neutral-300 hover:bg-white/10 hover:text-white transition"
                        >
                           {section.label}
                        </a>
                     ))}
                  </nav>
                  <div className="pt-3 border-t border-white/10 flex flex-col gap-2.5">
                     <Link
                        to="/login"
                        onClick={() => setMobileMenuOpen(false)}
                        className="btn-dark py-2.5 text-center text-xs font-bold"
                     >
                        Sign In
                     </Link>
                     <Link
                        to="/register"
                        onClick={() => setMobileMenuOpen(false)}
                        className="btn-white py-2.5 text-center text-xs font-bold flex items-center justify-center gap-2"
                     >
                        <span>Get Started Free</span>
                        <HiArrowRight className="h-4 w-4" />
                     </Link>
                  </div>
               </div>
            )}
         </header>

         {/* Hero Section */}
         <main className="flex-1">
            <section className="px-4 pt-20 sm:pt-28 pb-20 sm:px-6 lg:px-8 text-center">
               <div className="mx-auto max-w-5xl space-y-8">
                  <div className="inline-flex items-center gap-2.5 rounded-full border border-white/20 bg-[#09090b] px-4 py-1.5 text-xs font-mono font-bold text-white shadow-sm">
                     <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                     <span>ULTRAFAST COLLABORATION ENGINE</span>
                  </div>

                  <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.08]">
                     Streamline team discussions with pure clarity.
                  </h1>

                  <p className="mx-auto max-w-3xl text-base sm:text-xl leading-relaxed text-neutral-400 font-normal">
                     Real-time channels, direct messaging, and centralized team directories designed with precision, speed, and uncompromising contrast.
                  </p>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                     <Link
                        to="/register"
                        className="btn-white w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 text-sm font-bold shadow-xl"
                     >
                        <span>Start Workspace Free</span>
                        <HiArrowRight className="h-4 w-4" />
                     </Link>

                     <Link
                        to="/login"
                        className="btn-dark w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-bold"
                     >
                        <span>Sign In</span>
                     </Link>
                  </div>

                  {/* Big Metrics Bar */}
                  <div className="pt-12 max-w-4xl mx-auto">
                     <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 sm:p-6 big-card">
                        {[
                           { label: "Socket Sync", value: "Realtime" },
                           { label: "Presence", value: "Live Dot" },
                           { label: "Messaging", value: "Channels & DM" },
                           { label: "Interface", value: "Pure OLED B&W" },
                        ].map((stat) => (
                           <div key={stat.label} className="p-3 text-center space-y-1">
                              <div className="text-[11px] font-mono font-bold text-neutral-400 uppercase tracking-wider">{stat.label}</div>
                              <div className="text-base sm:text-lg font-black text-white">{stat.value}</div>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            </section>

            {/* Interactive Feature Simulator Section (Big Card) */}
            <section id="preview" className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
               <div className="text-center space-y-3 mb-10">
                  <div className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider">Preview</div>
                  <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Explore the Experience</h2>
                  <p className="text-sm text-neutral-400 max-w-md mx-auto">
                     Toggle between views to test the interface components.
                  </p>

                  <div className="flex flex-wrap items-center justify-center gap-2 pt-3">
                     {[
                        { id: "chat", label: "Channels", icon: <HiChatAlt2 size={16} /> },
                        { id: "dm", label: "Direct Messages", icon: <HiUsers size={16} /> },
                     ].map((tab) => (
                        <button
                           key={tab.id}
                           type="button"
                           onClick={() => setActiveTab(tab.id)}
                           className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition ${
                              activeTab === tab.id
                                 ? "bg-white text-black shadow-md"
                                 : "border border-white/15 bg-black text-neutral-400 hover:text-white"
                           }`}
                        >
                           {tab.icon}
                           <span>{tab.label}</span>
                        </button>
                     ))}
                  </div>
               </div>

               {/* Mockup Preview Big Card Shell */}
               <div className="big-card p-6 sm:p-8 shadow-2xl">
                  <div className="flex items-center justify-between pb-4 border-b border-white/10 text-xs">
                     <div className="flex items-center gap-2.5">
                        <span className="h-3 w-3 rounded-full bg-white/30" />
                        <span className="h-3 w-3 rounded-full bg-white/30" />
                        <span className="h-3 w-3 rounded-full bg-white/30" />
                        <span className="font-mono text-neutral-400 text-xs ml-3">pletto.internal/{activeTab}</span>
                     </div>

                     <span className="badge-bw px-3 py-0.5 text-[10px] font-mono uppercase">
                        Live Preview
                     </span>
                  </div>

                  <div className="pt-6 min-h-[260px]">
                     {activeTab === "chat" && (
                        <div className="space-y-4">
                           <div className="flex items-center justify-between pb-3 border-b border-white/10">
                              <h3 className="font-bold text-sm text-white"># engineering-team</h3>
                              <span className="text-xs font-mono text-neutral-400">12 members</span>
                           </div>
                           <div className="space-y-3">
                              {[
                                 { user: "Sarah Chen", text: "The new pure black and white layout has been verified across all desktop and mobile viewports.", time: "10:42 AM" },
                                 { user: "Marcus Vance", text: "Verified. Typography contrast and card responsiveness look exceptional.", time: "10:44 AM" },
                              ].map((m) => (
                                 <div key={m.user} className="p-4 rounded-xl border border-white/10 bg-black text-xs sm:text-sm space-y-1.5">
                                    <div className="flex justify-between font-bold text-white">
                                       <span>{m.user}</span>
                                       <span className="text-xs text-neutral-500 font-mono font-normal">{m.time}</span>
                                    </div>
                                    <p className="text-neutral-300">{m.text}</p>
                                 </div>
                              ))}
                           </div>
                        </div>
                     )}

                     {activeTab === "dm" && (
                        <div className="space-y-4">
                           <div className="flex items-center gap-2.5 pb-3 border-b border-white/10">
                              <span className="h-2.5 w-2.5 rounded-full bg-white animate-pulse" />
                              <h3 className="font-bold text-sm text-white">Alex Morgan</h3>
                              <span className="text-xs text-neutral-400 font-mono">Online</span>
                           </div>
                           <div className="space-y-3">
                              <div className="p-4 rounded-2xl bg-[#0e0e12] border border-white/15 text-xs sm:text-sm text-white max-w-md">
                                 Can you review the updated channel cards when you get a chance?
                              </div>
                              <div className="p-4 rounded-2xl bg-white text-black font-semibold text-xs sm:text-sm max-w-md ml-auto shadow-md">
                                 Reviewing it right now. Looks crisp and clean.
                              </div>
                           </div>
                        </div>
                     )}
                  </div>
               </div>
            </section>

            {/* Features Big Cards Section */}
            <section id="features" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
               <div className="text-center space-y-3 mb-12">
                  <div className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider">Features</div>
                  <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Everything for Modern Collaboration</h2>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                     {
                        icon: <HiChatAlt2 className="text-black" size={24} />,
                        title: "Discussion Channels",
                        desc: "Public and private rooms with threaded replies, creator management, and real-time live typing notifications.",
                     },
                     {
                        icon: <HiUsers className="text-black" size={24} />,
                        title: "Direct Messages",
                        desc: "1-on-1 private messaging with live presence status, unread counters, and message deletion capabilities.",
                     },
                     {
                        icon: <HiViewGrid className="text-black" size={24} />,
                        title: "Workspace Directory",
                        desc: "Filter and manage all team members, assign workspace roles, and search channels instantly.",
                     },
                  ].map((card) => (
                     <div
                        key={card.title}
                        className="big-card-interactive p-7 space-y-4"
                     >
                        <div className="p-3 rounded-xl bg-white w-fit shadow-md">{card.icon}</div>
                        <h3 className="font-bold text-lg text-white">{card.title}</h3>
                        <p className="text-sm text-neutral-400 leading-relaxed">{card.desc}</p>
                     </div>
                  ))}
               </div>
            </section>

            {/* FAQ Big Card Section */}
            <section id="faq" className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 space-y-6">
               <div className="text-center space-y-3 mb-8">
                  <div className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider">FAQ</div>
                  <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Frequently Asked Questions</h2>
               </div>

               <div className="space-y-3">
                  {[
                     {
                        q: "What is PLETTO?",
                        a: "PLETTO is a real-time collaborative workspace combining team discussion channels, direct messaging, and a unified team roster with pure black-and-white minimalist design.",
                     },
                     {
                        q: "How does real-time communication work?",
                        a: "PLETTO uses a Socket.IO real-time engine to provide instant message delivery, live presence indicators, and typing status without page refreshes.",
                     },
                     {
                        q: "How are channels organized?",
                        a: "Workspaces support both public channels (visible to all team members) and private channels with restricted access.",
                     },
                  ].map((faq, idx) => (
                     <div
                        key={faq.q}
                        className="big-card overflow-hidden"
                     >
                        <button
                           type="button"
                           onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                           className="w-full p-5 text-left text-sm font-bold text-white flex items-center justify-between gap-4"
                        >
                           <span>{faq.q}</span>
                           <HiChevronDown className={`transition-transform text-neutral-400 ${openFaq === idx ? "rotate-180" : ""}`} size={20} />
                        </button>
                        {openFaq === idx && (
                           <div className="px-5 pb-5 text-xs sm:text-sm text-neutral-400 leading-relaxed border-t border-white/10 pt-3">
                              {faq.a}
                           </div>
                        )}
                     </div>
                  ))}
               </div>
            </section>

            {/* Bottom Call to Action Big Card */}
            <section className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
               <div className="big-card p-8 sm:p-14 text-center space-y-6 bg-gradient-to-b from-[#111114] to-black">
                  <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">Ready to collaborate with clarity?</h2>
                  <p className="text-sm sm:text-base text-neutral-400 max-w-xl mx-auto">
                     Join thousands of modern teams building faster with PLETTO. Free setup, no credit card required.
                  </p>
                  <div className="pt-2">
                     <Link
                        to="/register"
                        className="btn-white inline-flex items-center gap-2.5 px-8 py-3.5 text-sm font-bold shadow-xl"
                     >
                        <span>Create Your Workspace</span>
                        <HiArrowRight className="h-4 w-4" />
                     </Link>
                  </div>
               </div>
            </section>
         </main>

         {/* Footer */}
         <footer className="border-t border-white/10 bg-black py-10">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-neutral-500">
               <div className="flex items-center gap-3">
                  <Logo />
               </div>
               <div>© {new Date().getFullYear()} PLETTO WORKSPACE. ALL RIGHTS RESERVED.</div>
            </div>
         </footer>
      </div>
   );
}
