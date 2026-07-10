import api from "./api";

// Presence APIs
export const getPresence = () => api.get("/presence");
export const updatePresence = (status, currentChannel = null) =>
   api.put("/presence", { status, currentChannel });
export const getUserPresence = (userId) => api.get(`/presence/users/${userId}`);
export const getOnlineUsers = () => api.get("/presence/online/list");
