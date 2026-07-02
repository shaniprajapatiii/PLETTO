import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
   HiArrowRight as ArrowRight,
   HiChip as Cpu,
   HiGlobe as Globe,
   HiLockClosed as Lock,
   HiSparkles as Activity,
   HiWifi as Wifi,
   HiLightningBolt as Zap,
} from "react-icons/hi";
import { Logo } from "../../components/brand/Logo";
import { LiveCursors } from "../../components/realtime/LiveCursors";

const sections = [
   { label: "Product", href: "#product" },
   { label: "Realtime", href: "#realtime" },
   { label: "AI", href: "#ai" },
   { label: "Infra", href: "#infra" },
];

export default function Landing() {
   return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(248,181,0,0.12),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.08),transparent_20%),#020617] text-slate-100">
         <header className="sticky top-0 z-20 border-b border-white/10 bg-[#040404]/85 backdrop-blur-2xl">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
               <Link to="/" className="flex items-center gap-3 text-white">
                  <Logo className="h-10" />
               </Link>
               <nav className="hidden items-center gap-6 lg:flex">
                  {sections.map((section) => (
                     <a key={section.href} href={section.href} className="text-sm text-muted-foreground transition hover:text-white">
                        {section.label}
                     </a>
                  ))}
               </nav>
               <div className="flex items-center gap-3">
                  <Link to="/login" className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-muted-foreground transition hover:border-gold/40 hover:text-white">
                     Login
                  </Link>
                  <Link to="/register" className="inline-flex items-center gap-2 rounded-full bg-gradient-gold px-5 py-2 text-sm font-semibold text-[var(--noir-900)] shadow-[0_12px_30px_rgba(245,181,50,0.18)] transition hover:-translate-y-0.5">
                     Get started <ArrowRight className="h-4 w-4" />
                  </Link>
               </div>
            </div>
         </header>

         <main>
            <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
               <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(248,181,0,0.18),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.1),transparent_26%)]" />
               <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
                  <div className="space-y-8">
                     <div className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-[rgba(248,181,0,0.08)] px-4 py-2 text-[11px] uppercase tracking-[0.3em] text-gold font-mono">
                        Realtime collaboration OS
                     </div>
                     <div className="max-w-2xl">
                        <h1 className="font-display text-5xl font-semibold leading-tight text-white sm:text-6xl">
                           The future of work, <span className="text-gradient-gold">designed to feel effortless</span>.
                        </h1>
                        <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
                           PLETTO unifies docs, chat, boards, and live context into a calm, high-signal workspace built for fast-moving teams.
                        </p>
                     </div>
                     <div className="flex flex-col gap-4 sm:flex-row">
                        <Link to="/register" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-gold px-6 py-3 text-sm font-semibold text-[var(--noir-900)] shadow-[0_16px_40px_rgba(245,181,50,0.2)] transition hover:-translate-y-0.5">
                           Start your workspace <ArrowRight className="h-4 w-4" />
                        </Link>
                        <Link to="/login" className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-3 text-sm text-white transition hover:border-gold/40">
                           Sign in
                        </Link>
                     </div>

                     <div className="grid gap-4 sm:grid-cols-3">
                        {[
                           { label: "Realtime docs", value: "Live editing" },
                           { label: "Shared boards", value: "Fast ideation" },
                           { label: "Focused chat", value: "Always synced" },
                        ].map((item) => (
                           <div key={item.label} className="rounded-[1.2rem] border border-white/10 bg-white/[0.035] p-4 shadow-[0_10px_35px_rgba(0,0,0,0.22)]">
                              <div className="text-sm uppercase tracking-[0.18em] text-gold font-semibold font-mono">{item.label}</div>
                              <p className="mt-2 text-sm text-muted-foreground">{item.value}</p>
                           </div>
                        ))}
                     </div>
                  </div>

                  <div className="relative">
                     <div className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle,rgba(248,181,0,0.18),transparent_60%)] blur-3xl" />
                     <div className="relative rounded-[2rem] border border-white/10 bg-[#050505]/85 p-4 shadow-[0_25px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
                        <FeatureDiagram />
                     </div>
                  </div>
               </div>
            </section>

            <section id="product" className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
               <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
                  <div>
                     <div className="text-[11px] uppercase tracking-[0.25em] text-gold font-mono">Unified workspace</div>
                     <h2 className="mt-4 font-display text-4xl font-semibold leading-tight text-white sm:text-5xl">
                        The same logic, look, and flow — now in your own MERN deployment.
                     </h2>
                     <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">
                        We rebuilt the exact `team-weave` landing experience in the client app while preserving your application flow and adding MongoDB, Express, and JWT-backed auth.
                     </p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                     {[
                        { icon: <Activity className="h-5 w-5" />, title: "Live collaboration", desc: "Shared presence, messages, and updates across every workspace." },
                        { icon: <Zap className="h-5 w-5" />, title: "Fast sync", desc: "Optimized API and socket flows for team updates." },
                        { icon: <Cpu className="h-5 w-5" />, title: "Realtime canvas", desc: "Diagram and sketch content with everyone in view." },
                        { icon: <Lock className="h-5 w-5" />, title: "Secure auth", desc: "Workspace membership and secure token access." },
                     ].map((item) => (
                        <div key={item.title} className="rounded-3xl border border-border bg-card/70 p-6">
                           <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(248,181,0,0.14)] text-gold">{item.icon}</div>
                           <h3 className="mt-4 text-lg font-semibold text-white">{item.title}</h3>
                           <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
                        </div>
                     ))}
                  </div>
               </div>
            </section>

            <RealtimeShowcase />
            <AIShowcase />
            <InfraSection />
            <CTA />
            <Footer />
         </main>
      </div>
   );
}

function FeatureDiagram() {
   return (
      <div className="relative overflow-hidden rounded-[1.75rem] border border-border bg-[rgba(255,255,255,0.06)] p-6">
         <div className="absolute inset-0 grid-bg opacity-40" />
         <div className="relative grid gap-4">
            <div className="rounded-[1.4rem] border border-border/80 bg-[rgba(255,255,255,0.05)] p-5">
               <div className="flex items-center justify-between gap-3">
                  <div>
                     <div className="text-[11px] uppercase tracking-[0.3em] text-gold font-mono">Workspace overview</div>
                     <div className="mt-2 flex items-center gap-3 text-sm font-semibold text-white">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgba(248,181,0,0.22)] text-gold">PA</span>
                        <div>
                           <div>PLETTO team</div>
                           <div className="text-xs text-muted-foreground">4 active collaborators · Synced now</div>
                        </div>
                     </div>
                  </div>
                  <div className="rounded-full border border-gold/20 bg-[rgba(248,181,0,0.1)] px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-gold">
                     Live
                  </div>
               </div>
            </div>
            <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
               <div className="rounded-[1.3rem] border border-border bg-[rgba(255,255,255,0.04)] p-5">
                  <div className="text-sm font-semibold text-white">Today’s focus</div>
                  <div className="mt-3 space-y-2 text-[13px] text-muted-foreground">
                     <div className="rounded-2xl border border-border/60 bg-[rgba(255,255,255,0.03)] px-3 py-2">• Design review notes are updating in real time</div>
                     <div className="rounded-2xl border border-border/60 bg-[rgba(255,255,255,0.03)] px-3 py-2">• Shared whiteboard ideas are syncing instantly</div>
                     <div className="rounded-2xl border border-border/60 bg-[rgba(255,255,255,0.03)] px-3 py-2">• Chat threads stay connected to the workspace context</div>
                  </div>
               </div>
               <div className="relative rounded-[1.3rem] border border-border bg-[rgba(255,255,255,0.03)] p-5">
                  <div className="text-sm font-semibold text-white">Realtime presence</div>
                  <div className="mt-4 flex items-center gap-3">
                     {['A', 'K', 'M'].map((letter) => (
                        <div key={letter} className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/30 bg-[rgba(248,181,0,0.14)] text-sm font-semibold text-gold">
                           {letter}
                        </div>
                     ))}
                  </div>
                  <div className="mt-5 h-36 rounded-[1.2rem] bg-[rgba(255,255,255,0.02)] p-4 text-[12px] text-muted-foreground">
                     <LiveCursors />
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
}

function SectionHeader({ eyebrow, title, sub }) {
   return (
      <div className="max-w-3xl">
         <div className="text-[11px] uppercase tracking-[0.25em] text-gold font-mono">{eyebrow}</div>
         <h2 className="mt-3 font-display text-3xl font-semibold leading-[1.05] text-white sm:text-5xl">{title}</h2>
         <p className="mt-4 text-muted-foreground">{sub}</p>
      </div>
   );
}

function BentoCard({ icon, title, desc }) {
   return (
      <div className="group overflow-hidden rounded-3xl border border-border bg-card/70 p-6 transition hover:border-gold/40">
         <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-[rgba(248,181,0,0.16)] text-gold">{icon}</div>
         <div className="mt-4 text-lg font-semibold text-white">{title}</div>
         <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
      </div>
   );
}

function RealtimeShowcase() {
   return (
      <section id="realtime" className="mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-24">
         <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
               <SectionHeader
                  eyebrow="Realtime infrastructure"
                  title={<>Sub-frame sync across <span className="text-gradient-gold">every region</span>.</>}
                  sub="A global mesh of websocket gateways pushes operations through an in-app sync layer, so your presence and board state always stay aligned."
               />
               <div className="mt-8 space-y-4">
                  {[
                     { icon: <Wifi className="h-5 w-5" />, title: "Distributed presence", desc: "Heartbeats under 40ms and shared cursor state." },
                     { icon: <Zap className="h-5 w-5" />, title: "Fast operation streams", desc: "Optimistic updates, backend event reconciliation." },
                     { icon: <Activity className="h-5 w-5" />, title: "Self-healing sync", desc: "Conflict-free updates and automatic recovery." },
                  ].map((feature) => (
                     <div key={feature.title} className="flex gap-4 rounded-3xl border border-border bg-card/70 p-5">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(248,181,0,0.16)] text-gold">{feature.icon}</div>
                        <div>
                           <div className="font-semibold text-white">{feature.title}</div>
                           <p className="text-sm text-muted-foreground">{feature.desc}</p>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
            <div className="relative rounded-[2rem] border border-border bg-card/60 p-6 shadow-soft">
               <div className="absolute inset-0 grid-bg opacity-40" />
               <SyncDiagram />
            </div>
         </div>
      </section>
   );
}

function SyncDiagram() {
   const [radius, setRadius] = useState(95);

   return (
      <div className="relative aspect-square max-w-md mx-auto w-full overflow-hidden rounded-3xl border border-border bg-[rgba(255,255,255,0.04)]">
         <div className="absolute inset-0 grid-bg opacity-50" />
         <div className="absolute inset-0 grid place-items-center">
            <div className="relative h-36 w-36 rounded-full border border-gold/30 bg-[rgba(248,181,0,0.12)]">
               <div className="absolute inset-0 rounded-full animate-pulse-ring" />
               <div className="absolute inset-6 rounded-full bg-gradient-gold shadow-gold" />
            </div>
            {['NYC', 'SFO', 'FRA', 'SYD', 'TYO', 'SAO'].map((label, index) => {
               const angle = (index / 6) * Math.PI * 2;
               const x = Math.cos(angle) * radius;
               const y = Math.sin(angle) * radius;
               return (
                  <div
                     key={label}
                     className="absolute flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-2 text-[11px] text-muted-foreground"
                     style={{ transform: `translate(${x}px, ${y}px)`, left: '50%', top: '50%' }}
                  >
                     <span className="h-2 w-2 rounded-full bg-gold" />
                     {label}
                  </div>
               );
            })}
         </div>
         <ResizeWatcher onChange={setRadius} />
      </div>
   );
}

function ResizeWatcher({ onChange }) {
   useEffect(() => {
      const update = () => onChange(window.innerWidth >= 640 ? 125 : 90);
      update();
      window.addEventListener("resize", update);
      return () => window.removeEventListener("resize", update);
   }, [onChange]);
   return null;
}

function AIShowcase() {
   return (
      <section id="ai" className="mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-24">
         <SectionHeader
            eyebrow="AI collaboration"
            title={<>An assistant that lives <span className="text-gradient-gold">inside your workspace</span>.</>}
            sub="PLETTO surfaces relevant docs, chat history, and board context with an AI companion that understands your team flow."
         />
         <div className="mt-10 rounded-[2rem] border border-border bg-card/70 p-6 shadow-soft">
            <div className="grid gap-6 lg:grid-cols-2">
               <div className="space-y-3 rounded-3xl border border-border bg-[rgba(255,255,255,0.04)] p-6">
                  {[
                     { from: "you", text: "Summarize what was decided about the rollout." },
                     { from: "ai", text: "Progressive rollout starts at 5% EU-West, owner Mira, full ramp by Nov 12." },
                     { from: "you", text: "Draft a Slack update for #launch." },
                     { from: "ai", text: "✨ Launch update — starting Wed 5% EU-West, owner @mira, full ramp by 11/12." },
                  ].map((message, index) => (
                     <div
                        key={index}
                        className={`rounded-3xl px-4 py-3 text-sm ${message.from === 'ai' ? 'bg-gradient-gold/15 text-white ml-auto' : 'bg-[rgba(255,255,255,0.05)] text-muted-foreground'}`}
                     >
                        {message.text}
                     </div>
                  ))}
               </div>
               <div className="space-y-4">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-gold font-mono">Retrieved context</div>
                  {[
                     { title: "q4-launch.md", line: "Decision: progressive rollout, EU-West first." },
                     { title: "#launch · Mira", line: "I own the flag setup and metrics dash." },
                     { title: "Meeting · Nov 4", line: "Target full ramp by Nov 12." },
                     { title: "infra/flags.ts", line: "export const ROLLOUT_PCT = 0.05;" },
                  ].map((item) => (
                     <div key={item.title} className="rounded-3xl border border-border bg-[rgba(255,255,255,0.04)] p-4">
                        <div className="flex items-center gap-2 text-xs text-white">
                           <Activity className="h-3 w-3 text-gold" />
                           <span className="font-mono">{item.title}</span>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">{item.line}</p>
                     </div>
                  ))}
               </div>
            </div>
         </div>
      </section>
   );
}

function InfraSection() {
   return (
      <section id="infra" className="mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-24">
         <SectionHeader
            eyebrow="Built for scale"
            title={<>Engineered like <span className="text-gradient-gold">infrastructure</span>, not a webapp.</>}
            sub="Secure auth, auditing, storage, and global sync patterns make PLETTO ready for teams that need reliability by default."
         />
         <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
               { icon: <Globe className="h-5 w-5" />, title: "Multi-region", desc: "Edge-ready architecture and failover." },
               { icon: <Lock className="h-5 w-5" />, title: "E2E encryption", desc: "Protection for tokens, files, and events." },
               { icon: <Activity className="h-5 w-5" />, title: "Observability", desc: "Logs, metrics, and health insights." },
               { icon: <Cpu className="h-5 w-5" />, title: "Scale", desc: "Rooms, docs, and boards grow with your team." },
            ].map((card) => (
               <div key={card.title} className="rounded-3xl border border-border bg-card/70 p-6 transition hover:border-gold/40">
                  <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-[rgba(248,181,0,0.14)] text-gold">{card.icon}</div>
                  <h3 className="mt-4 text-lg font-semibold text-white">{card.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{card.desc}</p>
               </div>
            ))}
         </div>
      </section>
   );
}

function CTA() {
   return (
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-24">
         <div className="relative overflow-hidden rounded-[2rem] border border-gold/30 bg-[rgba(255,255,255,0.04)] p-10 text-center">
            <div className="absolute inset-0 grid-bg opacity-40" />
            <div className="relative">
               <h2 className="font-display text-4xl font-semibold text-white sm:text-5xl">
                  Step into the <span className="text-gradient-gold">living workspace</span>.
               </h2>
               <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
                  Spin up your team's PLETTO in seconds. Bring your docs, channels, whiteboards and workspace memory into one polished experience.
               </p>
               <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                  <Link to="/register" className="inline-flex items-center gap-2 rounded-2xl bg-gradient-gold px-6 py-3 text-sm font-semibold text-[var(--noir-900)] shadow-gold transition hover:-translate-y-0.5">
                     Launch workspace <ArrowRight className="h-4 w-4" />
                  </Link>
               </div>
            </div>
         </div>
      </section>
   );
}

function Footer() {
   return (
      <footer className="border-t border-white/10 py-10">
         <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 sm:px-6 md:flex-row md:items-center md:justify-between">
            <Logo />
            <div className="text-sm text-muted-foreground">© {new Date().getFullYear()} PLETTO Systems · Built for connected teams.</div>
         </div>
      </footer>
   );
}
