import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const API_URL = "https://workflo-backend-1.onrender.com";

function Form() {
  const [formData, setFormData] = useState({
    name: '',
    number: '',
    email: '',
    age: '',
    gender: '',
    location: '',
    file: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState({}); // Track touched fields for validation feedback

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.number.match(/^\d{10}$/)) errors.number = 'Enter a valid 10-digit number';
    if (!formData.email.match(/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/)) errors.email = 'Enter a valid email';
    if (!formData.age || formData.age < 1 || formData.age > 120) errors.age = 'Enter a valid age (1-120)';
    if (!formData.gender) errors.gender = 'Select a gender';
    if (!formData.location.trim()) errors.location = 'Location is required';
    if (!formData.file || formData.file.type !== 'application/pdf') errors.file = 'Upload a valid PDF file';
    return errors;
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'file') {
      const selectedFile = files[0];
      if (selectedFile && selectedFile.type !== 'application/pdf') {
        setError('Only PDF files are allowed.');
        setTimeout(() => setError(''), 3000);
        return;
      }
      setFormData({ ...formData, file: selectedFile });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    setTouched({ ...touched, [name]: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setError(Object.values(errors)[0]);
      setTimeout(() => setError(''), 3000);
      return;
    }

    setLoading(true);
    setError('');

    const data = new FormData();
    data.append('name', formData.name);
    data.append('number', formData.number);
    data.append('email', formData.email);
    data.append('age', formData.age);
    data.append('gender', formData.gender);
    data.append('location', formData.location);
    data.append('file', formData.file);

    try {
      await axios.post(`${API_URL}/api/form/submit`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert('Form submitted successfully!');
      setFormData({
        name: '',
        number: '',
        email: '',
        age: '',
        gender: '',
        location: '',
        file: null,
      });
      setTouched({});
      e.target.reset(); // Reset file input
    } catch (err) {
      console.error('Submission error:', err);
      setError(
        err.response?.status === 400
          ? err.response.data.message || 'Invalid form data.'
          : 'Submission failed. Please check if the server is running.'
      );
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black w-screen pb-[calc(4rem+env(safe-area-inset-bottom))] flex items-center justify-center p-4">
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
          .animate-slide-in-left {
            animation: slideInLeft 0.3s ease-out;
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
          @keyframes slideInLeft {
            from {
              opacity: 0;
              transform: translateX(-50%);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
        `}
      </style>

      <form
        onSubmit={handleSubmit}
        encType="multipart/form-data"
        className="glass-card p-8 rounded-3xl shadow-2xl w-full max-w-lg space-y-6 animate-slide-in-right"
        aria-label="Application form"
      >
        <h2 className="text-3xl font-extrabold text-center bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-500 animate-slide-in-left">
          📝 Application Form
        </h2>

        {error && (
          <div className="p-3 glass-card rounded-lg text-red-400 flex justify-between items-center" aria-live="assertive">
            <span>{error}</span>
            <button
              onClick={() => setError('')}
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
        )}

        <div>
          <input
            type="text"
            name="name"
            placeholder="Your Name"
            value={formData.name}
            onChange={handleChange}
            className={`w-full px-4 py-2 bg-gray-800/50 text-white rounded-xl input-glow focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-400 ${
              touched.name && !formData.name.trim() ? 'border-red-500' : 'border-white/20'
            }`}
            required
            aria-label="Your name"
          />
          {touched.name && !formData.name.trim() && (
            <p className="text-red-400 text-sm mt-1">Name is required</p>
          )}
        </div>

        <div>
          <input
            type="number"
            name="number"
            placeholder="Your Number"
            value={formData.number}
            onChange={handleChange}
            className={`w-full px-4 py-2 bg-gray-800/50 text-white rounded-xl input-glow focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-400 ${
              touched.number && !formData.number.match(/^\d{10}$/) ? 'border-red-500' : 'border-white/20'
            }`}
            required
            aria-label="Your phone number"
          />
          {touched.number && !formData.number.match(/^\d{10}$/) && (
            <p className="text-red-400 text-sm mt-1">Enter a valid 10-digit number</p>
          )}
        </div>

        <div>
          <input
            type="email"
            name="email"
            placeholder="Your Email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full px-4 py-2 bg-gray-800/50 text-white rounded-xl input-glow focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-400 ${
              touched.email && !formData.email.match(/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/)
                ? 'border-red-500'
                : 'border-white/20'
            }`}
            required
            aria-label="Your email"
          />
          {touched.email && !formData.email.match(/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/) && (
            <p className="text-red-400 text-sm mt-1">Enter a valid email</p>
          )}
        </div>

        <div>
          <input
            type="number"
            name="age"
            placeholder="Your Age"
            value={formData.age}
            onChange={handleChange}
            className={`w-full px-4 py-2 bg-gray-800/50 text-white rounded-xl input-glow focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-400 ${
              touched.age && (formData.age < 1 || formData.age > 120) ? 'border-red-500' : 'border-white/20'
            }`}
            required
            aria-label="Your age"
          />
          {touched.age && (formData.age < 1 || formData.age > 120) && (
            <p className="text-red-400 text-sm mt-1">Enter a valid age (1-120)</p>
          )}
        </div>

        <div>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className={`w-full px-4 py-2 bg-gray-800/50 text-white rounded-xl input-glow focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-400 ${
              touched.gender && !formData.gender ? 'border-red-500' : 'border-white/20'
            }`}
            required
            aria-label="Select gender"
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
          {touched.gender && !formData.gender && (
            <p className="text-red-400 text-sm mt-1">Select a gender</p>
          )}
        </div>

        <div>
          <input
            type="text"
            name="location"
            placeholder="Your Location"
            value={formData.location}
            onChange={handleChange}
            className={`w-full px-4 py-2 bg-gray-800/50 text-white rounded-xl input-glow focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-400 ${
              touched.location && !formData.location.trim() ? 'border-red-500' : 'border-white/20'
            }`}
            required
            aria-label="Your location"
          />
          {touched.location && !formData.location.trim() && (
            <p className="text-red-400 text-sm mt-1">Location is required</p>
          )}
        </div>

        <div>
          <input
            type="file"
            name="file"
            accept=".pdf"
            onChange={handleChange}
            className="w-full text-sm text-gray-400 file:button-glow file:text-white file:rounded-lg file:px-4 file:py-2 file:mr-4"
            required
            aria-label="Upload PDF file"
          />
          {touched.file && (!formData.file || formData.file.type !== 'application/pdf') && (
            <p className="text-red-400 text-sm mt-1">Upload a valid PDF file</p>
          )}
        </div>

        <button
          type="submit"
          className="w-full button-glow text-white py-3 rounded-xl font-bold hover:shadow-lg transition duration-300 flex items-center justify-center"
          disabled={loading}
          aria-label="Submit application form"
        >
          {loading ? (
            <svg
              className="w-5 h-5 loading-spinner mr-2"
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
          ) : (
            '🚀 Submit'
          )}
          {loading && 'Submitting...'}
        </button>

        <Link
          to="/login"
          className="text-center block bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-500 hover:underline font-semibold"
          aria-label="Go to login page"
        >
          🔐 Go to Login
        </Link>
      </form>
    </div>
  );
}

export default Form;