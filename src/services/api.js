import axios from "axios";

// Get API URL from .env file
const apiUrl = import.meta.env.VITE_API_URL;

const API = axios.create({
  baseURL: apiUrl,
});

export default API;
