export function PageShell({ title, subtitle, actions, children, className = "", compact = false }) {
   return (
      <section className={`rounded-[24px] border border-white/10 bg-[#060606]/80 p-3 shadow-soft backdrop-blur-xl sm:p-4 ${className}`}>
         {(title || subtitle || actions) && (
            <div className={`mb-4 flex flex-col gap-3 ${compact ? "lg:flex-row lg:items-center lg:justify-between" : "lg:flex-row lg:items-end lg:justify-between"}`}>
               <div className="max-w-2xl">
                  {title ? <h2 className="text-xl font-semibold text-white sm:text-2xl">{title}</h2> : null}
                  {subtitle ? <p className="mt-1 text-sm text-muted-foreground sm:text-[0.95rem]">{subtitle}</p> : null}
               </div>
               {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
            </div>
         )}
         {children}
      </section>
   );
}

export function Surface({ children, className = "", interactive = false }) {
   return (
      <div className={`rounded-[18px] border border-white/10 bg-[rgba(255,255,255,0.035)] p-3 sm:p-4 ${interactive ? "transition hover:border-gold/30 hover:bg-[rgba(248,181,0,0.08)]" : ""} ${className}`}>
         {children}
      </div>
   );
}
