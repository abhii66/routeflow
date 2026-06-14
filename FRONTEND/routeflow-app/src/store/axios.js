import axios from "axios";

const api = axios.create({
  baseURL: "https://routeflow-backend-9l4m.onrender.com",
  withCredentials: true,
});

export default api;
