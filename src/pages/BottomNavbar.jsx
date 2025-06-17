import React from "react";
import { FaUser, FaSearch, FaCommentDots, FaPlusCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const BottomNavbar = ({ posts }) => {
  const navigate = useNavigate();

  // Ensure posts is an array before trying to access length
  const postCount = Array.isArray(posts) ? posts.length : 0;

  return (
    <div className="fixed bottom-0 left-0 w-screen text-white flex justify-around z-50">
      <style>
        {`
          .navbar-glass {
            background: rgba(17, 24, 39, 0.95); /* Tailwind's gray-900 with higher opacity */
            backdrop-filter: blur(12px);
            border-top: 1px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.3);
            padding-bottom: env(safe-area-inset-bottom); /* Handle iOS safe area */
          }
          .nav-button {
            transition: all 0.3s ease;
          }
          .nav-button:hover, .nav-button:focus {
            transform: translateY(-2px);
            color: #f472b6; /* Tailwind's pink-400 */
          }
          .add-button {
            transition: all 0.3s ease;
            background: linear-gradient(135deg, #ec4899, #8b5cf6); /* Pink-500 to Purple-500 */
          }
          .add-button:hover, .add-button:focus {
            transform: scale(1.1) rotate(90deg);
            box-shadow: 0 8px 24px rgba(236, 72, 153, 0.5);
          }
          .badge-pulse {
            animation: pulse 1.5s ease-in-out infinite;
          }
          @keyframes pulse {
            0% {
              transform: scale(1);
              box-shadow: 0 0 5px rgba(236, 72, 153, 0.5);
            }
            50% {
              transform: scale(1.2);
              box-shadow: 0 0 15px rgba(236, 72, 153, 0.8);
            }
            100% {
              transform: scale(1);
              box-shadow: 0 0 5px rgba(236, 72, 153, 0.5);
            }
          }
        `}
      </style>

      <div className="navbar-glass w-full flex justify-evenly items-center px-4 py-3">
        <button
          onClick={() => navigate("/data")}
          className="nav-button flex flex-col items-center gap-1 p-3"
          aria-label="Go to Profile"
        >
          <FaUser className="text-2xl" />
          <span className="text-sm font-medium">Profile</span>
        </button>

        <button
          onClick={() => navigate("/search")}
          className="nav-button flex flex-col items-center gap-1 p-3"
          aria-label="Go to Search"
        >
          <FaSearch className="text-2xl" />
          <span className="text-sm font-medium">Search</span>
        </button>

        <button
          onClick={() => navigate("/add")}
          className="add-button p-4 rounded-full -mt-8 border-4 border-white/90"
          aria-label="Add New Post"
        >
          <FaPlusCircle className="text-white text-3xl" />
        </button>

        <div className="relative flex flex-col items-center">
          <button
            onClick={() => navigate("/chats")}
            className="nav-button flex flex-col items-center gap-1 p-3"
            aria-label={`Go to Chats${postCount > 0 ? ` with ${postCount} new messages` : ""}`}
          >
            <FaCommentDots className="text-2xl" />
            <span className="text-sm font-medium">Chats</span>
          </button>

          {postCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center badge-pulse">
              {postCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default BottomNavbar;