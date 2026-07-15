import axios from "axios";

const fallbackApiUrl =
   typeof window !== "undefined" && window.location.hostname !== "localhost"
      ? `${window.location.protocol}//${window.location.hostname}/api`
      : "http://localhost:5000/api";

const api = axios.create({
   baseURL: import.meta.env.VITE_API_URL || fallbackApiUrl,
});

api.interceptors.request.use((config) => {
   const token = localStorage.getItem("token");

   if (token) {
      config.headers.Authorization = `Bearer ${token}`;
   }

   return config;
});

export default api;
