import api from "./api";

// Channel APIs
export const getChannels = (params) => api.get("/chat/channels", { params });
export const getCreatedChannels = () => api.get("/chat/channels/created");
export const createChannel = (payload) => api.post("/chat/channels", payload);
export const updateChannel = (channelId, payload) => api.put(`/chat/channels/${channelId}`, payload);
export const deleteChannel = (channelId) => api.delete(`/chat/channels/${channelId}`);

// Channel member management
export const addMember = (channelId, userId) =>
   api.post(`/chat/channels/${channelId}/members`, { userId });
export const removeMember = (channelId, userId) =>
   api.delete(`/chat/channels/${channelId}/members`, { data: { userId } });

// Channel muting
export const muteChannel = (channelId) => api.post(`/chat/channels/${channelId}/mute`);
export const unmuteChannel = (channelId) => api.post(`/chat/channels/${channelId}/unmute`);

// Message APIs
export const getMessages = (channelId) => api.get(`/chat/channels/${channelId}/messages`);
export const sendMessage = (channelId, text, attachments = []) =>
   api.post(`/chat/channels/${channelId}/messages`, { text, attachments });

// Message editing and deletion
export const editMessage = (messageId, text) => api.put(`/chat/messages/${messageId}`, { text });
export const deleteMessage = (messageId) => api.delete(`/chat/messages/${messageId}`);
export const deleteLatestMessage = (channelId) => api.delete(`/chat/channels/${channelId}/messages/latest`);

// Thread APIs
export const getThreadReplies = (messageId) => api.get(`/chat/messages/${messageId}/thread`);
export const sendThreadReply = (channelId, text, threadParentId, attachments = []) =>
   api.post(`/chat/channels/${channelId}/messages`, { text, attachments, threadParentId });
