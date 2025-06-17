import io from "socket.io-client";

const API_URL = "https://workflo-backend-1.onrender.com";
const socket = io(API_URL, {
  autoConnect: false,
});

export default socket;