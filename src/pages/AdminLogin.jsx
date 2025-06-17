import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleAdminLogin = async (e) => {
    e.preventDefault();

   
    if (username === 'sachin' && password === 'sachin123') {
      alert('Admin login successful!');
      navigate('/admindashboard');  
    } else {
      alert('Invalid admin credentials');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 to-orange-200 flex items-center justify-center p-4">
      <form
        onSubmit={handleAdminLogin}
        className="bg-white p-8 rounded-2xl shadow-2xl transform hover:scale-105 transition duration-300 w-full max-w-sm"
      >
        <h2 className="text-3xl font-bold text-center text-orange-700 mb-6">🛠️ Admin Login</h2>

        <input
          type="text"
          placeholder="Admin Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="w-full mb-4 px-4 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
        />

        <input
          type="password"
          placeholder="Admin Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full mb-6 px-4 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
        />

        <button
          type="submit"
          className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 rounded-lg transition duration-300"
        >
          🚀 Login as Admin
        </button>
      </form>
    </div>
  );
}

export default AdminLogin;
