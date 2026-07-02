import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getWorkspaceMembers } from "../../services/workspaceService";

export function PresenceStack() {
   const { user } = useAuth();
   const [members, setMembers] = useState([]);

   useEffect(() => {
      const loadMembers = async () => {
         try {
            const response = await getWorkspaceMembers();
            setMembers(response.data.members || []);
         } catch {
            setMembers([]);
         }
      };

      loadMembers();
   }, []);

   const visible = useMemo(() => {
      const currentUser = user ? [{ id: user._id || "me", name: user.name || "You", color: "#ffffff" }] : [];
      const workspaceMembers = members.map((member) => ({
         id: member._id || member.email || member.name,
         name: member.name || member.email || "Member",
         color: ["#f8b500", "#38bdf8", "#22c55e", "#f472b6"][Math.abs((member._id || member.email || "").length) % 4],
      }));
      return [...currentUser, ...workspaceMembers].slice(0, 4);
   }, [members, user]);

   return (
      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2">
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
         <div className="text-xs text-muted-foreground">{visible.length} active</div>
      </div>
   );
}
