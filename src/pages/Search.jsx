import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import debounce from "lodash/debounce";
import io from "socket.io-client";
import { FaVideo } from "react-icons/fa";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
const SOCKET_URL = API_URL;

const Search = () => {
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [callState, setCallState] = useState({ isCalling: false, targetUser: null });
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const navigate = useNavigate();
  const socketRef = useRef(null);
  const pcRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Initialize Socket.IO and WebRTC
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");
    if (!userId || !token) {
      setError("Please log in to use search.");
      setTimeout(() => navigate("/login"), 2000);
      setLoading(false);
      return;
    }

    socketRef.current = io(SOCKET_URL, {
      auth: { token },
      query: { userId },
    });

    socketRef.current.on("authError", ({ message }) => {
      setError(message);
      setTimeout(() => navigate("/login"), 2000);
    });

    socketRef.current.on("getOnlineUsers", (users) => {
      setOnlineUsers(users);
    });

    socketRef.current.on("callUser", async ({ from, offer }) => {
      const targetUser = users.find((u) => u._id === from);
      if (!targetUser) return;
      setCallState({ isCalling: true, targetUser });

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);

        pcRef.current = new RTCPeerConnection({
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });

        pcRef.current.onicecandidate = (event) => {
          if (event.candidate) {
            socketRef.current.emit("iceCandidate", {
              to: from,
              candidate: event.candidate,
            });
          }
        };

        pcRef.current.ontrack = (event) => {
          setRemoteStream(event.streams[0]);
        };

        stream.getTracks().forEach((track) => pcRef.current.addTrack(track, stream));
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pcRef.current.createAnswer();
        await pcRef.current.setLocalDescription(answer);
        socketRef.current.emit("answerCall", { to: from, answer });
      } catch (err) {
        console.error("Call answer error:", err);
        setError("Failed to accept call. Check camera/mic permissions.");
        setTimeout(() => setError(""), 3000);
        endCall();
      }
    });

    socketRef.current.on("callAccepted", async ({ answer }) => {
      if (pcRef.current) {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    socketRef.current.on("iceCandidate", async ({ candidate }) => {
      if (pcRef.current && candidate) {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    socketRef.current.on("callEnded", () => {
      endCall();
    });

    socketRef.current.on("callRejected", () => {
      setError(`${callState.targetUser?.name} rejected the call.`);
      setTimeout(() => setError(""), 3000);
      endCall();
    });

    socketRef.current.on("callError", ({ message }) => {
      setError(message);
      setTimeout(() => setError(""), 3000);
      endCall();
    });

    socketRef.current.emit("addUser", userId);

    return () => {
      socketRef.current.disconnect();
      endCall();
    };
  }, [users, navigate]);

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_URL}/api/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (Array.isArray(res.data)) {
          setUsers(res.data);
        } else {
          throw new Error("Invalid data format");
        }
        setLoading(false);
      } catch (err) {
        console.error("Fetch error:", err.message, err.response?.data);
        setError("Failed to load users. Please check if the server is running.");
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleSearch = useCallback(
    debounce((value) => {
      setQuery(value);
    }, 300),
    []
  );

  const filteredUsers = users.filter((user) =>
    user.name?.toLowerCase().includes(query.toLowerCase())
  );

  const handleUserClick = (userId) => {
    navigate(`/profile/${userId}`);
  };

  const handleWhatsApp = (user) => {
    if (!user.number) {
      alert("Phone number not available for this user.");
      return;
    }
    const whatsappUrl = `https://wa.me/${user.number}`;
    window.open(whatsappUrl, "_blank");
  };

  const initiateCall = async (user) => {
    if (!onlineUsers.includes(user._id)) {
      setError(`${user.name} is offline.`);
      setTimeout(() => setError(""), 3000);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      setCallState({ isCalling: true, targetUser: user });

      pcRef.current = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      pcRef.current.onicecandidate = (event) => {
        if (event.candidate) {
          socketRef.current.emit("iceCandidate", {
            to: user._id,
            candidate: event.candidate,
          });
        }
      };

      pcRef.current.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
      };

      stream.getTracks().forEach((track) => pcRef.current.addTrack(track, stream));
      const offer = await pcRef.current.createOffer();
      await pcRef.current.setLocalDescription(offer);
      socketRef.current.emit("callUser", {
        to: user._id,
        from: localStorage.getItem("userId"),
        offer,
      });
    } catch (err) {
      console.error("Call initiation error:", err);
      setError("Failed to start video call. Ensure camera/mic permissions are granted.");
      setTimeout(() => setError(""), 3000);
      endCall();
    }
  };

  const endCall = () => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }
    setRemoteStream(null);
    setCallState({ isCalling: false, targetUser: null });
    socketRef.current.emit("endCall", { to: callState.targetUser?._id });
  };

  const rejectCall = () => {
    socketRef.current.emit("rejectCall", { to: callState.targetUser?._id });
    endCall();
  };

  // Update video refs
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [localStream, remoteStream]);

  return (
    <div className="p-6 bg-gradient-to-br from-gray-900 via-purple-900 to-black min-h-screen text-white flex flex-col items-center font-sans w-screen pb-[calc(4rem+env(safe-area-inset-bottom))]">
      <style>
        {`
          .glass-effect {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            transition: all 0.3s ease;
          }
          .glass-effect:hover {
            background: rgba(255, 255, 255, 0.15);
            transform: translateY(-3px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
          }
          .button-glow {
            background: linear-gradient(135deg, #ff7f50, #ff6347);
            transition: all 0.3s ease;
          }
          .button-glow:hover:not(:disabled) {
            background: linear-gradient(135deg, #ff8c60, #ff7057);
            box-shadow: 0 8px 24px rgba(236, 72, 153, 0.5);
            transform: translateY(-2px);
          }
          .input-glow {
            animation: glow 1.5s ease-in-out infinite alternate;
          }
          @keyframes glow {
            from {
              box-shadow: 0 0 5px rgba(236, 72, 153, 0.5);
            }
            to {
              box-shadow: 0 0 15px rgba(236, 72, 153, 0.8);
            }
          }
          .user-card {
            transition: transform 0.3s ease, box-shadow 0.3s ease;
          }
          .user-card:hover {
            transform: scale(1.03);
            box-shadow: 0 10px 20px rgba(236, 72, 153, 0.3);
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

      <h1 className="text-4xl font-extrabold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-500 animate-pulse">
        🔍 Search Users
      </h1>

      <input
        type="text"
        placeholder="Search by username..."
        aria-label="Search users by username"
        className="glass-effect rounded-full px-6 py-3 w-full max-w-lg mb-8 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition duration-300 input-glow"
        onChange={(e) => handleSearch(e.target.value)}
      />

      {loading && (
        <div className="flex items-center gap-2 text-gray-300" aria-live="polite">
          <svg
            className="w-6 h-6 loading-spinner"
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
          <p>Loading users...</p>
        </div>
      )}
      {error && (
        <div className="text-center glass-effect rounded-lg p-4">
          <p className="text-red-400 font-medium" aria-live="assertive">
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 button-glow rounded-full px-6 py-2 text-white transition duration-300"
            aria-label="Retry loading users"
          >
            Retry
          </button>
        </div>
      )}

      <div className="w-full max-w-lg space-y-4" role="list">
        {filteredUsers.map((user) => (
          <div
            key={user._id}
            role="listitem"
            className="user-card glass-effect rounded-2xl p-4 flex items-center gap-4 cursor-pointer"
            onClick={() => handleUserClick(user._id)}
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && handleUserClick(user._id)}
            aria-label={`View profile of ${user.name}`}
          >
            <img
              src={user.profileImage || "https://cdn-icons-png.flaticon.com/512/847/847969.png"}
              alt={`${user.name}'s avatar`}
              className="w-14 h-14 rounded-full object-cover border-2 border-purple-500 transition-transform duration-300 hover:scale-110"
              onError={(e) => (e.target.src = "https://cdn-icons-png.flaticon.com/512/847/847969.png")}
            />
            <div className="flex-1">
              <span className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-500">
                {user.name}
              </span>
              <span className="text-sm text-gray-400 ml-2">
                {onlineUsers.includes(user._id) ? "Online" : "Offline"}
              </span>
            </div>
            <span className="text-sm bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full px-3 py-1">
              Profile
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                initiateCall(user);
              }}
              disabled={!onlineUsers.includes(user._id)}
              className={`p-2 rounded-full transition-all duration-200 relative group ${
                onlineUsers.includes(user._id)
                  ? "button-glow text-white hover:shadow-lg"
                  : "bg-gray-600 text-gray-400 cursor-not-allowed"
              }`}
              aria-label={`Start video call with ${user.name}`}
              title={onlineUsers.includes(user._id) ? "" : `${user.name} is offline`}
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && onlineUsers.includes(user._id) && initiateCall(user)}
            >
              <FaVideo className="h-5 w-5" />
              <span className="absolute top-10 right-0 bg-gray-700 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                Video Call
              </span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleWhatsApp(user);
              }}
              disabled={!user.number}
              className={`text-sm glass-effect rounded-full px-4 py-2 flex items-center gap-2 transition duration-300 ${
                user.number
                  ? "bg-green-500 hover:bg-green-600 text-white"
                  : "bg-gray-600 text-gray-400 cursor-not-allowed"
              }`}
              aria-label={user.number ? `Message ${user.name} on WhatsApp` : `WhatsApp unavailable for ${user.name}`}
              title={user.number ? "" : "Phone number not available"}
            >
              <span>📱</span> WhatsApp
            </button>
          </div>
        ))}
        {!loading && filteredUsers.length === 0 && (
          <p className="text-center text-gray-400 font-medium" aria-live="polite">
            No matching users found 😶
          </p>
        )}
      </div>

      {callState.isCalling && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-slide-in-right"
          role="dialog"
          aria-label={`Video call with ${callState.targetUser?.name}`}
        >
          <div className="glass-effect rounded-2xl p-6 max-w-3xl w-full">
            <h2 className="text-2xl font-bold mb-4 text-center bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-500">
              Video Call with {callState.targetUser?.name}
            </h2>
            <div className="flex flex-col md:flex-row gap-4">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                className="w-full md:w-1/2 h-64 rounded-lg border-2 border-purple-500"
                aria-label="Your video"
              />
              <video
                ref={remoteVideoRef}
                autoPlay
                className="w-full md:w-1/2 h-64 rounded-lg border-2 border-purple-500"
                aria-label={`${callState.targetUser?.name}'s video`}
              />
            </div>
            <div className="mt-6 flex justify-center gap-4">
              <button
                onClick={endCall}
                className="button-glow bg-red-500 hover:bg-red-600 text-white rounded-full px-6 py-2 transition duration-300"
                aria-label="End video call"
              >
                End Call
              </button>
              <button
                onClick={rejectCall}
                className="button-glow bg-gray-500 hover:bg-gray-600 text-white rounded-full px-6 py-2 transition duration-300"
                aria-label="Reject video call"
              >
                Reject Call
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Search;