import React, { useEffect, useState } from 'react';
import axios from 'axios';

function AdminDashboard() {
  const [requests, setRequests] = useState([]);
  const [rejected, setRejected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch on component load
  useEffect(() => {
    fetchRequests();
  }, []);

  // Fetch all requests
  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await axios.get('https://workflo-backend-1.onrender.com/api/form/requests');
      // Divide into pending and rejected lists
      const pending = res.data.filter((user) => user.status !== 'rejected');
      const rejectedUsers = res.data.filter((user) => user.status === 'rejected');

      setRequests(pending);
      setRejected(rejectedUsers);
      setError(null);
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError('Failed to fetch requests.');
    } finally {
      setLoading(false);
    }
  };

  // Approve user
  const handleAccept = async (id) => {
    try {
      await axios.post('https://workflo-backend-1.onrender.com/api/form/approve', { id });
      alert('✅ User Approved');
      fetchRequests();
    } catch (err) {
      console.error('Error approving user:', err);
      alert('Failed to approve user.');
    }
  };

  // Reject user
  const handleReject = async (id) => {
    if (!window.confirm('Reject this user?')) return;
    try {
      await axios.post('https://workflo-backend-1.onrender.com/api/form/reject', { id });
      alert('❌ User Rejected');
      fetchRequests();
    } catch (err) {
      console.error('Error rejecting user:', err);
      alert('Failed to reject user.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 p-6 flex flex-col items-center">
      <h1 className="text-4xl font-bold text-purple-800 mb-8">🛠️ Admin Dashboard</h1>

      {loading && <p className="text-lg text-purple-700">Loading...</p>}
      {error && <p className="text-lg text-red-600">{error}</p>}

      {/* Pending Requests */}
      <section className="w-full max-w-7xl mb-10">
        <h2 className="text-2xl font-semibold text-purple-700 mb-4">📋 Pending Requests</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {requests.length === 0 && <p className="text-gray-600">No pending requests.</p>}
          {requests.map((user) => (
            <UserCard
              key={user._id}
              user={user}
              onAccept={() => handleAccept(user._id)}
              onReject={() => handleReject(user._id)}
            />
          ))}
        </div>
      </section>

      {/* Rejected Requests */}
      <section className="w-full max-w-7xl">
        <h2 className="text-2xl font-semibold text-red-600 mb-4">❌ Rejected Requests</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {rejected.length === 0 && <p className="text-gray-600">No rejected requests.</p>}
          {rejected.map((user) => (
            <UserCard key={user._id} user={user} showActions={false} />
          ))}
        </div>
      </section>
    </div>
  );
}

// Reusable UserCard component
function UserCard({ user, onAccept, onReject, showActions = true }) {
  return (
    <div className="bg-white shadow-lg rounded-xl p-5 border border-purple-300 flex flex-col justify-between hover:shadow-2xl transition duration-300">
      <div className="space-y-1 mb-4">
        <h3 className="text-xl font-semibold text-purple-700">{user.name}</h3>
        <p>📧 {user.email}</p>
        <p>📱 {user.number}</p>
        <p>🎂 Age: {user.age}</p>
        <p>⚧ Gender: {user.gender}</p>
        <p>📍 {user.location}</p>
        {user.file && (
          <a
            href={`https://workflo-backend-1.onrender.com/${user.file}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 underline block mt-2"
          >
            📄 View Uploaded File
          </a>
        )}
      </div>

      {showActions && (
        <div className="flex space-x-2">
          <button
            onClick={onAccept}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 w-full"
          >
            ✅ Accept
          </button>
          <button
            onClick={onReject}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 w-full"
          >
            ❌ Reject
          </button>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
