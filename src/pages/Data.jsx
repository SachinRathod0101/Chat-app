import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

const API_URL = "https://workflo-backend-1.onrender.com";

const ProfileWithEbook = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    try {
      const storedUser = JSON.parse(localStorage.getItem("user"));
      if (!storedUser?._id || !storedUser?.name || !storedUser?.email) {
        return null;
      }
      return storedUser;
    } catch (err) {
      console.error("Invalid user data in localStorage:", err);
      return null;
    }
  });
  const [profileImage, setProfileImage] = useState(user?.profileImage);
  const [uploadError, setUploadError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [fetchError, setFetchError] = useState("");

  // Real-time user data fetching (polling every 30 seconds)
  useEffect(() => {
    if (!user?._id || !/^[0-9a-fA-F]{24}$/.test(user._id)) {
      setFetchError("Invalid user ID");
      return;
    }

    const fetchUserData = async () => {
      try {
        const response = await fetch(`${API_URL}/api/users/${user._id}`);
        if (!response.ok) {
          throw new Error(response.status === 404 ? "User not found" : "Failed to fetch user data");
        }
        const data = await response.json();
        localStorage.setItem("user", JSON.stringify(data));
        setUser(data);
        setProfileImage(data.profileImage);
        setFetchError("");
      } catch (err) {
        setFetchError(err.message);
      }
    };

    fetchUserData(); // Initial fetch
    const interval = setInterval(fetchUserData, 30000); // Poll every 30 seconds

    return () => clearInterval(interval); // Cleanup on unmount
  }, [user?._id]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black">
        <div className="text-center">
          <p className="text-red-400 text-xl">⚠ User not logged in</p>
          <Link to="/" className="mt-4 text-pink-400 hover:text-purple-400 font-semibold transition-colors duration-300">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  const handleStartChat = () => {
    navigate("/chats");
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!/^[0-9a-fA-F]{24}$/.test(user._id)) {
      setUploadError("Invalid user ID");
      return;
    }

    setIsUploading(true);
    setUploadError("");
    setProfileImage(URL.createObjectURL(file)); // Preview

    const formData = new FormData();
    formData.append("image", file);
    formData.append("userId", user._id);

    try {
      const response = await fetch(`${API_URL}/api/user/upload-profile`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(response.status === 404 ? "User not found" : "Failed to upload image");
      }

      const data = await response.json();
      if (data.user?.profileImage) {
        localStorage.setItem("user", JSON.stringify(data.user));
        setUser(data.user);
        setProfileImage(data.user.profileImage);
      }
    } catch (err) {
      setUploadError(err.message);
      setProfileImage(user.profileImage); // Revert preview on failure
    } finally {
      setIsUploading(false);
    }
  };

  const displayValue = (value) => value || "Not provided";

  return (
    <div className="min-h-full bg-gradient-to-br from-gray-900 via-purple-900 to-black flex w-screen pb-[calc(4rem+env(safe-area-inset-bottom))]">
      <style>
        {`
          .glass-card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            transition: all 0.3s ease;
          }
          .glass-card:hover {
            box-shadow: 0 10px 30px rgba(236, 72, 153, 0.3);
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
          }
          .loading-spinner {
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
          .profile-image {
            transition: transform 0.3s ease;
          }
          .profile-image:hover {
            transform: scale(1.1);
          }
        `}
      </style>

      {/* Sidebar */}
      <aside className="fixed top-0 left-0 w-80 h-full glass-card p-6 overflow-y-auto animate-slide-in-left">
        <div className="flex flex-col items-center">
          <div className="relative">
            <img
              src={profileImage || "https://cdn-icons-png.flaticon.com/512/847/847969.png"}
              alt={`${user.name}'s profile`}
              className="w-24 h-24 rounded-full object-cover border-2 border-purple-500 profile-image"
              onError={(e) => (e.target.src = "https://cdn-icons-png.flaticon.com/512/847/847969.png")}
            />
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                <svg
                  className="w-8 h-8 loading-spinner"
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
            )}
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="mt-2 text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:bg-purple-500 file:text-white file:border-0 hover:file:bg-purple-600 input-glow"
            disabled={isUploading}
            aria-label="Upload profile image"
          />
          {uploadError && <p className="text-red-400 text-sm mt-2">{uploadError}</p>}
        </div>

        <h2 className="text-2xl font-extrabold mt-5 text-center bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-500">
          {displayValue(user.name)}
        </h2>
        <div className="text-gray-300 space-y-3 mt-4">
          <p>📧 {displayValue(user.email)}</p>
          <p>📱 {displayValue(user.number)}</p>
          <p>🎂 Age: {displayValue(user.age)}</p>
          <p>⚧ Gender: {displayValue(user.gender)}</p>
          <p>📍 Location: {displayValue(user.location)}</p>
        </div>

        {fetchError && (
          <div className="text-center mt-4">
            <p className="text-red-400">{fetchError}</p>
            <button
              onClick={() => {
                setFetchError("");
                setUser(null); // Trigger re-fetch
              }}
              className="mt-2 px-4 py-2 button-glow text-white rounded-lg"
            >
              Retry
            </button>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="mt-10 w-full button-glow text-white py-3 rounded-lg"
        >
          🚪 Logout
        </button>

        <button
          onClick={handleStartChat}
          className="lg:hidden mt-4 w-full bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white py-3 rounded-lg transition"
        >
          💬 Start Chat
        </button>
      </aside>

      {/* Main Content (eBook Section) */}
      
    </div>
  );
};

export default ProfileWithEbook;