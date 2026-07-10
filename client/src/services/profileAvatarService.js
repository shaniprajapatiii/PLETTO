import api from "./api";

export const uploadProfileAvatar = (file) => {
   const formData = new FormData();
   formData.append("file", file);
   return api.post("/upload", formData);
};
