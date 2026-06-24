export function Logo({ className = "", withText = true }) {
   return (
      <div className={`flex items-center gap-2.5 ${className}`}>
         <div className="relative h-7 w-7">
            <div className="absolute inset-0 rounded-md bg-gradient-gold shadow-gold" />
            <div className="absolute inset-[3px] rounded-[5px] bg-[var(--noir-900)] flex items-center justify-center">
               <span className="font-display text-[11px] font-bold text-gradient-gold">P</span>
            </div>
         </div>
         {withText && (
            <span className="font-display text-[15px] font-semibold tracking-tight">
               PLETTO<span className="text-gold">.</span>
            </span>
         )}
      </div>
   );
}
