import api from "./api";

// Channel APIs
export const getChannels = () => api.get("/chat/channels");
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

// Message features - Pinning
export const pinMessage = (messageId) => api.post(`/chat/messages/${messageId}/pin`);
export const unpinMessage = (messageId) => api.post(`/chat/messages/${messageId}/unpin`);
export const getPinnedMessages = (channelId) => api.get(`/chat/channels/${channelId}/pinned`);

// Message features - Reactions
export const addReaction = (messageId, emoji) => api.post(`/chat/messages/${messageId}/reactions`, { emoji });
export const removeReaction = (messageId, emoji) => api.delete(`/chat/messages/${messageId}/reactions`, { data: { emoji } });

// Thread APIs
export const getThreadReplies = (messageId) => api.get(`/chat/messages/${messageId}/thread`);
export const sendThreadReply = (channelId, text, threadParentId, attachments = []) =>
   api.post(`/chat/channels/${channelId}/messages`, { text, attachments, threadParentId });
