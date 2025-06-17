import axios from "axios";

const API = axios.create({
  baseURL: "https://workflo-backend-1.onrender.com",
});

export default API;
