import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { getWorkspaceMembers } from "../../services/workspaceService";
import { getAvatarSrc } from "../../utils/avatar";

export function PresenceStack() {
   const { user } = useAuth();
   const socket = useSocket();
   const [members, setMembers] = useState([]);
   const [onlineUserIds, setOnlineUserIds] = useState(new Set());

   const normalizeId = (val) => (val?._id || val)?.toString();

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

   // Socket presence tracking
   useEffect(() => {
      if (!socket) return;

      socket.emit("userOnline");

      if (user?._id) {
         setOnlineUserIds((prev) => new Set([...prev, normalizeId(user._id)]));
      }

      const handlePresenceUpdate = ({ userId, status }) => {
         setOnlineUserIds((prev) => {
            const next = new Set(prev);
            if (status === "online") {
               next.add(normalizeId(userId));
            } else {
               next.delete(normalizeId(userId));
            }
            return next;
         });
      };

      socket.on("presenceUpdate", handlePresenceUpdate);

      return () => {
         socket.off("presenceUpdate", handlePresenceUpdate);
      };
   }, [socket, user]);

   // Deduplicate and filter to ONLY real online members
   const activeOnlineMembers = useMemo(() => {
      const seen = new Set();
      const unique = members.filter((m) => {
         const id = normalizeId(m.userId || m._id);
         if (seen.has(id)) return false;
         seen.add(id);
         return true;
      });

      // Filter to only those currently connected via Socket or the current user
      const activeList = unique.filter((m) => {
         const id = normalizeId(m.userId || m._id);
         return onlineUserIds.has(id) || id === normalizeId(user?._id);
      });

      // Ensure current user is always included in active stack
      if (user?._id && !activeList.some((m) => normalizeId(m.userId || m._id) === normalizeId(user._id))) {
         activeList.unshift({
            _id: user._id,
            name: user.name || "You",
            email: user.email,
            avatar: user.avatar,
         });
      }

      return activeList;
   }, [members, onlineUserIds, user]);

   return (
      <div className="flex items-center gap-2.5 rounded-full border border-white/15 bg-black px-3.5 py-1.5 shadow-sm">
         <div className="flex -space-x-2">
            {activeOnlineMembers.slice(0, 4).map((person) => (
               <div
                  key={person._id || person.email}
                  title={`${person.name || person.email} (Online)`}
                  className="relative flex h-6 w-6 items-center justify-center overflow-hidden rounded-full border-2 border-black bg-[#161618] text-[9px] font-bold text-white shadow-sm"
               >
                  <img src={getAvatarSrc(person)} alt={person.name || "Member"} className="h-full w-full object-cover" />
                  <span className="absolute bottom-0 right-0 h-1.5 w-1.5 rounded-full bg-white ring-1 ring-black" />
               </div>
            ))}
         </div>

         <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
            <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
            <span>{activeOnlineMembers.length} active</span>
         </div>
      </div>
   );
}
