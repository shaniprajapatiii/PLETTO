export function Logo({ className = "", iconClassName = "", withText = true }) {
   return (
      <div className={`flex items-center gap-2.5 ${className}`}>
         <div className={`relative shrink-0 flex items-center justify-center rounded-lg border border-zinc-700/80 bg-zinc-900 text-zinc-100 shadow-sm ${iconClassName || "h-7 w-7"}`}>
            <svg
               className="h-4 w-4 text-white"
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
            <span className="text-sm font-bold tracking-wider text-zinc-100 uppercase">
               PLETTO
            </span>
         )}
      </div>
   );
}
