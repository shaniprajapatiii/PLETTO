import { useMemo } from "react";
import { useAuth } from "../../context/AuthContext";

const PRESENCE = [
   { id: 1, name: "Mira", color: "#f8b500" },
   { id: 2, name: "Kenji", color: "#22c55e" },
   { id: 3, name: "Ada", color: "#38bdf8" },
];

export function PresenceStack() {
   const { user } = useAuth();
   const visible = useMemo(() => {
      const currentUser = user ? [{ id: user._id || "me", name: user.name || "You", color: "#ffffff" }] : [];
      return [...currentUser, ...PRESENCE].slice(0, 4);
   }, [user]);

   return (
      <div className="flex items-center gap-2 rounded-full border border-border bg-[rgba(255,255,255,0.04)] px-3 py-2">
         <div className="flex -space-x-2">
            {visible.map((person) => (
               <div
                  key={person.id}
                  title={person.name}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-[rgba(2,6,23,0.85)] text-[10px] font-semibold text-[var(--noir-900)]"
                  style={{ backgroundColor: person.color }}
               >
                  {person.name.slice(0, 1)}
               </div>
            ))}
         </div>
         <div className="text-xs text-muted-foreground">{visible.length} online</div>
      </div>
   );
}
