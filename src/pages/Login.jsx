import React, { useState, useContext, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import socket from "../socket";
import { NotificationContext } from "../context/NotificationContext";
import { AuthContext } from "../context/AuthContext";

const API_URL = "https://workflo-backend-1.onrender.com"; // Consistent with UserProfile.jsx

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { notify } = useContext(NotificationContext);
  const { user, setUser } = useContext(AuthContext);

  // Emit userOnline event if user is already logged in
  useEffect(() => {
    if (user) {
      socket.emit("userOnline", user._id);
    }
  }, [user]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/login`, {
        username,
        password,
      });

      // Log the response data to check the structure
      console.log("Login response:", res.data);

      // Store both user and token in localStorage
      localStorage.setItem("user", JSON.stringify(res.data.user));
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userId", res.data.user._id);

      // Update AuthContext
      setUser(res.data.user);

      // Emit userOnline event
      socket.emit("userOnline", res.data.user._id);

      notify("Login successful!", "success");
      navigate("/profile");
    } catch (error) {
      console.error("Login error:", error.response?.data);
      const errorMessage = error.response?.data?.message || "Login failed. Please try again.";
      notify(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black flex items-center justify-center p-4 w-screen">
      <style>
        {`
          .glass-form {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            transition: all 0.3s ease;
          }
          .glass-form:hover {
            transform: scale(1.03);
            box-shadow: 0 10px 30px rgba(236, 72, 153, 0.3);
          }
          .input-glow {
            transition: all 0.3s ease;
          }
          .input-glow:focus {
            box-shadow: 0 0 10px rgba(236, 72, 153, 0.8);
          }
          .button-glow {
            background: linear-gradient(135deg, #ec4899, #8b5cf6); /* Pink-500 to Purple-500 */
            transition: all 0.3s ease;
          }
          .button-glow:hover:not(:disabled) {
            background: linear-gradient(135deg, #f472b6, #a78bfa); /* Lighter Pink and Purple */
            box-shadow: 0 8px 24px rgba(236, 72, 153, 0.5);
            transform: translateY(-2px);
          }
          .loading-spinner {
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}
      </style>

      <form
        onSubmit={handleLogin}
        className="glass-form p-8 rounded-2xl w-full max-w-md"
      >
        <h2 className="text-3xl font-extrabold text-center bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-500 mb-6 animate-pulse">
          🔒 Login
        </h2>
        <input
          type="text"
          placeholder="User Name"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="w-full mb-4 px-4 py-3 rounded-lg bg-gray-700/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 input-glow"
          disabled={loading}
          aria-label="Username"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full mb-6 px-4 py-3 rounded-lg bg-gray-700/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 input-glow"
          disabled={loading}
          aria-label="Password"
        />
        <button
          type="submit"
          className="w-full button-glow text-white font-semibold py-3 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
          disabled={loading}
        >
          {loading ? (
            <>
              <svg
                className="w-5 h-5 loading-spinner"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 12a8 8 0 1116 0A8 8 0 014 12z"
                />
              </svg>
              Logging in...
            </>
          ) : (
            "Login"
          )}
        </button>
        <Link
          to="/admin-login"
          className="text-center block text-pink-400 mt-4 hover:text-purple-400 font-semibold transition-colors duration-300"
          aria-label="Go to Admin Login"
        >
          🛠️ Admin Login
        </Link>
      </form>
    </div>
  );
}

export default Login;