import axios from "axios"

export const api = axios.create({
  baseURL: "http://localhost:8000/api",
});

export const authApi = () => {
  const token = localStorage.getItem("token");
  return axios.create({
    baseURL: "http://localhost:8000/api",
    headers: { Authorization: `Bearer ${token}` },
  })
}
