/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
   const { workspace, user, loading } = useAuth();

   const socket = useMemo(() => {
      if (loading || !workspace || !user) {
         return null;
      }

      const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const socketBase = apiBase.replace(/\/api\/?$/, "");
      const nextSocket = io(socketBase, {
         auth: {
            token: localStorage.getItem("token"),
         },
         reconnection: true,
         reconnectionDelay: 1000,
         reconnectionDelayMax: 5000,
         reconnectionAttempts: 5,
      });

      return nextSocket;
   }, [loading, workspace, user]);

   useEffect(() => {
      if (!socket) return;

      socket.on("connect", () => {
         console.log("Socket connected");
         socket.emit("userOnline");
      });

      socket.on("connect_error", (error) => {
         console.error("Socket connection error:", error);
      });

      socket.on("disconnect", () => {
         console.log("Socket disconnected");
      });

      return () => {
         socket.off("connect");
         socket.off("connect_error");
         socket.off("disconnect");
         socket.disconnect();
      };
   }, [socket]);

   return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}

export function useSocket() {
   return useContext(SocketContext);
}
