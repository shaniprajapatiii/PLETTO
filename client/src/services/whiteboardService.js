import api from "./api";

export const getBoards = () => api.get("/whiteboards");
export const createBoard = (name) => api.post("/whiteboards", { name });
export const updateBoard = (id, payload) => api.put(`/whiteboards/${id}`, payload);
