import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = "https://workflo-backend-1.onrender.com";

const UserProfile = () => {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isFollowing, setIsFollowing] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const currentUserId = localStorage.getItem("userId");

  const fetchUser = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_URL}/api/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.data || !res.data._id) {
        throw new Error("Invalid user data");
      }
      setUser(res.data);
      setIsFollowing(res.data.isFollowing || false);
      setIsBlocked(res.data.isBlocked || false);
      setFollowersCount(res.data.followersCount || 0);
    } catch (err) {
      console.error("Fetch error:", err.message, err.response?.data);
      if (err.response?.status === 401) {
        setError("Session expired. Please log in again.");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setError(
          err.response?.status === 404
            ? "User not found"
            : "Failed to load user data. Please check if the server is running."
        );
      }
    } finally {
      setLoading(false);
    }
  }, [id, token, navigate]);

  const handleFollowToggle = async () => {
    if (isBlocked) {
      setError("Cannot follow a blocked user.");
      setTimeout(() => setError(""), 3000);
      return;
    }

    const previousIsFollowing = isFollowing;
    setIsFollowing(!isFollowing);
    setError("");

    try {
      const endpoint = isFollowing
        ? `${API_URL}/api/users/${id}/unfollow`
        : `${API_URL}/api/users/${id}/follow`;
      await axios.post(
        endpoint,
        { userId: currentUserId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Update followers count
      setFollowersCount((prevCount) =>
        previousIsFollowing ? prevCount - 1 : prevCount + 1
      );
    } catch (err) {
      console.error("Follow/Unfollow error:", err.message, err.response?.data);
      setIsFollowing(previousIsFollowing);
      if (err.response?.status === 401) {
        setError("Session expired. Please log in again.");
        setTimeout(() => navigate("/login"), 2000);
      } else if (err.response?.status === 403) {
        setError("Cannot follow a user who has blocked you.");
      } else {
        setError(
          err.response?.data?.message || "Failed to update follow status."
        );
      }
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleBlockToggle = async () => {
    const previousIsBlocked = isBlocked;
    setIsBlocked(!isBlocked);
    setError("");

    try {
      const endpoint = isBlocked
        ? `${API_URL}/api/users/${id}/unblock`
        : `${API_URL}/api/users/${id}/block`;
      await axios.post(
        endpoint,
        { userId: currentUserId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!isBlocked && isFollowing) {
        setIsFollowing(false);
        setFollowersCount((count) => count - 1);
      }
    } catch (err) {
      console.error("Block/Unblock error:", err.message, err.response?.data);
      setIsBlocked(previousIsBlocked);
      if (err.response?.status === 401) {
        setError("Session expired. Please log in again.");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setError(
          err.response?.data?.message || "Failed to update block status."
        );
      }
      setTimeout(() => setError(""), 3000);
    }
  };

  useEffect(() => {
    if (!token) {
      setError("Please log in to view profiles.");
      setTimeout(() => navigate("/login"), 2000);
      setLoading(false);
      return;
    }
    if (!id || id.trim() === "") {
      setError("Invalid user ID");
      setLoading(false);
      return;
    }
    if (currentUserId === id) {
      setError("You cannot view your own profile here.");
      setLoading(false);
      return;
    }
    fetchUser();
  }, [fetchUser, id, currentUserId, token, navigate]);

  const handleRetry = () => {
    setUser(null);
    setIsFollowing(false);
    setIsBlocked(false);
    fetchUser();
  };

  const handleBack = () => {
    navigate("/search");
  };

  if (loading) {
    return (
      <div className="text-center mt-20">
        <p className="text-gray-400" aria-live="polite" aria-busy="true">
          Loading user data...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center mt-20">
        <p className="text-red-500" aria-live="assertive">
          {error}
        </p>
        <p className="text-gray-400 mt-2">
          {error === "User not found"
            ? "The user might not exist. Try a different ID."
            : error.includes("log in")
            ? "Redirecting to login page..."
            : "There might be a server issue. Ensure the backend is running on port 5000."}
        </p>
        <div className="mt-4 space-x-4">
          <button
            onClick={handleRetry}
            className="bg-pink-500 text-white rounded-lg px-4 py-2 hover:bg-pink-600 transition duration-300"
            disabled={error.includes("log in")}
          >
            Retry
          </button>
          <button
            onClick={handleBack}
            className="bg-gray-500 text-white rounded-lg px-4 py-2 hover:bg-gray-600 transition duration-300"
          >
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white p-6">
      <div
        className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 shadow-lg max-w-md w-full text-center"
        role="region"
        aria-label={`Profile of ${user?.name || "user"}`}
      >
        <img
          src={user?.profileImage || "/default-avatar.png"}
          alt={`${user?.name || "User"}'s avatar`}
          className="w-28 h-28 rounded-full border-4 border-pink-500 mx-auto mb-4 object-cover"
          onError={(e) => (e.target.src = "/default-avatar.png")}
        />
        <h1 className="text-2xl font-bold mb-2">{user?.name || "Unknown User"}</h1>

        <div className="text-pink-300 space-y-2 mt-4">
          <p>
            📞 <span className="text-white">{user?.phone || "Not provided"}</span>
          </p>
          <p>
            📍 <span className="text-white">{user?.location || "Unknown"}</span>
          </p>
          <p>
            ⚥ <span className="text-white">{user?.gender || "Not specified"}</span>
          </p>
          <p>
            👥 <span className="text-white">{followersCount}</span> Followers
          </p>
        </div>

        <div className="mt-6 space-y-4">
          <button
            onClick={handleFollowToggle}
            className={`w-full text-white rounded-lg px-4 py-2 transition duration-300 ${
              isFollowing
                ? "bg-gray-500 hover:bg-gray-600"
                : "bg-blue-500 hover:bg-blue-600"
            } ${isBlocked ? "opacity-50 cursor-not-allowed" : ""}`}
            disabled={isBlocked}
            aria-label={isFollowing ? "Unfollow user" : "Follow user"}
            title={isBlocked ? "Cannot follow blocked user" : ""}
          >
            {isFollowing ? "Unfollow" : "Follow"}
          </button>
          <button
            onClick={handleBlockToggle}
            className={`w-full text-white rounded-lg px-4 py-2 transition duration-300 ${
              isBlocked
                ? "bg-gray-500 hover:bg-gray-600"
                : "bg-red-500 hover:bg-red-600"
            }`}
            aria-label={isBlocked ? "Unblock user" : "Block user"}
          >
            {isBlocked ? "Unblock" : "Block"}
          </button>
          <button
            onClick={handleBack}
            className="w-full bg-pink-500 text-white rounded-lg px-4 py-2 hover:bg-pink-600 transition duration-300"
            aria-label="Back to search page"
          >
            Back to Search
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
