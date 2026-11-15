export function Logo({ className = "", iconClassName = "", withText = true }) {
   return (
      <div className={`flex items-center gap-3 ${className}`}>
         <div className={`relative shrink-0 flex items-center justify-center rounded-xl border border-white/20 bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.15)] ${iconClassName || "h-8 w-8"}`}>
            <svg
               className="h-4 w-4 text-black"
               viewBox="0 0 24 24"
               fill="none"
               stroke="currentColor"
               strokeWidth="2.5"
               strokeLinecap="round"
               strokeLinejoin="round"
            >
               <polygon points="12 2 2 7 12 12 22 7 12 2" />
               <polyline points="2 17 12 22 22 17" />
               <polyline points="2 12 12 17 22 12" />
            </svg>
         </div>
         {withText && (
            <span className="text-sm sm:text-base font-black tracking-widest text-white uppercase font-mono">
               PLETTO
            </span>
         )}
      </div>
   );
}
