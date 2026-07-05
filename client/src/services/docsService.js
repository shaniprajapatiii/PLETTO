import api from "./api";

export const getDocs = () => api.get("/docs");
export const createDoc = (payload = { title: "Untitled document", content: "", type: "text" }) =>
   api.post("/docs", payload);
export const updateDoc = (id, payload) => api.put(`/docs/${id}`, payload);
