import React, { useEffect, useState } from "react";
import UserList from "../Components/UserList";
import ChatWindow from "../Components/ChatWindow";
import socket from "../socket";
import { ref, push, onValue } from "firebase/database";
import { database } from "../firebase/database";

const Chat = () => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    if (!user || !selectedUser) return;

    const chatRef = ref(database, "chats/");
    const unsubscribe = onValue(chatRef, (snapshot) => {
      const data = snapshot.val();
      const chatMessages = [];

      for (let id in data) {
        const msg = data[id];
        if (
          (msg.senderId === user._id && msg.receiverId === selectedUser._id) ||
          (msg.senderId === selectedUser._id && msg.receiverId === user._id)
        ) {
          chatMessages.push(msg);
        }
      }

      // ✅ Sort messages by timestamp
      chatMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      setMessages(chatMessages);
    });

    return () => unsubscribe();
  }, [selectedUser]);

  useEffect(() => {
    socket.on("newMessage", (newMessage) => {
      if (
        selectedUser &&
        (newMessage.senderId === selectedUser._id ||
          newMessage.receiverId === selectedUser._id)
      ) {
        setMessages((prev) => [...prev, newMessage]);
      }
    });

    return () => {
      socket.off("newMessage");
    };
  }, [selectedUser]);

  const handleSelectUser = (user) => {
    setSelectedUser(user);
  };

  const handleSend = async (message) => {
    if (!selectedUser || !user) return;

    const newMessage = {
      senderId: user._id,
      receiverId: selectedUser._id,
      message,
      timestamp: new Date().toISOString(),
    };

    const chatRef = ref(database, "chats/");
    try {
      await push(chatRef, newMessage); // ✅ Save to Firebase
      socket.emit("newMessage", newMessage); // ✅ Notify receiver
    } catch (err) {
      console.error("Error saving message", err);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gradient-to-r from-gray-900 to-black text-white">
      <UserList onUserSelect={handleSelectUser} />
      {selectedUser ? (
        <ChatWindow
          selectedUser={selectedUser}
          messages={messages}
          onSend={handleSend}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <h2 className="text-2xl font-bold text-gray-400">
            👈 Select a user to start chatting
          </h2>
        </div>
      )}
    </div>
  );
};

export default Chat;
