import api from "./api";

export const getChannels = () => api.get("/chat/channels");
export const createChannel = (payload) => api.post("/chat/channels", payload);
export const getMessages = (channelId) => api.get(`/chat/channels/${channelId}/messages`);
export const sendMessage = (channelId, text) => api.post(`/chat/channels/${channelId}/messages`, { text });
