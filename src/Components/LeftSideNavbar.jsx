import React from "react";
import { FaUser, FaSearch, FaCommentDots, FaPlusCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const LeftSideNavbar = ({ posts = [] }) => {
  const navigate = useNavigate();

  return (
    <div className="fixed top-0 left-0 h-full w-24 bg-gradient-to-b from-gray-800 via-gray-900 to-black text-white flex flex-col items-center py-6 space-y-8 shadow-2xl z-50 backdrop-blur-lg border-r border-gray-700">
      <button
        onClick={() => navigate("/profile")}
        className="bg-gradient-to-br from-pink-500 to-pink-700 p-3 rounded-xl shadow-lg hover:scale-110 transition"
      >
        <FaUser className="text-2xl" />
      </button>

      <button
        onClick={() => navigate("/search")}
        className="bg-gradient-to-br from-blue-500 to-blue-700 p-3 rounded-xl shadow-lg hover:scale-110 transition"
      >
        <FaSearch className="text-2xl" />
      </button>

      <button
        onClick={() => navigate("/add")}
        className="bg-gradient-to-br from-green-500 to-green-700 p-4 rounded-2xl shadow-2xl hover:scale-110 transition"
      >
        <FaPlusCircle className="text-3xl text-white" />
      </button>

      <div className="relative">
        <button
          onClick={() => navigate("/chats")}
          className="bg-gradient-to-br from-purple-500 to-purple-700 p-3 rounded-xl shadow-lg hover:scale-110 transition"
        >
          <FaCommentDots className="text-2xl" />
        </button>
        <span className="absolute -top-2 -right-2 bg-pink-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-md">
          {posts.length}
        </span>
      </div>
    </div>
  );
};

export default LeftSideNavbar;
