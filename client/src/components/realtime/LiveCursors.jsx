import { useEffect, useState } from "react";

const PEERS = [
   { id: "1", name: "Mira", color: "oklch(0.78 0.14 85)" },
   { id: "2", name: "Kenji", color: "oklch(0.72 0.16 30)" },
   { id: "3", name: "Ada", color: "oklch(0.78 0.16 160)" },
   { id: "4", name: "Léo", color: "oklch(0.70 0.20 290)" },
];

export function LiveCursors({ className = "" }) {
   const [cursors, setCursors] = useState(() =>
      PEERS.map((p, i) => ({
         ...p,
         x: 20 + i * 22,
         y: 30 + (i % 2) * 30,
         tx: 20 + i * 22,
         ty: 30 + (i % 2) * 30,
      })),
   );

   useEffect(() => {
      const retarget = () =>
         setCursors((cs) =>
            cs.map((c) => ({
               ...c,
               tx: 8 + Math.random() * 84,
               ty: 12 + Math.random() * 76,
            })),
         );
      retarget();
      const id = setInterval(retarget, 2400);
      return () => clearInterval(id);
   }, []);

   useEffect(() => {
      let raf = 0;
      const tick = () => {
         setCursors((cs) =>
            cs.map((c) => ({
               ...c,
               x: c.x + (c.tx - c.x) * 0.025,
               y: c.y + (c.ty - c.y) * 0.025,
            })),
         );
         raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
   }, []);

   return (
      <div className={`pointer-events-none absolute inset-0 ${className}`}>
         {cursors.map((c) => (
            <div key={c.id} className="absolute transition-none" style={{ left: `${c.x}%`, top: `${c.y}%` }}>
               <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M2 2L16 8.5L8.5 10L7 16L2 2Z" fill={c.color} stroke="oklch(0.08 0 0)" strokeWidth="1" strokeLinejoin="round" />
               </svg>
               <div className="mt-0.5 inline-block rounded-md px-1.5 py-0.5 text-[10px] font-medium text-[var(--noir-900)]" style={{ background: c.color }}>
                  {c.name}
               </div>
            </div>
         ))}
      </div>
   );
}
