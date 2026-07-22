import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
   HiArrowRight as ArrowRight,
   HiDocumentText,
   HiChatAlt2,
   HiViewBoards,
   HiWifi as Wifi,
   HiShieldCheck,
   HiCollection,
   HiTrendingUp,
   HiMenu as MenuIcon,
   HiX as CloseIcon,
} from "react-icons/hi";
import { Logo } from "../../components/brand/Logo";

const sections = [
   { label: "Product", href: "#product" },
   { label: "Platform", href: "#platform" },
   { label: "Workflow", href: "#workflow" },
   { label: "Launch", href: "#launch" },
];

export default function Landing() {
   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

   return (
      <div
         className="relative min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,rgba(249,235,174,0.16),transparent_34%),#030303] text-slate-100"
         style={{
            backgroundImage:
               "linear-gradient(rgba(249, 235, 174, 0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(249, 235, 174, 0.045) 1px, transparent 1px), radial-gradient(circle at top left, rgba(249, 235, 174, 0.16), transparent 34%)",
            backgroundSize: "44px 44px, 44px 44px, auto",
         }}
      >
         <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(rgba(249,235,174,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(249,235,174,0.045)_1px,transparent_1px)] bg-[size:44px_44px]" />
         <header className="sticky top-0 z-30 px-4 py-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl rounded-full border border-white/10 bg-[#050505]/85 px-3 py-3 shadow-[0_20px_60px_rgba(0,0,0,0.32)] backdrop-blur-2xl">
               <div className="flex items-center justify-between gap-3">
                  <Link to="/" className="flex items-center gap-3 text-white">
                     <Logo className="h-9" />
                     <div className="hidden sm:block">
                        <div className="text-[10px] uppercase tracking-[0.3em] text-[#f9ebae]">PLETTO</div>
                        <div className="text-xs text-slate-400">Collaborative workspace</div>
                     </div>
                  </Link>

                  <nav className="hidden items-center gap-1 lg:flex">
                     {sections.map((section) => (
                        <a
                           key={section.href}
                           href={section.href}
                           className="rounded-full px-3 py-2 text-sm text-slate-400 transition hover:bg-white/5 hover:text-[#f9ebae]"
                        >
                           {section.label}
                        </a>
                     ))}
                  </nav>

                  <div className="hidden items-center gap-3 md:flex">
                     <Link
                        to="/login"
                        className="rounded-full border border-[#f9ebae]/20 bg-[#121212]/80 px-4 py-2 text-sm text-slate-300 transition hover:border-[#f9ebae]/45 hover:text-white"
                     >
                        Login
                     </Link>
                     <Link
                        to="/register"
                        className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#f9ebae] via-[#f9ebae] to-[#d8c46e] px-5 py-2 text-sm font-semibold text-[#140d03] shadow-[0_16px_40px_rgba(249,235,174,0.18)] transition hover:-translate-y-0.5"
                     >
                        Start free <ArrowRight className="h-4 w-4" />
                     </Link>
                  </div>

                  <button
                     type="button"
                     onClick={() => setMobileMenuOpen((value) => !value)}
                     className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-slate-300 transition hover:border-[#f9ebae]/30 hover:text-white md:hidden"
                     aria-label="Toggle navigation"
                     aria-expanded={mobileMenuOpen}
                  >
                     {mobileMenuOpen ? <CloseIcon className="h-4 w-4" /> : <MenuIcon className="h-4 w-4" />}
                  </button>
               </div>

               {mobileMenuOpen ? (
                  <div className="mt-3 rounded-[22px] border border-white/10 bg-[#0b0b0b]/95 p-3 md:hidden">
                     <nav className="flex flex-col gap-1">
                        {sections.map((section) => (
                           <a
                              key={section.href}
                              href={section.href}
                              onClick={() => setMobileMenuOpen(false)}
                              className="rounded-2xl px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5 hover:text-[#f9ebae]"
                           >
                              {section.label}
                           </a>
                        ))}
                     </nav>
                     <div className="mt-3 flex flex-col gap-2">
                        <Link
                           to="/login"
                           onClick={() => setMobileMenuOpen(false)}
                           className="rounded-2xl border border-[#f9ebae]/20 bg-[#121212]/80 px-4 py-2 text-center text-sm text-slate-300"
                        >
                           Login
                        </Link>
                        <Link
                           to="/register"
                           onClick={() => setMobileMenuOpen(false)}
                           className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#f9ebae] via-[#f9ebae] to-[#d8c46e] px-4 py-2 text-sm font-semibold text-[#140d03]"
                        >
                           Start free <ArrowRight className="h-4 w-4" />
                        </Link>
                     </div>
                  </div>
               ) : null}
            </div>
         </header>

         <main>
            <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
               <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(249,235,174,0.16),transparent_40%),linear-gradient(145deg,rgba(249,235,174,0.1),rgba(10,10,10,0.96))]" />
               <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
                  <div className="space-y-8">
                     <div className="max-w-2xl">
                        <div className="inline-flex items-center gap-2 rounded-full border border-[#f9ebae]/20 bg-[#121212]/70 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.24em] text-[#f9ebae] shadow-[0_8px_25px_rgba(0,0,0,0.2)]">
                           <span className="h-2 w-2 rounded-full bg-[#f9ebae]" />
                           Premium collaboration workspace
                        </div>
                        <h1 className="mt-5 font-display text-5xl font-semibold leading-tight text-white sm:text-6xl lg:text-7xl">
                           Create a workspace that feels <span className="text-[#f9ebae]">alive</span>.
                        </h1>
                        <p className="mt-6 max-w-xl text-lg leading-8 text-slate-400">
                           PLETTO brings docs, chat, boards, and live context together into one premium operating system for modern teams that ship with clarity.
                        </p>
                     </div>

                     <div className="flex flex-col gap-4 sm:flex-row">
                        <Link to="/register" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#f9ebae] via-[#f9ebae] to-[#d8c46e] px-6 py-3 text-sm font-semibold text-[#140d03] shadow-[0_20px_50px_rgba(249,235,174,0.2)] transition hover:-translate-y-0.5">
                           Create workspace <ArrowRight className="h-4 w-4" />
                        </Link>
                        <Link to="/login" className="inline-flex items-center justify-center rounded-2xl border border-[#f9ebae]/20 bg-[#121212]/80 px-6 py-3 text-sm text-white transition hover:border-[#f9ebae]/45">
                           Sign in
                        </Link>
                     </div>

                     <div className="rounded-[1.5rem] border border-[#f9ebae]/15 bg-[#121212]/70 p-4 shadow-[0_16px_45px_rgba(0,0,0,0.24)] backdrop-blur-sm">
                        <div className="grid gap-4 sm:grid-cols-3">
                           {[
                              { label: "Live sync", value: "Sub-40ms" },
                              { label: "Team scale", value: "Unlimited" },
                              { label: "Security", value: "Enterprise" },
                           ].map((item) => (
                              <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                                 <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">{item.label}</div>
                                 <div className="mt-1 text-lg font-semibold text-white">{item.value}</div>
                              </div>
                           ))}
                        </div>
                     </div>
                  </div>
                  <div className="relative">
                     <div className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle,rgba(249,235,174,0.16),transparent_60%)] blur-3xl" />
                     <div className="relative rounded-[2rem] border border-[#f9ebae]/15 bg-[#0f0f0f]/90 p-4 shadow-[0_40px_120px_rgba(0,0,0,0.5)] backdrop-blur-xl">
                        <AnimatedWorkspaceDiagram />
                     </div>
                  </div>
               </div>
            </section>

            <section id="product" className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
               <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                  <div className="rounded-[2rem] border border-[#f9ebae]/15 bg-[#111111]/90 p-8 shadow-[0_24px_80px_rgba(0,0,0,0.3)]">
                     <div className="text-[11px] uppercase tracking-[0.24em] text-[#f9ebae]">Unified workspace</div>
                     <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">
                        Replace fragmented tools with one calm, intelligent environment for every team decision.
                     </h2>
                     <p className="mt-5 text-base leading-8 text-slate-400">
                        Share knowledge, align on execution, and move from conception to delivery without leaving the flow of work.
                     </p>
                     <div className="mt-8 grid gap-4 sm:grid-cols-2">
                        {[
                           { title: "Real-time documents", body: "Edit with presence-aware context and automatic save." },
                           { title: "Collaborative boards", body: "Turn ideas into structured direction without friction." },
                           { title: "Native chat", body: "Keep decisions, ownership, and async context in one place." },
                           { title: "Secure by design", body: "Role-based access, audit trails, and resilient infrastructure." },
                        ].map((item) => (
                           <div key={item.title} className="rounded-2xl border border-[#f9ebae]/15 bg-[#121212]/80 p-4">
                              <div className="text-sm font-semibold text-white">{item.title}</div>
                              <p className="mt-2 text-sm leading-6 text-slate-400">{item.body}</p>
                           </div>
                        ))}
                     </div>
                  </div>
                  <div className="grid gap-4">
                     {[
                        { icon: <HiCollection className="h-5 w-5" />, title: "Flexible architecture", body: "Scale from small teams to global orgs without reworking your flow." },
                        { icon: <HiTrendingUp className="h-5 w-5" />, title: "Fewer context switches", body: "Keep product plans, design notes, and conversations connected." },
                        { icon: <HiShieldCheck className="h-5 w-5" />, title: "Reliability built in", body: "Fast recovery, observability, and audit-ready operations." },
                     ].map((item) => (
                        <div key={item.title} className="rounded-[1.6rem] border border-[#f9ebae]/15 bg-gradient-to-br from-[#161616] to-[#101010] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.24)]">
                           <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f9ebae]/10 text-[#f9ebae]">{item.icon}</div>
                           <div className="mt-4 text-lg font-semibold text-white">{item.title}</div>
                           <p className="mt-2 text-sm leading-6 text-slate-400">{item.body}</p>
                        </div>
                     ))}
                  </div>
               </div>
            </section>

            <section id="platform" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
               <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
                  <div>
                     <div className="text-[11px] uppercase tracking-[0.24em] text-[#f9ebae]">Realtime platform</div>
                     <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
                        A system designed for momentum.
                     </h2>
                     <p className="mt-5 max-w-xl text-base leading-8 text-slate-400">
                        Every interaction moves through a fast, resilient layer of presence, sync, and event processing so your team can stay focused on the work instead of the tooling.
                     </p>
                     <div className="mt-8 space-y-4">
                        {[
                           { title: "Presence-aware collaboration", body: "See who is thinking, editing, and responding in real time." },
                           { title: "Conflict-free updates", body: "Rapid, reliable changes without the usual coordination overhead." },
                           { title: "Live context everywhere", body: "Messages, docs, and boards stay linked to the same source of truth." },
                        ].map((item) => (
                           <div key={item.title} className="flex gap-4 rounded-2xl border border-[#f9ebae]/15 bg-[#121212]/80 p-4">
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#f9ebae]/10 text-[#f9ebae]">
                                 <Wifi className="h-5 w-5" />
                              </div>
                              <div>
                                 <div className="font-semibold text-white">{item.title}</div>
                                 <p className="mt-1 text-sm leading-6 text-slate-400">{item.body}</p>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
                  <div className="rounded-[2rem] border border-[#f9ebae]/15 bg-gradient-to-br from-[#151515] to-[#101010] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
                     <SyncDiagram />
                  </div>
               </div>
            </section>

            <section id="workflow" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
               <div className="rounded-[2rem] border border-[#f9ebae]/15 bg-[radial-gradient(circle_at_top,rgba(249,235,174,0.12),transparent_60%)] p-8 sm:p-10">
                  <div className="max-w-3xl">
                     <div className="text-[11px] uppercase tracking-[0.24em] text-[#f9ebae]">Workflow</div>
                     <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
                        Move from concept to launch without losing momentum.
                     </h2>
                     <p className="mt-5 text-base leading-8 text-slate-400">
                        Capture ideas, assign ownership, and turn them into execution plans in one place.
                     </p>
                  </div>
                  <div className="mt-10 grid gap-4 lg:grid-cols-3">
                     {[
                        { title: "Plan", body: "Draft specs, collect context, and align teams quickly." },
                        { title: "Build", body: "Bring product and engineering into the same live workspace." },
                        { title: "Launch", body: "Share progress, respond fast, and keep momentum visible." },
                     ].map((step, index) => (
                        <div key={step.title} className="rounded-[1.6rem] border border-[#f9ebae]/15 bg-[#121212]/90 p-6 shadow-[0_16px_40px_rgba(0,0,0,0.22)]">
                           <div className="text-sm font-semibold text-[#f9ebae]">0{index + 1}</div>
                           <div className="mt-3 text-lg font-semibold text-white">{step.title}</div>
                           <p className="mt-2 text-sm leading-6 text-slate-400">{step.body}</p>
                        </div>
                     ))}
                  </div>
               </div>
            </section>

            <section id="launch" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
               <div className="rounded-[2rem] border border-[#f9ebae]/20 bg-gradient-to-br from-[#f9ebae]/10 to-[#0f0f0f] p-8 sm:p-10 text-center">
                  <div className="text-[11px] uppercase tracking-[0.24em] text-[#f9ebae]">Ready when you are</div>
                  <h2 className="mt-3 text-3xl font-semibold text-white sm:text-5xl">
                     Create the operating system your team has been waiting for.
                  </h2>
                  <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-400">
                     Start with a polished workspace that feels as strong as your product vision.
                  </p>
                  <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                     <Link to="/register" className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#f9ebae] via-[#f9ebae] to-[#d8c46e] px-7 py-3 text-sm font-semibold text-[#140d03] shadow-[0_20px_50px_rgba(249,235,174,0.2)] transition hover:-translate-y-0.5">
                        Start free <ArrowRight className="h-4 w-4" />
                     </Link>
                     <Link to="/login" className="inline-flex items-center justify-center rounded-full border border-[#f9ebae]/20 bg-[#121212]/80 px-7 py-3 text-sm font-semibold text-white transition hover:border-[#f9ebae]/45">
                        Sign in
                     </Link>
                  </div>
               </div>
            </section>

            <Footer />
         </main>
      </div>
   );
}

function AnimatedWorkspaceDiagram() {
   return (
      <div className="relative overflow-hidden rounded-[1.6rem] border border-[#f9ebae]/15 bg-[#121212]/95 p-6">
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(249,235,174,0.12),transparent_55%)]" />
         <div className="relative grid gap-4">
            <div className="flex items-center justify-between rounded-2xl border border-[#f9ebae]/20 bg-[#f9ebae]/10 px-4 py-3">
               <div>
                  <div className="text-[11px] uppercase tracking-[0.25em] text-[#f9ebae]">Live workspace</div>
                  <div className="mt-1 text-sm font-semibold text-white">Context, collaboration, delivery</div>
               </div>
               <div className="rounded-full border border-[#f9ebae]/20 bg-[#0f0f0f]/90 px-3 py-1 text-xs uppercase tracking-[0.2em] text-[#f9ebae]">
                  Syncing
               </div>
            </div>
            <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
               <div className="rounded-[1.4rem] border border-[#f9ebae]/15 bg-[#0f0f0f]/90 p-5">
                  <div className="flex items-center gap-3">
                     <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f9ebae]/10 text-[#f9ebae]">
                        <HiDocumentText className="h-5 w-5" />
                     </div>
                     <div>
                        <div className="text-sm font-semibold text-white">Launch brief</div>
                        <div className="text-xs text-slate-400">Updated by 4 collaborators</div>
                     </div>
                  </div>
                  <div className="mt-4 space-y-2">
                     {["A new onboarding flow", "Shared research notes", "AI-ready summaries"].map((item) => (
                        <div key={item} className="rounded-2xl border border-[#f9ebae]/10 bg-[#161616]/80 px-3 py-2 text-sm text-slate-400">
                           {item}
                        </div>
                     ))}
                  </div>
               </div>
               <div className="space-y-3">
                  <div className="rounded-[1.4rem] border border-[#f9ebae]/15 bg-[#0f0f0f]/90 p-4">
                     <div className="flex items-center gap-2 text-sm font-semibold text-white">
                        <HiChatAlt2 className="h-4 w-4 text-[#f9ebae]" />
                        Team channels
                     </div>
                     <div className="mt-3 space-y-2">
                        {['Design', 'Engineering', 'Launch'].map((channel) => (
                           <div key={channel} className="rounded-2xl border border-[#f9ebae]/10 bg-[#161616]/80 px-3 py-2 text-sm text-slate-400">
                              {channel}
                           </div>
                        ))}
                     </div>
                  </div>
                  <div className="rounded-[1.4rem] border border-[#f9ebae]/15 bg-[#0f0f0f]/90 p-4">
                     <div className="flex items-center gap-2 text-sm font-semibold text-white">
                        <HiViewBoards className="h-4 w-4 text-[#f9ebae]" />
                        Whiteboard
                     </div>
                     <div className="relative mt-4 h-24 rounded-[1.2rem] border border-[#f9ebae]/20 bg-[radial-gradient(circle_at_center,rgba(249,235,174,0.16),transparent_70%)]">
                        <div className="absolute left-4 top-4 h-8 w-8 rounded-full border border-[#f9ebae]/30 bg-[#f9ebae]/10" />
                        <div className="absolute right-6 top-8 h-12 w-12 rounded-2xl border border-[#f9ebae]/20 bg-[#f9ebae]/10" />
                        <div className="absolute bottom-4 left-12 h-10 w-20 rounded-full border border-[#f9ebae]/20 bg-[#f9ebae]/10" />
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
}

function SyncDiagram() {
   const [radius, setRadius] = useState(108);

   return (
      <div className="relative mx-auto aspect-square w-full max-w-md overflow-hidden rounded-[1.8rem] border border-[#f9ebae]/15 bg-[#121212]/95 p-5">
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(249,235,174,0.16),transparent_55%)]" />
         <div className="absolute inset-0">
            <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#f9ebae]/20" />
            <div className="absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#f9ebae]/10" />
            <div className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-[#f9ebae]/30 to-[#d8c46e]/30 blur-3xl" />
         </div>
         <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative h-24 w-24 rounded-full border border-[#f9ebae]/30 bg-[#f9ebae]/10 shadow-[0_0_40px_rgba(249,235,174,0.16)]">
               <div className="absolute inset-0 rounded-full animate-pulse-ring" />
               <div className="absolute inset-5 rounded-full bg-gradient-to-r from-[#f9ebae] to-[#d8c46e]" />
            </div>
         </div>
         {['Docs', 'Chat', 'Boards', 'AI', 'Apps', 'Teams'].map((label, index) => {
            const angle = (index / 6) * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            return (
               <div
                  key={label}
                  className="absolute flex items-center gap-2 rounded-full border border-[#f9ebae]/15 bg-[#0f0f0f]/90 px-3 py-2 text-[11px] font-medium text-slate-300"
                  style={{ transform: `translate(${x}px, ${y}px)`, left: '50%', top: '50%' }}
               >
                  <span className="h-2 w-2 rounded-full bg-[#f9ebae]" />
                  {label}
               </div>
            );
         })}
         <div className="absolute inset-0">
            <div className="absolute left-1/2 top-1/2 h-[2px] w-full -translate-y-1/2 bg-gradient-to-r from-transparent via-[#f9ebae]/20 to-transparent" />
            <div className="absolute left-1/2 top-1/2 h-full w-[2px] -translate-x-1/2 bg-gradient-to-b from-transparent via-[#f9ebae]/20 to-transparent" />
         </div>
         <ResizeWatcher onChange={setRadius} />
      </div>
   );
}

function ResizeWatcher({ onChange }) {
   useEffect(() => {
      const update = () => onChange(window.innerWidth >= 640 ? 124 : 92);
      update();
      window.addEventListener("resize", update);
      return () => window.removeEventListener("resize", update);
   }, [onChange]);
   return null;
}

function Footer() {
   return (
      <footer className="border-t border-[#f9ebae]/15 bg-gradient-to-b from-[#121212]/80 to-transparent py-12 sm:py-16">
         <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 md:grid-cols-4 md:gap-10">
               <div className="md:col-span-2">
                  <Logo className="mb-4 h-8" />
                  <p className="max-w-sm text-sm leading-7 text-slate-400">
                     A modern workspace for teams that value clarity, speed, and thoughtful execution.
                  </p>
               </div>
               <div>
                  <div className="mb-4 text-[11px] uppercase tracking-[0.24em] text-[#f9ebae]">Product</div>
                  <div className="space-y-3 text-sm text-slate-400">
                     <div><a href="#product" className="transition hover:text-white">Overview</a></div>
                     <div><a href="#platform" className="transition hover:text-white">Platform</a></div>
                     <div><a href="#workflow" className="transition hover:text-white">Workflow</a></div>
                  </div>
               </div>
               <div>
                  <div className="mb-4 text-[11px] uppercase tracking-[0.24em] text-[#f9ebae]">Company</div>
                  <div className="space-y-3 text-sm text-slate-400">
                     <div><a href="#launch" className="transition hover:text-white">Launch</a></div>
                     <div><a href="#" className="transition hover:text-white">Privacy</a></div>
                     <div><a href="#" className="transition hover:text-white">Terms</a></div>
                  </div>
               </div>
            </div>
            <div className="mt-10 flex flex-col gap-3 border-t border-[#f9ebae]/15 pt-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
               <div>© {new Date().getFullYear()} PLETTO. Built for connected teams.</div>
               <div className="flex gap-5">
                  <a href="#" className="transition hover:text-white">Status</a>
                  <a href="#" className="transition hover:text-white">Contact</a>
                  <a href="#" className="transition hover:text-white">Security</a>
               </div>
            </div>
         </div>
      </footer>
   );
}
