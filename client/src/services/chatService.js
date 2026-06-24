import api from "./api";

export const getChannels = () => api.get("/chat/channels");
export const createChannel = (name) => api.post("/chat/channels", { name });
export const getMessages = (channelId) => api.get(`/chat/channels/${channelId}/messages`);
export const sendMessage = (channelId, text) => api.post(`/chat/channels/${channelId}/messages`, { text });
