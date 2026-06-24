import api from "./api";

export const updateProfile = (payload) => api.put("/profile", payload);
