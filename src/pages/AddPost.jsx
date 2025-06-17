import React, { useState, useEffect } from "react";
import axios from "axios";
import socket from "../socket";
import { FaHeart, FaComment, FaPaperPlane, FaEllipsisH, FaUserPlus, FaUserMinus, FaBan, FaUserCheck } from "react-icons/fa";

const API_URL = "https://workflo-backend-1wls.onrender.com";

const AddPost = () => {
  const [user, setUser] = useState(() => {
    try {
      const storedUser = JSON.parse(localStorage.getItem("user"));
      return storedUser && storedUser._id && storedUser.name ? storedUser : null;
    } catch (err) {
      console.error("Invalid user data:", err);
      return null;
    }
  });
  const [caption, setCaption] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState("");
  const [commentInputs, setCommentInputs] = useState({});
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    if (!user?._id || !/^[0-9a-fA-F]{24}$/.test(user._id)) {
      setError("Invalid user ID. Please log in.");
      return;
    }

    socket.on("newPost", (newPost) => {
      console.log("AddPost received new post:", newPost);
      setPosts((prevPosts) => {
        if (!prevPosts.some((post) => post._id === newPost._id)) {
          return [newPost, ...prevPosts];
        }
        return prevPosts;
      });
    });

    socket.on("postUpdated", (updatedPost) => {
      console.log("Received updated post:", updatedPost);
      setPosts((prevPosts) =>
        prevPosts.map((post) => (post._id === updatedPost._id ? updatedPost : post))
      );
    });

    socket.on("userUpdated", (updatedUser) => {
      console.log("Received updated user:", updatedUser);
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
    });

    const fetchPosts = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/posts/getPosts`, {
          params: { userId: user._id },
        });
        console.log("Initial posts:", response.data);
        setPosts(response.data);
        setError("");
      } catch (err) {
        setError(err.response?.status === 404 ? "Posts not found." : "Failed to fetch posts.");
        console.error("Error fetching posts:", err);
      }
    };

    fetchPosts();
    socket.emit("addUser", user._id);

    return () => {
      socket.off("newPost");
      socket.off("postUpdated");
      socket.off("userUpdated");
    };
  }, [user?._id]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleClearImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!caption || !image) {
      setError("Please provide both caption and image.");
      return;
    }

    const formData = new FormData();
    formData.append("caption", caption);
    formData.append("image", image);
    formData.append("userId", user._id);

    setLoading(true);
    setError("");

    try {
      const res = await axios.post(`${API_URL}/api/posts/addPost`, formData);
      console.log("Backend response:", res.data);
      setPosts((prevPosts) => {
        if (!prevPosts.some((post) => post._id === res.data._id)) {
          return [res.data, ...prevPosts];
        }
        return prevPosts;
      });
      setCaption("");
      setImage(null);
      setImagePreview(null);
    } catch (err) {
      setError(err.response?.status === 404 ? "User not found." : "Failed to submit post.");
      console.error("Error submitting post:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      await axios.post(`${API_URL}/api/posts/${postId}/like`, { userId: user._id });
    } catch (err) {
      console.error("Error liking post:", err);
    }
  };

  const handleComment = async (postId, e) => {
    e.preventDefault();
    const commentText = commentInputs[postId]?.trim();
    if (!commentText) return;

    try {
      await axios.post(`${API_URL}/api/posts/${postId}/comment`, {
        userId: user._id,
        text: commentText,
      });
      setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
    } catch (err) {
      console.error("Error adding comment:", err);
    }
  };

  const handleShare = (postId) => {
    const postUrl = `${window.location.origin}/posts/${postId}`;
    navigator.clipboard.writeText(postUrl);
    alert("Post URL copied to clipboard!");
  };

  const handleDoubleClick = (postId) => {
    handleLike(postId);
  };

  const handleFollow = async (targetUserId) => {
    setActionLoading((prev) => ({ ...prev, [targetUserId]: true }));
    try {
      await axios.post(`${API_URL}/api/users/${targetUserId}/follow`, { userId: user._id });
      socket.emit("followUser", { userId: user._id, targetUserId });
    } catch (err) {
      console.error("Error following user:", err);
      setError(err.response?.data?.message || "Failed to follow user.");
    } finally {
      setActionLoading((prev) => ({ ...prev, [targetUserId]: false }));
    }
  };

  const handleUnfollow = async (targetUserId) => {
    setActionLoading((prev) => ({ ...prev, [targetUserId]: true }));
    try {
      await axios.post(`${API_URL}/api/users/${targetUserId}/unfollow`, { userId: user._id });
      socket.emit("unfollowUser", { userId: user._id, targetUserId });
    } catch (err) {
      console.error("Error unfollowing user:", err);
      setError(err.response?.data?.message || "Failed to unfollow user.");
    } finally {
      setActionLoading((prev) => ({ ...prev, [targetUserId]: false }));
    }
  };

  const handleBlock = async (targetUserId) => {
    if (window.confirm("Are you sure you want to block this user?")) {
      setActionLoading((prev) => ({ ...prev, [targetUserId]: true }));
      try {
        await axios.post(`${API_URL}/api/users/${targetUserId}/block`, { userId: user._id });
        socket.emit("blockUser", { userId: user._id, targetUserId });
        setPosts((prevPosts) => prevPosts.filter((post) => post.user?._id !== targetUserId));
      } catch (err) {
        console.error("Error blocking user:", err);
        setError(err.response?.data?.message || "Failed to block user.");
      } finally {
        setActionLoading((prev) => ({ ...prev, [targetUserId]: false }));
      }
    }
  };

  const handleUnblock = async (targetUserId) => {
    if (window.confirm("Are you sure you want to unblock this user?")) {
      setActionLoading((prev) => ({ ...prev, [targetUserId]: true }));
      try {
        await axios.post(`${API_URL}/api/users/${targetUserId}/unblock`, { userId: user._id });
        socket.emit("unblockUser", { userId: user._id, targetUserId });
        const response = await axios.get(`${API_URL}/api/posts/getPosts`, {
          params: { userId: user._id },
        });
        setPosts(response.data);
      } catch (err) {
        console.error("Error unblocking user:", err);
        setError(err.response?.data?.message || "Failed to unblock user.");
      } finally {
        setActionLoading((prev) => ({ ...prev, [targetUserId]: false }));
      }
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black">
        <div className="text-center">
          <p className="text-red-400 text-lg font-medium">⚠ Please log in to create posts.</p>
          <Link to="/" className="mt-4 text-pink-400 hover:text-purple-400 font-semibold transition-colors duration-300">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black w-screen py-6 px-4 sm:px-6 lg:px-8 pb-[calc(4rem+env(safe-area-inset-bottom))]">
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
            background: linear-gradient(135deg, #ec4899, #8b5cf6); /* Pink-500 to Purple-500 */
            transition: all 0.3s ease;
          }
          .button-glow:hover:not(:disabled) {
            background: linear-gradient(135deg, #f472b6, #a78bfa); /* Lighter Pink and Purple */
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
        `}
      </style>

      {/* Post Creation Form */}
      <div className="max-w-lg mx-auto mb-8 glass-card rounded-2xl p-6">
        <div className="flex items-center mb-4">
          <img
            src={user.profileImage || "https://cdn-icons-png.flaticon.com/512/847/847969.png"}
            alt={user.name}
            className="w-12 h-12 rounded-full mr-3 object-cover border-2 border-purple-500"
            onError={(e) => (e.target.src = "https://cdn-icons-png.flaticon.com/512/847/847969.png")}
          />
          <h2 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-500">
            {user.name}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {imagePreview && (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-64 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={handleClearImage}
                className="absolute top-2 right-2 bg-gray-900 bg-opacity-60 text-white p-2 rounded-full hover:bg-opacity-80 transition"
              >
                ✕
              </button>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full p-3 text-sm bg-gray-700/50 text-white rounded-lg input-glow file:mr-4 file:py-2 file:px-4 file:rounded-lg file:bg-purple-500 file:text-white file:border-0 hover:file:bg-purple-600"
            disabled={loading}
            aria-label="Upload post image"
          />
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full p-3 bg-gray-700/50 text-white rounded-lg resize-none text-sm input-glow focus:outline-none focus:ring-2 focus:ring-purple-500"
            rows="4"
            aria-label="Post caption"
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full button-glow text-white py-3 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
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
                Sharing...
              </>
            ) : (
              "Share Post"
            )}
          </button>
        </form>
      </div>

      {/* Posts Feed */}
      <div className="max-w-lg mx-auto space-y-6">
        {posts.length > 0 ? (
          posts.map((post) => (
            <div
              key={post._id}
              className="glass-card rounded-xl p-4"
              onDoubleClick={() => handleDoubleClick(post._id)}
            >
              {/* Post Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <img
                    src={post.user?.profileImage || "https://cdn-icons-png.flaticon.com/512/847/847969.png"}
                    alt={post.user?.name || "Unknown"}
                    className="w-10 h-10 rounded-full mr-3 object-cover border-2 border-purple-500"
                    onError={(e) => (e.target.src = "https://cdn-icons-png.flaticon.com/512/847/847969.png")}
                  />
                  <h3 className="text-base font-semibold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-500">
                    {post.user?.name || "Unknown"}
                  </h3>
                </div>
                <div className="flex items-center space-x-3">
                  {post.user?._id !== user._id && (
                    <>
                      {user.following?.includes(post.user?._id) ? (
                        <button
                          onClick={() => handleUnfollow(post.user._id)}
                          className="flex items-center text-white bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 rounded-full px-3 py-1 text-sm font-medium transition-colors"
                          title="Unfollow"
                          aria-label={`Unfollow ${post.user?.name || "user"}`}
                          disabled={actionLoading[post.user?._id]}
                        >
                          <FaUserMinus className="w-4 h-4 mr-1" />
                          Following
                        </button>
                      ) : (
                        <button
                          onClick={() => handleFollow(post.user._id)}
                          className="flex items-center button-glow text-white rounded-full px-3 py-1 text-sm font-medium"
                          title="Follow"
                          aria-label={`Follow ${post.user?.name || "user"}`}
                          disabled={actionLoading[post.user?._id]}
                        >
                          <FaUserPlus className="w-4 h-4 mr-1" />
                          Follow
                        </button>
                      )}
                      {user.blockedUsers?.includes(post.user?._id) ? (
                        <button
                          onClick={() => handleUnblock(post.user._id)}
                          className="text-green-500 hover:text-green-600 transition-colors"
                          title="Unblock"
                          aria-label={`Unblock ${post.user?.name || "user"}`}
                          disabled={actionLoading[post.user?._id]}
                        >
                          <FaUserCheck className="w-5 h-5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBlock(post.user._id)}
                          className="text-red-500 hover:text-red-600 transition-colors"
                          title="Block"
                          aria-label={`Block ${post.user?.name || "user"}`}
                          disabled={actionLoading[post.user?._id]}
                        >
                          <FaBan className="w-5 h-5" />
                        </button>
                      )}
                    </>
                  )}
                  <button className="text-gray-300 hover:text-gray-400" aria-label="More options">
                    <FaEllipsisH className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Post Image */}
              <div className="relative">
                <img
                  src={post.imageUrl}
                  alt={post.caption || "Post image"}
                  className="w-full h-auto aspect-square object-cover rounded-lg"
                  onError={(e) => (e.target.src = "https://cdn-icons-png.flaticon.com/512/847/847969.png")}
                />
              </div>

              {/* Post Actions */}
              <div className="flex items-center p-4 space-x-6">
                <button
                  onClick={() => handleLike(post._id)}
                  className={`text-2xl ${Array.isArray(post.likes) && post.likes.includes(user._id)
                      ? "text-red-500"
                      : "text-gray-300"
                    } hover:text-red-500 transition-colors`}
                  aria-label="Like post"
                >
                  <FaHeart />
                </button>
                <button
                  className="text-2xl text-gray-300 hover:text-gray-400 transition-colors"
                  onClick={() => document.getElementById(`comment-input-${post._id}`).focus()}
                  aria-label="Comment on post"
                >
                  <FaComment />
                </button>
                <button
                  onClick={() => handleShare(post._id)}
                  className="text-2xl text-gray-300 hover:text-gray-400 transition-colors"
                  aria-label="Share post"
                >
                  <FaPaperPlane />
                </button>
              </div>

              {/* Likes Count */}
              <div className="px-4 py-1">
                {Array.isArray(post.likes) && post.likes.length > 0 ? (
                  <p className="text-sm text-gray-300">
                    Liked by{" "}
                    <span className="font-semibold">
                      {post.likes.includes(user._id) ? "you" : "others"}
                    </span>{" "}
                    {post.likes.length > 1 &&
                      `and ${post.likes.length - 1} others`}
                  </p>
                ) : (
                  <p className="text-sm text-gray-400">No likes yet</p>
                )}
              </div>

              {/* Caption */}
              <div className="px-4 py-1">
                <p className="text-sm text-gray-300">
                  <span className="font-semibold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-500">
                    {post.user?.name || "Unknown"}
                  </span>{" "}
                  {post.caption}
                </p>
              </div>

              {/* Comments */}
              <div className="px-4 py-1">
                {Array.isArray(post.comments) && post.comments.length > 0 ? (
                  post.comments.map((comment, index) => (
                    <p key={index} className="text-sm text-gray-300">
                      <span className="font-semibold">{comment.user?.name || "Unknown"}</span>{" "}
                      {comment.text}
                    </p>
                  ))
                ) : (
                  <p className="text-sm text-gray-400">No comments yet.</p>
                )}
              </div>

              {/* Comment Input */}
              <div className="p-4 border-t border-white/10">
                <form
                  onSubmit={(e) => handleComment(post._id, e)}
                  className="flex items-center"
                >
                  <input
                    id={`comment-input-${post._id}`}
                    type="text"
                    value={commentInputs[post._id] || ""}
                    onChange={(e) =>
                      setCommentInputs((prev) => ({
                        ...prev,
                        [post._id]: e.target.value,
                      }))
                    }
                    placeholder="Add a comment..."
                    className="flex-1 p-2 text-sm bg-gray-700/50 text-white rounded-lg input-glow focus:outline-none focus:ring-2 focus:ring-purple-500"
                    aria-label="Add a comment"
                  />
                  <button
                    type="submit"
                    className="ml-2 text-purple-500 text-sm font-semibold hover:text-purple-400 transition-colors"
                  >
                    Post
                  </button>
                </form>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-400 text-sm">No posts available.</p>
        )}
      </div>
    </div>
  );
};

export default AddPost;