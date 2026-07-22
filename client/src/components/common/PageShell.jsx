export function PageShell({ title, subtitle, actions, children, className = "", compact = false }) {
   return (
      <section className={`relative overflow-hidden px-0 py-0 ${className}`}>
         <div className="space-y-6 px-0 py-0 sm:px-0 sm:py-0">
            {(title || subtitle || actions) && (
               <div className={`mb-6 flex flex-col gap-4 ${compact ? "lg:flex-row lg:items-center lg:justify-between" : "lg:flex-row lg:items-end lg:justify-between"}`}>
                  <div className="max-w-2xl px-0">
                     {title ? <h2 className="text-2xl font-semibold text-white sm:text-3xl">{title}</h2> : null}
                     {subtitle ? <p className="mt-2 text-sm text-muted-foreground sm:text-base">{subtitle}</p> : null}
                  </div>
                  {actions ? <div className="flex flex-wrap items-center gap-2 px-0">{actions}</div> : null}
               </div>
            )}
            <div className="space-y-6 px-0 pb-0">
               {children}
            </div>
         </div>
      </section>
   );
}

export function Surface({ children, className = "", interactive = false }) {
   return (
      <div className={`rounded-[20px] border border-white/10 bg-[rgba(255,255,255,0.045)] p-3 shadow-[0_18px_50px_rgba(0,0,0,0.2)] sm:p-4 ${interactive ? "transition hover:border-gold/30 hover:bg-[rgba(249,235,174,0.08)]" : ""} ${className}`}>
         {children}
      </div>
   );
}
