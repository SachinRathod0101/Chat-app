import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import axios from "axios";
import { database, storage } from "../firebase/firebaseConfig";
import { ref as dbRef, push, onValue, off } from "firebase/database";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import DOMPurify from "dompurify";
import socket from "../socket";
import EmojiPicker from "emoji-picker-react";
import { FaVideo, FaPhone } from "react-icons/fa"; // Added icons for video and voice calls

const API_URL = "https://workflo-backend-1wls.onrender.com";

const ChatWindow = () => {
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [file, setFile] = useState(null);
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const { userId } = useParams();
  const { state } = useLocation();

  // Fetch selected user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        if (state?.selectedUser) {
          setSelectedUser(state.selectedUser);
        } else if (userId) {
          const response = await axios.get(`${API_URL}/api/users/${userId}`);
          setSelectedUser(response.data);
        }
      } catch (err) {
        setError(err.response?.status === 404 ? "User not found." : "Failed to load user data.");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [userId, state]);

  // Auto-scroll to latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch messages from Firebase
  useEffect(() => {
    if (!user?._id || !selectedUser?._id) return;

    const chatId =
      user._id < selectedUser._id
        ? `chat_${user._id}_${selectedUser._id}`
        : `chat_${selectedUser._id}_${user._id}`;

    const messagesRef = dbRef(database, `chats/${chatId}`);

    const handleMessages = (snapshot) => {
      const messagesData = snapshot.val();
      setMessages(
        messagesData
          ? Object.entries(messagesData).map(([id, data]) => ({ id, ...data }))
          : []
      );
    };

    onValue(messagesRef, handleMessages, (err) => setError("Failed to fetch messages."));
    return () => off(messagesRef);
  }, [user._id, selectedUser?._id]);

  // Listen for new messages via Socket.io
  useEffect(() => {
    const handleNewMessage = (message) => {
      setMessages((prev) => [...prev, message]);
    };
    socket.on("newMessage", handleNewMessage);
    return () => socket.off("newMessage", handleNewMessage);
  }, []);

  // Send text message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user?._id || !selectedUser?._id) return;

    const sanitizedMessage = DOMPurify.sanitize(newMessage);
    const chatId =
      user._id < selectedUser._id
        ? `chat_${user._id}_${selectedUser._id}`
        : `chat_${selectedUser._id}_${user._id}`;

    const messageObj = {
      senderId: user._id,
      receiverId: selectedUser._id,
      message: sanitizedMessage,
      type: "text",
      timestamp: Date.now(),
    };

    try {
      await push(dbRef(database, `chats/${chatId}`), messageObj);
      socket.emit("sendMessage", messageObj);
      setNewMessage("");
      setShowEmojiPicker(false);
    } catch (err) {
      setError("Failed to send message.");
    }
  };

  // Send media message
  const handleSendMedia = async () => {
    if (!file || !user?._id || !selectedUser?._id) {
      setError("No file selected or user data missing.");
      return;
    }

    const chatId =
      user._id < selectedUser._id
        ? `chat_${user._id}_${selectedUser._id}`
        : `chat_${selectedUser._id}_${user._id}`;

    try {
      const fileRef = storageRef(storage, `media/${chatId}/${Date.now()}_${file.name}`);
      await uploadBytes(fileRef, file);
      const fileUrl = await getDownloadURL(fileRef);

      const messageObj = {
        senderId: user._id,
        receiverId: selectedUser._id,
        message: fileUrl,
        type: file.type.startsWith("image/") ? "image" : "file",
        fileName: file.name,
        timestamp: Date.now(),
      };

      await push(dbRef(database, `chats/${chatId}`), messageObj);
      socket.emit("sendMessage", messageObj);
      setFile(null);
      fileInputRef.current.value = null;
    } catch (err) {
      setError("Failed to upload media.");
    }
  };

  // Simulate SMS sending (placeholder)
  const handleSendSMS = () => {
    if (!newMessage.trim() || !selectedUser?.number) {
      setError("Cannot send SMS: Missing message or phone number.");
      return;
    }
    alert(`SMS sent to ${selectedUser.number}: ${newMessage}`);
    setNewMessage("");
    setShowEmojiPicker(false);
  };

  // Placeholder for video call
  const handleVideoCall = () => {
    alert(`Initiating video call with ${selectedUser.name}`);
    // For real implementation, use WebRTC or a third-party API (e.g., Agora, Twilio):
    // 1. Initialize WebRTC peer connection
    // 2. Request user media (navigator.mediaDevices.getUserMedia)
    // 3. Emit socket event to notify the other user
    // Example: socket.emit("videoCallRequest", { userId: user._id, targetUserId: selectedUser._id });
  };

  // Placeholder for voice call
  const handleVoiceCall = () => {
    alert(`Initiating voice call with ${selectedUser.name}`);
    // Similar to video call, use WebRTC or API for audio-only stream
    // Example: socket.emit("voiceCallRequest", { userId: user._id, targetUserId: selectedUser._id });
  };

  // Emoji picker handlers
  const handleEmojiClick = () => {
    setShowEmojiPicker((prev) => !prev);
  };

  const handleEmojiSelect = (emoji) => {
    setNewMessage((prev) => prev + emoji.emoji);
    setShowEmojiPicker(false);
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      handleSendMedia();
    }
  };

  // Clear error
  const clearError = () => setError(null);

  // Render message
  const renderMessage = useCallback(
    (msg, index) => {
      const isSender = msg.senderId === user._id;
      return (
        <div
          key={msg.id || index}
          className={`flex ${isSender ? "justify-end" : "justify-start"} mb-3 animate-slide-in-right`}
        >
          <div
            className={`max-w-[70%] p-3 rounded-2xl glass-card ${
              isSender
                ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-br-none"
                : "bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-bl-none"
            }`}
          >
            {msg.type === "text" ? (
              <div className="text-sm">{msg.message}</div>
            ) : msg.type === "image" ? (
              <img
                src={msg.message}
                alt="Shared media"
                className="max-w-full h-auto rounded-lg"
              />
            ) : (
              <a
                href={msg.message}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-pink-300 underline"
              >
                {msg.fileName || "Download File"}
              </a>
            )}
            <div className="text-xs text-gray-300 mt-1 text-right">
              {new Date(msg.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        </div>
      );
    },
    [user._id]
  );

  // Handle loading, error, and no-user states
  if (!user?._id) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black">
        <div className="text-center">
          <p className="text-red-400 text-xl">⚠ Please log in to chat.</p>
          <Link to="/" className="mt-4 text-pink-400 hover:text-purple-400 font-semibold transition-colors duration-300">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black">
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
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black">
        <div className="p-4 glass-card rounded-lg text-red-400 flex justify-between items-center">
          <span>{error}</span>
          <button
            onClick={clearError}
            className="text-white hover:text-gray-200"
            aria-label="Clear error"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  if (!selectedUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black text-gray-400">
        Select a user to start chatting
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-130 bg-gradient-to-br from-gray-900 via-purple-900 to-black w-screen pb-[calc(4rem+env(safe-area-inset-bottom))]">
      <style>
        {`
          .glass-card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            transition: all 0.3s ease;
          }
          .glass-card:hover {
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
          .animate-slide-in-right {
            animation: slideInRight 0.3s ease-out;
          }
          @keyframes slideInRight {
            from {
              opacity: 0;
              transform: translateX(50%);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
        `}
      </style>

      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 glass-card border-b border-white/10 animate-slide-in-left">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center text-white mr-3 overflow-hidden">
            {selectedUser.profileImage ? (
              <img
                src={selectedUser.profileImage}
                alt={`${selectedUser.name}'s profile`}
                className="w-full h-full object-cover"
                onError={(e) => (e.target.src = "https://cdn-icons-png.flaticon.com/512/847/847969.png")}
              />
            ) : (
              <span>{selectedUser.name?.charAt(0) || "?"}</span>
            )}
          </div>
          <div>
            <h2 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-500">
              {selectedUser.name}
            </h2>
            <p className="text-sm text-gray-400">Online</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleVideoCall}
            aria-label={`Start video call with ${selectedUser.name}`}
            className="p-2 button-glow text-white rounded-full hover:shadow-lg transition-all duration-200 relative group"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && handleVideoCall()}
          >
            <FaVideo className="h-5 w-5" />
            <span className="absolute top-10 left-1/2 transform -translate-x-1/2 bg-gray-700 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              Video Call
            </span>
          </button>
          <button
            onClick={handleVoiceCall}
            aria-label={`Start voice call with ${selectedUser.name}`}
            className="p-2 button-glow text-white rounded-full hover:shadow-lg transition-all duration-200 relative group"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && handleVoiceCall()}
          >
            <FaPhone className="h-5 w-5" />
            <span className="absolute top-10 left-1/2 transform -translate-x-1/2 bg-gray-700 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              Voice Call
            </span>
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length ? (
          messages.map(renderMessage)
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            No messages yet. Start chatting!
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Message Input */}
      <div className="px-4 py-2 glass-card border-t border-white/10 rounded-t-xl shadow-lg relative">
        <div className="flex items-center gap-2">
          <button
            onClick={handleEmojiClick}
            aria-label="Toggle emoji picker"
            className="p-2 button-glow text-white rounded-full hover:shadow-lg transition-all duration-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>
          {showEmojiPicker && (
            <div className="absolute bottom-16 left-4 z-10">
              <EmojiPicker onEmojiClick={handleEmojiSelect} />
            </div>
          )}
          <button
            onClick={() => fileInputRef.current.click()}
            aria-label="Add attachment"
            className="p-2 button-glow text-white rounded-full hover:shadow-lg transition-all duration-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.586-6.586a4 4 0 00-5.656-5.656L5.757 10.757a6 6 0 108.486 8.486L20.5 12"
              />
            </svg>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*,video/*,application/*"
            className="hidden"
            aria-label="Upload media"
          />
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            className="flex-1 p-3 bg-gray-800/50 text-white rounded-full input-glow focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-400"
            placeholder="Type a message..."
            aria-label="Type a message"
            aria-describedby="message-input-desc"
          />
          <span id="message-input-desc" className="sr-only">
            Enter your message and press Enter or the send button to send it.
          </span>
          <button
            onClick={handleSendMessage}
            aria-label="Send chat message"
            className="p-2 button-glow text-white rounded-full hover:shadow-lg transition-all duration-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
          <button
            onClick={handleSendSMS}
            aria-label="Send SMS"
            className="p-2 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-full hover:from-green-600 hover:to-teal-600 transition-all duration-200 relative group"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <span className="absolute bottom-10 left-1/2 transform -translate-x-1/2 bg-gray-700 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              Send SMS
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;