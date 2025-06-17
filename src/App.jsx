import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Form from './pages/Form';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';
import Profile from './pages/Profile';
import Chat from './pages/Chat';
import ChatWindow from "./Components/ChatWindow";
import AddPost from './pages/AddPost';
import Data from './pages/Data';
import Layout from './Components/Layout';
import Search from "./pages/Search";
import UserProfile from './pages/UserProfile';
import ConvertBase64 from './Components/ConvertBase64';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Form />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admindashboard" element={<AdminDashboard />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/profile" element={<Layout><Profile /></Layout>} />
        <Route path="/chats" element={<Layout><Chat /></Layout>} />
        <Route path="/chats/:userId" element={<Layout><ChatWindow /></Layout>} />
        <Route path="/add" element={<Layout><AddPost /></Layout>} />
        <Route path="/data" element={<Layout><Data /></Layout>} />
        <Route path="/search" element={<Layout><Search /></Layout>} />
        <Route path="/profile/:id" element={<Layout><UserProfile /></Layout>} />
        <Route path="/convert-base64" element={<ConvertBase64 />} />
        <Route path="*" element={<div className="text-center mt-20 text-white">404 - Page Not Found</div>} />
      </Routes>
    </Router>
  );
}

export default App;