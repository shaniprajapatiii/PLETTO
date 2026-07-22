export function PageShell({ title, subtitle, actions, children, className = "", compact = false }) {
   return (
      <section className={`relative w-full max-w-full space-y-6 ${className}`}>
         {(title || subtitle || actions) && (
            <div className={`flex flex-col gap-4 ${compact ? "sm:flex-row sm:items-center sm:justify-between" : "sm:flex-row sm:items-end sm:justify-between"}`}>
               <div className="max-w-2xl">
                  {title ? <h1 className="text-2xl font-bold tracking-tight text-zinc-100 sm:text-3xl">{title}</h1> : null}
                  {subtitle ? <p className="mt-1.5 text-sm text-zinc-400 sm:text-base leading-relaxed">{subtitle}</p> : null}
               </div>
               {actions ? <div className="flex flex-wrap items-center gap-2.5 shrink-0">{actions}</div> : null}
            </div>
         )}
         <div className="w-full max-w-full space-y-6">
            {children}
         </div>
      </section>
   );
}

export function Surface({ children, className = "", interactive = false }) {
   return (
      <div className={`rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-4 sm:p-5 backdrop-blur-md transition-all duration-200 ${interactive ? "hover:border-indigo-500/40 hover:bg-zinc-900/80 hover:shadow-lg hover:shadow-indigo-500/5" : ""} ${className}`}>
         {children}
      </div>
   );
}

