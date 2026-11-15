export function PageShell({ title, subtitle, actions, children, className = "", compact = false }) {
   return (
      <section className={`relative w-full max-w-full space-y-6 sm:space-y-8 ${className}`}>
         {(title || subtitle || actions) && (
            <div className={`flex flex-col gap-4 pb-4 border-b border-white/10 ${compact ? "md:flex-row md:items-center md:justify-between" : "md:flex-row md:items-end md:justify-between"}`}>
               <div className="max-w-3xl space-y-1">
                  {title ? (
                     <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
                        {title}
                     </h1>
                  ) : null}
                  {subtitle ? (
                     <p className="text-xs sm:text-sm text-neutral-400 font-normal leading-relaxed">
                        {subtitle}
                     </p>
                  ) : null}
               </div>
               {actions ? (
                  <div className="flex flex-wrap items-center gap-2.5 shrink-0 sm:justify-end">
                     {actions}
                  </div>
               ) : null}
            </div>
         )}
         <div className="w-full max-w-full space-y-6 sm:space-y-8">
            {children}
         </div>
      </section>
   );
}

export function Surface({ children, className = "", interactive = false }) {
   return (
      <div
         className={`rounded-2xl border border-white/10 bg-[#09090b] p-5 sm:p-7 backdrop-blur-md transition-all duration-200 shadow-xl ${
            interactive ? "hover:border-white/30 hover:bg-[#111114] cursor-pointer" : ""
         } ${className}`}
      >
         {children}
      </div>
   );
}
