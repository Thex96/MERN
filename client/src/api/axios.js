import axios from "axios";
import { appConfig } from "../config/appConfig";

const api = axios.create({
  baseURL: appConfig.apiUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("foodease_admin_token") || sessionStorage.getItem("foodease_token") || localStorage.getItem("foodease_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
