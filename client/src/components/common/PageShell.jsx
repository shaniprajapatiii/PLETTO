export function PageShell({ title, subtitle, actions, children, className = "", compact = false }) {
   return (
      <section className={`relative w-full max-w-full space-y-5 ${className}`}>
         {(title || subtitle || actions) && (
            <div className={`flex flex-col gap-3 pb-2 border-b border-zinc-800/60 ${compact ? "md:flex-row md:items-center md:justify-between" : "md:flex-row md:items-end md:justify-between"}`}>
               <div className="max-w-2xl">
                  {title ? <h1 className="text-xl font-semibold tracking-tight text-zinc-100 sm:text-2xl">{title}</h1> : null}
                  {subtitle ? <p className="mt-1 text-xs sm:text-sm text-zinc-400 leading-relaxed">{subtitle}</p> : null}
               </div>
               {actions ? <div className="flex flex-wrap items-center gap-2 shrink-0 sm:justify-end">{actions}</div> : null}
            </div>
         )}
         <div className="w-full max-w-full space-y-5">
            {children}
         </div>
      </section>
   );
}

export function Surface({ children, className = "", interactive = false }) {
   return (
      <div className={`rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-4 sm:p-5 backdrop-blur-sm transition-colors duration-150 ${interactive ? "hover:border-zinc-700 hover:bg-zinc-900/90" : ""} ${className}`}>
         {children}
      </div>
   );
}
