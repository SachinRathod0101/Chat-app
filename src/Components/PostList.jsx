import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import socket from "../socket";
import { FaHeart, FaComment, FaPaperPlane, FaEllipsisH, FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const API_URL = "https://workflo-backend-1wls.onrender.com";

const Post = ({ post, currentUser }) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isOnline, setIsOnline] = useState(false);
  const [viewCount, setViewCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser?._id || !post?.user?._id) return;

    // Check follow and block status
    const checkStatus = async () => {
      try {
        const token = localStorage.getItem("token");
        const userRes = await axios.get(`${API_URL}/api/users/${currentUser._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsFollowing(userRes.data.following?.includes(post.user._id));
        setIsBlocked(userRes.data.blockedUsers?.includes(post.user._id));
      } catch (err) {
        console.error("Error checking status:", err);
      }
    };
    checkStatus();

    // Join post room for typing and view events
    socket.emit("viewPost", { postId: post._id, userId: currentUser._id });

    // Listen for typing events
    socket.on("typing", ({ userId, postId }) => {
      if (postId === post._id && userId !== currentUser._id) {
        setTypingUsers((prev) => {
          if (!prev.includes(userId)) return [...prev, userId];
          return prev;
        });
      }
    });
    socket.on("stopTyping", ({ userId, postId }) => {
      if (postId === post._id) {
        setTypingUsers((prev) => prev.filter((id) => id !== userId));
      }
    });

    // Listen for online status
    socket.on("getOnlineUsers", (onlineUsers) => {
      setIsOnline(onlineUsers.includes(post.user._id));
    });

    // Listen for notifications
    socket.on("notification", ({ type, message, fromUserId, postId }) => {
      if (postId === post._id && post.user._id === currentUser._id) {
        toast.info(message);
      }
    });

    // Listen for view count
    socket.on("postViewCount", ({ postId, count }) => {
      if (postId === post._id) setViewCount(count);
    });

    return () => {
      socket.emit("leavePost", { postId: post._id, userId: currentUser._id });
      socket.off("typing");
      socket.off("stopTyping");
      socket.off("getOnlineUsers");
      socket.off("notification");
      socket.off("postViewCount");
    };
  }, [currentUser?._id, post?._id, post.user?._id]);

  const handleFollow = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_URL}/api/users/${post.user._id}/${isFollowing ? "unfollow" : "follow"}`,
        { userId: currentUser._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsFollowing(!isFollowing);
      toast.success(isFollowing ? "Unfollowed user" : "Followed user");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update follow status");
    }
  };

  const handleBlock = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_URL}/api/users/${post.user._id}/${isBlocked ? "unblock" : "block"}`,
        { userId: currentUser._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsBlocked(!isBlocked);
      toast.success(isBlocked ? "Unblocked user" : "Blocked user");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update block status");
    }
  };

  const handleLike = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API_URL}/api/posts/${post._id}/like`, { userId: currentUser._id }, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to like post");
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API_URL}/api/posts/${post._id}/comment`, {
        userId: currentUser._id,
        text: commentText,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCommentText("");
      socket.emit("stopTyping", { postId: post._id, userId: currentUser._id });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add comment");
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      try {
        const token = localStorage.getItem("token");
        await axios.post(
          `${API_URL}/api/posts/${post._id}/delete`,
          { userId: currentUser._id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Post deleted");
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to delete post");
      }
    }
  };

  const handleShare = () => {
    const postUrl = `${window.location.origin}/posts/${post._id}`;
    navigator.clipboard.writeText(postUrl);
    toast.success("Post URL copied to clipboard!");
  };

  const handleDoubleClick = () => {
    if (!post.likes.includes(currentUser._id)) handleLike();
  };

  const handleCommentInput = (e) => {
    setCommentText(e.target.value);
    if (e.target.value.trim()) {
      socket.emit("startTyping", { postId: post._id, userId: currentUser._id });
    } else {
      socket.emit("stopTyping", { postId: post._id, userId: currentUser._id });
    }
  };

  if (!currentUser || isBlocked) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-4">
      {/* Post Header */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center">
          <img
            src={post.user?.profileImage || "https://cdn-icons-png.flaticon.com/512/847/847969.png"}
            alt={post.user?.name || "User"}
            className="w-8 h-8 rounded-full mr-2"
          />
          <div className="flex items-center">
            <h3
              className="text-sm font-semibold text-gray-800 cursor-pointer"
              onClick={() => navigate(`/profile/${post.user._id}`)}
            >
              {post.user?.name || "Unknown"}
            </h3>
            {isOnline && <span className="w-2 h-2 bg-green-500 rounded-full ml-2"></span>}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {post.user._id !== currentUser._id && (
            <>
              <button
                onClick={handleFollow}
                className={`text-sm font-semibold ${
                  isFollowing ? "text-gray-500" : "text-blue-500"
                } hover:text-blue-600`}
              >
                {isFollowing ? "Unfollow" : "Follow"}
              </button>
              <button
                onClick={handleBlock}
                className="text-sm font-semibold text-red-500 hover:text-red-600"
              >
                {isBlocked ? "Unblock" : "Block"}
              </button>
            </>
          )}
          {post.user._id === currentUser._id && (
            <button onClick={handleDelete} className="text-red-500 hover:text-red-600">
              <FaTrash className="w-4 h-4" />
            </button>
          )}
          <button className="text-gray-600">
            <FaEllipsisH className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Post Image */}
      <div className="relative" onDoubleClick={handleDoubleClick}>
        <img
          src={post.imageUrl}
          alt={post.caption || "Post image"}
          className="w-full h-auto aspect-square object-cover"
          onError={(e) => (e.target.src = "https://placehold.co/600x600?text=Image+Not+Found")}
        />
        {viewCount > 0 && (
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
            {viewCount} {viewCount === 1 ? "view" : "views"}
          </div>
        )}
      </div>

      {/* Post Actions */}
      <div className="flex items-center p-3 space-x-4">
        <button
          onClick={handleLike}
          className={`text-2xl ${
            post.likes.includes(currentUser._id) ? "text-red-500" : "text-gray-600"
          } hover:text-red-500 transition-colors`}
        >
          <FaHeart />
        </button>
        <button
          className="text-2xl text-gray-600 hover:text-gray-800 transition-colors"
          onClick={() => document.getElementById(`comment-input-${post._id}`).focus()}
        >
          <FaComment />
        </button>
        <button
          onClick={handleShare}
          className="text-2xl text-gray-600 hover:text-gray-800 transition-colors"
        >
          <FaPaperPlane />
        </button>
      </div>

      {/* Likes Count */}
      <div className="px-3">
        {post.likes.length > 0 ? (
          <p className="text-sm text-gray-800">
            Liked by{" "}
            <span className="font-semibold">
              {post.likes.includes(currentUser._id) ? "you" : "others"}
            </span>{" "}
            {post.likes.length > 1 && `and ${post.likes.length - 1} others`}
          </p>
        ) : (
          <p className="text-sm text-gray-600">No likes yet</p>
        )}
      </div>

      {/* Caption */}
      <div className="px-3 py-1">
        <p className="text-sm text-gray-800">
          <span className="font-semibold">{post.user?.name || "Unknown"}</span>{" "}
          {post.caption}
        </p>
      </div>

      {/* Comments */}
      <div className="px-3 py-1">
        {post.comments.length > 0 ? (
          post.comments.map((comment, index) => (
            <p key={index} className="text-sm text-gray-600">
              <span className="font-semibold">{comment.user?.name || "Unknown"}</span>{" "}
              {comment.text}
            </p>
          ))
        ) : (
          <p className="text-sm text-gray-500">No comments yet.</p>
        )}
        {typingUsers.length > 0 && (
          <p className="text-xs text-gray-500 italic">
            {typingUsers.length === 1 ? "Someone is typing..." : "Multiple users are typing..."}
          </p>
        )}
      </div>

      {/* Comment Input */}
      <div className="p-3 border-t border-gray-200">
        <form onSubmit={handleComment} className="flex items-center">
          <input
            id={`comment-input-${post._id}`}
            type="text"
            value={commentText}
            onChange={handleCommentInput}
            placeholder="Add a comment..."
            className="flex-1 p-1 text-sm border-none focus:outline-none"
          />
          <button
            type="submit"
            className="text-blue-500 text-sm font-semibold hover:text-blue-600"
          >
            Post
          </button>
        </form>
      </div>
    </div>
  );
};

export default Post;