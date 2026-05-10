import axios from "axios";

export const mediaUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('/')) return path;
    const apiBase = import.meta.env.VITE_API_URL || '';
    try {
        return `${new URL(apiBase).origin}/media/${path}`;
    } catch {
        return `/media/${path}`;
    }
};

const BASE_URL = import.meta.env.VITE_API_URL || "/api";

export const api = axios.create({ baseURL: BASE_URL });

export const authApi = axios.create({ baseURL: BASE_URL });

authApi.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
    failedQueue = [];
};

authApi.interceptors.response.use(
    (response) => response,
    async (error) => {
        const original = error.config;

        if (error.response?.status !== 401 || original._retry) {
            return Promise.reject(error);
        }

        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject });
            }).then((token) => {
                original.headers.Authorization = `Bearer ${token}`;
                return authApi(original);
            });
        }

        original._retry = true;
        isRefreshing = true;

        const refresh = localStorage.getItem("refresh");
        if (!refresh) {
            isRefreshing = false;
            localStorage.removeItem("token");
            window.location.href = "/";
            return Promise.reject(error);
        }

        try {
            const { data } = await api.post("/token/refresh/", { refresh });
            localStorage.setItem("token", data.access);
            if (data.refresh) localStorage.setItem("refresh", data.refresh);
            authApi.defaults.headers.common.Authorization = `Bearer ${data.access}`;
            processQueue(null, data.access);
            original.headers.Authorization = `Bearer ${data.access}`;
            return authApi(original);
        } catch (err) {
            processQueue(err, null);
            localStorage.removeItem("token");
            localStorage.removeItem("refresh");
            window.location.href = "/";
            return Promise.reject(err);
        } finally {
            isRefreshing = false;
        }
    }
);
