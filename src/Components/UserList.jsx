import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import socket from "../socket";

const API_URL = "https://workflo-backend-1.onrender.com";

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Get current user for socket.io
  const currentUser = useMemo(() => {
    try {
      const storedUser = JSON.parse(localStorage.getItem("user"));
      return storedUser && storedUser._id ? storedUser : null;
    } catch (err) {
      console.error("Invalid user data:", err);
      return null;
    }
  }, []);

  // Fetch users from API and setup socket
  useEffect(() => {
    if (!currentUser?._id) {
      setError("Please log in to view users.");
      return;
    }

    setLoading(true);
    axios
      .get(`${API_URL}/api/users`)
      .then((res) => {
        console.log("Fetched users:", res.data);
        setUsers(res.data.filter((user) => user._id !== currentUser._id)); // Exclude current user
        setError(null);
      })
      .catch((err) => {
        console.error("User fetch error:", err);
        setError(err.response?.status === 404 ? "No users found." : "Failed to fetch users.");
      })
      .finally(() => setLoading(false));

    socket.emit("addUser", currentUser._id);
    socket.on("updateOnlineUsers", (users) => {
      setOnlineUsers(users);
    });

    return () => {
      socket.off("updateOnlineUsers");
    };
  }, [currentUser?._id]);

  // Memoize online user lookup
  const onlineUserLookup = useMemo(() => {
    return onlineUsers.reduce((acc, u) => {
      acc[u.userId] = true;
      return acc;
    }, {});
  }, [onlineUsers]);

  // Filter users based on search input
  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(search.toLowerCase())
  );

  // Handle user click to start chat
  const handleUserClick = (user) => {
    console.log("Navigating to chat with user:", user);
    navigate(`/chats/${user._id}`, { state: { selectedUser: user } });
  };

  // Retry function for error
  const handleRetry = () => {
    setError(null);
    setLoading(true);
    axios
      .get(`${API_URL}/api/users`)
      .then((res) => {
        setUsers(res.data.filter((user) => user._id !== currentUser._id));
        setError(null);
      })
      .catch((err) => {
        console.error("User fetch error:", err);
        setError(err.response?.status === 404 ? "No users found." : "Failed to fetch users.");
      })
      .finally(() => setLoading(false));
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black">
        <div className="text-center">
          <p className="text-red-400 text-xl">⚠ Please log in to view users.</p>
          <Link to="/" className="mt-4 text-pink-400 hover:text-purple-400 font-semibold transition-colors duration-300">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black w-screen pb-[calc(4rem+env(safe-area-inset-bottom))]">
      <style>
        {`
          .glass-card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            transition: all 0.3s ease;
          }
          .glass-card:hover {
            transform: scale(1.02);
            box-shadow: 0 8px 24px rgba(236, 72, 153, 0.3);
          }
          .button-glow {
            background: linear-gradient(135deg, #ff7f50, #ff6347); /* Coral to tomato */
            transition: all 0.3s ease;
          }
          .button-glow:hover:not(:disabled) {
            background: linear-gradient(135deg, #ff8c60, #ff7057); /* Lighter coral to tomato */
            box-shadow: 0 8px 24px rgba(236, 72, 153, 0.5);
            transform: translateY(-2px);
          }
          .input-glow {
            transition: all 0.3s ease;
          }
          .input-glow:focus {
            box-shadow: 0 0 10px rgba(236, 72, 153, 0.8);
            border-color: #ec4899;
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

      <aside className="fixed top-0 left-0 w-80 h-full glass-card p-6 overflow-y-auto animate-slide-in-left">
        <h3 className="text-xl mb-4 font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-500 flex items-center">
          👥 Users
        </h3>

        <input
          type="text"
          placeholder="Search user..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full p-2 rounded-lg bg-gray-800/50 text-white input-glow focus:outline-none focus:ring-2 focus:ring-purple-500"
          aria-label="Search users"
        />

        {error && (
          <div className="mt-4 text-center">
            <p className="text-red-400 text-sm">{error}</p>
            <button
              onClick={handleRetry}
              className="mt-2 px-4 py-2 button-glow text-white rounded-lg"
              aria-label="Retry fetching users"
            >
              Try Again
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center mt-6">
            <svg
              className="w-8 h-8 loading-spinner text-pink-400"
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
          </div>
        ) : filteredUsers.length > 0 ? (
          <div className="mt-4 space-y-3">
            {filteredUsers.map((user) => (
              <div
                key={user._id}
                className="p-3 glass-card rounded-lg cursor-pointer hover:bg-pink-500/20 flex items-center justify-between transition-all duration-200 animate-slide-in-right"
                onClick={() => handleUserClick(user)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && handleUserClick(user)}
                aria-label={`Start chat with ${user.name}`}
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center text-sm mr-3 overflow-hidden">
                    {user.profileImage ? (
                      <img
                        src={user.profileImage}
                        alt={`${user.name}'s profile`}
                        className="w-full h-full object-cover"
                        onError={(e) => (e.target.src = "https://cdn-icons-png.flaticon.com/512/847/847969.png")}
                      />
                    ) : (
                      <span className="text-white">{user.name.charAt(0)}</span>
                    )}
                  </div>
                  <span className="text-white text-sm">{user.name}</span>
                </div>
                <div
                  className={`w-3 h-3 rounded-full ${
                    onlineUserLookup[user._id] ? "bg-green-400 animate-pulse" : "bg-gray-500"
                  }`}
                  aria-label={onlineUserLookup[user._id] ? "Online" : "Offline"}
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm mt-4">
            {search ? "No users found matching your search." : "No users available."}
          </p>
        )}
      </aside>
    </div>
  );
};

export default UserList;