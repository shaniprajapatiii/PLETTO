import api from "./api";

export const getWorkspaceMembers = () => api.get("/workspace/members");
export const inviteWorkspaceMember = (email) => api.post("/workspace/members", { email });
