export function PageShell({ title, subtitle, actions, children, className = "", compact = false }) {
   return (
      <section className={`rounded-[2rem] border border-border/80 bg-card/70 p-4 shadow-soft sm:p-6 ${className}`}>
         {(title || subtitle || actions) && (
            <div className={`mb-6 flex flex-col gap-4 ${compact ? "lg:flex-row lg:items-center lg:justify-between" : "lg:flex-row lg:items-end lg:justify-between"}`}>
               <div className="max-w-2xl">
                  {title ? <h2 className="text-2xl font-semibold text-white sm:text-3xl">{title}</h2> : null}
                  {subtitle ? <p className="mt-2 text-sm text-muted-foreground sm:text-base">{subtitle}</p> : null}
               </div>
               {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
            </div>
         )}
         {children}
      </section>
   );
}

export function Surface({ children, className = "", interactive = false }) {
   return (
      <div className={`rounded-[1.5rem] border border-border/70 bg-[rgba(255,255,255,0.04)] p-4 sm:p-5 ${interactive ? "transition hover:border-gold/30 hover:bg-[rgba(248,181,0,0.08)]" : ""} ${className}`}>
         {children}
      </div>
   );
}
