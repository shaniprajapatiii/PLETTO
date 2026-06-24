import api from "./api";

export const getDocs = () => api.get("/docs");
export const createDoc = () => api.post("/docs", { title: "Untitled document", content: "" });
export const updateDoc = (id, payload) => api.put(`/docs/${id}`, payload);
