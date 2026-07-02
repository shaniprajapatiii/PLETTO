export function Logo({ className = "", withText = true }) {
   return (
      <div className={`flex items-center gap-2.5 ${className}`}>
         <div className="relative h-8 w-8 shrink-0">
            <div className="absolute inset-0 rounded-[14px] border border-gold/40 bg-[radial-gradient(circle_at_top_left,rgba(245,181,50,0.4),transparent_55%),rgba(255,255,255,0.04)] shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_12px_32px_rgba(0,0,0,0.28)]" />
            <div className="absolute inset-[2px] rounded-[12px] border border-white/10 bg-[linear-gradient(135deg,rgba(245,181,50,0.22),transparent)]" />
            <div className="absolute inset-0 flex items-center justify-center">
               <span className="font-display text-[12px] font-semibold tracking-[0.18em] text-gold">P</span>
            </div>
         </div>
         {withText && (
            <span className="font-display text-[15px] font-semibold tracking-[0.24em] text-white">
               PLETTO<span className="ml-0.5 text-gold">.</span>
            </span>
         )}
      </div>
   );
}
